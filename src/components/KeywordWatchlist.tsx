import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Plus, Trash2, Loader2, Sparkles, Flame, X, FileText, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { TrendItem } from "@/lib/mockData";
import ScriptModal from "./ScriptModal";

interface KeywordWatchlistProps {
  userId: string;
  trends: TrendItem[];
}

interface WatchlistItem {
  id: string;
  keyword: string;
  created_at: string;
  last_volume: number;
  last_change_percent: number;
  spiked: boolean;
}

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

const KeywordWatchlist = ({ userId, trends }: KeywordWatchlistProps) => {
  const [newKeyword, setNewKeyword] = useState("");
  const [topicsKeyword, setTopicsKeyword] = useState<string | null>(null);
  const [scriptIdea, setScriptIdea] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: watchlist = [], isLoading } = useQuery({
    queryKey: ["keyword-watchlist", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("keyword_watchlist")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Check for spikes by comparing with current trends
      return (data as WatchlistItem[]).map((item) => {
        const trend = trends.find(
          (t) => t.keyword.toLowerCase() === item.keyword.toLowerCase()
        );
        const spiked = trend ? trend.change > 20 : false;
        return { ...item, spiked, last_volume: trend?.volume ?? item.last_volume, last_change_percent: trend?.change ?? item.last_change_percent };
      });
    },
    staleTime: 1000 * 60 * 2,
  });

  const addKeyword = useMutation({
    mutationFn: async (keyword: string) => {
      const { error } = await supabase
        .from("keyword_watchlist")
        .insert({ user_id: userId, keyword: keyword.trim() });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["keyword-watchlist"] });
      setNewKeyword("");
      toast({ title: "Keyword added to watchlist" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to add", description: err.message?.includes("duplicate") ? "Already in your watchlist" : err.message, variant: "destructive" });
    },
  });

  const removeKeyword = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("keyword_watchlist").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["keyword-watchlist"] });
      toast({ title: "Keyword removed" });
    },
  });

  const { data: topicsData, isLoading: topicsLoading } = useQuery({
    queryKey: ["watchlist-topics", topicsKeyword],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("generate-watchlist-topics", {
        body: { keyword: topicsKeyword },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error);
      return data.data as { keyword: string; ideas: string[] };
    },
    enabled: !!topicsKeyword,
    staleTime: 1000 * 60 * 30,
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newKeyword.trim()) addKeyword.mutate(newKeyword);
  };

  const spikedCount = watchlist.filter((w) => w.spiked).length;

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="glass-card p-5 mt-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Eye className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-display font-semibold text-foreground">
            Keyword Watchlist
          </h2>
          {spikedCount > 0 && (
            <Badge variant="destructive" className="text-[10px] gap-1">
              <Flame className="h-3 w-3" /> {spikedCount} spiking
            </Badge>
          )}
          <span className="ml-auto text-xs text-muted-foreground">
            {watchlist.length} keyword{watchlist.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Add keyword form */}
        <form onSubmit={handleAdd} className="flex gap-2 mb-4">
          <Input
            placeholder="Add a funeral keyword to watch..."
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            className="text-sm h-9"
          />
          <Button type="submit" size="sm" disabled={addKeyword.isPending || !newKeyword.trim()} className="gap-1 shrink-0">
            {addKeyword.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
            Add
          </Button>
        </form>

        {isLoading && (
          <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading watchlist...</span>
          </div>
        )}

        {!isLoading && watchlist.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">
            No keywords yet. Add funeral-related keywords to track spikes and generate video ideas.
          </p>
        )}

        <AnimatePresence>
          <div className="space-y-2">
            {watchlist.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  item.spiked
                    ? "bg-destructive/5 border-destructive/30"
                    : "bg-accent/30 border-border/50"
                }`}
              >
                {item.spiked && <Flame className="h-4 w-4 text-destructive shrink-0 animate-pulse" />}
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-foreground">{item.keyword}</span>
                  <div className="flex gap-2 text-xs text-muted-foreground mt-0.5">
                    {item.last_volume > 0 && <span>{item.last_volume.toLocaleString()} vol</span>}
                    {item.last_change_percent !== 0 && (
                      <span className={item.last_change_percent > 0 ? "text-[hsl(var(--trend-up))]" : "text-[hsl(var(--trend-down))]"}>
                        {item.last_change_percent > 0 ? "+" : ""}{item.last_change_percent}%
                      </span>
                    )}
                    {item.spiked && <Badge variant="destructive" className="text-[9px] h-4 px-1">SPIKE</Badge>}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTopicsKeyword(item.keyword)}
                  className="gap-1 text-xs h-7 text-primary"
                >
                  <Sparkles className="h-3 w-3" />
                  25 Ideas
                </Button>
                <button
                  onClick={() => removeKeyword.mutate(item.id)}
                  className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      </motion.section>

      {/* 25 Video Topics Modal */}
      <Dialog open={!!topicsKeyword} onOpenChange={(open) => !open && setTopicsKeyword(null)}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              25 Video Ideas: {topicsKeyword}
            </DialogTitle>
          </DialogHeader>

          {topicsLoading && (
            <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Generating 25 video ideas...</span>
            </div>
          )}

          {topicsData && !topicsLoading && (
            <div className="space-y-2">
              {topicsData.ideas.map((idea, i) => (
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
                  <button
                    onClick={() => { setTopicsKeyword(null); setScriptIdea(idea); }}
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

      <ScriptModal
        open={!!scriptIdea}
        onOpenChange={(open) => !open && setScriptIdea(null)}
        idea={scriptIdea || ""}
      />
    </>
  );
};

export default KeywordWatchlist;
