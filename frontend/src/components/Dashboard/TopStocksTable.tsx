"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/Badge";
import { MoreHorizontal, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, YAxis } from "recharts";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

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

const generateSparkline = (trend: number) => {
  let current = 100;
  return Array.from({ length: 15 }, () => {
    current += (Math.random() - 0.5) * 10 + (trend >= 0 ? 2 : -2);
    return { val: current };
  });
};

export function TopStocksTable({
  className,
  delay = 0.2,
}: TopStocksTableProps) {
  const [stocks, setStocks] = useState<Stock[]>([]);

  useEffect(() => {
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
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.5 }}
      className={`editorial-panel ${className}`}
    >
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-rule">
        <h3 className="text-xl font-serif font-black tracking-tighter text-ink uppercase">
          HOT SHEET
        </h3>
        <span className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">TOP MENTIONS</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[10px] font-mono uppercase tracking-[0.2em] border-b border-rule/20 text-ink-muted">
              <th className="pb-4 pl-0 font-bold">ASSET / TICKER</th>
              <th className="pb-4 font-bold text-center">VELOCITY</th>
              <th className="pb-4 font-bold text-right px-4">SENT.</th>
              <th className="pb-4 font-bold text-right">VALUATION</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {stocks.map((stock) => {
              const isPositive = stock.change >= 0;
              return (
                <tr
                  key={stock.ticker}
                  className="group border-b border-rule/5 last:border-0 hover:bg-highlight/10 transition-colors"
                >
                  <td className="py-5 pl-0">
                    <div className="flex flex-col">
                      <span className="font-mono text-xs font-black text-ink bg-ink text-paper px-1.5 py-0.5 w-fit mb-1">
                        {stock.ticker}
                      </span>
                      <span className="font-mono text-[9px] text-ink-muted uppercase tracking-wider">
                        {stock.name}
                      </span>
                    </div>
                  </td>

                  <td className="py-5 w-24">
                    <div className="h-8 w-20 mx-auto">
                      <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                        <AreaChart data={stock.sparklineData}>
                          <Area
                            type="step"
                            dataKey="val"
                            stroke={isPositive ? "#1A1A1A" : "#FF4D30"}
                            fill="transparent"
                            strokeWidth={1.5}
                            isAnimationActive={false}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </td>

                  <td className="py-5 text-right px-4">
                    <div className={cn(
                      "data-font text-[11px] inline-block px-2 py-0.5",
                      stock.sentiment > 0.2 ? "bg-green-100 text-green-900" : stock.sentiment < -0.2 ? "bg-signal text-paper" : "bg-ink/5 text-ink-muted"
                    )}>
                      {stock.sentiment > 0 ? "+" : ""}{stock.sentiment.toFixed(2)}
                    </div>
                  </td>

                  <td className="py-5 text-right">
                    <div className="data-font text-ink text-xl leading-none uppercase">
                      ${stock.price.toFixed(2)}
                    </div>
                    <div className={cn(
                      "font-mono text-[10px] flex items-center justify-end gap-1 font-bold mt-1",
                      isPositive ? "text-green-700" : "text-signal"
                    )}>
                      {isPositive ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                      {Math.abs(stock.change)}%
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Editorial Footer Decoration */}
      <div className="mt-8 pt-4 border-t border-rule/10 flex justify-between items-center">
        <p className="font-mono text-[9px] text-ink-muted uppercase">LIVE WIRE ANALYSIS</p>
        <button className="font-mono text-[9px] text-ink border-b border-ink hover:text-signal hover:border-signal transition-colors uppercase font-bold tracking-widest">VIEW ALL DATA</button>
      </div>
    </motion.div>
  );
}
