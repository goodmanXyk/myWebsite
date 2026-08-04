"use client";

import React from "react";

type Variant = "primary" | "secondary" | "ghost";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-[colors,transform,box-shadow] duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 select-none active:scale-[0.98]";

const variants: Record<Variant, string> = {
  primary: "bg-white text-black hover:bg-white/80 shadow-sm hover:shadow",
  secondary: "bg-white/[0.06] text-white border border-white/10 hover:bg-white/10",
  ghost: "bg-transparent text-ink hover:bg-white/5",
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
