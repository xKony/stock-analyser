"use client";

import { useState } from "react";
import { EditorialPanel } from "@/components/ui/EditorialPanel";
import { Loader2 } from "lucide-react";
import { useSentimentChartData } from "./useSentimentChartData";
import { ChartHeader } from "./ChartHeader";
import { ChartControls } from "./ChartControls";
import { ChartArea } from "./ChartArea";
import { SentimentChartProps, TimeRange } from "./types";

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
    <EditorialPanel className={className} delay={delay}>
      {/* Header & Controls Section */}
      <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-8 mb-12">
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
      <div className="h-[400px] w-full relative">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 
              className="animate-spin text-signal" 
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
    </EditorialPanel>
  );
}
