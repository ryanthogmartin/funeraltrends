import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2, Copy, Check, TrendingUp, Search, FileText, MessageSquare, Users, Eye, ThumbsUp, Clock, Zap, Lock, ArrowRight, RefreshCw } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TrendItem } from "@/lib/mockData";
import ScriptModal from "./ScriptModal";
import SaveIdeaButton from "./SaveIdeaButton";
import { useSaveIdea } from "@/hooks/useSaveIdea";

interface ReelsInsightsProps {
  trends: TrendItem[];
  isAuthenticated: boolean;
  onRequireAuth: () => void;
}

interface ReelsIdea {
  idea: string;
  type: string;
  hook: string;
  estimatedLength: string;
  engagementTip: string;
}

interface ReelsTrend {
  topic: string;
  context: string;
  source: string;
  viralPotential: string;
  contentAngle: string;
}

const typeConfig: Record<string, { icon: typeof MessageSquare; className: string }> = {
  educational: { icon: FileText, className: "bg-primary/15 text-primary border-primary/30" },
  "day-in-the-life": { icon: Eye, className: "bg-secondary/15 text-secondary border-secondary/30" },
  storytime: { icon: MessageSquare, className: "bg-tertiary/15 text-tertiary border-tertiary/30" },
  "myth-busting": { icon: Sparkles, className: "bg-destructive/15 text-destructive border-destructive/30" },
  "trending-audio": { icon: Zap, className: "bg-[hsl(var(--chart-3))]/15 text-[hsl(var(--chart-3))] border-[hsl(var(--chart-3))]/30" },
  emotional: { icon: Users, className: "bg-accent text-accent-foreground border-border" },
};

const viralColors: Record<string, string> = {
  high: "bg-[hsl(var(--trend-up))]/15 text-[hsl(var(--trend-up))] border-[hsl(var(--trend-up))]/30",
  medium: "bg-primary/15 text-primary border-primary/30",
  low: "bg-muted text-muted-foreground border-border",
};

const IG_GRADIENT = "from-[#F58529] via-[#DD2A7B] to-[#8134AF]";

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={handleCopy} className="shrink-0 p-0.5 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
      {copied ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
    </button>
  );
};

