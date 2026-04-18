import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface EditorialPanelProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function EditorialPanel({ children, className, delay = 0 }: EditorialPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "bg-white border border-rule p-8 relative overflow-hidden",
        className
      )}
    >
      {/* Structural Decoration: Rule lines at corners */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-rule/20" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-rule/20" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-rule/20" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-rule/20" />
      
      {children}
    </motion.div>
  );
}
