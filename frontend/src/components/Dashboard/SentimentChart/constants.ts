import { TimeRange } from "./types";

/**
 * Supported time ranges for the sentiment chart.
 */
export const TIME_RANGES: TimeRange[] = ["1D", "1W", "1M", "3M", "1Y", "ALL"];

/**
 * Fallback tickers to display if the initial asset fetch fails.
 */
export const FALLBACK_TICKERS: string[] = ["AAPL", "NVDA", "TSLA", "AMD", "MSFT"];

/**
 * Tickers that require an "-USD" suffix for price API (Yahoo Finance).
 */
export const CRYPTO_TICKERS: string[] = ["BTC", "ETH", "SOL", "DOGE"];

/**
 * Map of time ranges to days count for internal queries.
 */
export const RANGE_DAYS_MAP: Record<TimeRange, number> = {
  "1D": 1,
  "1W": 7,
  "1M": 30,
  "3M": 90,
  "1Y": 365,
  "ALL": 1825,
};
