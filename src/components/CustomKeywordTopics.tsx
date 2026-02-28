import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Sparkles, Loader2, Copy, Check, FileText, Lock, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import ScriptModal from "./ScriptModal";
import SaveIdeaButton from "./SaveIdeaButton";
import { useSaveIdea } from "@/hooks/useSaveIdea";
import { exportVideoIdeasPdf } from "@/lib/exportPdf";

interface CustomKeywordTopicsProps {
  isAuthenticated: boolean;
  onRequireAuth: () => void;
}

interface TopicResult {
  keyword: string;
  ideas: string[];
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

const CustomKeywordTopics = ({ isAuthenticated, onRequireAuth }: CustomKeywordTopicsProps) => {
  const [keyword, setKeyword] = useState("");
  const [result, setResult] = useState<TopicResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [scriptIdea, setScriptIdea] = useState<string | null>(null);
  const { toast } = useToast();
  const { saveIdea, saving, isSaved } = useSaveIdea();

  const handleGenerate = async () => {
    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }

    const trimmed = keyword.trim();
    if (!trimmed) {
      toast({ title: "Enter a keyword", description: "Type a keyword or search term to generate ideas.", variant: "destructive" });
      return;
    }
    if (trimmed.length > 100) {
      toast({ title: "Keyword too long", description: "Keep your keyword under 100 characters.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("generate-watchlist-topics", {
        body: { keyword: trimmed },
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || "Failed to generate topics");
      setResult(data.data);
    } catch (err: any) {
      toast({
        title: "Generation failed",
        description: err.message || "Try again later",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="glass-card p-5 mt-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Search className="h-5 w-5 text-tertiary" />
          <h2 className="text-lg font-display font-semibold text-foreground">
            Custom Keyword Ideas
          </h2>
          <Sparkles className="h-4 w-4 text-tertiary" />
          <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
            <Lock className="h-3 w-3" /> Requires login
          </span>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Enter any keyword or topic to generate 25 AI-powered short-form video ideas tailored to the funeral profession.
        </p>

        <div className="flex gap-2">
          <Input
            placeholder="e.g. cremation trends, grief support, green burial..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            className="flex-1"
            maxLength={100}
            disabled={isLoading}
          />
          <Button
            onClick={handleGenerate}
            disabled={isLoading}
            className="gap-1.5 bg-tertiary text-tertiary-foreground hover:bg-tertiary/90 shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Generate
          </Button>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Generating 25 video ideas for "{keyword.trim()}"...</span>
          </div>
        )}

        {result && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-tertiary uppercase tracking-wide">
                {result.keyword}
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportVideoIdeasPdf(result.keyword, result.ideas)}
                  className="gap-1.5 text-xs h-7"
                >
                  <Download className="h-3 w-3" />
                  Download PDF
                </Button>
                <span className="text-xs text-muted-foreground">{result.ideas.length} ideas</span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {result.ideas.map((idea, i) => (
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
                    onSave={() => saveIdea({ type: "idea", ideaText: idea, source: `Keyword: ${result.keyword}` })}
                    saved={isSaved(idea)}
                    saving={saving}
                    className="opacity-0 group-hover:opacity-100"
                  />
                  <button
                    onClick={() => setScriptIdea(idea)}
                    className="shrink-0 p-0.5 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-tertiary opacity-0 group-hover:opacity-100"
                    title="Write Script"
                  >
                    <FileText className="h-3 w-3" />
                  </button>
                  <CopyButton text={idea} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.section>

      <ScriptModal
        open={!!scriptIdea}
        onOpenChange={(open) => !open && setScriptIdea(null)}
        idea={scriptIdea || ""}
      />
    </>
  );
};

export default CustomKeywordTopics;
