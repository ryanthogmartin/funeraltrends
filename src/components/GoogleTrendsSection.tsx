import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import TrendRow from "./TrendRow";
import { Button } from "@/components/ui/button";
import type { TrendItem } from "@/lib/mockData";

interface GoogleTrendsSectionProps {
  trends: TrendItem[];
  handleAddToWatchlist: (keyword: string) => void;
  isAddingToWatchlist: boolean;
  addingKeyword?: string;
  onRefreshKeywords?: () => void;
  isRefreshingKeywords?: boolean;
}

const INITIAL_COUNT = 12;

const GoogleTrendsSection = ({
  trends,
  handleAddToWatchlist,
  isAddingToWatchlist,
  addingKeyword,
  onRefreshKeywords,
  isRefreshingKeywords,
}: GoogleTrendsSectionProps) => {
  const [expanded, setExpanded] = useState(false);
  const visibleTrends = expanded ? trends : trends.slice(0, INITIAL_COUNT);

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="lg:col-span-3 glass-card p-5">
      
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-display font-semibold text-foreground">Google Keywords — Funeral Searches</h2>
        <span className="text-xs text-muted-foreground">🇺🇸 United States · 30 Days</span>
      </div>
      <p className="text-sm text-muted-foreground mb-4">Top funeral-related search terms ranked by monthly volume and trend direction. Add any keyword to your watchlist for spike alerts.</p>
      <div className="space-y-0.5">
        {visibleTrends.map((trend, i) =>
        <TrendRow
          key={trend.keyword}
          trend={trend}
          index={i}
          rank={i + 1}
          onAddToWatchlist={handleAddToWatchlist}
          isAddingToWatchlist={isAddingToWatchlist}
          addingKeyword={addingKeyword} />

        )}
      </div>
      {trends.length > INITIAL_COUNT &&
      <div className="mt-3 text-center">
          <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="gap-1.5 text-xs text-muted-foreground hover:text-primary">
          
            {expanded ?
          <>
                <ChevronUp className="h-3.5 w-3.5" />
                Show Less
              </> :

          <>
                <ChevronDown className="h-3.5 w-3.5" />
                See All {trends.length} Keywords
              </>
          }
          </Button>
        </div>
      }
    </motion.section>);

};

export default GoogleTrendsSection;