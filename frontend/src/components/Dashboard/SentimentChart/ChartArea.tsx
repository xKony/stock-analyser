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
  const gradientId = `sentimentGradient-${selectedTicker}`;
  const fillColor = isPositive ? "var(--success)" : "var(--error)";

  return (
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

        <Tooltip content={<ChartTooltip />} />

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
  );
}
