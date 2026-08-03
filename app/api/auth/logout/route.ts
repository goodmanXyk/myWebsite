import { deleteSession, getBearerToken } from "@/lib/server/auth";
import { ok } from "@/lib/server/respond";

export async function POST(req: Request) {
  await deleteSession(getBearerToken(req));
  return ok();
}
