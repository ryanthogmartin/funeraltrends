import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, TrendingUp, Flame, Radio, ExternalLink, RefreshCw, ChevronDown, ChevronUp, Video, Loader2, Copy, Check, Download, Bookmark } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSaveIdea } from "@/hooks/useSaveIdea";
import { exportScriptPdf } from "@/lib/exportPdf";

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

interface VideoIdea {
  title: string;
  hook: string;
  body: string;
  cta: string;
  wordCount: number;
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

const sourceLabel = (source: string) => {
  switch (source) {
    case 'google_trends_daily': return '📊 Google Trends';
    case 'reddit': return '🟠 Reddit';
    case 'tiktok': return '🎵 TikTok';
    case 'facebook': return '📘 Facebook';
    case 'twitter': return '🐦 X/Twitter';
    case 'youtube': return '▶️ YouTube';
    default: return '🤖 AI Detected';
  }
};

function VideoIdeaCard({ idea, signalTitle }: { idea: VideoIdea; signalTitle: string }) {
  const [expandedScript, setExpandedScript] = useState(false);
  const [copied, setCopied] = useState(false);
  const { saveIdea, saving, isSaved } = useSaveIdea();

  const fullScript = `${idea.hook}\n\n${idea.body}\n\n${idea.cta}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="rounded-md border border-border/40 bg-background/50 p-2.5">
      <div className="flex items-start justify-between gap-2">
        <button
          onClick={() => setExpandedScript(!expandedScript)}
          className="flex-1 text-left"
        >
          <p className="text-xs font-medium text-foreground leading-snug">{idea.title}</p>
        </button>
        <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5 transition-transform ${expandedScript ? 'rotate-180' : ''}`} />
      </div>

