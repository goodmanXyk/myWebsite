"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { SiteNavbar } from "@/components/SiteNavbar";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export default function RegisterPage() {
  const { register, sendCode } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const handleSendCode = async () => {
    setError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("请先填写有效的邮箱地址");
      return;
    }
    setSending(true);
    const res = await sendCode(email.trim(), "register");
    setSending(false);
    if (!res.ok) {
      setError(res.error || "验证码发送失败");
      return;
    }
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const res = await register(email, password, name, code);
    setSubmitting(false);
    if (res.ok) router.push("/console");
    else setError(res.error || "注册失败");
  };

  return (
    <div className="app-bg min-h-screen">
      <SiteNavbar />
      <main className="mx-auto flex max-w-md flex-col px-4 py-16">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo showText={false} />
          <h1 className="mt-4 text-2xl font-semibold text-ink">创建账户</h1>
          <p className="mt-1 text-sm text-muted">通过邮箱验证码完成注册</p>
        </div>
        <Card>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <Input
              label="Name（可选）"
              name="name"
              placeholder="你的昵称"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <div>
              <div className="mb-1 text-xs font-medium text-muted">邮箱验证码 / Code</div>
              <div className="flex items-end gap-2">
                <Input
                  name="code"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="6 位验证码"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  className="flex-1"
                  required
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleSendCode}
                  disabled={sending || countdown > 0}
                  className="shrink-0 px-3 py-2 text-xs"
                >
                  {countdown > 0 ? `${countdown}s` : sending ? "发送中…" : "发送验证码"}
                </Button>
              </div>
            </div>
            <Input
              label="Password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="至少 6 位"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={error}
              required
            />
            <Button type="submit" fullWidth disabled={submitting}>
              {submitting ? "创建中…" : "Sign up"}
            </Button>
          </form>
        </Card>
        <p className="mt-4 text-center text-sm text-muted">
          已有账户？{" "}
          <Link
            href="/login"
            className="font-medium text-ink underline-offset-2 hover:underline"
          >
            Log in
          </Link>
        </p>
      </main>
    </div>
  );
}