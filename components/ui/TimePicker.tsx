"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

interface TimePickerProps {
  value: string; // "HH:mm" 或空
  onChange: (time: string) => void;
  label?: string;
  className?: string;
}

const ITEM_H = 36; // 每项高度 px
const VISIBLE = 5; // 可见项数

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

interface WheelColumnProps {
  items: string[];
  value: string;
  onChange: (v: string) => void;
  label: string;
}

function WheelColumn({ items, value, onChange, label }: WheelColumnProps) {
  const ref = useRef<HTMLDivElement>(null);
  const last = useRef(value);
  const idx = Math.max(0, items.indexOf(value));

  // 外部值变化时平滑滚动到对应项
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const cur = Math.round(el.scrollTop / ITEM_H);
    if (cur !== idx) el.scrollTo({ top: idx * ITEM_H, behavior: "smooth" });
  }, [idx]);

  const handleScroll = () => {
    const el = ref.current;
    if (!el) return;
    const i = Math.round(el.scrollTop / ITEM_H);
    const clamped = Math.max(0, Math.min(items.length - 1, i));
    const v = items[clamped];
    if (v !== last.current) {
      last.current = v;
      onChange(v);
    }
  };

  const step = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const cur = Math.round(el.scrollTop / ITEM_H);
    const target = Math.max(0, Math.min(items.length - 1, cur + dir));
    el.scrollTo({ top: target * ITEM_H, behavior: "smooth" });
  };

  const clickItem = (i: number) => {
    const el = ref.current;
    if (!el) return;
    el.scrollTo({ top: i * ITEM_H, behavior: "smooth" });
    onChange(items[i]);
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={() => step(-1)}
        className="flex h-6 w-12 items-center justify-center rounded-md text-muted transition-colors hover:bg-white/5 hover:text-white"
        aria-label={`${label} 上一个`}
      >
        <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M4 10l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div
        ref={ref}
        onScroll={handleScroll}
        className="no-scrollbar relative h-[180px] w-16 touch-pan-y snap-y snap-mandatory overflow-y-auto scroll-smooth"
      >
        {/* 上下渐隐遮罩 */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-10 bg-gradient-to-b from-[#1c1c1c] to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-10 bg-gradient-to-t from-[#1c1c1c] to-transparent" />
        {/* 中间高亮条 */}
        <div className="pointer-events-none absolute inset-x-0 top-1/2 z-0 h-9 -translate-y-1/2 rounded-lg bg-white/[0.08] ring-1 ring-inset ring-white/10" />
        <div className="relative z-0 py-[72px]">
          {items.map((it, i) => {
            const active = it === value;
            return (
              <button
                key={it}
                type="button"
                onClick={() => clickItem(i)}
                className={`flex h-9 w-full snap-center items-center justify-center text-sm tabular-nums transition-colors ${
                  active ? "font-semibold text-white" : "text-muted"
                }`}
              >
                {it}
              </button>
            );
          })}
        </div>
      </div>
      <button
        type="button"
        onClick={() => step(1)}
        className="flex h-6 w-12 items-center justify-center rounded-md text-muted transition-colors hover:bg-white/5 hover:text-white"
        aria-label={`${label} 下一个`}
      >
        <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <span className="text-[10px] uppercase tracking-wide text-muted/60">{label}</span>
    </div>
  );
}

/** 滚轮时间选择器：小时 0-23、分钟 00-59 */
export function TimePicker({ value, onChange, label, className = "" }: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<"down" | "up">("down");
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
      const popHeight = pop.offsetHeight || 280;
      const spaceBelow = window.innerHeight - btnRect.bottom - 8;
      const spaceAbove = btnRect.top - 8;
      setPosition(spaceBelow >= popHeight || spaceBelow >= spaceAbove ? "down" : "up");
    });
    return () => cancelAnimationFrame(t);
  }, [open]);

  const [hh, mm] = value ? value.split(":") : ["", ""];
  const hasTime = value !== "" && hh !== "" && mm !== "";

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
          <span className={`truncate tabular-nums ${hasTime ? "text-ink" : "text-muted"}`}>
            {hasTime ? value : "请选择时间"}
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
            <circle cx="10" cy="10" r="7" />
            <path d="M10 6v4l3 2" />
          </svg>
        </button>
        {open && (
          <div
            ref={popRef}
            className={`absolute left-0 z-30 w-56 rounded-xl border border-white/10 bg-[#1c1c1c] p-3 shadow-[0_12px_32px_rgba(0,0,0,0.5)] ${
              position === "down" ? "top-full mt-1.5" : "bottom-full mb-1.5"
            }`}
          >
            <div className="mb-2 flex items-center justify-center gap-2 text-sm font-medium tabular-nums text-ink">
              <span>{hasTime ? hh : "--"}</span>
              <span className="text-muted">:</span>
              <span>{hasTime ? mm : "--"}</span>
            </div>
            <div className="flex items-start justify-center gap-4">
              <WheelColumn
                items={HOURS}
                value={hasTime ? hh : ""}
                onChange={(h) => onChange(`${h}:${hasTime ? mm : "00"}`)}
                label="时"
              />
              <WheelColumn
                items={MINUTES}
                value={hasTime ? mm : ""}
                onChange={(m) => onChange(`${hasTime ? hh : "00"}:${m}`)}
                label="分"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}