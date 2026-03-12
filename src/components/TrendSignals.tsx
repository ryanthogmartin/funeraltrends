import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, TrendingUp, Flame, Radio, ExternalLink, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface TrendSignal {
  id: string;
  signal_type: string;
  title: string;
  summary: string;
  relevance_score: number;
  source: string;
  source_urls: string[];
  related_keywords: string[];
  fetched_at: string;
}

interface TrendSignalsProps {
  signals: TrendSignal[];
  isLoading: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
}

const signalIcons: Record<string, typeof Zap> = {
  breaking: Flame,
  viral: Flame,
  growing: TrendingUp,
  emerging: Zap,
};

const signalColors: Record<string, string> = {
  breaking: "bg-destructive/10 text-destructive border-destructive/20",
  viral: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  growing: "bg-primary/10 text-primary border-primary/20",
  emerging: "bg-accent/50 text-accent-foreground border-accent/30",
};

const INITIAL_COUNT = 5;

const TrendSignals = ({ signals, isLoading, onRefresh, isRefreshing }: TrendSignalsProps) => {
  const [expanded, setExpanded] = useState(false);
  const visibleSignals = expanded ? signals : signals.slice(0, INITIAL_COUNT);
  const hasMore = signals.length > INITIAL_COUNT;
  if (isLoading) {
    return (
      <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5">
        <h2 className="text-lg font-display font-semibold text-foreground mb-4 flex items-center gap-2">
          <Radio className="h-5 w-5 text-primary animate-pulse" /> Real-Time Trend Signals
        </h2>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 rounded-lg bg-muted/50 animate-pulse" />
          ))}
        </div>
      </motion.section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.4 }}
      className="glass-card p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
          <Radio className="h-5 w-5 text-primary" /> Real-Time Trend Signals
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            AI + Google Trends
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-7 px-2 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {signals.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          <Radio className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p>No signals detected yet. Click refresh to scan for emerging trends.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {signals.map((signal, i) => {
            const Icon = signalIcons[signal.signal_type] || Zap;
            const colorClass = signalColors[signal.signal_type] || signalColors.emerging;

            return (
              <motion.div
                key={signal.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-lg border border-border/50 bg-card/50 p-3 hover:bg-card/80 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className={`rounded-md p-1.5 mt-0.5 border ${colorClass}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-medium text-foreground truncate">{signal.title}</h3>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {signal.signal_type}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-2">{signal.summary}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {signal.related_keywords.map(kw => (
                        <span key={kw} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          {kw}
                        </span>
                      ))}
                      {signal.source_urls.length > 0 && (
                        <a
                          href={signal.source_urls[0]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-primary/70 hover:text-primary flex items-center gap-0.5"
                        >
                          <ExternalLink className="h-2.5 w-2.5" /> Source
                        </a>
                      )}
                      <span className="text-[10px] text-muted-foreground/50 ml-auto">
                        {signal.source === 'google_trends_daily' ? '📊 Google Trends' : 
                         signal.source === 'reddit' ? '🟠 Reddit' :
                         signal.source === 'tiktok' ? '🎵 TikTok' :
                         signal.source === 'facebook' ? '📘 Facebook' :
                         signal.source === 'twitter' ? '🐦 X/Twitter' :
                         signal.source === 'youtube' ? '▶️ YouTube' :
                         '🤖 AI Detected'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-mono font-semibold text-foreground">{signal.relevance_score}</div>
                    <div className="text-[9px] text-muted-foreground">score</div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {signals.length > 0 && (
        <p className="text-[10px] text-muted-foreground/50 mt-3 text-center">
          Updated {new Date(signals[0]?.fetched_at).toLocaleString()}
        </p>
      )}
    </motion.section>
  );
};

export default TrendSignals;
