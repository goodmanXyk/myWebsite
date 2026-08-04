"use client";

import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({
  label,
  error,
  hint,
  className = "",
  id,
  ...props
}: InputProps) {
  const inputId = id || props.name;
  const hasError = !!error;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full rounded-xl border bg-white/[0.03] px-3.5 py-2.5 text-sm text-ink outline-none transition-all duration-150 placeholder:text-muted/60 hover:border-white/20 focus:border-white/40 focus:ring-2 focus:ring-white/10 [color-scheme:dark] ${
          hasError ? "border-red-400/70" : "border-white/10"
        } ${className}`}
        {...props}
      />
      {error ? (
        <span className="text-xs text-red-400">{error}</span>
      ) : hint ? (
        <span className="text-xs text-muted">{hint}</span>
      ) : null}
    </div>
  );
}
