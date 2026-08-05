"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { addMonths, format, isSameDay, isSameMonth, startOfMonth, startOfWeek, addDays, isToday, parse } from "date-fns";
import { zhCN } from "date-fns/locale";

interface DatePickerProps {
  value: string; // "YYYY-MM-DD" 或空
  onChange: (date: string) => void;
  label?: string;
  className?: string;
}

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

/** 自定义日历选择器（OpenAI 风格柔和弹出层），空间不足时自动向上弹出 */
export function DatePicker({ value, onChange, label, className = "" }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<"down" | "up">("down");
  const [viewMonth, setViewMonth] = useState<Date>(() => {
    const d = parse(value || "", "yyyy-MM-dd", new Date());
    return isNaN(d.getTime()) ? new Date() : d;
  });
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

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

  useLayoutEffect(() => {
    if (!open) return;
    const t = requestAnimationFrame(() => {
      const btn = triggerRef.current;
      const pop = popRef.current;
      if (!btn || !pop) return;
      const btnRect = btn.getBoundingClientRect();
      const popHeight = pop.offsetHeight || 320;
      const spaceBelow = window.innerHeight - btnRect.bottom - 8;
      const spaceAbove = btnRect.top - 8;
      setPosition(spaceBelow >= popHeight || spaceBelow >= spaceAbove ? "down" : "up");
    });
    return () => cancelAnimationFrame(t);
  }, [open]);

  const selected = parse(value || "2000-01-01", "yyyy-MM-dd", new Date());
  const hasDate = value !== "" && !isNaN(selected.getTime());

  const days: Date[] = [];
  const gridStart = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 0 });
  for (let i = 0; i < 42; i++) days.push(addDays(gridStart, i));

  return (
    <div className={`flex flex-col gap-1.5 ${className}`} ref={ref}>
      {label && <span className="text-sm font-medium text-ink">{label}</span>}
      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`flex w-full items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-ink transition-colors hover:border-white/20 ${
            open ? "border-white/25" : ""
          }`}
        >
          <span className={`truncate ${hasDate ? "text-ink" : "text-muted"}`}>
            {hasDate ? format(selected, "yyyy年M月d日 EEEE", { locale: zhCN }) : "请选择日期"}
          </span>
          <svg
            className="h-4 w-4 shrink-0 text-muted"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="14" height="13" rx="2" />
            <path d="M3 8h14" />
            <path d="M7 2v4" />
            <path d="M13 2v4" />
          </svg>
        </button>
        {open && (
          <div
            ref={popRef}
            className={`absolute left-0 z-30 w-64 rounded-xl border border-white/10 bg-[#1c1c1c] p-2.5 shadow-[0_12px_32px_rgba(0,0,0,0.5)] ${
              position === "down" ? "top-full mt-1.5" : "bottom-full mb-1.5"
            }`}
          >
            <div className="mb-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setViewMonth((m) => addMonths(m, -1))}
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-white/5 hover:text-white"
                aria-label="上个月"
              >
                ‹
              </button>
              <span className="text-sm font-medium text-ink">
                {format(viewMonth, "yyyy年M月", { locale: zhCN })}
              </span>
              <button
                type="button"
                onClick={() => setViewMonth((m) => addMonths(m, 1))}
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-white/5 hover:text-white"
                aria-label="下个月"
              >
                ›
              </button>
            </div>
            <div className="mb-1 grid grid-cols-7 text-center">
              {WEEKDAYS.map((w) => (
                <span key={w} className="py-1 text-xs text-muted">
                  {w}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {days.map((d) => {
                const inMonth = isSameMonth(d, viewMonth);
                const isSel = hasDate ? isSameDay(d, selected) : false;
                const isTod = isToday(d);
                return (
                  <button
                    key={d.toISOString()}
                    type="button"
                    onClick={() => {
                      onChange(format(d, "yyyy-MM-dd"));
                      setOpen(false);
                    }}
                    className={`flex h-8 items-center justify-center rounded-lg text-sm transition-colors ${
                      isSel
                        ? "bg-white font-semibold text-black"
                        : isTod
                        ? "text-white ring-1 ring-inset ring-white/25 hover:bg-white/10"
                        : inMonth
                        ? "text-ink hover:bg-white/10"
                        : "text-muted/40 hover:bg-white/5"
                    }`}
                  >
                    {format(d, "d")}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}