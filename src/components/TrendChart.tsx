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
  "hsl(49, 100%, 48%)",
  "hsl(190, 100%, 50%)",
  "hsl(330, 100%, 60%)",
  "hsl(142, 50%, 45%)",
  "hsl(0, 0%, 74%)",
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
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-display font-semibold text-foreground">
          Search Volume Trends
        </h2>
        <span className="text-xs text-muted-foreground">Top 5 keywords · 12-month view</span>
      </div>
      <p className="text-sm text-muted-foreground mb-4">Visual breakdown of how the top 5 funeral search keywords have trended over the past 12 months. Click a keyword in the legend to toggle it.</p>

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
              stroke="hsl(0, 0%, 20%)"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={{ fill: "hsl(0, 0%, 74%)", fontSize: 11 }}
              axisLine={{ stroke: "hsl(0, 0%, 20%)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "hsl(0, 0%, 74%)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(0, 0%, 12%)",
                border: "1px solid hsl(0, 0%, 20%)",
                borderRadius: "8px",
                fontSize: 12,
                color: "hsl(0, 0%, 100%)",
              }}
              itemStyle={{ color: "hsl(0, 0%, 100%)" }}
              labelStyle={{ color: "hsl(0, 0%, 100%)", fontWeight: 600, marginBottom: 4 }}
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
          <div key={trend.keyword} className={`flex items-center gap-1.5 transition-opacity ${hidden.has(trend.keyword) ? "opacity-40" : "opacity-100"}`}>
            <button
              onClick={() => toggle(trend.keyword)}
              className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: COLORS[i] }}
              aria-label={`Toggle ${trend.keyword}`}
            />
            <a
              href={`https://trends.google.com/trends/explore?q=${encodeURIComponent(trend.keyword)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-xs truncate max-w-[140px] hover:underline ${hidden.has(trend.keyword) ? "line-through text-muted-foreground" : "text-muted-foreground"}`}
            >
              {trend.keyword}
            </a>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default TrendChart;
