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
        className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors duration-150 placeholder:text-muted/70 hover:border-muted focus:border-brand focus:ring-2 focus:ring-brand/20 [color-scheme:light] ${
          hasError ? "border-red-400" : "border-line"
        } ${className}`}
        {...props}
      />
      {error ? (
        <span className="text-xs text-red-600">{error}</span>
      ) : hint ? (
        <span className="text-xs text-muted">{hint}</span>
      ) : null}
    </div>
  );
}
