"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";
import type { User } from "@/lib/auth";

const navItems = [
  { href: "/console", label: "Dashboard", icon: "▦" },
  { href: "/console/todos", label: "我的待办", icon: "✓" },
  { href: "/console/notes", label: "知识库", icon: "📚" },
  { href: "/console/health", label: "Body Healthy", icon: "♥" },
  { href: "/console/workflows", label: "Workflows", icon: "⚡" },
  { href: "/console/projects", label: "Projects", icon: "◫" },
  { href: "/console/keys", label: "API keys", icon: "🔑" },
  { href: "/console/usage", label: "Usage", icon: "📊" },
  { href: "/console/settings", label: "Settings", icon: "⚙" },
];

function initials(user: User): string {
  const source = user.name || user.email;
  return source?.[0]?.toUpperCase() || "U";
}

export function Sidebar({
  user,
  onNavigate,
}: {
  user: User;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <aside className="flex h-full w-60 flex-col border-r border-line bg-surface">
      <div className="flex h-14 items-center border-b border-line px-4">
        <Logo />
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          Workspace
        </p>
        <ul className="flex flex-col gap-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    active
                      ? "bg-white/10 font-medium text-ink"
                      : "text-muted hover:bg-white/[0.04] hover:text-ink"
                  }`}
                >
                  <span className="w-4 text-center">{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="border-t border-line p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-semibold text-black">
            {initials(user)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink">{user.name}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
