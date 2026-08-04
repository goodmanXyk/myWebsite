"use client";

import { useEffect } from "react";

export interface ContextMenuItem {
  label: string;
  icon?: string;
  danger?: boolean;
  onClick: () => void;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

/**
 * 右键菜单（OpenAI 风格柔和弹出层）。
 */
export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("mousedown", onClose);
    window.addEventListener("resize", onClose);
    window.addEventListener("scroll", onClose, true);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onClose);
      window.removeEventListener("resize", onClose);
      window.removeEventListener("scroll", onClose, true);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const style: React.CSSProperties = {
    left: Math.max(8, Math.min(x, (typeof window !== "undefined" ? window.innerWidth : 1200) - 180)),
    top: Math.max(8, Math.min(y, (typeof window !== "undefined" ? window.innerHeight : 800) - items.length * 36 - 16)),
  };

  return (
    <div
      className="fixed z-50 w-44 rounded-xl border border-white/10 bg-[#1c1c1c] p-1 shadow-[0_12px_32px_rgba(0,0,0,0.6)]"
      style={style}
      onContextMenu={(e) => e.preventDefault()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {items.map((it) => (
        <button
          key={it.label}
          type="button"
          onClick={() => {
            onClose();
            it.onClick();
          }}
          className={`flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-sm transition-colors ${
            it.danger
              ? "text-red-400 hover:bg-red-500/10 hover:text-red-300"
              : "text-ink hover:bg-white/5"
          }`}
        >
          {it.icon && <span className="text-xs">{it.icon}</span>}
          {it.label}
        </button>
      ))}
    </div>
  );
}
