import React from "react";

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  hint?: string;
  accent?: boolean;
  children?: React.ReactNode;
}

export function StatCard({
  label,
  value,
  hint,
  accent,
  children,
}: StatCardProps) {
  return (
      <div
        className={`rounded-card border border-line bg-surface p-5 transition-shadow duration-150 hover:shadow-soft ${
          accent ? "border-l-4 border-l-brand" : ""
        }`}
      >
      <p className="text-sm text-muted">{label}</p>
      <div className="mt-2 text-3xl font-semibold text-ink">{value}</div>
      {hint && <p className="mt-2 text-xs text-muted">{hint}</p>}
      {children}
    </div>
  );
}
