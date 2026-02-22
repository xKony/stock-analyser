"use client";

import { GlassPanel } from "./GlassPanel";
import { Badge } from "./Badge";
import { NumberTicker } from "./NumberTicker";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string; // Keep as string for formatting prefix/suffix (like $ or K) usually, but we need raw number for ticker. Let's adapt.
  rawValue?: number; // Optional raw number for ticker. If provided, we tick.
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

  // Extract prefix/suffix if rawValue is provided (e.g. value="$128" -> prefix="$", rawValue=128)
  const isCurrency = value.startsWith("$");
  const hasK = value.endsWith("K");
  const hasM = value.endsWith("M");
  const decimalPlaces = value.includes(".") ? value.split(".")[1].length : 0;

  return (
    <GlassPanel
      delay={delay}
      className={cn(
        // Removed group hover:bg here to rely on GlassPanel's internal spotlight
        "flex flex-col justify-between min-h-[140px]",
        className,
      )}
    >
      {/* Header: Title + Icon */}
      <div className="flex items-start justify-between mb-4">
        <span
          className="text-sm font-medium tracking-wide"
          style={{ color: "var(--text-secondary)" }}
        >
          {title}
        </span>
        {Icon && (
          <div
            className="p-2 rounded-[var(--radius-btn)] transition-colors group-hover:bg-white/5"
            style={{ color: "var(--text-muted)" }}
          >
            <Icon size={18} />
          </div>
        )}
      </div>

      {/* Body: Value */}
      <div className="space-y-3">
        <div
          className="text-3xl font-bold tabular-nums tracking-tight flex items-baseline"
          style={{ color: "var(--text-primary)" }}
        >
          {rawValue !== undefined ? (
            <>
              {isCurrency && (
                <span className="mr-1 text-2xl text-[var(--text-muted)]">
                  $
                </span>
              )}
              <NumberTicker
                value={rawValue}
                decimalPlaces={decimalPlaces}
                delay={delay + 0.1}
              />
              {hasK && (
                <span className="ml-0.5 text-2xl text-[var(--text-muted)]">
                  K
                </span>
              )}
              {hasM && (
                <span className="ml-0.5 text-2xl text-[var(--text-muted)]">
                  M
                </span>
              )}
            </>
          ) : (
            value
          )}
        </div>

        {/* Footer: Trend Badge */}
        {(isPositive || isNegative || isNeutral) && trend !== undefined && (
          <div className="flex items-center gap-2">
            <Badge
              variant={
                isPositive ? "success" : isNegative ? "error" : "default"
              }
            >
              {isPositive && <ArrowUpRight size={12} />}
              {isNegative && <ArrowDownRight size={12} />}
              {isNeutral && <Minus size={12} />}
              <span className="tabular-nums">
                {Math.abs(trend).toFixed(1)}%
              </span>
            </Badge>
            {trendLabel && (
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {trendLabel}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Hover decoration: Brand glow (kept in addition to spotlight for extra pop) */}
      <div
        className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full blur-[60px] opacity-0 group-hover:opacity-15 transition-opacity duration-500 pointer-events-none"
        style={{ backgroundColor: "var(--brand-primary)" }}
      />
    </GlassPanel>
  );
}
