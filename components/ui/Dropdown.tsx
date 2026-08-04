"use client";

import { useEffect, useRef, useState } from "react";

export interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  label?: string;
  placeholder?: string;
  className?: string;
  align?: "left" | "right";
}

/**
 * 自定义下拉选择（OpenAI 风格柔和菜单，替代原生 <select>）。
 */
export function Dropdown({
  value,
  onChange,
  options,
  label,
  placeholder = "请选择",
  className = "",
  align = "left",
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div className={`flex flex-col gap-1.5 ${className}`} ref={ref}>
      {label && <span className="text-sm font-medium text-ink">{label}</span>}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`flex w-full items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-ink transition-colors hover:border-white/20 ${
            open ? "border-white/25" : ""
          }`}
        >
          <span className={`truncate ${selected ? "text-ink" : "text-muted"}`}>
            {selected ? selected.label : placeholder}
          </span>
          <svg
            className={`h-4 w-4 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5.5 7.5 10 12l4.5-4.5" />
          </svg>
        </button>
        {open && (
          <div
            className={`absolute z-30 mt-1.5 w-full min-w-[10rem] rounded-xl border border-white/10 bg-[#1c1c1c] p-1 shadow-[0_12px_32px_rgba(0,0,0,0.5)] ${
              align === "right" ? "right-0" : "left-0"
            }`}
          >
            {options.map((o) => {
              const active = o.value === value;
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className={`block w-full rounded-lg px-3 py-1.5 text-left text-sm transition-colors ${
                    active ? "bg-white/10 text-white" : "text-muted hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
