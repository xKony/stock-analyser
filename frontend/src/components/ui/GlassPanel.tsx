"use client";

import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";

interface GlassPanelProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  gradient?: boolean;
}

export function GlassPanel({
  children,
  className,
  gradient = false,
  ...props
}: GlassPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "glass rounded-2xl p-6 relative overflow-hidden",
        gradient && "bg-gradient-to-br from-white/10 to-transparent",
        className,
      )}
      {...props}
    >
      {gradient && (
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />
      )}
      {children}
    </motion.div>
  );
}
