import { Badge } from "@/components/ui/Badge";

import { cn } from "@/lib/utils";

interface ChartHeaderProps {
  currentSentiment: number;
}

export function ChartHeader({ currentSentiment }: ChartHeaderProps) {
  const isPositive = currentSentiment >= 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <h3 className="text-2xl font-serif font-black tracking-tighter text-ink uppercase">
          Sentiment Velocity
        </h3>
        <span className={cn(
          "font-mono text-[9px] px-2 py-0.5 font-bold uppercase tracking-widest",
          isPositive ? "bg-green-100 text-green-900" : "bg-signal text-paper"
        )}>
          {isPositive ? "ACCELERATING" : "DECELERATING"}
        </span>
      </div>
      <p className="font-mono text-[10px] text-ink-muted uppercase tracking-widest flex items-center gap-2">
        Current conviction index: 
        <span className="data-font text-base bg-ink text-paper px-2 py-0.5 normal-case">
          {currentSentiment.toFixed(4)}
        </span>
      </p>
    </div>
  );
}
