"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { getStore } from "@/lib/store";
import { todayKey } from "@/lib/storage";

const store = getStore();

const placeholders = [
  { title: "工作流 Workflows", hint: "编排你的 AI 流程" },
  { title: "最近运行 Runs", hint: "查看执行记录" },
  { title: "本月用量 Usage", hint: "Tokens / 调用统计" },
];

interface Summary {
  todoPending: number;
  todoOverdue: number;
  todoDoneToday: number;
  waterPercent: number;
  workoutDone: number;
  latestWeight: string;
}

const emptySummary: Summary = {
  todoPending: 0,
  todoOverdue: 0,
  todoDoneToday: 0,
  waterPercent: 0,
  workoutDone: 0,
  latestWeight: "—",
};

export default function ConsoleHome() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const uid = user.id;
      const now = Date.now();
      const today = todayKey();

      const [todos, waterSettings, waterDays, workoutsToday, weights] = await Promise.all([
        store.todos.get(uid),
        store.health.getSettings(uid),
        store.health.getWaterDays(uid),
        store.health.getWorkoutEntries(uid, today),
        store.health.getWeightEntries(uid),
      ]);

      const pending = todos.filter((t) => t.status === "pending");
      const overdue = pending.filter((t) => t.due != null && t.due < now);
      const doneToday = todos.filter(
        (t) => t.status === "completed" && t.completedAt && todayKey(new Date(t.completedAt)) === today
      );

      const waterToday = waterDays.find((d) => d.date === today);
      const percent = waterSettings.waterTargetMl
        ? Math.round(((waterToday?.amountMl ?? 0) / waterSettings.waterTargetMl) * 100)
        : 0;

      const doneWorkouts = workoutsToday.filter((w) => w.done);
      const latestWeight = weights.length
        ? `${weights[weights.length - 1].kg} kg`
        : "—";

      setSummary({
        todoPending: pending.length,
        todoOverdue: overdue.length,
        todoDoneToday: doneToday.length,
        waterPercent: percent,
        workoutDone: doneWorkouts.length,
        latestWeight,
      });
    })().catch((e) => {
      console.error("加载概览失败", e);
      setSummary(emptySummary);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-ink">欢迎回来，{user?.name}</h1>
        <p className="mt-1 text-sm text-muted">
          这里是你的 AI 工作流控制台。今日概览与你的待办、健康数据已自动同步。
        </p>
      </div>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
        今日概览 / Today
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Link href="/console/todos" className="col-span-1">
          <Card className="h-full transition-colors hover:border-brand">
            <p className="text-xs text-muted">待完成</p>
            <p className="mt-1 text-2xl font-semibold text-ink">
              {summary ? summary.todoPending : "—"}
            </p>
          </Card>
        </Link>
        <Link href="/console/todos" className="col-span-1">
          <Card className="h-full transition-colors hover:border-brand">
            <p className="text-xs text-muted">已逾期</p>
            <p className="mt-1 text-2xl font-semibold text-red-500">
              {summary ? summary.todoOverdue : "—"}
            </p>
          </Card>
        </Link>
        <Link href="/console/todos" className="col-span-1">
          <Card className="h-full transition-colors hover:border-brand">
            <p className="text-xs text-muted">今日完成</p>
            <p className="mt-1 text-2xl font-semibold text-ink">
              {summary ? summary.todoDoneToday : "—"}
            </p>
          </Card>
        </Link>
        <Link href="/console/health" className="col-span-1">
          <Card className="h-full transition-colors hover:border-brand">
            <p className="text-xs text-muted">饮水进度</p>
            <p className="mt-1 text-2xl font-semibold text-ink">
              {summary ? `${summary.waterPercent}%` : "—"}
            </p>
          </Card>
        </Link>
        <Link href="/console/health" className="col-span-1">
          <Card className="h-full transition-colors hover:border-brand">
            <p className="text-xs text-muted">今日健身</p>
            <p className="mt-1 text-2xl font-semibold text-ink">
              {summary ? summary.workoutDone : "—"}
            </p>
          </Card>
        </Link>
        <Link href="/console/health" className="col-span-1">
          <Card className="h-full transition-colors hover:border-brand">
            <p className="text-xs text-muted">最新体重</p>
            <p className="mt-1 text-2xl font-semibold text-ink">
              {summary ? summary.latestWeight : "—"}
            </p>
          </Card>
        </Link>
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
          工作区 / Workspace
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {placeholders.map((item) => (
            <Card key={item.title}>
              <p className="text-sm text-muted">{item.title}</p>
              <p className="mt-3 text-3xl font-semibold text-ink">—</p>
              <p className="mt-2 text-xs text-muted">{item.hint}（内容待填充）</p>
            </Card>
          ))}
        </div>
      </div>

      <Card className="mt-6">
        <h3 className="text-base font-medium text-ink">快速开始</h3>
        <p className="mt-2 text-sm text-muted">
          已上线模块：<Link href="/console/todos" className="text-brand hover:underline">我的待办</Link>
          、<Link href="/console/health" className="text-brand hover:underline">Body Healthy</Link>
          ，以及 <Link href="/console/settings" className="text-brand hover:underline">通知设置</Link>
          。创建工作流、运行监控、用量图表等能力将在后续版本中实现。
        </p>
      </Card>
    </div>
  );
}
