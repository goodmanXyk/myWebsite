import { getBearerToken, getUserByToken } from "@/lib/server/auth";
import { fail, ok } from "@/lib/server/respond";

export async function GET(req: Request) {
  const user = await getUserByToken(getBearerToken(req));
  if (!user) return fail("未登录", 401);
  return ok({ user });
}
