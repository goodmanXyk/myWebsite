import type { RowDataPacket } from "mysql2";
import { pool } from "@/lib/server/db";
import { fail, json } from "@/lib/server/respond";
import { requireUser } from "@/lib/server/auth";
import {
  isEnterpriseWecomEmail,
  isMailConfigured,
  sendMail,
  sendWecomWebhook,
} from "@/lib/server/mail";

// 真实发送测试提醒（登录鉴权）：企微邮箱用户发测试邮件 + 配置了企微群则推群消息
export async function POST(req: Request) {
  const user = await requireUser(req);
  if (!user) return fail("未登录", 401);

  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT wecom_webhook FROM notify_settings WHERE user_id = ?",
    [user.id]
  );
  const webhook = rows.length && rows[0].wecom_webhook ? String(rows[0].wecom_webhook) : "";

  const data: { email: string; wecom?: string } = { email: "" };

  if (isEnterpriseWecomEmail(user.email)) {
    if (!isMailConfigured()) return fail("SMTP 尚未配置，请联系管理员开启邮件通道", 500);
    const ok = await sendMail(
      user.email,
      "【OvixAI】测试邮件",
      "这是一封来自 OvixAI 的测试邮件，说明待办邮件提醒通道已就绪。",
      "<p>这是一封来自 <strong>OvixAI</strong> 的测试邮件，说明待办邮件提醒通道已就绪。</p>"
    );
    if (!ok) return fail("测试邮件发送失败，请检查 SMTP 配置", 500);
    data.email = `已发送测试邮件至 ${user.email}`;
  } else {
    data.email = "当前账号非企业微信邮箱，不触发邮件提醒（应用内提醒已开启）";
  }

  if (webhook) {
    const pushed = await sendWecomWebhook(
      webhook,
      "【OvixAI】测试消息：这是一条来自待办提醒的测试消息。"
    );
    data.wecom = pushed ? "已推送企业微信群 ✅" : "企业微信群推送失败，请检查 Webhook 地址";
  }

  return json({ ok: true, data });
}