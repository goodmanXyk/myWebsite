"use client";

import { useEffect, useMemo, useState } from "react";
import { startOfDay, endOfDay, addDays } from "date-fns";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { getStore } from "@/lib/store";
import type { Todo, TodoPriority, TodoStatus } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Card } from "@/components/ui/Card";

const store = getStore();

type StatusFilter = "all" | TodoStatus;
type PriorityFilter = "all" | TodoPriority;
type TimeFilter = "all" | "today" | "next7" | "overdue";

const timeFilterOptions: { value: TimeFilter; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "today", label: "今天" },
  { value: "next7", label: "未来7天" },
  { value: "overdue", label: "已逾期" },
];

const priorityOptions: { value: TodoPriority; label: string }[] = [
  { value: "high", label: "高 / High" },
  { value: "medium", label: "中 / Medium" },
  { value: "low", label: "低 / Low" },
];

const priorityBadge: Record<TodoPriority, string> = {
  high: "bg-red-50 text-red-600 border border-red-200",
  medium: "bg-amber-50 text-amber-600 border border-amber-200",
  low: "bg-gray-100 text-muted border border-line",
};

const priorityLabel: Record<TodoPriority, string> = {
  high: "高",
  medium: "中",
  low: "低",
};

function toLocalInput(ts: number | null): string {
  if (!ts) return "";
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function fromLocalInput(v: string): number | null {
  if (!v) return null;
  const t = new Date(v).getTime();
  return isNaN(t) ? null : t;
}

function formatDue(ts: number | null): { text: string; overdue: boolean } {
  if (!ts) return { text: "无截止时间", overdue: false };
  const now = Date.now();
  const overdue = ts < now;
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  const text = `${d.getMonth() + 1}月${d.getDate()}日 ${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
  return { text, overdue };
}

interface FormState {
  title: string;
  description: string;
  due: string;
  priority: TodoPriority;
  status: TodoStatus;
}

const emptyForm: FormState = {
  title: "",
  description: "",
  due: "",
  priority: "medium",
  status: "pending",
};

export default function TodosPage() {
  const { user } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Todo | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState("");

  const reload = () => {
    if (!user) return;
    setTodos(store.todos.get(user.id));
    setLoaded(true);
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const filtered = useMemo(() => {
    const now = Date.now();
    const startOfToday = startOfDay(now).getTime();
    const endOfNext7 = endOfDay(addDays(now, 7)).getTime();
    const matchTime = (t: Todo): boolean => {
      if (timeFilter === "all") return true;
      if (!t.due) return false;
      if (timeFilter === "today") return t.due >= startOfToday && t.due < startOfToday + 86400000;
      if (timeFilter === "next7") return t.due >= startOfToday && t.due <= endOfNext7;
      if (timeFilter === "overdue") return t.due < now && t.status !== "completed";
      return true;
    };
    return todos.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
      if (!matchTime(t)) return false;
      return true;
    });
  }, [todos, statusFilter, priorityFilter, timeFilter]);

  const stats = useMemo(() => {
    const pending = todos.filter((t) => t.status === "pending");
    const overdue = pending.filter((t) => t.due != null && t.due < Date.now());
    const completed = todos.filter((t) => t.status === "completed");
    return { total: todos.length, pending: pending.length, completed: completed.length, overdue: overdue.length };
  }, [todos]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setModalOpen(true);
  };

  const openEdit = (t: Todo) => {
    setEditing(t);
    setForm({
      title: t.title,
      description: t.description || "",
      due: toLocalInput(t.due),
      priority: t.priority,
      status: t.status,
    });
    setError("");
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!user) return;
    if (!form.title.trim()) {
      setError("请填写标题 / Title is required");
      return;
    }
    const due = fromLocalInput(form.due);
    if (editing) {
      store.todos.update(user.id, editing.id, {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        due,
        priority: form.priority,
        status: form.status,
        completedAt: form.status === "completed" ? editing.completedAt ?? Date.now() : null,
      });
    } else {
      store.todos.add(user.id, {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        due,
        priority: form.priority,
      });
    }
    setModalOpen(false);
    reload();
  };

  const handleToggle = (t: Todo) => {
    if (!user) return;
    store.todos.toggle(user.id, t.id);
    reload();
  };

  const handleDelete = (t: Todo) => {
    if (!user) return;
    if (!confirm(`确认删除「${t.title}」？`)) return;
    store.todos.remove(user.id, t.id);
    reload();
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">我的待办</h1>
          <p className="mt-1 text-sm text-muted">
            My Todos · 创建并记录每日任务，支持到期提醒
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/console/settings">
            <Button variant="secondary">⚙ 提醒设置</Button>
          </Link>
          <Button onClick={openCreate}>+ 新建待办</Button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs text-muted">总任务</p>
          <p className="mt-1 text-2xl font-semibold text-ink">{loaded ? stats.total : "—"}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted">待完成</p>
          <p className="mt-1 text-2xl font-semibold text-ink">{loaded ? stats.pending : "—"}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted">已完成</p>
          <p className="mt-1 text-2xl font-semibold text-ink">{loaded ? stats.completed : "—"}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted">已逾期</p>
          <p className="mt-1 text-2xl font-semibold text-red-500">{loaded ? stats.overdue : "—"}</p>
        </Card>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-xl border border-line bg-white p-1">
          {timeFilterOptions.map((o) => (
            <button
              key={o.value}
              onClick={() => setTimeFilter(o.value)}
              className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                timeFilter === o.value
                  ? "bg-ink text-white"
                  : "text-muted hover:text-ink"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          options={[
            { value: "all", label: "全部状态" },
            { value: "pending", label: "待完成" },
            { value: "completed", label: "已完成" },
          ]}
          className="w-36"
        />
        <Select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)}
          options={[
            { value: "all", label: "全部优先级" },
            ...priorityOptions.map((o) => ({ value: o.value, label: o.label })),
          ]}
          className="w-40"
        />
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {!loaded ? (
          <p className="py-12 text-center text-sm text-muted">加载中…</p>
        ) : filtered.length === 0 ? (
          <Card className="py-12 text-center text-sm text-muted">
            暂无待办，点击右上角「新建待办」开始记录 ✍️
          </Card>
        ) : (
          filtered.map((t) => {
            const due = formatDue(t.due);
            const done = t.status === "completed";
            return (
              <Card
                key={t.id}
                className={`flex items-start gap-4 p-4 ${
                  due.overdue && !done ? "border-l-4 border-l-red-400" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={done}
                  onChange={() => handleToggle(t)}
                  className="mt-1 h-4 w-4 accent-brand"
                  aria-label="完成切换"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-sm font-medium ${done ? "text-muted line-through" : "text-ink"}`}
                    >
                      {t.title}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${priorityBadge[t.priority]}`}
                    >
                      {priorityLabel[t.priority]}
                    </span>
                  </div>
                  {t.description && (
                    <p className="mt-1 text-xs text-muted">{t.description}</p>
                  )}
                  <p className={`mt-1 text-xs ${due.overdue && !done ? "text-red-500" : "text-muted"}`}>
                    📅 截止：{due.text}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => openEdit(t)}
                    className="rounded-md px-2 py-1 text-xs text-muted transition-colors hover:bg-gray-100 hover:text-ink"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleDelete(t)}
                    className="rounded-md px-2 py-1 text-xs text-red-500 transition-colors hover:bg-red-50"
                  >
                    删除
                  </button>
                </div>
              </Card>
            );
          })
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "编辑待办" : "新建待办"}>
        <div className="flex flex-col gap-4">
          <Input
            label="标题 / Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="例如：完成周报"
            error={error || undefined}
          />
          <Textarea
            label="描述 / Description（可选）"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="补充说明…"
            rows={3}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="截止时间 / Due（可选）"
              type="datetime-local"
              value={form.due}
              onChange={(e) => setForm({ ...form, due: e.target.value })}
            />
            <Select
              label="优先级 / Priority"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value as TodoPriority })}
              options={priorityOptions}
            />
          </div>
          {editing && (
            <Select
              label="状态 / Status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as TodoStatus })}
              options={[
                { value: "pending", label: "待完成" },
                { value: "completed", label: "已完成" },
              ]}
            />
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave}>保存</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
