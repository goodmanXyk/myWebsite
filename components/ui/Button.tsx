"use client";

import React from "react";

type Variant = "primary" | "secondary" | "ghost";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-[colors,transform,box-shadow] duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 select-none active:scale-[0.98]";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-white hover:bg-black/80 shadow-sm hover:shadow",
  secondary: "bg-white text-ink border border-line hover:bg-gray-50",
  ghost: "bg-transparent text-ink hover:bg-gray-100",
};

export function Button({
  variant = "primary",
  fullWidth,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${base} ${variants[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    />
  );
}
