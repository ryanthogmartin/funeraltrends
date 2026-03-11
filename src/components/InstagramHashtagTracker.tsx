import { motion } from "framer-motion";
import { Hash, TrendingUp, TrendingDown, Loader2, Copy, Check, Flame, Leaf, Zap, ExternalLink, Instagram } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import type { TrendItem } from "@/lib/mockData";
import { Badge } from "@/components/ui/badge";

interface InstagramHashtagTrackerProps {
  trends: TrendItem[];
}

interface InstagramHashtag {
  hashtag: string;
  posts: string;
  growth: number;
  category: "trending" | "evergreen" | "emerging";
  relatedKeyword: string;
}

const fetchInstagramHashtags = async (keywords: string[]): Promise<InstagramHashtag[]> => {
  const { data, error } = await supabase.functions.invoke('generate-instagram-hashtags', {
    body: { keywords },
  });
  if (error) throw new Error(error.message);
  if (!data?.success) throw new Error(data?.error || 'Failed to generate hashtags');
  return data.data;
};

const categoryConfig = {
  trending: { icon: Flame, label: "Trending", className: "bg-destructive/15 text-destructive border-destructive/30" },
  evergreen: { icon: Leaf, label: "Evergreen", className: "bg-primary/15 text-primary border-primary/30" },
  emerging: { icon: Zap, label: "Emerging", className: "bg-accent/80 text-accent-foreground border-border" },
};

const CopyHashtag = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={handleCopy} className="p-1 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground" title="Copy hashtag">
      {copied ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
    </button>
  );
};

const InstagramHashtagTracker = ({ trends }: InstagramHashtagTrackerProps) => {
  const topKeywords = trends.slice(0, 8).map(t => t.keyword);

  const { data: hashtags, isLoading, error } = useQuery({
    queryKey: ['instagram-hashtags', ...topKeywords],
    queryFn: () => fetchInstagramHashtags(topKeywords),
    staleTime: 1000 * 60 * 30,
    enabled: topKeywords.length > 0,
  });

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7, duration: 0.5 }}
      className="glass-card p-5 mt-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Hash className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-display font-semibold text-foreground">
          Instagram Hashtag Tracker
        </h2>
        <Badge variant="outline" className="ml-auto text-[10px] bg-muted/50 text-muted-foreground border-border">AI-Suggested</Badge>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Analyzing Instagram hashtags...</span>
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive py-4 text-center">
          Failed to load hashtags. Try refreshing.
        </p>
      )}

      {hashtags && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {hashtags.map((tag, i) => {
            const catConfig = categoryConfig[tag.category] || categoryConfig.evergreen;
            const CatIcon = catConfig.icon;
            return (
              <motion.div
                key={tag.hashtag}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                className="flex items-center gap-3 bg-accent/40 rounded-lg p-3 border border-border/50 hover:border-primary/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-sm font-semibold text-foreground truncate">{tag.hashtag}</span>
                    <CopyHashtag text={tag.hashtag} />
                    <a
                      href={`https://www.instagram.com/explore/tags/${tag.hashtag.replace('#', '')}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                      title="Verify on Instagram"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="capitalize">{tag.relatedKeyword}</span>
                  </div>
                </div>
                <Badge variant="outline" className={`text-[10px] shrink-0 gap-1 ${catConfig.className}`}>
                  <CatIcon className="h-2.5 w-2.5" />
                  {catConfig.label}
                </Badge>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.section>
  );
};

export default InstagramHashtagTracker;
