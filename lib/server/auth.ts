// 服务端认证工具：会话 token 的创建/校验/删除。
// 使用随机 64 位十六进制 token 存 sessions 表，30 天有效期。
import crypto from "crypto";
import { pool } from "./db";
import type { RowDataPacket } from "mysql2";

export interface DbUser {
  id: string;
  email: string;
  password_hash: string;
  name: string | null;
  created_at: number;
}

export interface SafeUser {
  id: string;
  email: string;
  name?: string;
  createdAt: number;
}

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 天

export function toSafeUser(u: Pick<DbUser, "id" | "email" | "name" | "created_at">): SafeUser {
  return {
    id: u.id,
    email: u.email,
    name: u.name ?? undefined,
    createdAt: Number(u.created_at),
  };
}

export function getBearerToken(req: Request): string | null {
  const h = req.headers.get("authorization");
  if (h && h.startsWith("Bearer ")) {
    const t = h.slice(7).trim();
    return t || null;
  }
  return null;
}

export async function createSession(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const now = Date.now();
  await pool.execute(
    "INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
    [token, userId, now, now + SESSION_TTL_MS]
  );
  return token;
}

export async function getUserByToken(token: string | null): Promise<SafeUser | null> {
  if (!token) return null;
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT u.id, u.email, u.name, u.created_at
       FROM sessions s
       JOIN users u ON u.id = s.user_id
      WHERE s.token = ? AND s.expires_at > ?`,
    [token, Date.now()]
  );
  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    id: String(r.id),
    email: String(r.email),
    name: r.name != null ? String(r.name) : undefined,
    createdAt: Number(r.created_at),
  };
}

export async function deleteSession(token: string | null): Promise<void> {
  if (!token) return;
  await pool.execute("DELETE FROM sessions WHERE token = ?", [token]);
}

// 供路由使用的快捷校验：返回用户或 null
export async function requireUser(req: Request): Promise<SafeUser | null> {
  return getUserByToken(getBearerToken(req));
}
