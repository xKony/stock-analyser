"use client";

import { useEffect, useState } from "react";
import { Activity, BarChart2, MessageSquare } from "lucide-react";

interface StatsData {
  totalAssets: number;
  totalMentions: number;
  averageSentiment: number;
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
      <div className="bg-white p-6 rounded-lg shadow flex items-center">
        <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
          <BarChart2 size={24} />
        </div>
        <div>
          <p className="text-gray-500 text-sm">Total Assets</p>
          <p className="text-2xl font-bold text-gray-800">
            {stats.totalAssets}
          </p>
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow flex items-center">
        <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
          <MessageSquare size={24} />
        </div>
        <div>
          <p className="text-gray-500 text-sm">Total Mentions</p>
          <p className="text-2xl font-bold text-gray-800">
            {stats.totalMentions}
          </p>
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow flex items-center">
        <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
          <Activity size={24} />
        </div>
        <div>
          <p className="text-gray-500 text-sm">Avg Sentiment</p>
          <p className="text-2xl font-bold text-gray-800">
            {stats.averageSentiment}
          </p>
        </div>
      </div>
    </div>
  );
}
