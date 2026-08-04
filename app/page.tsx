"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { SiteNavbar } from "@/components/SiteNavbar";
import { Button } from "@/components/ui/Button";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      router.replace(user ? "/console" : "/login");
    }
  }, [loading, user, router]);

  return (
    <div className="min-h-screen bg-canvas">
      <SiteNavbar />
      <main className="mx-auto max-w-6xl px-4 py-24 text-center">
        <p className="text-sm font-medium tracking-wide text-brand">
          AI WORKFLOW PLATFORM
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          Build, run and scale your AI workflows
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-muted">
          一个面向 AI 工作流的控制台。注册账号，即可开始编排、运行并监控你的智能体流程。
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button onClick={() => router.push(user ? "/console" : "/register")}>
            {user ? "进入控制台" : "免费开始"}
          </Button>
          <Button variant="secondary" onClick={() => router.push("/login")}>
            Log in
          </Button>
        </div>
      </main>
    </div>
  );
}
