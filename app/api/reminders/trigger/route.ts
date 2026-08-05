import { fail, json } from "@/lib/server/respond";
import { requireUser } from "@/lib/server/auth";
import { runTodoReminders } from "@/lib/server/reminder";

// 前端轮询触发：仅扫描当前登录用户的到期待办并发送提醒（幂等，每 30 秒调用无副作用）
export async function POST(req: Request) {
  const user = await requireUser(req);
  if (!user) return fail("未登录", 401);
  const result = await runTodoReminders(Date.now(), user.id);
  return json({ ok: true, ...result });
}