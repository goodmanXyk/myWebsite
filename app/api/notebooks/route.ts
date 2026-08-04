import crypto from "crypto";
import type { RowDataPacket } from "mysql2";
import { pool } from "@/lib/server/db";
import { fail, json, readBody } from "@/lib/server/respond";
import { requireUser } from "@/lib/server/auth";

export async function GET(req: Request) {
  const user = await requireUser(req);
  if (!user) return fail("未登录", 401);

  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT n.id, n.name, n.sort_order, n.created_at, n.updated_at,
            (SELECT COUNT(*) FROM notes d WHERE d.notebook_id = n.id) AS note_count
       FROM notebooks n
      WHERE n.user_id = ?
      ORDER BY n.sort_order ASC, n.created_at ASC`,
    [user.id]
  );
  const notebooks = rows.map((r) => ({
    id: r.id,
    name: r.name,
    sortOrder: Number(r.sort_order),
    createdAt: Number(r.created_at),
    updatedAt: Number(r.updated_at),
    noteCount: Number(r.note_count),
  }));
  return json({ ok: true, notebooks });
}

export async function POST(req: Request) {
  const user = await requireUser(req);
  if (!user) return fail("未登录", 401);

  const body = await readBody(req);
  const name = String(body.name ?? "").trim();
  if (!name) return fail("请填写知识库名称");

  const id = crypto.randomUUID();
  const now = Date.now();
  await pool.execute(
    "INSERT INTO notebooks (id, user_id, name, sort_order, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?)",
    [id, user.id, name, now, now]
  );
  return json({
    ok: true,
    notebook: { id, name, sortOrder: 0, createdAt: now, updatedAt: now, noteCount: 0 },
  });
}
