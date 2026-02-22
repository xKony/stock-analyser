"use client";

import { useState, useEffect } from "react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Badge } from "@/components/ui/Badge";
import { MoreHorizontal } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

interface Stock {
  ticker: string;
  name: string;
  mentions: number;
  sentiment: number;
  price: number;
  change: number;
  sparklineData: { val: number }[];
}

interface TopStocksTableProps {
  className?: string;
  delay?: number;
}

// Generate random sparkline data
const generateSparkline = (trend: number) => {
  let current = 100;
  return Array.from({ length: 20 }, () => {
    current += (Math.random() - 0.5) * 5 + (trend >= 0 ? 0.5 : -0.5);
    return { val: current };
  });
};

export function TopStocksTable({
  className,
  delay = 0.2,
}: TopStocksTableProps) {
  const [stocks, setStocks] = useState<Stock[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setStocks([
        {
          ticker: "NVDA",
          name: "NVIDIA Corp",
          mentions: 1542,
          sentiment: 0.65,
          price: 890.52,
          change: 4.2,
          sparklineData: generateSparkline(4.2),
        },
        {
          ticker: "TSLA",
          name: "Tesla Inc",
          mentions: 1205,
          sentiment: -0.15,
          price: 175.34,
          change: -1.8,
          sparklineData: generateSparkline(-1.8),
        },
        {
          ticker: "AAPL",
          name: "Apple Inc",
          mentions: 980,
          sentiment: 0.12,
          price: 172.65,
          change: 0.5,
          sparklineData: generateSparkline(0.5),
        },
        {
          ticker: "AMD",
          name: "Adv. Micro Devices",
          mentions: 850,
          sentiment: 0.45,
          price: 180.2,
          change: 2.1,
          sparklineData: generateSparkline(2.1),
        },
        {
          ticker: "MSFT",
          name: "Microsoft Corp",
          mentions: 760,
          sentiment: 0.88,
          price: 420.45,
          change: 1.2,
          sparklineData: generateSparkline(1.2),
        },
        {
          ticker: "GME",
          name: "GameStop Corp",
          mentions: 2400,
          sentiment: -0.4,
          price: 14.5,
          change: -5.6,
          sparklineData: generateSparkline(-5.6),
        },
      ]);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <GlassPanel className={className} delay={delay}>
      <div className="flex items-center justify-between mb-6">
        <h3
          className="text-lg font-semibold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          Top Mentioned Assets
        </h3>
        <button className="p-2 text-[var(--text-secondary)] hover:text-white hover:bg-white/5 rounded-[var(--radius-btn)] transition-colors">
          <MoreHorizontal size={18} />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider border-b border-white/5 text-[var(--text-muted)]">
              <th className="pb-3 pl-2 font-medium">Asset</th>
              <th className="pb-3 pr-4 font-medium text-right">Trend</th>
              <th className="pb-3 font-medium text-right">Price</th>
              <th className="pb-3 font-medium text-right">Sent.</th>
              <th className="pb-3 font-medium text-right">Mentions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {stocks.map((stock) => {
              const sparkColor =
                stock.change >= 0 ? "var(--success)" : "var(--error)";
              return (
                <tr
                  key={stock.ticker}
                  className="group border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors relative"
                >
                  <td className="py-3 pl-2 relative z-10 w-1/3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold text-white border border-white/5 group-hover:bg-[var(--brand-primary)]/20 group-hover:border-[var(--brand-primary)]/50 transition-colors shadow-inner shadow-white/10">
                        {stock.ticker[0]}
                      </div>
                      <div>
                        <div className="font-bold text-white tracking-wide">
                          {stock.ticker}
                        </div>
                        <div className="text-[11px] text-[var(--text-secondary)] truncate max-w-[100px]">
                          {stock.name}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Miniature Sparkline */}
                  <td className="py-3 pr-4 w-24 align-middle">
                    <div className="h-8 w-20 ml-auto opacity-70 group-hover:opacity-100 transition-opacity">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stock.sparklineData}>
                          <defs>
                            <linearGradient
                              id={`spark-${stock.ticker}`}
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="0%"
                                stopColor={sparkColor}
                                stopOpacity={0.2}
                              />
                              <stop
                                offset="100%"
                                stopColor={sparkColor}
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <Area
                            type="monotone"
                            dataKey="val"
                            stroke={sparkColor}
                            fill={`url(#spark-${stock.ticker})`}
                            strokeWidth={1.5}
                            isAnimationActive={false}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </td>

                  <td className="py-3 text-right">
                    <div className="font-medium text-white tabular-nums">
                      ${stock.price.toFixed(2)}
                    </div>
                    <div
                      className={`text-[11px] tabular-nums font-medium ${stock.change >= 0 ? "text-[var(--success)]" : "text-[var(--error)]"}`}
                    >
                      {stock.change > 0 ? "+" : ""}
                      {stock.change}%
                    </div>
                  </td>

                  <td className="py-3 text-right">
                    <div className="flex justify-end">
                      <Badge
                        variant={
                          stock.sentiment > 0.2
                            ? "success"
                            : stock.sentiment < -0.2
                              ? "error"
                              : "neutral"
                        }
                      >
                        {stock.sentiment > 0 ? "+" : ""}
                        {stock.sentiment.toFixed(2)}
                      </Badge>
                    </div>
                  </td>

                  <td className="py-3 text-right font-medium text-[var(--text-secondary)] tabular-nums">
                    {stock.mentions.toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </GlassPanel>
  );
}
