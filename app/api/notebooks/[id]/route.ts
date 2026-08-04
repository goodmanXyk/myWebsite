import type { ResultSetHeader } from "mysql2";
import { pool } from "@/lib/server/db";
import { fail, json, readBody } from "@/lib/server/respond";
import { requireUser } from "@/lib/server/auth";

type Params = { params: { id: string } };

export async function PATCH(req: Request, { params }: Params) {
  const user = await requireUser(req);
  if (!user) return fail("未登录", 401);

  const body = await readBody(req);
  const name = String(body.name ?? "").trim();
  if (!name) return fail("请填写知识库名称");

  const now = Date.now();
  const [result] = await pool.execute<ResultSetHeader>(
    "UPDATE notebooks SET name = ?, updated_at = ? WHERE id = ? AND user_id = ?",
    [name, now, params.id, user.id]
  );
  if (result.affectedRows === 0) return fail("知识库不存在或无权修改", 404);
  return json({ ok: true });
}

export async function DELETE(req: Request, { params }: Params) {
  const user = await requireUser(req);
  if (!user) return fail("未登录", 401);

  // 删除知识库：其下文档变为「未分类」（notebook_id 置 NULL）
  const [result] = await pool.execute<ResultSetHeader>(
    "DELETE FROM notebooks WHERE id = ? AND user_id = ?",
    [params.id, user.id]
  );
  if (result.affectedRows === 0) return fail("知识库不存在或无权删除", 404);
  return json({ ok: true });
}