      <AnimatePresence>
        {expandedScript && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2 space-y-2">
              <div className="p-2 bg-primary/5 rounded border border-primary/20">
                <p className="text-[10px] font-semibold text-primary uppercase tracking-wide mb-0.5">🎬 Hook</p>
                <p className="text-xs text-foreground">{idea.hook}</p>
              </div>
              <div className="p-2 bg-accent/30 rounded border border-border/30">
                <p className="text-[10px] font-semibold text-primary uppercase tracking-wide mb-0.5">📝 Script</p>
                <p className="text-xs text-foreground whitespace-pre-line leading-relaxed">{idea.body}</p>
              </div>
              <div className="p-2 bg-primary/5 rounded border border-primary/20">
                <p className="text-[10px] font-semibold text-primary uppercase tracking-wide mb-0.5">📣 CTA</p>
                <p className="text-xs text-foreground">{idea.cta}</p>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-muted-foreground">~{idea.wordCount} words · ~45s</span>
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => saveIdea({
                      type: "script",
                      ideaText: idea.title,
                      scriptHook: idea.hook,
                      scriptBody: idea.body,
                      scriptCta: idea.cta,
                      scriptTone: "trend-generated",
                      source: signalTitle,
                    })}
                    disabled={saving || isSaved(idea.title, "script", "trend-generated")}
                    className="h-6 px-2 text-[10px] gap-1"
                  >
                    <Bookmark className="h-2.5 w-2.5" />
                    {isSaved(idea.title, "script", "trend-generated") ? "Saved" : "Save"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => exportScriptPdf(idea.title, { hook: idea.hook, body: idea.body, cta: idea.cta, wordCount: idea.wordCount }, "Trend Signal")}
                    className="h-6 px-2 text-[10px] gap-1"
                  >
                    <Download className="h-2.5 w-2.5" />
                    PDF
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCopy} className="h-6 px-2 text-[10px] gap-1">
                    {copied ? <Check className="h-2.5 w-2.5" /> : <Copy className="h-2.5 w-2.5" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const TrendSignals = ({ signals, isLoading, onRefresh, isRefreshing }: TrendSignalsProps) => {
  const [expanded, setExpanded] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [ideasMap, setIdeasMap] = useState<Record<string, VideoIdea[]>>({});
  const [expandedIdeas, setExpandedIdeas] = useState<Record<string, boolean>>({});
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const visibleSignals = expanded ? signals : signals.slice(0, INITIAL_COUNT);
  const hasMore = signals.length > INITIAL_COUNT;

  const handleGenerateIdeas = async (signal: TrendSignal) => {
    if (!(authLoading || user)) {
      toast({ title: "Sign in required", description: "Please sign in to generate video ideas.", variant: "destructive" });
      return;
    }

    // If already generated, just toggle visibility
    if (ideasMap[signal.id]) {
      setExpandedIdeas(prev => ({ ...prev, [signal.id]: !prev[signal.id] }));
      return;
    }

    setGeneratingId(signal.id);
    setExpandedIdeas(prev => ({ ...prev, [signal.id]: true }));

    try {
      const { data, error } = await supabase.functions.invoke('generate-trend-video-ideas', {
        body: {
          title: signal.title,
          summary: signal.summary,
          relatedKeywords: signal.related_keywords,
        },
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || 'Failed to generate ideas');

      setIdeasMap(prev => ({ ...prev, [signal.id]: data.data }));
    } catch (err: any) {
      toast({ title: "Generation failed", description: err.message || "Try again later", variant: "destructive" });
      setExpandedIdeas(prev => ({ ...prev, [signal.id]: false }));
    } finally {
      setGeneratingId(null);
    }
  };

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
          <span className="text-xs text-muted-foreground">AI + Google Trends</span>
          <Button variant="ghost" size="sm" onClick={onRefresh} disabled={isRefreshing} className="h-7 px-2 text-xs">
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
        <>
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {visibleSignals.map((signal, i) => {
                const Icon = signalIcons[signal.signal_type] || Zap;
                const colorClass = signalColors[signal.signal_type] || signalColors.emerging;
                const isGenerating = generatingId === signal.id;
                const ideas = ideasMap[signal.id];
                const showIdeas = expandedIdeas[signal.id];

                return (
                  <motion.div
                    key={signal.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ delay: i < INITIAL_COUNT ? i * 0.05 : (i - INITIAL_COUNT) * 0.03 }}
                    className="rounded-lg border border-border/50 bg-card/50 p-3 hover:bg-card/80 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`rounded-md p-1.5 mt-0.5 border ${colorClass}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {signal.source_urls.length > 0 ? (
                            <a href={signal.source_urls[0]} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-foreground truncate hover:text-primary hover:underline transition-colors">
                              {signal.title}
                            </a>
                          ) : (
                            <h3 className="text-sm font-medium text-foreground truncate">{signal.title}</h3>
                          )}
                          <Badge variant="outline" className="text-[10px] shrink-0">{signal.signal_type}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed mb-2">{signal.summary}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          {signal.related_keywords.map(kw => (
                            <span key={kw} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{kw}</span>
                          ))}
                          {signal.source_urls.length > 0 && (
                            <a href={signal.source_urls[0]} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary/70 hover:text-primary flex items-center gap-0.5">
                              <ExternalLink className="h-2.5 w-2.5" /> Source
                            </a>
                          )}
                          <span className="text-[10px] text-muted-foreground/50 ml-auto">{sourceLabel(signal.source)}</span>
                        </div>

                        {/* Generate Video Ideas Button */}
                        <div className="mt-2 pt-2 border-t border-border/30">
                          <Button
                            size="sm"
                            variant={ideas ? "ghost" : "outline"}
                            onClick={() => handleGenerateIdeas(signal)}
                            disabled={isGenerating}
                            className="h-7 text-[11px] gap-1.5"
                          >
                            {isGenerating ? (
                              <><Loader2 className="h-3 w-3 animate-spin" /> Generating Ideas...</>
                            ) : ideas ? (
                              <><Video className="h-3 w-3" /> {showIdeas ? 'Hide' : 'Show'} Video Ideas ({ideas.length})</>
                            ) : (
                              <><Video className="h-3 w-3" /> Generate Video Ideas</>
                            )}
                          </Button>
                        </div>

                        {/* Video Ideas List */}
                        <AnimatePresence>
                          {showIdeas && ideas && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-2 space-y-2">
                                {ideas.map((idea, idx) => (
                                  <VideoIdeaCard key={idx} idea={idea} signalTitle={signal.title} />
                                ))}
                              </div>
                            </motion.div>
                          )}
                          {isGenerating && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="mt-2 space-y-1.5"
                            >
                              {[1, 2, 3].map(i => (
                                <div key={i} className="h-8 rounded bg-muted/40 animate-pulse" />
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-mono font-semibold text-foreground">{signal.relevance_score}</div>
                        <div className="text-[9px] text-muted-foreground">score</div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
          {hasMore && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="w-full mt-3 text-xs text-muted-foreground hover:text-foreground"
            >
              {expanded ? (
                <>Show Less <ChevronUp className="h-3.5 w-3.5 ml-1" /></>
              ) : (
                <>Show All {signals.length} Signals <ChevronDown className="h-3.5 w-3.5 ml-1" /></>
              )}
            </Button>
          )}
        </>
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
