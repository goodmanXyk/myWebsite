"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { getStore } from "@/lib/store";
import { useToast } from "@/components/ui/Toast";
const store = getStore();

/**
 * 挂载于 console layout 的无 UI 组件。
 * 每 30 秒轮询：
 * 1) 调用后端 /api/reminders/trigger 真实发送到期待办提醒（邮件/企微群，幂等，只发一次）
 * 2) 前端站内 toast（非企微邮箱用户也适用）
 */
export function ReminderWatcher() {
  const { user } = useAuth();
  const { show } = useToast();
  const reminded = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;

    const triggerRemote = async (): Promise<boolean> => {
      try {
        const token = window.localStorage.getItem("aiwf_token");
        if (!token) return false;
        const res = await fetch("/api/reminders/trigger", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        const sent = Number(data.emailed || 0) + Number(data.wecomPushed || 0);
        if (sent > 0) {
          show("已发送待办提醒至你的邮箱 📧", "success");
          return true;
        }
        return false;
      } catch {
        return false;
      }
    };

    const check = async () => {
      await triggerRemote();

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