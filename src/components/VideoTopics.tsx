import { motion } from "framer-motion";
import { Video, Sparkles, Loader2, Copy, Check, FileText, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useMemo } from "react";
import type { TrendItem } from "@/lib/mockData";
import ScriptModal from "./ScriptModal";
import SaveIdeaButton from "./SaveIdeaButton";
import { useSaveIdea } from "@/hooks/useSaveIdea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KEYWORD_CATEGORIES } from "@/lib/keywordCategories";

interface VideoTopicsProps {
  trends: TrendItem[];
  onRequireAuth?: () => void;
  isAuthenticated?: boolean;
}

interface TopicGroup {
  keyword: string;
  ideas: string[];
}

const fetchVideoTopicsForKeyword = async (keyword: string): Promise<TopicGroup> => {
  const { data, error } = await supabase.functions.invoke('generate-video-topics', {
    body: { keywords: [keyword] },
  });
  if (error) throw new Error(error.message);
  if (!data?.success) throw new Error(data?.error || 'Failed to generate topics');
  return data.data?.[0] || { keyword, ideas: [] };
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

const VideoTopics = ({ trends, onRequireAuth, isAuthenticated }: VideoTopicsProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedKeyword, setSelectedKeyword] = useState<string>("");
  const [searchFilter, setSearchFilter] = useState("");
  const [scriptIdea, setScriptIdea] = useState<string | null>(null);
  const [extraKeyword, setExtraKeyword] = useState<string | null>(null);
  const [generateKeyword, setGenerateKeyword] = useState<string | null>(null);
  const { saveIdea, saving, isSaved } = useSaveIdea();

  // Group trends by category
  const keywordsByCategory = useMemo(() => {
    const filtered = searchFilter
      ? trends.filter(t => t.keyword.toLowerCase().includes(searchFilter.toLowerCase()))
      : trends;

    if (selectedCategory === "all") return filtered;
    return filtered.filter(t => (t as any).category === selectedCategory);
  }, [trends, selectedCategory, searchFilter]);

  // Generate ideas for selected keyword
  const { data: generatedTopics, isLoading, error } = useQuery({
    queryKey: ['video-topics-single', generateKeyword],
    queryFn: () => fetchVideoTopicsForKeyword(generateKeyword!),
    staleTime: 1000 * 60 * 30,
    enabled: !!generateKeyword,
  });

  // 25 more ideas
  const { data: extraTopics, isLoading: extraLoading } = useQuery({
    queryKey: ['extra-video-topics', extraKeyword],
    queryFn: () => fetchExtraTopics(extraKeyword!),
    enabled: !!extraKeyword,
    staleTime: 1000 * 60 * 30,
  });

  const handleGenerate = () => {
    if (!isAuthenticated) {
      onRequireAuth?.();
      return;
    }
    if (!selectedKeyword) return;
    setGenerateKeyword(selectedKeyword);
  };

  const handleGenerate25 = (keyword: string) => {
    if (!isAuthenticated) {
      onRequireAuth?.();
      return;
    }
    setExtraKeyword(keyword);
  };

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="glass-card p-5 mt-6"
      >
        <div className="flex items-center gap-2 mb-1">
          <Video className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-display font-semibold text-foreground">
            Short-Form Video Ideas from Keywords
          </h2>
          <Sparkles className="h-4 w-4 text-tertiary" />
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Select a keyword from your Google Search keyword database, then generate AI-powered short-form video ideas with scripts.
        </p>

        {/* Keyword Selector */}
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <Select value={selectedCategory} onValueChange={(v) => { setSelectedCategory(v); setSelectedKeyword(""); }}>
            <SelectTrigger className="h-9 w-full sm:w-[200px] text-xs">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {KEYWORD_CATEGORIES.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.emoji} {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search keywords..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="h-9 pl-8 text-xs"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <Select value={selectedKeyword} onValueChange={setSelectedKeyword}>
            <SelectTrigger className="h-9 flex-1 text-xs">
              <SelectValue placeholder={`Select a keyword (${keywordsByCategory.length} available)`} />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {keywordsByCategory.map(t => (
                <SelectItem key={t.keyword} value={t.keyword} className="text-xs">
                  <span className="flex items-center justify-between gap-3 w-full">
                    <span>{t.keyword}</span>
                    {t.volume > 0 && (
                      <span className="text-muted-foreground text-[10px]">
                        {t.volume.toLocaleString()} vol
                      </span>
                    )}
                  </span>
                </SelectItem>
              ))}
              {keywordsByCategory.length === 0 && (
                <div className="px-3 py-2 text-xs text-muted-foreground">No keywords found</div>
              )}
            </SelectContent>
          </Select>

          <Button
            onClick={handleGenerate}
            disabled={!selectedKeyword || isLoading}
            className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shrink-0 h-9"
          >
            {isLoading && generateKeyword === selectedKeyword ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Generate Ideas
          </Button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Generating video ideas for "{generateKeyword}"...</span>
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive py-4 text-center">
            Failed to generate ideas. Try again.
          </p>
        )}

        {/* Results */}
        {generatedTopics && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-accent/50 rounded-lg p-4 border border-border/50"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-primary uppercase tracking-wide">
                {generatedTopics.keyword}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleGenerate25(generatedTopics.keyword)}
                className="gap-1 text-[10px] h-6 text-muted-foreground hover:text-tertiary shrink-0"
              >
                <Sparkles className="h-3 w-3" />
                25 More
              </Button>
            </div>
            <ul className="space-y-1.5">
              {generatedTopics.ideas.map((idea, j) => (
                <li key={j} className="flex items-start gap-1.5 group">
                  <span className="text-accent-foreground text-xs mt-0.5 shrink-0">▶</span>
                  <span className="text-xs text-foreground leading-snug flex-1">{idea}</span>
                  <SaveIdeaButton
                    onSave={() => saveIdea({ type: "idea", ideaText: idea, source: `Keyword: ${generatedTopics.keyword}` })}
                    saved={isSaved(idea)}
                    saving={saving}
                  />
                  <button
                    onClick={() => {
                      if (!isAuthenticated) { onRequireAuth?.(); return; }
                      setScriptIdea(idea);
                    }}
                    className="shrink-0 p-0.5 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-primary"
                    title="Generate Script"
                  >
                    <FileText className="h-3 w-3" />
                  </button>
                  <CopyButton text={idea} />
                </li>
              ))}
            </ul>
          </motion.div>
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
              25 Video Ideas: {extraKeyword}
            </DialogTitle>
          </DialogHeader>

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
                    onSave={() => saveIdea({ type: "idea", ideaText: idea, source: `Keyword: ${extraKeyword}` })}
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
                    title="Generate Script"
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

export default VideoTopics;
