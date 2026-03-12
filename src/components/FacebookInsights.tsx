import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2, Copy, Check, TrendingUp, Search, FileText, MessageSquare, Users, Eye, ThumbsUp, Lock, ArrowRight, RefreshCw } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TrendItem } from "@/lib/mockData";
import ScriptModal from "./ScriptModal";
import SaveIdeaButton from "./SaveIdeaButton";
import { useSaveIdea } from "@/hooks/useSaveIdea";

interface FacebookInsightsProps {
  trends: TrendItem[];
  isAuthenticated: boolean;
  onRequireAuth: () => void;
}

interface FacebookIdea {
  idea: string;
  type: string;
  format: string;
  engagementTip: string;
}

interface FacebookTrend {
  topic: string;
  context: string;
  source: string;
  engagement: string;
  contentAngle: string;
}

const typeConfig: Record<string, { icon: typeof MessageSquare; className: string }> = {
  educational: { icon: FileText, className: "bg-primary/15 text-primary border-primary/30" },
  community: { icon: Users, className: "bg-secondary/15 text-secondary border-secondary/30" },
  "behind-the-scenes": { icon: Eye, className: "bg-tertiary/15 text-tertiary border-tertiary/30" },
  "myth-busting": { icon: Sparkles, className: "bg-destructive/15 text-destructive border-destructive/30" },
  seasonal: { icon: TrendingUp, className: "bg-[hsl(var(--trend-up))]/15 text-[hsl(var(--trend-up))] border-[hsl(var(--trend-up))]/30" },
  "testimonial-prompt": { icon: MessageSquare, className: "bg-accent text-accent-foreground border-border" },
};

const engagementColors: Record<string, string> = {
  high: "bg-[hsl(var(--trend-up))]/15 text-[hsl(var(--trend-up))] border-[hsl(var(--trend-up))]/30",
  medium: "bg-primary/15 text-primary border-primary/30",
  low: "bg-muted text-muted-foreground border-border",
};

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

const FacebookInsights = ({ trends, isAuthenticated, onRequireAuth }: FacebookInsightsProps) => {
  const [scriptIdea, setScriptIdea] = useState<string | null>(null);
  const { saveIdea, saving, isSaved } = useSaveIdea();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const topKeywords = trends.slice(0, 10).map(t => t.keyword);

  const { data: ideas, isLoading: ideasLoading, error: ideasError } = useQuery({
    queryKey: ['facebook-ideas', ...topKeywords],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('generate-facebook-ideas', {
        body: { keywords: topKeywords },
      });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || 'Failed to generate ideas');
      return data.data as FacebookIdea[];
    },
    staleTime: 1000 * 60 * 30,
    enabled: topKeywords.length > 0,
  });

  const { data: trendsData, isLoading: trendsLoading, error: trendsError } = useQuery({
    queryKey: ['facebook-trends'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('search-facebook-trends');
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || 'Failed to fetch trends');
      return { trends: data.data as FacebookTrend[], citations: data.citations as string[] };
    },
    staleTime: 1000 * 60 * 30,
  });

  if (!isAuthenticated) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="glass-card p-5 mt-6 relative overflow-hidden cursor-pointer group hover:border-secondary/50 hover:shadow-[0_0_20px_-5px_hsl(var(--secondary)/0.2)] transition-all duration-300"
        onClick={onRequireAuth}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-secondary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10" />
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded flex items-center justify-center bg-[#1877F2]/20">
              <svg className="h-3.5 w-3.5 text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </div>
            <h2 className="text-lg font-display font-semibold text-foreground group-hover:text-secondary transition-colors duration-300">
              Facebook Insights and Reel Ideas
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
            <p className="text-sm font-medium text-foreground">Sign in to view Facebook Insights and Reel Ideas</p>
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
        transition={{ delay: 0.5, duration: 0.5 }}
        className="glass-card p-5 mt-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded flex items-center justify-center bg-[#1877F2]/20">
              <svg className="h-3.5 w-3.5 text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </div>
            <h2 className="text-lg font-display font-semibold text-foreground">
              Facebook Insights and Reel Ideas
            </h2>
            <Sparkles className="h-4 w-4 text-tertiary" />
          </div>
          <div className="flex items-center gap-2 ml-0 sm:ml-auto">
            <button
              onClick={async () => {
                setRefreshing(true);
                await queryClient.invalidateQueries({ queryKey: ['facebook-ideas'] });
                await queryClient.invalidateQueries({ queryKey: ['facebook-trends'] });
                setRefreshing(false);
              }}
              disabled={refreshing || ideasLoading || trendsLoading}
              className="p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50"
              title="Refresh ideas"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing || ideasLoading || trendsLoading ? 'animate-spin' : ''}`} />
            </button>
            <Badge variant="outline" className="text-[10px] bg-[#1877F2]/10 text-[#1877F2] border-[#1877F2]/30 w-fit">
              AI + Live Search
            </Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-4">AI-powered Facebook post ideas and live trending topics for the funeral industry. Get engagement tips and turn ideas into scripts.</p>
        </div>

        <Tabs defaultValue="ideas" className="w-full">
          <TabsList className="mb-4 bg-accent/50">
            <TabsTrigger value="ideas" className="gap-1.5 text-xs">
              <Sparkles className="h-3 w-3" />
              Post Ideas
            </TabsTrigger>
            <TabsTrigger value="trending" className="gap-1.5 text-xs">
              <Search className="h-3 w-3" />
              Trending Now
            </TabsTrigger>
          </TabsList>

          {/* AI-Generated Post Ideas */}
          <TabsContent value="ideas">
            {ideasLoading && (
              <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Generating Facebook post ideas...</span>
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
                      className="bg-accent/40 rounded-lg p-3 border border-border/50 hover:border-[#1877F2]/30 transition-colors group"
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground leading-snug">{idea.idea}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <SaveIdeaButton
                            onSave={() => saveIdea({ type: "idea", ideaText: idea.idea, source: "Facebook AI" })}
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
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={`text-[10px] gap-1 ${config.className}`}>
                          <TypeIcon className="h-2.5 w-2.5" />
                          {idea.type}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] bg-accent text-muted-foreground border-border">
                          {idea.format}
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

          {/* Live Facebook Trends */}
          <TabsContent value="trending">
            {trendsLoading && (
              <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Searching funeral trends on Facebook...</span>
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
                    className="bg-accent/40 rounded-lg p-3 border border-border/50 hover:border-[#1877F2]/30 transition-colors group"
                  >
                    <div className="flex items-start gap-2 mb-1.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground leading-snug">{trend.topic}</p>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{trend.context}</p>
                      </div>
                      <CopyButton text={trend.topic} />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap mt-2">
                      <Badge variant="outline" className="text-[10px] bg-[#1877F2]/10 text-[#1877F2] border-[#1877F2]/30">
                        {trend.source}
                      </Badge>
                      <Badge variant="outline" className={`text-[10px] gap-1 ${engagementColors[trend.engagement] || engagementColors.medium}`}>
                        <TrendingUp className="h-2.5 w-2.5" />
                        {trend.engagement} engagement
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
                          className="text-[10px] text-[#1877F2] hover:underline truncate max-w-[200px]"
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

export default FacebookInsights;
