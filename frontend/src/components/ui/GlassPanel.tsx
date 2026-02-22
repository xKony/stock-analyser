"use client";

import { cn } from "@/lib/utils";
import {
  motion,
  HTMLMotionProps,
  useMotionTemplate,
  useMotionValue,
} from "framer-motion";
import { MouseEvent } from "react";

interface GlassPanelProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  elevated?: boolean;
  delay?: number;
}

export function GlassPanel({
  children,
  className,
  elevated = false,
  delay = 0,
  ...props
}: GlassPanelProps) {
  // Spotlight effect logic
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({
    currentTarget,
    clientX,
    clientY,
  }: MouseEvent<HTMLDivElement>) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{
        duration: 0.5,
        ease: [0.23, 1, 0.32, 1], // Physics-based cubic bezier
        delay,
      }}
      onMouseMove={handleMouseMove}
      className={cn(
        "group relative overflow-hidden",
        "rounded-[var(--radius-card)] p-6",
        "border border-white/5", // Darker border, glass highlight handled inside
        "shadow-2xl backdrop-blur-2xl",
        elevated ? "bg-[#1C212E]/80" : "bg-[#151923]/80", // Slightly more transparent for glass effect
        className,
      )}
      {...props}
    >
      {/* Interactive Spotlight Hover Effect */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              650px circle at ${mouseX}px ${mouseY}px,
              rgba(255,255,255,0.06),
              transparent 80%
            )
          `,
        }}
      />

      {/* Inner top light-catching border (Physical glass feel) */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none opacity-50" />
      <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-white/10 to-transparent pointer-events-none opacity-30" />

      {/* Content */}
      <div className="relative z-10 w-full h-full">{children}</div>
    </motion.div>
  );
}
