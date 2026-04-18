"use client";

import { Badge } from "./Badge";
import { NumberTicker } from "./NumberTicker";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { motion } from "framer-motion";

interface MetricCardProps {
  title: string;
  value: string;
  rawValue?: number;
  trend?: number;
  trendLabel?: string;
  icon?: React.ElementType;
  className?: string;
  delay?: number;
}

export function MetricCard({
  title,
  value,
  rawValue,
  trend,
  trendLabel,
  icon: Icon,
  className,
  delay = 0,
}: MetricCardProps) {
  const isPositive = trend !== undefined && trend > 0;
  const isNegative = trend !== undefined && trend < 0;
  const isNeutral = trend === 0;

  const isCurrency = value.startsWith("$");
  const hasK = value.endsWith("K");
  const hasM = value.endsWith("M");
  const decimalPlaces = value.includes(".") ? value.split(".")[1].length : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={cn(
        "editorial-panel relative overflow-hidden group hover:bg-highlight/20 transition-colors duration-300",
        className,
      )}
    >
      {/* Editorial Header: Monospace Label + Icon */}
      <div className="flex items-start justify-between mb-8 pb-3 border-b border-rule/5">
        <span className="font-mono text-[10px] text-ink-muted uppercase tracking-[0.2em]">
          {title}
        </span>
        {Icon && (
          <div className="text-ink/20 group-hover:text-signal transition-colors">
            <Icon size={16} strokeWidth={1.5} />
          </div>
        )}
      </div>

      {/* Body: Financial Terminal Style Value */}
      <div className="space-y-4">
        <div className="text-5xl data-font text-ink flex items-baseline leading-none uppercase">
          {rawValue !== undefined ? (
            <>
              {isCurrency && (
                <span className="mr-1 text-2xl font-normal text-ink/40 tracking-normal">$</span>
              )}
              <NumberTicker
                value={rawValue}
                decimalPlaces={decimalPlaces}
                delay={delay + 0.1}
              />
              {hasK && (
                <span className="ml-0.5 text-2xl font-normal text-ink/40 lowercase">k</span>
              )}
              {hasM && (
                <span className="ml-0.5 text-2xl font-normal text-ink/40 lowercase">m</span>
              )}
            </>
          ) : (
            value
          )}
        </div>

        {/* Footer: Detailed Metadata */}
        {(isPositive || isNegative || isNeutral) && trend !== undefined && (
          <div className="flex items-center gap-3 border-t border-rule/10 pt-4">
            <div className={cn(
              "font-mono text-[10px] font-bold px-2 py-0.5 flex items-center gap-1",
              isPositive ? "bg-green-100 text-green-800" : "bg-signal text-paper"
            )}>
              {isPositive && <ArrowUpRight size={10} />}
              {isNegative && <ArrowDownRight size={10} />}
              <span className="tabular-nums">
                {Math.abs(trend).toFixed(1)}%
              </span>
            </div>
            {trendLabel && (
              <span className="font-mono text-[9px] text-ink-muted uppercase tracking-wider">
                {trendLabel}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Visual Accent: Rule line on hover */}
      <div className="absolute left-0 bottom-0 w-0 h-1 bg-signal group-hover:w-full transition-all duration-500" />
    </motion.div>
  );
}
