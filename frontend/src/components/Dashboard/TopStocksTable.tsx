"use client";

import { useEffect, useState } from "react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Stock {
  ticker: string;
  mentions: number;
  avg_sentiment: number;
}

export function TopStocksTable() {
  const [stocks, setStocks] = useState<Stock[]>([]);

  useEffect(() => {
    fetch("/api/top-stocks")
      .then((res) => res.json())
      .then((data: Stock[] | { error: string }) => {
        if (Array.isArray(data)) {
          setStocks(data);
        } else {
          console.error("Failed to fetch top stocks:", data);
          setStocks([]);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  return (
    <GlassPanel className="h-full">
      <h3 className="text-xl font-bold text-white mb-6">
        Top Stocks by Mentions
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/10 text-gray-400 text-sm">
              <th className="pb-4 font-medium pl-4">Ticker</th>
              <th className="pb-4 font-medium">Mentions</th>
              <th className="pb-4 font-medium text-right pr-4">Sentiment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {stocks.map((stock) => (
              <tr
                key={stock.ticker}
                className="group hover:bg-white/5 transition-colors"
              >
                <td className="py-4 pl-4">
                  <span className="font-bold text-white group-hover:text-primary transition-colors">
                    {stock.ticker}
                  </span>
                </td>
                <td className="py-4">
                  <span className="text-gray-300 font-medium">
                    {stock.mentions.toLocaleString()}
                  </span>
                </td>
                <td className="py-4 text-right pr-4">
                  <div
                    className={cn(
                      "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold",
                      stock.avg_sentiment > 0.1
                        ? "bg-green-500/10 text-green-500"
                        : stock.avg_sentiment < -0.1
                          ? "bg-red-500/10 text-red-500"
                          : "bg-gray-500/10 text-gray-400",
                    )}
                  >
                    {stock.avg_sentiment > 0.1 ? (
                      <ArrowUpRight size={12} />
                    ) : stock.avg_sentiment < -0.1 ? (
                      <ArrowDownRight size={12} />
                    ) : (
                      <Minus size={12} />
                    )}
                    {parseFloat(stock.avg_sentiment.toString()).toFixed(2)}
                  </div>
                </td>
              </tr>
            ))}
            {stocks.length === 0 && (
              <tr>
                <td colSpan={3} className="py-8 text-center text-gray-500">
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </GlassPanel>
  );
}
