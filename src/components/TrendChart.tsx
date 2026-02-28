import { useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { TrendItem } from "@/lib/mockData";

const COLORS = [
  "hsl(42, 60%, 55%)",
  "hsl(142, 50%, 45%)",
  "hsl(200, 60%, 55%)",
  "hsl(280, 50%, 60%)",
  "hsl(20, 70%, 55%)",
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface TrendChartProps {
  trends: TrendItem[];
}

const TrendChart = ({ trends }: TrendChartProps) => {
  const top5 = trends.slice(0, 5);
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  const toggle = (keyword: string) => {
    setHidden((prev) => {
      const next = new Set(prev);
      next.has(keyword) ? next.delete(keyword) : next.add(keyword);
      return next;
    });
  };

  const chartData = MONTHS.map((month, i) => {
    const point: Record<string, string | number> = { month };
    top5.forEach((trend) => {
      point[trend.keyword] = trend.sparkline[i] ?? 0;
    });
    return point;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, duration: 0.5 }}
      className="glass-card p-5 mb-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-serif font-semibold text-foreground">
          Search Volume Trends
        </h2>
        <span className="text-xs text-muted-foreground">Top 5 keywords · 12-month view</span>
      </div>

      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <defs>
              {top5.map((trend, i) => (
                <linearGradient key={trend.keyword} id={`gradient-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS[i]} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={COLORS[i]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(220, 10%, 20%)"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={{ fill: "hsl(220, 8%, 55%)", fontSize: 11 }}
              axisLine={{ stroke: "hsl(220, 10%, 20%)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "hsl(220, 8%, 55%)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(220, 12%, 12%)",
                border: "1px solid hsl(220, 10%, 20%)",
                borderRadius: "8px",
                fontSize: 12,
                color: "hsl(40, 10%, 90%)",
              }}
              itemStyle={{ color: "hsl(40, 10%, 90%)" }}
              labelStyle={{ color: "hsl(40, 10%, 90%)", fontWeight: 600, marginBottom: 4 }}
            />
            {top5.map((trend, i) => (
              <Area
                key={trend.keyword}
                type="monotone"
                dataKey={trend.keyword}
                stroke={hidden.has(trend.keyword) ? "transparent" : COLORS[i]}
                strokeWidth={2}
                fill={hidden.has(trend.keyword) ? "transparent" : `url(#gradient-${i})`}
                dot={false}
                activeDot={hidden.has(trend.keyword) ? false : { r: 4, strokeWidth: 0 }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap gap-4 mt-3 px-1">
        {top5.map((trend, i) => (
          <button
            key={trend.keyword}
            onClick={() => toggle(trend.keyword)}
            className={`flex items-center gap-1.5 transition-opacity ${hidden.has(trend.keyword) ? "opacity-40" : "opacity-100"}`}
          >
            <span
              className="inline-block w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: COLORS[i] }}
            />
            <span className={`text-xs truncate max-w-[140px] ${hidden.has(trend.keyword) ? "line-through text-muted-foreground" : "text-muted-foreground"}`}>
              {trend.keyword}
            </span>
          </button>
        ))}
      </div>
    </motion.div>
  );
};

export default TrendChart;
