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

type Mode = "login" | "forgot";

export default function LoginPage() {
  const { login, sendCode, resetPassword } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const res = await login(email, password);
    setSubmitting(false);
    if (res.ok) router.push("/console");
    else setError(res.error || "登录失败");
  };

  const handleSendCode = async () => {
    setError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("请先填写有效的邮箱地址");
      return;
    }
    setSending(true);
    const res = await sendCode(email.trim(), "reset");
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

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 6) {
      setError("新密码至少需要 6 位");
      return;
    }
    setSubmitting(true);
    const res = await resetPassword(email, code, newPassword);
    setSubmitting(false);
    if (res.ok) {
      setMode("login");
      setPassword("");
      setCode("");
      setNewPassword("");
      setError("");
    } else {
      setError(res.error || "重置失败");
    }
  };

  return (
    <div className="app-bg min-h-screen">
      <SiteNavbar />
      <main className="mx-auto flex max-w-md flex-col px-4 py-16">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo showText={false} />
          <h1 className="mt-4 text-2xl font-semibold text-ink">
            {mode === "login" ? "Welcome back" : "重置密码"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {mode === "login" ? "登录以继续使用你的 AI 工作流" : "通过邮箱验证码重置你的密码"}
          </p>
        </div>
        <Card>
          {mode === "login" ? (
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
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
              <Input
                label="Password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={error}
                required
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setMode("forgot");
                    setError("");
                  }}
                  className="text-xs text-muted underline-offset-2 transition-colors hover:text-ink hover:underline"
                >
                  忘记密码？
                </button>
              </div>
              <Button type="submit" fullWidth disabled={submitting}>
                {submitting ? "登录中…" : "Continue"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleReset} className="flex flex-col gap-4">
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
                <div className="mb-1 text-xs font-medium text-muted">验证码 / Code</div>
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
                label="新密码"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                placeholder="至少 6 位"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                error={error}
                required
              />
              <Button type="submit" fullWidth disabled={submitting}>
                {submitting ? "重置中…" : "重置密码"}
              </Button>
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
                className="text-center text-xs text-muted underline-offset-2 transition-colors hover:text-ink hover:underline"
              >
                ← 返回登录
              </button>
            </form>
          )}
        </Card>
        {mode === "login" && (
          <p className="mt-4 text-center text-sm text-muted">
            还没有账户？{" "}
            <Link
              href="/register"
              className="font-medium text-ink underline-offset-2 hover:underline"
            >
              去注册
            </Link>
          </p>
        )}
      </main>
    </div>
  );
}