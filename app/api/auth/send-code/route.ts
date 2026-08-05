import type { RowDataPacket } from "mysql2";
import { pool } from "@/lib/server/db";
import { fail, json, readBody } from "@/lib/server/respond";
import { isValidEmail, sendVerificationCode } from "@/lib/server/verify";

// 发送邮箱验证码（注册 / 重置密码）
export async function POST(req: Request) {
  const body = await readBody(req);
  const email = String(body.email ?? "").trim().toLowerCase();
  const purpose = String(body.purpose ?? "");
  if (!isValidEmail(email)) return fail("请输入有效的邮箱地址");
  if (purpose !== "register" && purpose !== "reset") return fail("参数不完整（purpose）");

  if (purpose === "register") {
    const [exists] = await pool.execute<RowDataPacket[]>(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );
    if (exists.length > 0) return fail("该邮箱已注册，请直接登录", 409);
  }

  const sent = await sendVerificationCode(email, purpose);
  if (!sent) return fail("验证码发送失败，请确认邮件服务已配置", 500);

  return json({ ok: true, message: "验证码已发送到邮箱" });
}