import { fail, json, readBody } from "@/lib/server/respond";
import { isValidEmail, sendVerificationCode } from "@/lib/server/verify";

// 忘记密码：发送重置验证码（统一返回 ok，避免泄露邮箱是否注册）
export async function POST(req: Request) {
  const body = await readBody(req);
  const email = String(body.email ?? "").trim().toLowerCase();
  if (!isValidEmail(email)) return fail("请输入有效的邮箱地址");

  const sent = await sendVerificationCode(email, "reset");
  if (!sent) return fail("验证码发送失败，请确认邮件服务已配置", 500);

  return json({ ok: true, message: "如果该邮箱已注册，重置验证码已发送" });
}