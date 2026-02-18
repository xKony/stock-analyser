"use client";

import { GlassPanel } from "./GlassPanel";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  trend: number;
  trendLabel?: string;
  icon?: React.ElementType;
  className?: string;
}

export function MetricCard({
  title,
  value,
  trend,
  trendLabel = "vs last month",
  icon: Icon = Activity,
  className,
}: MetricCardProps) {
  const isPositive = trend >= 0;

  return (
    <GlassPanel
      className={cn(
        "relative overflow-hidden group hover:border-white/20 transition-colors",
        className,
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-white/5 rounded-lg text-gray-400 group-hover:text-white group-hover:bg-white/10 transition-colors">
          <Icon size={20} />
        </div>
        <div
          className={cn(
            "flex items-center px-2 py-1 rounded-full text-xs font-medium",
            isPositive
              ? "bg-green-500/10 text-green-500"
              : "bg-red-500/10 text-red-500",
          )}
        >
          {isPositive ? (
            <ArrowUpRight size={14} className="mr-1" />
          ) : (
            <ArrowDownRight size={14} className="mr-1" />
          )}
          {Math.abs(trend)}%
        </div>
      </div>

      <div className="space-y-1">
        <h3 className="text-sm font-medium text-gray-400">{title}</h3>
        <div className="text-2xl font-bold text-white tracking-tight">
          {value}
        </div>
        <p className="text-xs text-gray-500">{trendLabel}</p>
      </div>

      {/* Decorative gradient blob */}
      <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-primary/20 blur-2xl rounded-full group-hover:bg-primary/30 transition-all duration-500" />
    </GlassPanel>
  );
}
