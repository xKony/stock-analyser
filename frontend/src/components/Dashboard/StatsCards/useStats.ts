import { useState, useEffect } from "react";
import { StatsData, UseStatsResult } from "./types";

/**
 * Custom hook to fetch and manage statistics data for the dashboard.
 * @returns An object containing stats, loading state, and error message.
 */
export function useStats(): UseStatsResult {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    
    async function fetchStats() {
      // React 19 / Vercel: setIsLoading(true) already handled by initial state,
      // but if we were to re-fetch, we'd do it in an async scope.
      setError(null);

      try {
        const response = await fetch("/api/stats", { signal: controller.signal });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch statistics: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // Basic validation of the received data structure
        if (data && typeof data.totalAssets === "number") {
          setStats({
            totalAssets: data.totalAssets,
            totalMentions: data.totalMentions || 0,
            averageSentiment: Number(data.averageSentiment) || 0,
          });
        } else {
          throw new Error("Invalid statistics data format received from server.");
        }
      } catch (err) {
        // Only update state if not aborted to avoid race conditions
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred while fetching stats.";
        console.error("Stats fetch error:", err);
        setError(errorMessage);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    fetchStats();

    return () => {
      controller.abort();
    };
  }, []);

  return { stats, isLoading, error };
}
