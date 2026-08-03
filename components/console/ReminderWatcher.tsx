"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { getStore } from "@/lib/store";
import { useToast } from "@/components/ui/Toast";
const store = getStore();

/**
 * 挂载于 console layout 的无 UI 组件。
 * 应用打开期间每 30 秒轮询一次，对待办「已到期且未完成、且本会话未提醒过」的触发 toast 提醒。
 * 纯前端无后台，关闭页面不会提醒（符合本阶段预期）。
 */
export function ReminderWatcher() {
  const { user } = useAuth();
  const { show } = useToast();
  const reminded = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;

    const check = async () => {
      const now = Date.now();
      let todos;
      try {
        todos = await store.todos.get(user.id);
      } catch {
        return;
      }
      for (const t of todos) {
        if (t.status === "completed") {
          reminded.current.delete(t.id);
          continue;
        }
        if (t.due != null && t.due <= now && !reminded.current.has(t.id)) {
          reminded.current.add(t.id);
          show(`待办「${t.title}」已到期 ⏰`, "warning");
        }
      }
    };

    check();
    const id = setInterval(check, 30000);
    return () => clearInterval(id);
  }, [user, show]);

  return null;
}
