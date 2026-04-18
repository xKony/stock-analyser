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
    "bg-ink text-paper font-mono uppercase tracking-widest text-[11px] font-bold",
    "rounded-none px-6 py-3",
    "border border-transparent",
    "hover:bg-signal hover:text-white",
  ].join(" "),
  ghost: [
    "bg-paper border border-rule text-ink font-mono uppercase tracking-widest text-[11px] font-bold",
    "rounded-none px-6 py-3",
    "hover:bg-highlight hover:border-ink",
  ].join(" "),
  inline: [
    "bg-transparent text-ink font-mono uppercase tracking-widest text-[10px] font-bold relative",
    "rounded-none px-3 py-1.5",
    "hover:bg-highlight/20",
    "before:absolute before:bottom-0 before:left-0 before:w-full before:h-px before:bg-ink before:opacity-30 hover:before:opacity-100",
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
      whileHover={{ scale: 1 }} // Remove scaling bounce for strict editorial feel
      whileTap={{ scale: 0.98 }}
      className={cn(
        "inline-flex items-center justify-center gap-2 cursor-pointer transition-colors duration-200",
        variantStyles[variant],
        className,
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}
