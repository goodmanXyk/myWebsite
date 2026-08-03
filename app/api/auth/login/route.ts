import bcrypt from "bcryptjs";
import type { RowDataPacket } from "mysql2";
import { pool } from "@/lib/server/db";
import { fail, json, readBody } from "@/lib/server/respond";
import { createSession, toSafeUser } from "@/lib/server/auth";
import type { DbUser } from "@/lib/server/auth";

export async function POST(req: Request) {
  const body = await readBody(req);
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT id, email, password_hash, name, created_at FROM users WHERE email = ?",
    [email]
  );
  if (rows.length === 0) {
    return fail("邮箱或密码不正确", 401);
  }
  const u = rows[0] as unknown as DbUser;
  const okPw = await bcrypt.compare(password, u.password_hash);
  if (!okPw) {
    return fail("邮箱或密码不正确", 401);
  }

  const token = await createSession(u.id);
  return json({ ok: true, user: toSafeUser(u), token });
}
