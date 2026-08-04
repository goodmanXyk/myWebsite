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

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const res = await login(email, password);
    setSubmitting(false);
    if (res.ok) router.push("/console");
    else setError(res.error || "登录失败");
  };

  return (
    <div className="min-h-screen bg-canvas">
      <SiteNavbar />
      <main className="mx-auto flex max-w-md flex-col px-4 py-16">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo showText={false} />
          <h1 className="mt-4 text-2xl font-semibold text-ink">Welcome back</h1>
          <p className="mt-1 text-sm text-muted">登录以继续使用你的 AI 工作流</p>
        </div>
        <Card>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
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
            <Button type="submit" fullWidth disabled={submitting}>
              {submitting ? "登录中…" : "Continue"}
            </Button>
          </form>
        </Card>
        <p className="mt-4 text-center text-sm text-muted">
          还没有账户？{" "}
          <Link
            href="/register"
            className="font-medium text-ink underline-offset-2 hover:underline"
          >
            去注册
          </Link>
        </p>
      </main>
    </div>
  );
}
