"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import type { User } from "@/lib/auth";
import { NotificationBell } from "@/components/console/NotificationBell";

const titleMap: Record<string, string> = {
  "/console": "Dashboard",
  "/console/todos": "我的待办",
  "/console/notes": "知识库",
  "/console/health": "Body Healthy",
  "/console/settings": "设置",
};

function initials(user: User): string {
  const source = user.name || user.email;
  return source?.[0]?.toUpperCase() || "U";
}

export function Topbar({
  user,
  onMenuClick,
}: {
  user: User;
  onMenuClick?: () => void;
}) {
  const { logout } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const title = titleMap[pathname] ?? "Dashboard";

  return (
    <header className="flex h-14 items-center justify-between border-b border-line bg-surface px-4 md:px-6">
      <div className="flex items-center gap-2">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-ink transition-colors hover:bg-white/10 md:hidden"
            aria-label="打开菜单"
          >
            <span className="text-lg leading-none">☰</span>
          </button>
        )}
        <h2 className="text-sm font-medium text-ink">{title}</h2>
      </div>
      <div className="relative flex items-center gap-3">
        <input
          className="hidden w-64 rounded-lg border border-line bg-canvas px-3 py-1.5 text-sm outline-none transition-colors placeholder:text-muted focus:border-ink md:block"
          placeholder="搜索工作流…"
        />
        <NotificationBell />
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-semibold text-black"
          aria-label="用户菜单"
        >
          {initials(user)}
        </button>
        {open && (
          <div className="absolute right-0 top-10 z-50 w-44 overflow-hidden rounded-lg border border-line bg-surface py-1 shadow-lg">
            <div className="border-b border-line px-3 py-2">
              <p className="truncate text-sm font-medium text-ink">{user.name}</p>
              <p className="truncate text-xs text-muted">{user.email}</p>
            </div>
            <button
              onClick={logout}
              className="block w-full px-3 py-2 text-left text-sm text-ink transition-colors hover:bg-white/[0.04]"
            >
              退出登录 / Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
