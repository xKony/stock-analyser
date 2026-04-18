"use client";

import { cn } from "@/lib/utils";

type BadgeVariant =
  | "default"
  | "success"
  | "error"
  | "warning"
  | "info"
  | "neutral"
  | "active"
  | "editorial";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default:
    "bg-paper text-ink border-rule",
  success: "bg-green-100 text-green-800 border-green-800/30",
  error: "bg-signal text-paper border-signal",
  warning: "bg-yellow-200 text-yellow-900 border-yellow-900/30",
  info: "bg-blue-100 text-blue-900 border-blue-900/30",
  neutral: "bg-white text-ink-muted border-rule/20",
  active:
    "bg-ink text-paper border-ink",
  editorial: "bg-highlight text-ink border-ink",
};

export function Badge({
  children,
  variant = "default",
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest border select-none",
        "rounded-none", // Sharp shapes
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
