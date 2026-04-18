import { Badge } from "@/components/ui/Badge";

interface ChartHeaderProps {
  /** The current sentiment score */
  currentSentiment: number;
}

/**
 * Header component for the Sentiment Chart, displaying the trend status and current score.
 */
export function ChartHeader({ currentSentiment }: ChartHeaderProps) {
  const isPositive = currentSentiment >= 0;

  return (
    <div>
      <h3
        className="text-lg font-semibold tracking-tight text-[var(--text-primary)]"
      >
        Sentiment Trend
      </h3>
      <div className="flex items-center gap-2 mt-1">
        <Badge variant={isPositive ? "success" : "error"}>
          {isPositive ? "Bullish" : "Bearish"}
        </Badge>
        <span
          className="text-sm tabular-nums text-[var(--text-secondary)]"
        >
          Current:{" "}
          <strong className="text-white">
            {currentSentiment.toFixed(4)}
          </strong>
        </span>
      </div>
    </div>
  );
}
