"use client";

import { useState, useEffect } from "react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Badge } from "@/components/ui/Badge";
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

interface ChartDataPoint {
  date: string;
  sentiment: number;
  price?: number;
}

interface SentimentChartProps {
  className?: string;
  delay?: number;
}

const timeRanges = ["1D", "1W", "1M", "3M", "1Y", "ALL"];
// Fallback tickers in case API fails
const fallbackTickers = ["AAPL", "NVDA", "TSLA", "AMD", "MSFT"];

export function SentimentChart({
  className,
  delay = 0.1,
}: SentimentChartProps) {
  const [selectedRange, setSelectedRange] = useState("1M");
  const [selectedTicker, setSelectedTicker] = useState("BTC"); // Start with a generic or fetched one later
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [tickers, setTickers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch available tickers on mount
  useEffect(() => {
    fetch("/api/assets")
      .then((res) => res.json())
      .then((data: string[]) => {
        if (data && data.length > 0) {
          setTickers(data);
          // Only set initial ticker if the current one isn't in the list
          if (!data.includes(selectedTicker)) {
            setSelectedTicker(data[0]);
          }
        } else {
          setTickers(fallbackTickers);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch tickers:", err);
        setTickers(fallbackTickers);
      });
  }, [selectedTicker]);

  // Fetch actual data based on selectedTicker and Range
  useEffect(() => {
    setTimeout(() => setLoading(true), 0);
    let isMounted = true;

    async function fetchData() {
      try {
        let days = 30;
        switch (selectedRange) {
          case "1D":
            days = 1;
            break;
          case "1W":
            days = 7;
            break;
          case "1M":
            days = 30;
            break;
          case "3M":
            days = 90;
            break;
          case "1Y":
            days = 365;
            break;
          case "ALL":
            days = 1825;
            break;
        }

        // Handle Yahoo Finance ticker quirks (e.g. BTC needs BTC-USD)
        const fetchTicker =
          selectedTicker === "BTC" || selectedTicker === "ETH"
            ? `${selectedTicker}-USD`
            : selectedTicker;

        const [sentimentRes, priceRes] = await Promise.all([
          fetch(`/api/trends?ticker=${selectedTicker}&days=${days}`),
          fetch(`/api/prices?ticker=${fetchTicker}&days=${days}`),
        ]);

        const sentimentData: {
          date: string;
          sentiment?: number;
          avg_sentiment?: number;
        }[] = sentimentRes.ok ? await sentimentRes.json() : [];
        const priceData: { date: string; price: number }[] = priceRes.ok
          ? await priceRes.json()
          : [];

        // Merge by Date
        const mergedMap = new Map<string, ChartDataPoint>();

        const formatKey = (d: string) => d.substring(0, days <= 7 ? 13 : 10); // "YYYY-MM-DDTHH" or "YYYY-MM-DD"

        sentimentData.forEach((item) => {
          if (!item.date) return;
          const key = formatKey(item.date);
          const val =
            item.avg_sentiment !== undefined
              ? item.avg_sentiment
              : item.sentiment || 0;
          mergedMap.set(key, { date: item.date, sentiment: val });
        });

        priceData.forEach((item) => {
          if (!item.date) return;
          const key = formatKey(item.date);
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

        // Sort by date ascending
        const mergedArray = Array.from(mergedMap.values()).sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        );

        // Forward-fill price and sentiment to remove gaps
        let lastSentiment = 0;
        let lastPrice = 0;
        mergedArray.forEach((item) => {
          if (item.sentiment !== undefined && item.sentiment !== 0) {
            lastSentiment = item.sentiment;
          } else {
            item.sentiment = lastSentiment;
          }

          if (item.price !== undefined && item.price !== 0) {
            lastPrice = item.price;
          } else {
            item.price = lastPrice;
          }
        });

        if (isMounted) {
          setData(mergedArray);
          setLoading(false);
        }
      } catch (error) {
        console.error("Failed to fetch chart data", error);
        if (isMounted) setLoading(false);
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [selectedRange, selectedTicker]);

  const currentSentiment =
    data.length > 0 ? data[data.length - 1].sentiment : 0;
  const isPositive = currentSentiment >= 0;
  const gradientId = `sentimentGradient-${selectedTicker}`;
  const fillColor = isPositive ? "var(--success)" : "var(--error)";

  return (
    <GlassPanel className={className} delay={delay}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h3
            className="text-lg font-semibold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Sentiment Trend
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={isPositive ? "success" : "error"}>
              {isPositive ? "Bullish" : "Bearish"}
            </Badge>
            <span
              className="text-sm tabular-nums"
              style={{ color: "var(--text-secondary)" }}
            >
              Current:{" "}
              <strong className="text-white">
                {currentSentiment.toFixed(4)}
              </strong>
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Ticker Select */}
          <select
            value={selectedTicker}
            onChange={(e) => setSelectedTicker(e.target.value)}
            className="bg-[var(--bg-app)] border border-white/10 text-white text-xs rounded-[var(--radius-btn)] px-3 py-1.5 focus:outline-none focus:border-[var(--brand-primary)]"
          >
            {tickers.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {/* Time Range */}
          <div className="flex bg-[var(--bg-app)] rounded-[var(--radius-pill)] p-1 border border-white/5">
            {timeRanges.map((range) => (
              <button
                key={range}
                onClick={() => setSelectedRange(range)}
                className={`px-3 py-1 text-[10px] font-medium rounded-[var(--radius-pill)] transition-all ${
                  selectedRange === range
                    ? "bg-[var(--brand-primary)] text-white shadow-md shadow-[var(--brand-glow)]"
                    : "text-[var(--text-muted)] hover:text-white"
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Area */}
      <div className="h-[280px] w-full relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="animate-spin text-[var(--brand-primary)]" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={fillColor} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={fillColor} stopOpacity={0} />
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow
                    dx="0"
                    dy="8"
                    stdDeviation="12"
                    floodColor={fillColor}
                    floodOpacity="0.6"
                  />
                </filter>
              </defs>
              {/* Minimal Axis - Date only */}
              <XAxis
                dataKey="date"
                tickFormatter={(str) => format(new Date(str), "dd MMM")}
                stroke="var(--text-muted)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                dy={10}
                minTickGap={30}
              />
              {/* Left YAxis for Sentiment */}
              <YAxis yAxisId="left" hide domain={[-1, 1]} />

              {/* Right YAxis for Price */}
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={["auto", "auto"]}
                tickFormatter={(val) => `$${val}`}
                stroke="var(--text-muted)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                dx={10}
              />

              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const sentimentPayload = payload.find(
                      (p) => p.dataKey === "sentiment",
                    );
                    const pricePayload = payload.find(
                      (p) => p.dataKey === "price",
                    );

                    return (
                      <div className="bg-[var(--bg-card-hover)] border border-white/10 rounded-[var(--radius-btn)] p-3 shadow-xl backdrop-blur-md">
                        <p className="text-[10px] text-[var(--text-muted)] mb-2">
                          {label
                            ? format(new Date(label), "MMM dd, yyyy HH:mm")
                            : ""}
                        </p>
                        {sentimentPayload && (
                          <div className="flex justify-between items-center gap-4 mb-1">
                            <span className="text-xs text-[var(--text-secondary)]">
                              Sentiment:
                            </span>
                            <span className="text-sm font-bold text-white tabular-nums">
                              {Number(sentimentPayload.value).toFixed(4)}
                            </span>
                          </div>
                        )}
                        {pricePayload && pricePayload.value !== undefined && (
                          <div className="flex justify-between items-center gap-4">
                            <span className="text-xs text-[var(--text-secondary)]">
                              Price:
                            </span>
                            <span className="text-sm font-bold text-[var(--brand-primary)] tabular-nums">
                              $
                              {Number(pricePayload.value).toLocaleString(
                                undefined,
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                },
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />

              <ReferenceLine
                y={0}
                yAxisId="left"
                stroke="rgba(255,255,255,0.05)"
                strokeDasharray="3 3"
              />

              <Area
                yAxisId="left"
                type="monotone"
                dataKey="sentiment"
                stroke={fillColor}
                strokeWidth={3}
                fill={`url(#${gradientId})`}
                animationDuration={1500}
                style={{ filter: "url(#glow)" }}
              />

              <Line
                yAxisId="right"
                type="monotone"
                dataKey="price"
                stroke="var(--brand-primary)"
                strokeWidth={2}
                dot={false}
                activeDot={{
                  r: 4,
                  fill: "var(--brand-primary)",
                  stroke: "var(--bg-app)",
                  strokeWidth: 2,
                }}
                animationDuration={1500}
                connectNulls
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </GlassPanel>
  );
}
