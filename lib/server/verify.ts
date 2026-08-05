// 邮箱验证码服务：注册 / 重置密码
import crypto from "crypto";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import { pool } from "./db";
import { isMailConfigured, sendMail } from "./mail";

export type VerifyPurpose = "register" | "reset";

const CODE_TTL_MS = 10 * 60 * 1000; // 10 分钟有效

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function generateCode(): string {
  return String(crypto.randomInt(0, 1000000)).padStart(6, "0");
}

/** 发送验证码邮件；返回是否发送成功 */
export async function sendVerificationCode(
  email: string,
  purpose: VerifyPurpose
): Promise<boolean> {
  if (!isMailConfigured()) return false;
  const code = generateCode();
  const now = Date.now();

  // 同一邮箱同用途只保留一条有效码：旧码标记失效
  await pool.execute<ResultSetHeader>(
    "UPDATE email_verifications SET used = 1 WHERE email = ? AND purpose = ? AND used = 0",
    [email, purpose]
  );

  await pool.execute(
    "INSERT INTO email_verifications (id, email, code, purpose, expires_at, used, created_at) VALUES (?, ?, ?, ?, ?, 0, ?)",
    [crypto.randomUUID(), email, code, purpose, now + CODE_TTL_MS, now]
  );

  const subject =
    purpose === "register"
      ? "【OvixAI】注册验证码"
      : "【OvixAI】重置密码验证码";
  const text = `你的验证码是：${code}\n验证码 10 分钟内有效，请勿泄露给他人。\n\n如果这不是你的操作，请忽略本邮件。`;
  const html = `<p>你的验证码是：<strong style="font-size:20px">${code}</strong></p><p>验证码 <strong>10 分钟</strong> 内有效，请勿泄露给他人。</p><p>如果这不是你的操作，请忽略本邮件。</p>`;
  return sendMail(email, subject, text, html);
}

/** 校验验证码：匹配且未使用、未过期 → 标记已用并返回 true */
export async function verifyCode(
  email: string,
  purpose: VerifyPurpose,
  code: string
): Promise<boolean> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id FROM email_verifications
      WHERE email = ? AND purpose = ? AND code = ? AND used = 0 AND expires_at > ?
      ORDER BY created_at DESC LIMIT 1`,
    [email, purpose, code, Date.now()]
  );
  if (rows.length === 0) return false;
  await pool.execute<ResultSetHeader>(
    "UPDATE email_verifications SET used = 1 WHERE id = ?",
    [rows[0].id]
  );
  return true;
}