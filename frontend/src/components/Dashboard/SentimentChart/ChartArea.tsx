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
import { ChartDataPoint } from "./types";
import { ChartTooltip } from "./ChartTooltip";

interface ChartAreaProps {
  /** The merged and filled chart data */
  data: ChartDataPoint[];
  /** The selected ticker symbol (used for gradient IDs) */
  selectedTicker: string;
  /** Whether current sentiment is positive */
  isPositive: boolean;
}

/**
 * The core chart display component using Recharts.
 */
export function ChartArea({
  data,
  selectedTicker,
  isPositive,
}: ChartAreaProps) {
  const signalColor = isPositive ? "#1A1A1A" : "#FF4D30"; // Positive is ink (neutral/strong), Negative is signal

  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
      <AreaChart data={data}>
        <YAxis yAxisId="left" hide domain={["auto", "auto"]} />
        <XAxis
          dataKey="date"
          tickFormatter={(str) => format(new Date(str), "MMM dd").toUpperCase()}
          stroke="#1A1A1A"
          strokeOpacity={0.2}
          fontSize={9}
          fontFamily="var(--font-mono)"
          tickLine={true}
          axisLine={true}
          dy={10}
          minTickGap={40}
        />

        <YAxis
          yAxisId="right"
          orientation="right"
          domain={["auto", "auto"]}
          tickFormatter={(val) => `$${val}`}
          stroke="#1A1A1A"
          strokeOpacity={0.2}
          fontSize={9}
          fontFamily="var(--font-mono)"
          tickLine={true}
          axisLine={true}
          dx={10}
        />

        <Tooltip content={<ChartTooltip />} />

        <ReferenceLine
          y={0}
          yAxisId="left"
          stroke="#1A1A1A"
          strokeOpacity={0.1}
          strokeWidth={1}
        />

        {/* Sentiment Area - High Contrast Step */}
        <Area
          yAxisId="left"
          type="stepAfter"
          dataKey="sentiment"
          stroke={signalColor}
          strokeWidth={2}
          fill={signalColor}
          fillOpacity={0.05}
          animationDuration={1000}
        />

        {/* Price Line - Bold Ink */}
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="price"
          stroke="#1A1A1A"
          strokeWidth={3}
          dot={false}
          activeDot={{
            r: 4,
            fill: "#1A1A1A",
            stroke: "#FBF9F4",
            strokeWidth: 2,
          }}
          animationDuration={1000}
          connectNulls
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
