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
    <div className="flex flex-wrap items-center gap-3">
      {/* Ticker Select */}
      <div className="relative">
        <label htmlFor="ticker-select" className="sr-only">
          Select Ticker
        </label>
        <select
          id="ticker-select"
          value={selectedTicker}
          onChange={(e) => onTickerChange(e.target.value)}
          className="bg-[var(--bg-app)] border border-white/10 text-white text-xs rounded-[var(--radius-btn)] px-3 py-1.5 focus:outline-none focus:border-[var(--brand-primary)] cursor-pointer"
        >
          {tickers.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {/* Time Range Pills */}
      <div 
        role="group" 
        aria-label="Time range selector"
        className="flex bg-[var(--bg-app)] rounded-[var(--radius-pill)] p-1 border border-white/5"
      >
        {TIME_RANGES.map((range) => (
          <button
            key={range}
            type="button"
            onClick={() => onRangeChange(range)}
            aria-pressed={selectedRange === range}
            className={cn(
              "px-3 py-1 text-[10px] font-medium rounded-[var(--radius-pill)] transition-all",
              selectedRange === range
                ? "bg-[var(--brand-primary)] text-white shadow-md shadow-[var(--brand-glow)]"
                : "text-[var(--text-muted)] hover:text-white"
            )}
          >
            {range}
          </button>
        ))}
      </div>
    </div>
  );
}
