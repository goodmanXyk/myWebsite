import { fail, json } from "@/lib/server/respond";
import { getBearerToken } from "@/lib/server/auth";
import { runTodoReminders } from "@/lib/server/reminder";

// 定时任务入口：GitHub Actions 每 5 分钟调用（需 CRON_SECRET 鉴权）
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET || "";
  const token = getBearerToken(req);
  if (!secret || !token || token !== secret) return fail("未授权", 401);
  const result = await runTodoReminders();
  return json({ ok: true, ...result });
}