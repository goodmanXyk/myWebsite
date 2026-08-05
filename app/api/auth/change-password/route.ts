import bcrypt from "bcryptjs";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import { pool } from "@/lib/server/db";
import { fail, json, readBody } from "@/lib/server/respond";
import { requireUser } from "@/lib/server/auth";

// 修改密码：登录态下验证旧密码，更新后使所有会话失效（需重新登录）
export async function POST(req: Request) {
  const user = await requireUser(req);
  if (!user) return fail("未登录", 401);

  const body = await readBody(req);
  const oldPassword = String(body.oldPassword ?? "");
  const newPassword = String(body.newPassword ?? "");
  if (newPassword.length < 6) return fail("新密码至少需要 6 位");

  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT password_hash FROM users WHERE id = ?",
    [user.id]
  );
  if (rows.length === 0) return fail("用户不存在", 404);
  const okOld = await bcrypt.compare(oldPassword, rows[0].password_hash);
  if (!okOld) return fail("当前密码不正确", 400);

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await pool.execute<ResultSetHeader>(
    "UPDATE users SET password_hash = ? WHERE id = ?",
    [passwordHash, user.id]
  );

  // 安全：使该用户所有会话失效（含当前），前端跳转重新登录
  await pool.execute<ResultSetHeader>(
    "DELETE FROM sessions WHERE user_id = ?",
    [user.id]
  );

  return json({ ok: true, message: "密码已修改，请重新登录" });
}