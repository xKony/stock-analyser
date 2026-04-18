"use client";

import { Activity, BarChart2, MessageSquare, AlertCircle } from "lucide-react";
import { MetricCard } from "@/components/ui/MetricCard";
import { useStats } from "./useStats";

/**
 * StatsCards Component
 * Renders a row of metric cards with real-time market statistics.
 * 
 * Includes loading, error, and populated states following
 * Next.js best practices and accessibility guidelines.
 */
export function StatsCards() {
  const { stats, isLoading, error } = useStats();

  if (error) {
    return (
      <section 
        aria-label="Market Statistics Error" 
        className="p-6 rounded-[var(--radius-card)] border border-red-500/20 bg-red-500/5 flex items-center gap-3 text-red-400"
      >
        <AlertCircle size={20} />
        <span className="text-sm font-medium">Failed to load market statistics: {error}</span>
      </section>
    );
  }

  // Define data with fallbacks for loading state (zeroes or nulls)
  const totalAssets = stats?.totalAssets ?? 0;
  const totalMentions = stats?.totalMentions ?? 0;
  const avgSentiment = stats?.averageSentiment ?? 0;
  
  // scale to percent-like for delta badge
  const sentimentTrend = avgSentiment * 100; 

  return (
    <section 
      aria-label="Market Statistics Overview" 
      className="grid grid-cols-1 md:grid-cols-3 gap-5"
    >
      <MetricCard
        title="Total Assets Tracked"
        value={isLoading ? "..." : totalAssets.toLocaleString()}
        rawValue={isLoading ? undefined : totalAssets}
        trend={12.5} // TODO: Fetch trend from API
        trendLabel="across all markets"
        icon={BarChart2}
        delay={0}
      />
      <MetricCard
        title="Total Mentions"
        value={isLoading ? "..." : totalMentions.toLocaleString()}
        rawValue={isLoading ? undefined : totalMentions}
        trend={8.2} // TODO: Fetch trend from API
        trendLabel="social media posts"
        icon={MessageSquare}
        delay={0.07}
      />
      <MetricCard
        title="Average Sentiment"
        value={isLoading ? "..." : avgSentiment.toFixed(3)}
        rawValue={isLoading ? undefined : avgSentiment}
        trend={sentimentTrend}
        trendLabel="overall market mood"
        icon={Activity}
        delay={0.14}
      />
    </section>
  );
}
