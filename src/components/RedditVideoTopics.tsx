import { motion } from "framer-motion";
import { Sparkles, Loader2, MessageSquare, Copy, Check } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import type { RedditPost } from "@/lib/mockData";

interface RedditVideoTopicsProps {
  posts: RedditPost[];
}

interface RedditTopicGroup {
  post_title: string;
  ideas: string[];
}

const fetchRedditVideoTopics = async (posts: { title: string; subreddit: string }[]): Promise<RedditTopicGroup[]> => {
  const { data, error } = await supabase.functions.invoke('generate-reddit-video-topics', {
    body: { posts },
  });

  if (error) throw new Error(error.message);
  if (!data?.success) throw new Error(data?.error || 'Failed to generate topics');
  return data.data;
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

const RedditVideoTopics = ({ posts }: RedditVideoTopicsProps) => {
  const top5Posts = posts.slice(0, 5).map(p => ({ title: p.title, subreddit: p.subreddit }));

  const { data: topics, isLoading, error } = useQuery({
    queryKey: ['reddit-video-topics', ...top5Posts.map(p => p.title)],
    queryFn: () => fetchRedditVideoTopics(top5Posts),
    staleTime: 1000 * 60 * 30,
    enabled: top5Posts.length > 0,
  });

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.5 }}
      className="glass-card p-5 mt-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-serif font-semibold text-foreground">
          Reddit-Inspired Video Ideas
        </h2>
        <Sparkles className="h-4 w-4 text-accent-foreground" />
        <span className="text-xs text-muted-foreground ml-auto">Based on Top 5 Reddit Post Discussions</span>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Generating video ideas from Reddit discussions...</span>
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive py-4 text-center">
          Failed to generate topics. Try refreshing.
        </p>
      )}

      {topics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {topics.map((group, i) => (
            <motion.div
              key={group.post_title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="bg-accent/50 rounded-lg p-3 border border-border/50"
            >
              <h3 className="text-xs font-semibold text-primary mb-2 leading-snug line-clamp-2">
                {group.post_title}
              </h3>
              <ul className="space-y-1.5">
                {group.ideas.map((idea, j) => (
                  <li key={j} className="flex items-start gap-1.5 group">
                    <span className="text-accent-foreground text-xs mt-0.5 shrink-0">▶</span>
                    <span className="text-xs text-foreground leading-snug flex-1">{idea}</span>
                    <CopyButton text={idea} />
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

export default RedditVideoTopics;
