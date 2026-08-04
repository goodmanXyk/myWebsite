"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Sidebar } from "@/components/console/Sidebar";
import { Topbar } from "@/components/console/Topbar";
import { ToastProvider } from "@/components/ui/Toast";
import { ReminderWatcher } from "@/components/console/ReminderWatcher";

export default function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface text-muted">
        加载中…
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="flex h-screen overflow-hidden bg-surface">
        {/* 桌面端：固定侧栏 */}
        <div className="hidden h-full md:block">
          <Sidebar user={user} />
        </div>

        {/* 移动端：抽屉 + 遮罩 */}
        {navOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="absolute inset-0 bg-black/70"
              onClick={() => setNavOpen(false)}
            />
            <div className="animate-slide-in-left absolute left-0 top-0 h-full w-60 bg-surface shadow-xl">
              <Sidebar user={user} onNavigate={() => setNavOpen(false)} />
            </div>
          </div>
        )}

        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar user={user} onMenuClick={() => setNavOpen(true)} />
          <main className="app-bg flex-1 overflow-y-auto p-4 md:p-8">
            {children}
          </main>
        </div>
      </div>
      <ReminderWatcher />
    </ToastProvider>
  );
}
