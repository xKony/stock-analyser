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
    <div className="bg-white border border-rule p-4 shadow-sm">
      <p className="font-mono text-[10px] text-ink-muted uppercase tracking-widest mb-3 border-b border-rule/10 pb-2">
        {label ? format(new Date(label), "MMM dd, yyyy HH:mm") : ""}
      </p>
      
      {sentimentPayload && (
        <div className="flex justify-between items-center gap-6 mb-2">
          <span className="font-mono text-[10px] text-ink uppercase tracking-wider">
            Sentiment:
          </span>
          <span className="font-bold text-ink data-font">
            {Number(sentimentPayload.value).toFixed(4)}
          </span>
        </div>
      )}
      
      {pricePayload && pricePayload.value !== undefined && (
        <div className="flex justify-between items-center gap-6">
          <span className="font-mono text-[10px] text-ink uppercase tracking-wider">
            Price:
          </span>
          <span className="font-bold text-ink data-font">
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
