"use client";

import React from "react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: { value: string; label: string }[];
}

export function Select({
  label,
  error,
  hint,
  options,
  className = "",
  id,
  ...props
}: SelectProps) {
  const selectId = id || props.name;
  const hasError = !!error;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          className={`w-full appearance-none rounded-xl border bg-white/[0.03] pl-3.5 pr-10 py-2.5 text-sm text-ink outline-none transition-all duration-150 hover:border-white/20 focus:border-white/40 focus:ring-2 focus:ring-white/10 [color-scheme:dark] ${
            hasError ? "border-red-400/70" : "border-white/10"
          } ${className}`}
          {...props}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M5.5 7.5 10 12l4.5-4.5" />
        </svg>
      </div>
      {error ? (
        <span className="text-xs text-red-400">{error}</span>
      ) : hint ? (
        <span className="text-xs text-muted">{hint}</span>
      ) : null}
    </div>
  );
}
