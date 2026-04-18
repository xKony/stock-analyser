import { useState, useEffect, useRef } from "react";
import { 
  ChartDataPoint, 
  TimeRange, 
  SentimentData, 
  PriceData 
} from "./types";
import { 
  FALLBACK_TICKERS, 
  RANGE_DAYS_MAP 
} from "./constants";
import { 
  normalizeTicker, 
  mergeChartData, 
  forwardFillData 
} from "./utils";

/**
 * Custom hook for fetching and managing sentiment chart data.
 * @param selectedTicker - The currently selected stock symbol.
 * @param selectedRange - The currently selected time range.
 * @returns An object containing tickers, data, loading state, and selected ticker.
 */
export function useSentimentChartData(
  initialTicker: string,
  selectedRange: TimeRange
) {
  const [selectedTicker, setSelectedTicker] = useState(initialTicker);
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [tickers, setTickers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Use a ref to track the latest ticker selection and avoid race conditions
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch available tickers on mount
  useEffect(() => {
    let isMounted = true;

    async function fetchTickers() {
      try {
        const res = await fetch("/api/assets");
        if (!res.ok) throw new Error("Failed to fetch assets");
        const assetList: string[] = await res.json();
        
        if (isMounted) {
          if (assetList && assetList.length > 0) {
            setTickers(assetList);
            // Default to the first ticker if current one is not in the list
            if (!assetList.includes(selectedTicker)) {
              setSelectedTicker(assetList[0]);
            }
          } else {
            setTickers(FALLBACK_TICKERS);
          }
        }
      } catch (err) {
        console.error("Failed to fetch tickers:", err);
        if (isMounted) setTickers(FALLBACK_TICKERS);
      }
    }

    fetchTickers();
    return () => {
      isMounted = false;
    };
  }, [selectedTicker]);

  // Fetch chart data when ticker or range changes
  useEffect(() => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        const days = RANGE_DAYS_MAP[selectedRange];
        const normalizedTicker = normalizeTicker(selectedTicker);

        // Parallel fetch for performance (async-parallel)
        const [sentimentRes, priceRes] = await Promise.all([
          fetch(`/api/trends?ticker=${selectedTicker}&days=${days}`, { signal: controller.signal }),
          fetch(`/api/prices?ticker=${normalizedTicker}&days=${days}`, { signal: controller.signal }),
        ]);

        if (!sentimentRes.ok || !priceRes.ok) {
          throw new Error("One or more data sources failed");
        }

        const sentimentData: SentimentData[] = await sentimentRes.json();
        const priceData: PriceData[] = await priceRes.json();

        // Heavy data processing
        const merged = mergeChartData(sentimentData, priceData, days);
        const filled = forwardFillData(merged);

        if (!controller.signal.aborted) {
          setData(filled);
          setIsLoading(false);
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return; // Ignore aborted requests
        }
        console.error("Failed to fetch chart data:", err);
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err : new Error("Unknown error"));
          setIsLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      controller.abort();
    };
  }, [selectedRange, selectedTicker]);

  return {
    tickers,
    data,
    isLoading,
    error,
    selectedTicker,
    setSelectedTicker,
  };
}
