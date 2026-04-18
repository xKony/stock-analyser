"use client";

import { useState } from "react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Loader2 } from "lucide-react";
import { useSentimentChartData } from "./useSentimentChartData";
import { ChartHeader } from "./ChartHeader";
import { ChartControls } from "./ChartControls";
import { ChartArea } from "./ChartArea";
import { SentimentChartProps, TimeRange } from "./types";

/**
 * SentimentChart component displays a merged view of sentiment and price trends.
 * 
 * It handles the selection of tickers and time ranges, and presents the data
 * using Recharts in a glass-morphic panel.
 */
export function SentimentChart({
  className,
  delay = 0.1,
}: SentimentChartProps) {
  const [selectedRange, setSelectedRange] = useState<TimeRange>("1M");
  const {
    tickers,
    data,
    isLoading,
    selectedTicker,
    setSelectedTicker,
  } = useSentimentChartData("BTC", selectedRange);

  const currentSentiment = data.length > 0 ? data[data.length - 1].sentiment : 0;
  const isPositive = currentSentiment >= 0;

  return (
    <GlassPanel className={className} delay={delay}>
      {/* Header & Controls Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <ChartHeader currentSentiment={currentSentiment} />
        
        <ChartControls
          selectedTicker={selectedTicker}
          onTickerChange={setSelectedTicker}
          tickers={tickers}
          selectedRange={selectedRange}
          onRangeChange={setSelectedRange}
        />
      </div>

      {/* Chart Display Area */}
      <div className="h-[280px] w-full relative">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 
              className="animate-spin text-[var(--brand-primary)]" 
              aria-label="Loading chart data"
            />
          </div>
        ) : (
          <ChartArea
            data={data}
            selectedTicker={selectedTicker}
            isPositive={isPositive}
          />
        )}
      </div>
    </GlassPanel>
  );
}
