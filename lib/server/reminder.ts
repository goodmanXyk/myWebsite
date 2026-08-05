// 待办提醒核心逻辑：扫描到期未提醒的待办 → 企微邮箱用户发邮件 + 配置了企微群则推群消息
import type { RowDataPacket } from "mysql2";
import { pool } from "./db";
import { isEnterpriseWecomEmail, sendMail, sendWecomWebhook } from "./mail";

export interface ReminderRunResult {
  matched: number;
  emailed: number;
  wecomPushed: number;
  skippedNoChannel: number;
  failed: number;
}

/** 补发窗口：只提醒最近 6 小时内到期的待办，避免长时间离线后邮件轰炸 */
const BACKFILL_WINDOW_MS = 6 * 60 * 60 * 1000;
const TODO_URL = "https://www.jasonxyk.cn/console/todos";

function formatDueCn(ts: number): string {
  const d = new Date(ts + 8 * 3600 * 1000); // 按北京时间展示
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}年${d.getUTCMonth() + 1}月${d.getUTCDate()}日 ${pad(
    d.getUTCHours()
  )}:${pad(d.getUTCMinutes())}`;
}

export async function runTodoReminders(
  now: number = Date.now(),
  userId?: string
): Promise<ReminderRunResult> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT u.id AS user_id, u.email,
            t.id AS todo_id, t.title, t.due,
            ns.lead_minutes, ns.wecom_webhook
       FROM todos t
       JOIN users u ON u.id = t.user_id
       JOIN notify_settings ns ON ns.user_id = u.id
      WHERE t.status = 'pending'
        AND t.due IS NOT NULL
        AND t.reminder_sent_at IS NULL
        AND ns.enabled = 1
        AND t.due <= ? + ns.lead_minutes * 60000
        AND t.due >= ? - ?
        ${userId ? "AND u.id = ?" : ""}`,
    userId ? [now, now, BACKFILL_WINDOW_MS, userId] : [now, now, BACKFILL_WINDOW_MS]
  );

  const result: ReminderRunResult = {
    matched: rows.length,
    emailed: 0,
    wecomPushed: 0,
    skippedNoChannel: 0,
    failed: 0,
  };

  for (const r of rows) {
    const title = String(r.title);
    const due = Number(r.due);
    const dueText = formatDueCn(due);
    const subject = `【OvixAI 待办提醒】${title}`;
    const text = `你的待办「${title}」已到提醒时间。\n截止时间：${dueText}\n查看待办：${TODO_URL}`;
    const html = `<p>你的待办 <strong>「${title}」</strong> 已到提醒时间。</p><p>截止时间：${dueText}</p><p><a href="${TODO_URL}">点击查看待办</a></p>`;
    const wecomContent = `【OvixAI 待办提醒】\n📌 待办：${title}\n⏰ 截止：${dueText}\n🔗 ${TODO_URL}`;

    let anySent = false;
    let sent = false;

    // 企业微信邮箱用户 → 发邮件
    if (isEnterpriseWecomEmail(String(r.email))) {
      sent = await sendMail(String(r.email), subject, text, html);
      if (sent) {
        result.emailed += 1;
        anySent = true;
      } else {
        result.failed += 1;
      }
    }

    // 企业微信群机器人（可选附加通道）
    const webhook = r.wecom_webhook ? String(r.wecom_webhook) : "";
    if (webhook) {
      const pushed = await sendWecomWebhook(webhook, wecomContent);
      if (pushed) {
        result.wecomPushed += 1;
        anySent = true;
      } else {
        result.failed += 1;
      }
    }

    if (!anySent) {
      // 无可用通道（非企微邮箱且未配群机器人）或全部发送失败：不标记，下轮重试（6 小时窗口内）
      result.skippedNoChannel += 1;
      continue;
    }

    // 至少一个通道成功 → 标记幂等，避免重复提醒
    await pool.execute("UPDATE todos SET reminder_sent_at = ? WHERE id = ?", [now, r.todo_id]);
  }

  return result;
}