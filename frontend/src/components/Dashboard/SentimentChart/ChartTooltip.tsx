import { format } from "date-fns";

interface PayloadItem {
  dataKey?: string | number;
  value?: string | number;
  name?: string | number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: PayloadItem[];
  label?: string | number;
}

/**
 * Custom tooltip component for the Sentiment Chart.
 */
export function ChartTooltip({
  active,
  payload,
  label,
}: CustomTooltipProps) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const sentimentPayload = payload.find((p) => p.dataKey === "sentiment");
  const pricePayload = payload.find((p) => p.dataKey === "price");

  return (
    <div className="bg-[var(--bg-card-hover)] border border-white/10 rounded-[var(--radius-btn)] p-3 shadow-xl backdrop-blur-md">
      <p className="text-[10px] text-[var(--text-muted)] mb-2">
        {label ? format(new Date(label), "MMM dd, yyyy HH:mm") : ""}
      </p>
      
      {sentimentPayload && (
        <div className="flex justify-between items-center gap-4 mb-1">
          <span className="text-xs text-[var(--text-secondary)]">
            Sentiment:
          </span>
          <span className="text-sm font-bold text-white tabular-nums">
            {Number(sentimentPayload.value).toFixed(4)}
          </span>
        </div>
      )}
      
      {pricePayload && pricePayload.value !== undefined && (
        <div className="flex justify-between items-center gap-4">
          <span className="text-xs text-[var(--text-secondary)]">
            Price:
          </span>
          <span className="text-sm font-bold text-[var(--brand-primary)] tabular-nums">
            $
            {Number(pricePayload.value).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
      )}
    </div>
  );
}