const ReelsInsights = ({ trends, isAuthenticated, onRequireAuth }: ReelsInsightsProps) => {
  const [scriptIdea, setScriptIdea] = useState<string | null>(null);
  const { saveIdea, saving, isSaved } = useSaveIdea();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const topKeywords = trends.slice(0, 10).map(t => t.keyword);

  const { data: ideas, isLoading: ideasLoading, error: ideasError } = useQuery({
    queryKey: ['reels-ideas', ...topKeywords],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('generate-reels-ideas', {
        body: { keywords: topKeywords },
      });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || 'Failed to generate ideas');
      return data.data as ReelsIdea[];
    },
    staleTime: 1000 * 60 * 30,
    enabled: topKeywords.length > 0,
  });

  const { data: trendsData, isLoading: trendsLoading, error: trendsError } = useQuery({
    queryKey: ['reels-trends'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('search-reels-trends');
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || 'Failed to fetch trends');
      return { trends: data.data as ReelsTrend[], citations: data.citations as string[] };
    },
    staleTime: 1000 * 60 * 30,
  });

  if (!isAuthenticated) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="glass-card p-5 mt-6 relative overflow-hidden cursor-pointer group hover:border-secondary/50 hover:shadow-[0_0_20px_-5px_hsl(var(--secondary)/0.2)] transition-all duration-300"
        onClick={onRequireAuth}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-secondary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10" />
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
          <div className="flex items-center gap-2">
            <div className={`w-5 h-5 rounded flex items-center justify-center bg-gradient-to-br ${IG_GRADIENT}`}>
              <svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            </div>
            <h2 className="text-lg font-display font-semibold text-foreground group-hover:text-secondary transition-colors duration-300">
              Instagram Reels Ideas
            </h2>
            <Sparkles className="h-4 w-4 text-tertiary" />
          </div>
          <motion.span
            className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-secondary/30 bg-secondary/10 text-secondary text-[10px] font-medium ml-0 sm:ml-auto w-fit"
            whileHover={{ scale: 1.05 }}
          >
            <Lock className="h-2.5 w-2.5" />
            Sign in to unlock
          </motion.span>
        </div>
        <div className="relative">
          <div className="filter blur-[6px] pointer-events-none select-none" aria-hidden="true">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-accent/40 rounded-lg p-3 border border-border/50">
                  <div className="h-4 bg-muted-foreground/10 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted-foreground/10 rounded w-full mb-1" />
                  <div className="h-3 bg-muted-foreground/10 rounded w-2/3" />
                </div>
              ))}
            </div>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
            <Lock className="h-8 w-8 text-secondary/60 mb-2" />
            <p className="text-sm font-medium text-foreground">Sign in to view Instagram Reels Ideas</p>
            <p className="text-xs text-muted-foreground mt-1 group-hover:hidden">Requires account</p>
            <p className="text-xs text-secondary mt-1 hidden group-hover:flex items-center gap-1">
              Sign in to get started <ArrowRight className="h-3 w-3" />
            </p>
          </div>
        </div>
      </motion.section>
    );
  }

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="glass-card p-5 mt-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
          <div className="flex items-center gap-2">
            <div className={`w-5 h-5 rounded flex items-center justify-center bg-gradient-to-br ${IG_GRADIENT}`}>
              <svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            </div>
            <h2 className="text-lg font-display font-semibold text-foreground">
              Instagram Reels Ideas
            </h2>
            <Sparkles className="h-4 w-4 text-tertiary" />
          </div>
          <div className="flex items-center gap-2 ml-0 sm:ml-auto">
            <button
              onClick={async () => {
                setRefreshing(true);
                await queryClient.invalidateQueries({ queryKey: ['reels-ideas'] });
                await queryClient.invalidateQueries({ queryKey: ['reels-trends'] });
                setRefreshing(false);
              }}
              disabled={refreshing || ideasLoading || trendsLoading}
              className="p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50"
              title="Refresh ideas"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing || ideasLoading || trendsLoading ? 'animate-spin' : ''}`} />
            </button>
            <Badge variant="outline" className={`text-[10px] bg-gradient-to-r ${IG_GRADIENT} text-white border-0 w-fit`}>
              AI + Live Search
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="ideas" className="w-full">
          <TabsList className="mb-4 bg-accent/50">
            <TabsTrigger value="ideas" className="gap-1.5 text-xs">
              <Sparkles className="h-3 w-3" />
              Reels Ideas
            </TabsTrigger>
            <TabsTrigger value="trending" className="gap-1.5 text-xs">
              <Search className="h-3 w-3" />
              Trending Now
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ideas">
            {ideasLoading && (
              <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Generating Instagram Reels ideas...</span>
              </div>
            )}

            {ideasError && (
              <p className="text-sm text-destructive py-4 text-center">
                Failed to generate ideas. Try refreshing.
              </p>
            )}

            {ideas && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ideas.map((idea, i) => {
                  const config = typeConfig[idea.type] || typeConfig.educational;
                  const TypeIcon = config.icon;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.3 }}
                      className="bg-accent/40 rounded-lg p-3 border border-border/50 hover:border-[#DD2A7B]/30 transition-colors group"
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground leading-snug">{idea.idea}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <SaveIdeaButton
                            onSave={() => saveIdea({ type: "idea", ideaText: idea.idea, source: "Instagram Reels AI" })}
                            saved={isSaved(idea.idea)}
                            saving={saving}
                            className="sm:opacity-0 sm:group-hover:opacity-100"
                          />
                          <button
                            onClick={() => setScriptIdea(idea.idea)}
                            className="shrink-0 p-0.5 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-primary sm:opacity-0 sm:group-hover:opacity-100"
                            title="Generate Script"
                          >
                            <FileText className="h-3 w-3" />
                          </button>
                          <CopyButton text={idea.idea} />
                        </div>
                      </div>

                      <div className="p-1.5 bg-primary/5 rounded border border-primary/15 mb-2">
                        <p className="text-[11px] text-foreground leading-snug">
                          <span className="font-semibold text-primary text-[10px] uppercase tracking-wide mr-1">Hook:</span>
                          {idea.hook}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={`text-[10px] gap-1 ${config.className}`}>
                          <TypeIcon className="h-2.5 w-2.5" />
                          {idea.type}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] gap-1 bg-accent text-muted-foreground border-border">
                          <Clock className="h-2.5 w-2.5" />
                          {idea.estimatedLength}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-2 leading-snug">
                        <ThumbsUp className="h-2.5 w-2.5 inline mr-1" />
                        {idea.engagementTip}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="trending">
            {trendsLoading && (
              <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Searching funeral Reels trends...</span>
              </div>
            )}

            {trendsError && (
              <p className="text-sm text-destructive py-4 text-center">
                Failed to fetch trends. Try refreshing.
              </p>
            )}

            {trendsData && (
              <div className="space-y-3">
                {trendsData.trends.map((trend, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                    className="bg-accent/40 rounded-lg p-3 border border-border/50 hover:border-[#DD2A7B]/30 transition-colors group"
                  >
                    <div className="flex items-start gap-2 mb-1.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground leading-snug">{trend.topic}</p>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{trend.context}</p>
                      </div>
                      <CopyButton text={trend.topic} />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap mt-2">
                      <Badge variant="outline" className="text-[10px] bg-[#DD2A7B]/10 text-[#DD2A7B] border-[#DD2A7B]/30">
                        {trend.source}
                      </Badge>
                      <Badge variant="outline" className={`text-[10px] gap-1 ${viralColors[trend.viralPotential] || viralColors.medium}`}>
                        <Zap className="h-2.5 w-2.5" />
                        {trend.viralPotential} viral potential
                      </Badge>
                    </div>
                    <div className="mt-2 p-2 bg-accent/50 rounded border border-border/30">
                      <p className="text-[11px] text-muted-foreground">
                        <Sparkles className="h-2.5 w-2.5 inline mr-1 text-tertiary" />
                        <span className="font-medium text-foreground">Content angle:</span> {trend.contentAngle}
                      </p>
                    </div>
                  </motion.div>
                ))}

                {trendsData.citations.length > 0 && (
                  <div className="pt-2 border-t border-border/30">
                    <p className="text-[10px] text-muted-foreground mb-1">Sources:</p>
                    <div className="flex flex-wrap gap-1">
                      {trendsData.citations.slice(0, 5).map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-[#DD2A7B] hover:underline truncate max-w-[200px]"
                        >
                          [{i + 1}] {new URL(url).hostname}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </motion.section>

      <ScriptModal
        open={!!scriptIdea}
        onOpenChange={(open) => !open && setScriptIdea(null)}
        idea={scriptIdea || ""}
      />
    </>
  );
};

export default ReelsInsights;
