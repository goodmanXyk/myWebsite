"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export interface ToastItem {
  id: string;
  message: string;
  type?: "info" | "success" | "warning";
}

interface ToastContextValue {
  show: (message: string, type?: ToastItem["type"]) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const show = useCallback(
    (message: string, type: ToastItem["type"] = "info") => {
      const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`animate-toast-in motion-reduce:animate-none rounded-lg border border-line bg-white px-4 py-3 text-sm text-ink shadow-lg ${
              t.type === "warning" ? "border-l-4 border-l-brand" : ""
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
