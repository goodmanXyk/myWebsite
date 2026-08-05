import crypto from "crypto";
import bcrypt from "bcryptjs";
import type { RowDataPacket } from "mysql2";
import { pool } from "@/lib/server/db";
import { fail, json, readBody } from "@/lib/server/respond";
import { createSession } from "@/lib/server/auth";
import { isValidEmail, verifyCode } from "@/lib/server/verify";

export async function POST(req: Request) {
  const body = await readBody(req);
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const code = String(body.code ?? "").trim();
  const name = body.name ? String(body.name).trim() : undefined;

  if (!isValidEmail(email)) {
    return fail("请输入有效的邮箱地址");
  }
  if (password.length < 6) {
    return fail("密码至少需要 6 位");
  }
  if (!code) {
    return fail("请先获取邮箱验证码");
  }
  const okCode = await verifyCode(email, "register", code);
  if (!okCode) {
    return fail("验证码错误或已过期，请重新获取");
  }

  const [exists] = await pool.execute<RowDataPacket[]>(
    "SELECT id FROM users WHERE email = ?",
    [email]
  );
  if (exists.length > 0) {
    return fail("该邮箱已注册，请直接登录", 409);
  }

  const id = crypto.randomUUID();
  const passwordHash = await bcrypt.hash(password, 10);
  const createdAt = Date.now();
  const displayName = name || email.split("@")[0];

  await pool.execute(
    "INSERT INTO users (id, email, password_hash, name, created_at) VALUES (?, ?, ?, ?, ?)",
    [id, email, passwordHash, displayName, createdAt]
  );

  const token = await createSession(id);
  return json({ ok: true, user: { id, email, name: displayName, createdAt }, token });
}
