/**
 * Type definitions for the SentimentChart component.
 */

export interface ChartDataPoint {
  /** The date as an ISO string */
  date: string;
  /** The sentiment score (typically -1 to 1) */
  sentiment: number;
  /** The asset price (optional) */
  price?: number;
}

export interface SentimentData {
  date: string;
  sentiment?: number;
  avg_sentiment?: number;
}

export interface PriceData {
  date: string;
  price: number;
}

export type TimeRange = "1D" | "1W" | "1M" | "3M" | "1Y" | "ALL";

export interface SentimentChartProps {
  /** Optional CSS class for the wrapper */
  className?: string;
  /** Initial delay for the glass panel animation */
  delay?: number;
}
