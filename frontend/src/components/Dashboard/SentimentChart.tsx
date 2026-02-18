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
  Area,
  AreaChart,
} from "recharts";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { cn } from "@/lib/utils";

interface SentimentData {
  date: string;
  sentiment: string;
}

export function SentimentChart() {
  const [data, setData] = useState<{ date: string; sentiment: number }[]>([]);
  const [tickers, setTickers] = useState<string[]>([]);
  const [selectedTicker, setSelectedTicker] = useState<string>("Global");
  const [timeRange, setTimeRange] = useState<string>("30");

  useEffect(() => {
    fetch("/api/assets")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setTickers(data);
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    const tickerParam =
      selectedTicker !== "Global" ? `&ticker=${selectedTicker}` : "";
    fetch(`/api/trends?days=${timeRange}${tickerParam}`)
      .then((res) => res.json())
      .then((data: SentimentData[] | { error: string }) => {
        if (Array.isArray(data)) {
          const formattedData = data.map((item) => ({
            date: new Date(item.date).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            }),
            sentiment: parseFloat(item.sentiment),
          }));
          setData(formattedData);
        } else {
          console.error("Failed to fetch sentiment data:", data);
          setData([]);
        }
      })
      .catch((err) => console.error(err));
  }, [timeRange, selectedTicker]);

  return (
    <GlassPanel className="h-[500px] flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">Sentiment Trend</h3>
          <p className="text-sm text-gray-400">
            Analysis for{" "}
            <span className="text-primary font-medium">{selectedTicker}</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          <select
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer hover:bg-white/10 transition-colors"
            value={selectedTicker}
            onChange={(e) => setSelectedTicker(e.target.value)}
          >
            <option value="Global" className="bg-gray-900 text-gray-200">
              Global Sentiment
            </option>
            {tickers.map((ticker) => (
              <option
                key={ticker}
                value={ticker}
                className="bg-gray-900 text-gray-200"
              >
                {ticker}
              </option>
            ))}
          </select>

          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
            {["7", "30", "90", "all"].map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setTimeRange(range)}
                className={cn(
                  "px-4 py-1.5 text-xs font-medium rounded-lg transition-all",
                  timeRange === range
                    ? "bg-primary text-white shadow-lg shadow-primary/25"
                    : "text-gray-400 hover:text-white hover:bg-white/5",
                )}
              >
                {range === "all" ? "All" : `${range}D`}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorSentiment" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              stroke="#525252"
              tick={{ fill: "#a3a3a3", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis
              domain={[-1, 1]}
              stroke="#525252"
              tick={{ fill: "#a3a3a3", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              dx={-10}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-black/80 backdrop-blur-xl border border-white/10 p-3 rounded-xl shadow-xl">
                      <p className="text-gray-400 text-xs mb-1">{label}</p>
                      <p className="text-white font-bold flex items-center gap-2">
                        <span className="size-2 rounded-full bg-primary" />
                        {payload[0].value?.toFixed(2)}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="sentiment"
              stroke="#3b82f6"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorSentiment)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GlassPanel>
  );
}
