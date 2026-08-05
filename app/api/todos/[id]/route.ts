import type { ResultSetHeader } from "mysql2";
import { pool } from "@/lib/server/db";
import { fail, json, readBody } from "@/lib/server/respond";
import { requireUser } from "@/lib/server/auth";

type Params = { params: { id: string } };

export async function PATCH(req: Request, { params }: Params) {
  const user = await requireUser(req);
  if (!user) return fail("未登录", 401);

  const body = await readBody(req);
  const sets: string[] = [];
  const vals: any[] = [];

  const fields: Record<string, string> = {
    title: "title",
    description: "description",
    due: "due",
    priority: "priority",
    status: "status",
    completedAt: "completed_at",
  };

  for (const [key, col] of Object.entries(fields)) {
    if (key in body) {
      let v: unknown = body[key];
      if (key === "due") v = v != null && v !== "" ? Number(v) : null;
      if (key === "completedAt") v = v != null ? Number(v) : null;
      sets.push(`${col} = ?`);
      vals.push(v);
    }
  }

  // 修改截止时间时重置提醒标记，允许改期后重新提醒
  if ("due" in body) sets.push("reminder_sent_at = NULL");

  if (sets.length === 0) return fail("没有需要更新的字段");

  const sql: string = `UPDATE todos SET ${sets.join(", ")} WHERE id = ? AND user_id = ?`;
  const [result] = await pool.execute<ResultSetHeader>(
    sql,
    [...vals, params.id, user.id]
  );
  if (result.affectedRows === 0) return fail("待办不存在或无权修改", 404);
  return json({ ok: true });
}

export async function DELETE(req: Request, { params }: Params) {
  const user = await requireUser(req);
  if (!user) return fail("未登录", 401);

  const [result] = await pool.execute<ResultSetHeader>(
    "DELETE FROM todos WHERE id = ? AND user_id = ?",
    [params.id, user.id]
  );
  if (result.affectedRows === 0) return fail("待办不存在或无权删除", 404);
  return json({ ok: true });
}
