import type { RowDataPacket, ResultSetHeader } from "mysql2";
import { pool } from "@/lib/server/db";
import { fail, json, readBody } from "@/lib/server/respond";
import { requireUser } from "@/lib/server/auth";

type Params = { params: { id: string } };

// 单篇详情（含正文）
export async function GET(req: Request, { params }: Params) {
  const user = await requireUser(req);
  if (!user) return fail("未登录", 401);

  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT id, notebook_id, title, content, created_at, updated_at FROM notes WHERE id = ? AND user_id = ?",
    [params.id, user.id]
  );
  if (rows.length === 0) return fail("文档不存在", 404);
  const r = rows[0];
  return json({
    ok: true,
    note: {
      id: r.id,
      notebookId: r.notebook_id ?? null,
      title: r.title,
      content: r.content ?? "",
      createdAt: Number(r.created_at),
      updatedAt: Number(r.updated_at),
    },
  });
}

export async function PATCH(req: Request, { params }: Params) {
  const user = await requireUser(req);
  if (!user) return fail("未登录", 401);

  const body = await readBody(req);
  const sets: string[] = [];
  const vals: any[] = [];

  if (body.title !== undefined) {
    const title = String(body.title).trim();
    if (!title) return fail("请填写文档标题");
    sets.push("title = ?");
    vals.push(title);
  }
  if (body.content !== undefined) {
    sets.push("content = ?");
    vals.push(String(body.content));
  }
  if (body.notebookId !== undefined) {
    const notebookId = body.notebookId ? String(body.notebookId) : null;
    if (notebookId) {
      const [nb] = await pool.execute<RowDataPacket[]>(
        "SELECT id FROM notebooks WHERE id = ? AND user_id = ?",
        [notebookId, user.id]
      );
      if (nb.length === 0) return fail("知识库不存在", 404);
    }
    sets.push("notebook_id = ?");
    vals.push(notebookId);
  }
  if (sets.length === 0) return fail("没有需要更新的字段");

  sets.push("updated_at = ?");
  vals.push(Date.now());

  const sql: string = `UPDATE notes SET ${sets.join(", ")} WHERE id = ? AND user_id = ?`;
  const [result] = await pool.execute<ResultSetHeader>(sql, [...vals, params.id, user.id]);
  if (result.affectedRows === 0) return fail("文档不存在或无权修改", 404);
  return json({ ok: true });
}

export async function DELETE(req: Request, { params }: Params) {
  const user = await requireUser(req);
  if (!user) return fail("未登录", 401);

  const [result] = await pool.execute<ResultSetHeader>(
    "DELETE FROM notes WHERE id = ? AND user_id = ?",
    [params.id, user.id]
  );
  if (result.affectedRows === 0) return fail("文档不存在或无权删除", 404);
  return json({ ok: true });
}
