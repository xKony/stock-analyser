"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface SentimentData {
  date: string;
  sentiment: string;
}

export function SentimentChart() {
  const [data, setData] = useState<{ date: string; sentiment: number }[]>([]);

  useEffect(() => {
    fetch("/api/trends?days=30")
      .then((res) => res.json())
      .then((data: SentimentData[] | { error: string }) => {
        if (Array.isArray(data)) {
          const formattedData = data.map((item) => ({
            date: new Date(item.date).toLocaleDateString(),
            sentiment: parseFloat(item.sentiment),
          }));
          setData(formattedData);
        } else {
          console.error("Failed to fetch sentiment data:", data);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="w-full h-64 bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4 text-gray-700">
        30-Day Sentiment Trend
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis domain={[-1, 1]} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="sentiment"
            stroke="#8884d8"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
