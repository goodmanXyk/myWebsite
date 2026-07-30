"use client";

import { useEffect } from "react";
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

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-white text-muted">
        加载中…
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="flex h-screen overflow-hidden bg-white">
        <Sidebar user={user} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar user={user} />
          <main className="flex-1 overflow-y-auto bg-canvas p-8">{children}</main>
        </div>
      </div>
      <ReminderWatcher />
    </ToastProvider>
  );
}
