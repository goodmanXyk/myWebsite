import React from "react";

export function Card({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-card border border-line bg-surface p-6 transition-shadow duration-150 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
