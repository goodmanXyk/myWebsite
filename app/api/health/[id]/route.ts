import type { ResultSetHeader } from "mysql2";
import { pool } from "@/lib/server/db";
import { fail, json, readBody } from "@/lib/server/respond";
import { requireUser } from "@/lib/server/auth";

type Params = { params: { id: string } };

const TABLE_MAP: Record<string, string> = {
  weight: "weight_entries",
  diet: "diet_entries",
  workout: "workout_entries",
  sleep: "sleep_entries",
};

export async function PATCH(req: Request, { params }: Params) {
  const user = await requireUser(req);
  if (!user) return fail("未登录", 401);

  const type = new URL(req.url).searchParams.get("type");
  const table = type ? TABLE_MAP[type] : null;
  if (!table || (type !== "workout" && type !== "sleep")) {
    return fail("仅支持修改 workout / sleep", 400);
  }

  const body = await readBody(req);
  const fieldMap: Record<string, string> =
    type === "workout"
      ? { done: "done", activity: "activity", durationMin: "duration_min", date: "date" }
      : { bedtime: "bedtime", wakeTime: "wake_time", durationMin: "duration_min", quality: "quality", note: "note", date: "date" };

  const sets: string[] = [];
  const vals: any[] = [];
  for (const [key, col] of Object.entries(fieldMap)) {
    if (key in body) {
      let v: unknown = body[key];
      if (key === "done") v = v ? 1 : 0;
      if (key === "durationMin") v = Number(v);
      sets.push(`${col} = ?`);
      vals.push(v);
    }
  }
  if (sets.length === 0) return fail("没有需要更新的字段");

  const sql: string = `UPDATE ${table} SET ${sets.join(", ")} WHERE id = ? AND user_id = ?`;
  const [result] = await pool.execute<ResultSetHeader>(
    sql,
    [...vals, params.id, user.id]
  );
  if (result.affectedRows === 0) return fail("记录不存在或无权修改", 404);
  return json({ ok: true });
}

export async function DELETE(req: Request, { params }: Params) {
  const user = await requireUser(req);
  if (!user) return fail("未登录", 401);

  const type = new URL(req.url).searchParams.get("type");
  const table = type ? TABLE_MAP[type] : null;
  if (!table) return fail("缺少 type 参数", 400);

  const [result] = await pool.execute<ResultSetHeader>(
    `DELETE FROM ${table} WHERE id = ? AND user_id = ?`,
    [params.id, user.id]
  );
  if (result.affectedRows === 0) return fail("记录不存在或无权删除", 404);
  return json({ ok: true });
}
