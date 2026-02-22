"use client";

import { cn } from "@/lib/utils";

type BadgeVariant =
  | "default"
  | "success"
  | "error"
  | "warning"
  | "info"
  | "neutral"
  | "active";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default:
    "bg-[var(--bg-card-hover)] text-[var(--text-secondary)] border-transparent",
  success: "bg-[var(--success)]/10 text-[var(--success)] border-transparent",
  error: "bg-[var(--error)]/10 text-[var(--error)] border-transparent",
  warning: "bg-[var(--warning)]/10 text-[var(--warning)] border-transparent",
  info: "bg-[var(--info)]/10 text-[var(--info)] border-transparent",
  neutral: "bg-white/5 text-[var(--text-muted)] border-transparent",
  active:
    "bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] border-[var(--brand-primary)]/20 shadow-[0_0_12px_var(--brand-glow)]",
};

export function Badge({
  children,
  variant = "default",
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-medium tracking-wide border select-none",
        "rounded-[var(--radius-pill)]", // Capsule shape
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
