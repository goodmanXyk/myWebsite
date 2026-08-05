import bcrypt from "bcryptjs";
import type { ResultSetHeader } from "mysql2";
import { pool } from "@/lib/server/db";
import { fail, json, readBody } from "@/lib/server/respond";
import { isValidEmail, verifyCode } from "@/lib/server/verify";

// 重置密码：验证码 + 新密码
export async function POST(req: Request) {
  const body = await readBody(req);
  const email = String(body.email ?? "").trim().toLowerCase();
  const code = String(body.code ?? "").trim();
  const password = String(body.password ?? "");
  if (!isValidEmail(email)) return fail("请输入有效的邮箱地址");
  if (!code) return fail("请输入验证码");
  if (password.length < 6) return fail("新密码至少需要 6 位");

  const okCode = await verifyCode(email, "reset", code);
  if (!okCode) return fail("验证码错误或已过期", 400);

  const passwordHash = await bcrypt.hash(password, 10);
  const [result] = await pool.execute<ResultSetHeader>(
    "UPDATE users SET password_hash = ? WHERE email = ?",
    [passwordHash, email]
  );
  if (result.affectedRows === 0) return fail("该邮箱未注册", 404);

  // 安全：重置后使该用户所有会话失效
  await pool.execute<ResultSetHeader>(
    "DELETE FROM sessions WHERE user_id = (SELECT id FROM users WHERE email = ?)",
    [email]
  );

  return json({ ok: true, message: "密码已重置，请使用新密码登录" });
}