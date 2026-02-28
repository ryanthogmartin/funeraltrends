import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { TrendItem } from "@/lib/mockData";

interface TrendRowProps {
  trend: TrendItem;
  index: number;
  rank: number;
}

const MiniSparkline = ({ data }: { data: number[] }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 80;
  const height = 24;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const TrendRow = ({ trend, index, rank }: TrendRowProps) => {
  const isUp = trend.change > 0;
  const isDown = trend.change < 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="flex items-center gap-4 py-3 px-4 rounded-md hover:bg-secondary/50 transition-colors group"
    >
      <span className="text-muted-foreground text-xs font-mono w-5 text-right">
        {rank}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
          {trend.keyword}
        </p>
        <p className="text-xs text-muted-foreground">
          {trend.volume.toLocaleString()} searches
        </p>
      </div>
      <MiniSparkline data={trend.sparkline} />
      <div className="flex items-center gap-1 min-w-[60px] justify-end">
        {isUp && <TrendingUp className="h-3.5 w-3.5 text-trend-up" />}
        {isDown && <TrendingDown className="h-3.5 w-3.5 text-trend-down" />}
        {!isUp && !isDown && <Minus className="h-3.5 w-3.5 text-trend-neutral" />}
        <span
          className={`text-xs font-mono ${
            isUp ? "text-trend-up" : isDown ? "text-trend-down" : "text-trend-neutral"
          }`}
        >
          {isUp ? "+" : ""}
          {trend.change}%
        </span>
      </div>
    </motion.div>
  );
};

export default TrendRow;
