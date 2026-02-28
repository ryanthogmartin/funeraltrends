import { motion } from "framer-motion";
import { Video, Sparkles, Loader2, Copy, Check, FileText, Mail } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import type { TrendItem } from "@/lib/mockData";
import ScriptModal from "./ScriptModal";
import EmailTopicsModal from "./EmailTopicsModal";
import { Button } from "@/components/ui/button";

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

const VideoTopics = ({ trends }: VideoTopicsProps) => {
  const top10Keywords = trends.slice(0, 10).map(t => t.keyword);
  const [scriptIdea, setScriptIdea] = useState<string | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);

  const { data: topics, isLoading, error } = useQuery({
    queryKey: ['video-topics', ...top10Keywords],
    queryFn: () => fetchVideoTopics(top10Keywords),
    staleTime: 1000 * 60 * 30,
    enabled: top10Keywords.length > 0,
  });

  return (
    <>
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
          <div className="ml-auto flex items-center gap-2">
            {topics && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEmailModal(true)}
                className="gap-1.5 text-xs h-7"
              >
                <Mail className="h-3 w-3" />
                Email Top 10
              </Button>
            )}
            <span className="text-xs text-muted-foreground">Based on Top 10 Funeral Search Topics</span>
          </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <li key={j} className="flex items-start gap-1.5 group">
                      <span className="text-accent-foreground text-xs mt-0.5 shrink-0">▶</span>
                      <span className="text-xs text-foreground leading-snug flex-1">{idea}</span>
                      <button
                        onClick={() => setScriptIdea(idea)}
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

      {topics && (
        <EmailTopicsModal
          open={showEmailModal}
          onOpenChange={setShowEmailModal}
          topics={topics}
        />
      )}
    </>
  );
};

export default VideoTopics;
