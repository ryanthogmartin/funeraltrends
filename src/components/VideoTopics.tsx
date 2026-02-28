import { motion } from "framer-motion";
import { Video, Sparkles, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TrendItem } from "@/lib/mockData";

interface VideoTopicsProps {
  trends: TrendItem[];
}

interface TopicGroup {
  keyword: string;
  ideas: string[];
}

const fetchVideoTopics = async (keywords: string[]): Promise<TopicGroup[]> => {
  const { data, error } = await supabase.functions.invoke('generate-video-topics', {
    body: { keywords },
  });

  if (error) throw new Error(error.message);
  if (!data?.success) throw new Error(data?.error || 'Failed to generate topics');
  return data.data;
};

const VideoTopics = ({ trends }: VideoTopicsProps) => {
  const top5Keywords = trends.slice(0, 5).map(t => t.keyword);

  const { data: topics, isLoading, error } = useQuery({
    queryKey: ['video-topics', ...top5Keywords],
    queryFn: () => fetchVideoTopics(top5Keywords),
    staleTime: 1000 * 60 * 30,
    enabled: top5Keywords.length > 0,
  });

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      className="glass-card p-5 mt-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Video className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-serif font-semibold text-foreground">
          Short-Form Video Ideas
        </h2>
        <Sparkles className="h-4 w-4 text-accent-foreground" />
        <span className="text-xs text-muted-foreground ml-auto">AI-generated from top 5 trends</span>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Generating video ideas...</span>
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive py-4 text-center">
          Failed to generate topics. Try refreshing.
        </p>
      )}

      {topics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {topics.map((group, i) => (
            <motion.div
              key={group.keyword}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="bg-accent/50 rounded-lg p-3 border border-border/50"
            >
              <h3 className="text-xs font-semibold text-primary mb-2 uppercase tracking-wide truncate">
                {group.keyword}
              </h3>
              <ul className="space-y-1.5">
                {group.ideas.map((idea, j) => (
                  <li key={j} className="flex items-start gap-1.5">
                    <span className="text-accent-foreground text-xs mt-0.5 shrink-0">▶</span>
                    <span className="text-xs text-foreground leading-snug">{idea}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      )}
    </motion.section>
  );
};

export default VideoTopics;
