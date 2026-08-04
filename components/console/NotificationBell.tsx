"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { getStore } from "@/lib/store";
import type { Todo } from "@/lib/store";
const store = getStore();

/**
 * 顶栏铃铛：计算「待办到期且未完成」数量作徽标，点击下拉列出明细，可跳转 /console/todos。
 * 挂载时 + 每 30 秒 + 窗口聚焦时刷新（避免 SSR/hydration 不一致，初始渲染徽标为 0）。
 */
export function NotificationBell() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const [dueTodos, setDueTodos] = useState<Todo[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const refresh = useCallback(() => {
    if (!user) return;
    store.todos
      .get(user.id)
      .then((list) => {
        const now = Date.now();
        const due = list.filter(
          (t) => t.status === "pending" && t.due != null && t.due <= now
        );
        setDueTodos(due);
        setCount(due.length);
      })
      .catch(() => {
        setDueTodos([]);
        setCount(0);
      });
  }, [user]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 30000);
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface text-muted transition-colors hover:text-ink"
        aria-label="待办提醒"
      >
        <span className="text-base leading-none">🔔</span>
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[10px] font-semibold text-black">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-10 z-50 w-72 overflow-hidden rounded-lg border border-line bg-surface shadow-lg">
          <div className="border-b border-line px-3 py-2 text-sm font-medium text-ink">
            待办提醒
          </div>
          {dueTodos.length === 0 ? (
            <p className="px-3 py-4 text-center text-xs text-muted">暂无到期待办 🎉</p>
          ) : (
            <ul className="max-h-72 overflow-y-auto">
              {dueTodos.map((t) => {
                const overdue = t.due != null && t.due < Date.now();
                return (
                  <li key={t.id}>
                    <Link
                      href="/console/todos"
                      className="block px-3 py-2 transition-colors hover:bg-white/[0.04]"
                    >
                      <span className="block truncate text-sm text-ink">{t.title}</span>
                      <span className={`text-xs ${overdue ? "text-red-500" : "text-muted"}`}>
                        {overdue ? "已逾期" : "已到期"}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
          <Link
            href="/console/todos"
            className="block border-t border-line px-3 py-2 text-center text-xs text-brand hover:underline"
          >
            查看全部待办
          </Link>
        </div>
      )}
    </div>
  );
}
