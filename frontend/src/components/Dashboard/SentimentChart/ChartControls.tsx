import { TimeRange } from "./types";
import { TIME_RANGES } from "./constants";
import { cn } from "@/lib/utils";

interface ChartControlsProps {
  /** The currently selected ticker symbol */
  selectedTicker: string;
  /** Callback to change the ticker */
  onTickerChange: (ticker: string) => void;
  /** List of available tickers */
  tickers: string[];
  /** The currently selected time range */
  selectedRange: TimeRange;
  /** Callback to change the time range */
  onRangeChange: (range: TimeRange) => void;
}

/**
 * Control panel for the Sentiment Chart, allowing users to select tickers and time ranges.
 */
export function ChartControls({
  selectedTicker,
  onTickerChange,
  tickers,
  selectedRange,
  onRangeChange,
}: ChartControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Ticker Selector - Journal Style */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-[9px] text-ink-muted uppercase">ASSET</span>
        <select
          id="ticker-select"
          value={selectedTicker}
          onChange={(e) => onTickerChange(e.target.value)}
          className="bg-paper border border-rule text-ink text-xs font-mono font-bold px-3 py-1.5 focus:outline-none focus:bg-highlight cursor-pointer uppercase tracking-widest"
        >
          {tickers.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {/* Time Range Selector - Rigid Tabbed Style */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-[9px] text-ink-muted uppercase">WINDOW</span>
        <div className="flex border border-rule">
          {TIME_RANGES.map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => onRangeChange(range)}
              className={cn(
                "px-4 py-1.5 text-[10px] font-mono font-bold border-r border-rule last:border-r-0 transition-all uppercase tracking-tighter",
                selectedRange === range
                  ? "bg-ink text-paper"
                  : "text-ink hover:bg-highlight"
              )}
            >
              {range}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
