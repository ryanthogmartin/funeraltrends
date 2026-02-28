import { motion } from "framer-motion";
import { Sparkles, Loader2, MessageSquare, Copy, Check, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import type { RedditPost } from "@/lib/mockData";
import ScriptModal from "./ScriptModal";
import SaveIdeaButton from "./SaveIdeaButton";
import { useSaveIdea } from "@/hooks/useSaveIdea";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface RedditVideoTopicsProps {
  posts: RedditPost[];
  isAuthenticated?: boolean;
  onRequireAuth?: () => void;
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

const fetchExtraTopics = async (keyword: string): Promise<{ keyword: string; ideas: string[] }> => {
  const { data, error } = await supabase.functions.invoke('generate-watchlist-topics', {
    body: { keyword },
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

const RedditVideoTopics = ({ posts, isAuthenticated, onRequireAuth }: RedditVideoTopicsProps) => {
  const top5Posts = posts.slice(0, 5).map(p => ({ title: p.title, subreddit: p.subreddit }));
  const [scriptIdea, setScriptIdea] = useState<string | null>(null);
  const [extraKeyword, setExtraKeyword] = useState<string | null>(null);
  const { saveIdea, saving, isSaved } = useSaveIdea();

  const { data: topics, isLoading, error } = useQuery({
    queryKey: ['reddit-video-topics', ...top5Posts.map(p => p.title)],
    queryFn: () => fetchRedditVideoTopics(top5Posts),
    staleTime: 1000 * 60 * 30,
    enabled: top5Posts.length > 0,
  });

  const { data: extraTopics, isLoading: extraLoading } = useQuery({
    queryKey: ['extra-reddit-topics', extraKeyword],
    queryFn: () => fetchExtraTopics(extraKeyword!),
    enabled: !!extraKeyword,
    staleTime: 1000 * 60 * 30,
  });

  const handleGenerate25 = (postTitle: string) => {
    if (!isAuthenticated) {
      onRequireAuth?.();
      return;
    }
    setExtraKeyword(postTitle);
  };

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="glass-card p-5 mt-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-display font-semibold text-foreground">
            Reddit-Inspired Video Ideas
          </h2>
          <Sparkles className="h-4 w-4 text-tertiary" />
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
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold text-primary leading-snug line-clamp-2 flex-1">
                    {group.post_title}
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleGenerate25(group.post_title)}
                    className="gap-1 text-[10px] h-6 text-muted-foreground hover:text-tertiary shrink-0 ml-2"
                  >
                    <Sparkles className="h-3 w-3" />
                    25 More
                  </Button>
                </div>
                <ul className="space-y-1.5">
                  {group.ideas.map((idea, j) => (
                    <li key={j} className="flex items-start gap-1.5 group">
                      <span className="text-accent-foreground text-xs mt-0.5 shrink-0">▶</span>
                      <span className="text-xs text-foreground leading-snug flex-1">{idea}</span>
                      <SaveIdeaButton
                        onSave={() => saveIdea({ type: "idea", ideaText: idea, source: `Reddit: ${group.post_title.slice(0, 50)}` })}
                        saved={isSaved(idea)}
                        saving={saving}
                      />
                      <button
                        onClick={() => {
                          if (!isAuthenticated) { onRequireAuth?.(); return; }
                          setScriptIdea(idea);
                        }}
                        className="shrink-0 p-0.5 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-primary"
                        title="Write Script"
                      >
                        <FileText className="h-3 w-3" />
                      </button>
                      <CopyButton text={idea} />
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        )}
      </motion.section>

      <ScriptModal
        open={!!scriptIdea}
        onOpenChange={(open) => !open && setScriptIdea(null)}
        idea={scriptIdea || ""}
      />

      {/* 25 More Ideas Modal */}
      <Dialog open={!!extraKeyword} onOpenChange={(open) => !open && setExtraKeyword(null)}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              25 Video Ideas
            </DialogTitle>
          </DialogHeader>

          <p className="text-xs text-muted-foreground line-clamp-2 -mt-1">{extraKeyword}</p>

          {extraLoading && (
            <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Generating 25 video ideas...</span>
            </div>
          )}

          {extraTopics && !extraLoading && (
            <div className="space-y-2">
              {extraTopics.ideas.map((idea, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-start gap-2 p-2 rounded-lg bg-accent/30 border border-border/50 group"
                >
                  <span className="text-[10px] font-mono text-muted-foreground mt-0.5 shrink-0 w-5 text-right">
                    {i + 1}.
                  </span>
                  <span className="text-xs text-foreground flex-1 leading-snug">{idea}</span>
                  <SaveIdeaButton
                    onSave={() => saveIdea({ type: "idea", ideaText: idea, source: `Reddit: ${extraKeyword?.slice(0, 50)}` })}
                    saved={isSaved(idea)}
                    saving={saving}
                    className="opacity-0 group-hover:opacity-100"
                  />
                   <button
                     onClick={() => {
                       if (!isAuthenticated) { onRequireAuth?.(); return; }
                       setExtraKeyword(null); setScriptIdea(idea);
                     }}
                     className="shrink-0 p-0.5 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100"
                     title="Write Script"
                   >
                     <FileText className="h-3 w-3" />
                   </button>
                  <CopyButton text={idea} />
                </motion.div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RedditVideoTopics;
