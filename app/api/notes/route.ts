import crypto from "crypto";
import type { RowDataPacket } from "mysql2";
import { pool } from "@/lib/server/db";
import { fail, json, readBody } from "@/lib/server/respond";
import { requireUser } from "@/lib/server/auth";

// 列表：返回摘要（不含正文），按更新时间倒序
export async function GET(req: Request) {
  const user = await requireUser(req);
  if (!user) return fail("未登录", 401);

  const notebookId = new URL(req.url).searchParams.get("notebookId");
  let rows: RowDataPacket[];
  if (notebookId === "null") {
    // 未分类：notebook_id 为 NULL 的文档
    [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT id, notebook_id, title, created_at, updated_at
         FROM notes WHERE user_id = ? AND notebook_id IS NULL
        ORDER BY updated_at DESC`,
      [user.id]
    );
  } else if (notebookId) {
    [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT id, notebook_id, title, created_at, updated_at
         FROM notes WHERE user_id = ? AND notebook_id = ?
        ORDER BY updated_at DESC`,
      [user.id, notebookId]
    );
  } else {
    [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT id, notebook_id, title, created_at, updated_at
         FROM notes WHERE user_id = ?
        ORDER BY updated_at DESC`,
      [user.id]
    );
  }
  const notes = rows.map((r) => ({
    id: r.id,
    notebookId: r.notebook_id ?? null,
    title: r.title,
    createdAt: Number(r.created_at),
    updatedAt: Number(r.updated_at),
  }));
  return json({ ok: true, notes });
}

export async function POST(req: Request) {
  const user = await requireUser(req);
  if (!user) return fail("未登录", 401);

  const body = await readBody(req);
  const title = String(body.title ?? "").trim();
  if (!title) return fail("请填写文档标题");

  const id = crypto.randomUUID();
  const now = Date.now();
  const content = body.content != null ? String(body.content) : "";
  const notebookId = body.notebookId ? String(body.notebookId) : null;

  // 校验 notebook 属于当前用户（如有）
  if (notebookId) {
    const [nb] = await pool.execute<RowDataPacket[]>(
      "SELECT id FROM notebooks WHERE id = ? AND user_id = ?",
      [notebookId, user.id]
    );
    if (nb.length === 0) return fail("知识库不存在", 404);
  }

  await pool.execute(
    "INSERT INTO notes (id, user_id, notebook_id, title, content, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 0, ?, ?)",
    [id, user.id, notebookId, title, content, now, now]
  );
  return json({
    ok: true,
    note: { id, notebookId, title, content, createdAt: now, updatedAt: now },
  });
}
