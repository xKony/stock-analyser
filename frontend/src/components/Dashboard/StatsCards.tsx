"use client";

import { useEffect, useState } from "react";
import { Activity, BarChart2, MessageSquare, TrendingUp } from "lucide-react";
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
      .then((res) => res.json())
      .then((data: StatsData) => setStats(data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <MetricCard
        title="Total Assets"
        value={stats.totalAssets.toString()}
        trend={12.5}
        icon={BarChart2}
        className="delay-0"
      />
      <MetricCard
        title="Total Mentions"
        value={stats.totalMentions.toLocaleString()}
        trend={8.2}
        icon={MessageSquare}
        className="delay-100"
      />
      <MetricCard
        title="Avg Sentiment"
        value={Number(stats.averageSentiment).toFixed(2)}
        trend={-2.4}
        icon={Activity}
        className="delay-200"
      />
    </div>
  );
}
