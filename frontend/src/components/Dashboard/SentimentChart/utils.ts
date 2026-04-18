import { ChartDataPoint, SentimentData, PriceData } from "./types";
import { CRYPTO_TICKERS } from "./constants";

/**
 * Normalizes a ticker symbol for the price API (Yahoo Finance quirks).
 */
export function normalizeTicker(ticker: string): string {
  return CRYPTO_TICKERS.includes(ticker) ? `${ticker}-USD` : ticker;
}

/**
 * Formats a date string into a key for merging datasets by day or hour.
 * @param date - The date ISO string
 * @param days - Number of days in the range to determine precision
 */
export function formatDataKey(date: string, days: number): string {
  // "YYYY-MM-DDTHH" for small ranges (<= 7 days), otherwise "YYYY-MM-DD"
  return date.substring(0, days <= 7 ? 13 : 10);
}

/**
 * Merges sentiment and price data arrays into a single array of ChartDataPoints.
 */
export function mergeChartData(
  sentimentData: SentimentData[],
  priceData: PriceData[],
  days: number
): ChartDataPoint[] {
  const mergedMap = new Map<string, ChartDataPoint>();

  // Process sentiment data
  sentimentData.forEach((item) => {
    if (!item.date) return;
    const key = formatDataKey(item.date, days);
    const value = item.avg_sentiment !== undefined 
      ? item.avg_sentiment 
      : (item.sentiment || 0);
    
    mergedMap.set(key, { date: item.date, sentiment: value });
  });

  // Process price data
  priceData.forEach((item) => {
    if (!item.date) return;
    const key = formatDataKey(item.date, days);
    if (mergedMap.has(key)) {
      mergedMap.get(key)!.price = item.price;
    } else {
      mergedMap.set(key, {
        date: item.date,
        sentiment: 0,
        price: item.price,
      });
    }
  });

  // Convert to sorted array
  return Array.from(mergedMap.values()).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

/**
 * Forward-fills gaps in sentiment and price data to prevent chart "holes".
 */
export function forwardFillData(data: ChartDataPoint[]): ChartDataPoint[] {
  let lastSentiment = 0;
  let lastPrice = 0;

  return data.map((item) => {
    const sentiment = (item.sentiment !== undefined && item.sentiment !== 0) 
      ? item.sentiment 
      : lastSentiment;
    
    const price = (item.price !== undefined && item.price !== 0)
      ? item.price
      : lastPrice;
    
    if (sentiment !== 0) lastSentiment = sentiment;
    if (price !== 0) lastPrice = price;

    return {
      ...item,
      sentiment,
      price,
    };
  });
}
