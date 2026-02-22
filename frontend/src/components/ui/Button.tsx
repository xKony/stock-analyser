"use client";

import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";

type ButtonVariant = "primary" | "ghost" | "inline";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  children: React.ReactNode;
  variant?: ButtonVariant;
  className?: string;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: [
    "text-white font-semibold text-sm",
    "rounded-[var(--r-btn)] px-5 py-2.5",
    "shadow-[var(--shadow-cta)]",
    "hover:brightness-110",
  ].join(" "),
  ghost: [
    "bg-white/[0.06] border border-white/[0.12] text-[var(--text-body)]",
    "font-medium text-sm",
    "rounded-[var(--r-btn)] px-5 py-2.5",
    "hover:bg-white/[0.10]",
  ].join(" "),
  inline: [
    "bg-[var(--brand-glow)] border border-[rgba(108,99,255,0.4)] text-[var(--brand-primary)]",
    "font-medium text-[13px]",
    "rounded-[var(--r-icon)] px-[14px] py-[6px]",
    "hover:bg-[var(--brand-glow)] hover:brightness-110",
  ].join(" "),
};

export function Button({
  children,
  variant = "primary",
  className,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      style={
        variant === "primary"
          ? { background: "var(--brand-gradient)" }
          : undefined
      }
      className={cn(
        "inline-flex items-center justify-center gap-2 cursor-pointer transition-[filter,background-color] duration-200",
        variantStyles[variant],
        className,
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}
