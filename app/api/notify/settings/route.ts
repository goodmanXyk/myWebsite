import type { RowDataPacket, ResultSetHeader } from "mysql2";
import { pool } from "@/lib/server/db";
import { fail, json, readBody } from "@/lib/server/respond";
import { requireUser } from "@/lib/server/auth";

export async function GET(req: Request) {
  const user = await requireUser(req);
  if (!user) return fail("未登录", 401);

  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT enabled, lead_minutes, wecom_webhook FROM notify_settings WHERE user_id = ?",
    [user.id]
  );
  if (rows.length === 0) {
    return json({ ok: true, data: { enabled: true, leadMinutes: 0, webhooks: {} } });
  }
  const r = rows[0];
  const webhooks: Record<string, string> = {};
  if (r.wecom_webhook) webhooks.wecom = String(r.wecom_webhook);
  return json({
    ok: true,
    data: {
      enabled: Boolean(r.enabled),
      leadMinutes: Number(r.lead_minutes),
      webhooks,
    },
  });
}

export async function POST(req: Request) {
  const user = await requireUser(req);
  if (!user) return fail("未登录", 401);

  const body = await readBody(req);
  const enabled = Boolean(body.enabled);
  const leadMinutes = Math.max(0, Number(body.leadMinutes || 0));
  const webhooks = (body.webhooks ?? {}) as Record<string, string>;
  const wecom = webhooks.wecom?.trim() || null;

  await pool.execute<ResultSetHeader>(
    `INSERT INTO notify_settings (user_id, enabled, lead_minutes, wecom_webhook)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       enabled = VALUES(enabled),
       lead_minutes = VALUES(lead_minutes),
       wecom_webhook = VALUES(wecom_webhook)`,
    [user.id, enabled ? 1 : 0, leadMinutes, wecom]
  );

  return json({ ok: true, data: { enabled, leadMinutes, webhooks: { wecom: wecom ?? undefined } } });
}
