import crypto from "crypto";
import type { RowDataPacket } from "mysql2";
import { pool } from "@/lib/server/db";
import { fail, json, readBody } from "@/lib/server/respond";
import { requireUser } from "@/lib/server/auth";

export async function GET(req: Request) {
  const user = await requireUser(req);
  if (!user) return fail("未登录", 401);

  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, title, description, due, priority, status, created_at, completed_at
       FROM todos WHERE user_id = ? ORDER BY created_at DESC`,
    [user.id]
  );
  const todos = rows.map((r) => ({
    id: r.id,
    userId: user.id,
    title: r.title,
    description: r.description ?? undefined,
    due: r.due != null ? Number(r.due) : null,
    priority: r.priority,
    status: r.status,
    createdAt: Number(r.created_at),
    completedAt: r.completed_at != null ? Number(r.completed_at) : null,
  }));
  return json({ ok: true, todos });
}

export async function POST(req: Request) {
  const user = await requireUser(req);
  if (!user) return fail("未登录", 401);

  const body = await readBody(req);
  const title = String(body.title ?? "").trim();
  if (!title) return fail("请填写待办标题");

  const id = crypto.randomUUID();
  const now = Date.now();
  const priority = ["low", "medium", "high"].includes(String(body.priority))
    ? String(body.priority)
    : "medium";
  const due = body.due != null && body.due !== "" ? Number(body.due) : null;
  const description = body.description != null ? String(body.description) : null;

  await pool.execute(
    `INSERT INTO todos (id, user_id, title, description, due, priority, status, created_at, completed_at)
     VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, NULL)`,
    [id, user.id, title, description, due, priority, now]
  );

  return json({
    ok: true,
    todo: {
      id,
      userId: user.id,
      title,
      description: description ?? undefined,
      due,
      priority,
      status: "pending",
      createdAt: now,
      completedAt: null,
    },
  });
}
