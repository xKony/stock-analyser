"use client";

import { useEffect, useState } from "react";
import { Activity, BarChart2, MessageSquare } from "lucide-react";
import { MetricCard } from "@/components/ui/MetricCard";

interface StatsData {
  totalAssets: number;
  totalMentions: number;
  averageSentiment: number | string;
}

export function StatsCards() {
  const [stats, setStats] = useState<StatsData>({
    totalAssets: 0,
    totalMentions: 0,
    averageSentiment: 0,
  });

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`API Error: ${res.status}`);
        }
        return res.json();
      })
      .then((data: StatsData) => {
        if (data && typeof data.totalAssets !== "undefined") {
          setStats(data);
        } else {
          console.error("Invalid stats data received:", data);
        }
      })
      .catch((err) => console.error("Failed to fetch stats:", err));
  }, []);

  const avgSentiment = Number(stats.averageSentiment);
  const sentimentTrend = avgSentiment * 100; // scale to percent-like for delta badge

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      <MetricCard
        title="Total Assets Tracked"
        value={stats.totalAssets.toLocaleString()}
        rawValue={stats.totalAssets}
        trend={12.5}
        trendLabel="across all markets"
        icon={BarChart2}
        delay={0}
      />
      <MetricCard
        title="Total Mentions"
        value={stats.totalMentions.toLocaleString()}
        rawValue={stats.totalMentions}
        trend={8.2}
        trendLabel="social media posts"
        icon={MessageSquare}
        delay={0.07}
      />
      <MetricCard
        title="Average Sentiment"
        value={avgSentiment.toFixed(3)}
        rawValue={avgSentiment}
        trend={sentimentTrend}
        trendLabel="overall market mood"
        icon={Activity}
        delay={0.14}
      />
    </div>
  );
}
