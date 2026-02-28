import { useState } from "react";
import { motion } from "framer-motion";
import { HelpCircle, Sparkles, Loader2, Copy, Check, Lock, FileText, Download, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import ScriptModal from "./ScriptModal";
import SaveIdeaButton from "./SaveIdeaButton";
import { useSaveIdea } from "@/hooks/useSaveIdea";
import { exportVideoIdeasPdf } from "@/lib/exportPdf";

interface QuestionSeriesGeneratorProps {
  isAuthenticated: boolean;
  onRequireAuth: () => void;
}

interface SeriesResult {
  prompt: string;
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

const QuestionSeriesGenerator = ({ isAuthenticated, onRequireAuth }: QuestionSeriesGeneratorProps) => {
  const [question, setQuestion] = useState("");
  const [lastQuestion, setLastQuestion] = useState("");
  const [result, setResult] = useState<SeriesResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [scriptIdea, setScriptIdea] = useState<string | null>(null);
  const { toast } = useToast();
  const { saveIdea, saving, isSaved } = useSaveIdea();

  const handleGenerate = async (regenerate = false) => {
    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }

    const trimmed = regenerate ? lastQuestion : question.trim();
    if (!trimmed) {
      toast({ title: "Enter a question", description: "Type a question or prompt to generate video ideas.", variant: "destructive" });
      return;
    }
    if (trimmed.length > 200) {
      toast({ title: "Prompt too long", description: "Keep your prompt under 200 characters.", variant: "destructive" });
      return;
    }

    if (regenerate) {
      setIsRegenerating(true);
    } else {
      setIsLoading(true);
      setLastQuestion(trimmed);
    }
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("generate-question-series", {
        body: { question: trimmed },
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || "Failed to generate ideas");
      setResult(data.data);
    } catch (err: any) {
      toast({
        title: "Generation failed",
        description: err.message || "Try again later",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsRegenerating(false);
    }
  };

  const examplePrompts = [
    "10 questions every family should ask their funeral home but they don't",
    "7 myths about cremation that I hear every single week",
    "5 things I wish people knew before walking into a funeral home",
    "8 ways to personalize a funeral service on any budget",
  ];

  const loading = isLoading || isRegenerating;

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="glass-card p-5 mt-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <HelpCircle className="h-5 w-5 text-secondary" />
          <h2 className="text-lg font-display font-semibold text-foreground">
            Question → Video Series
          </h2>
          <Sparkles className="h-4 w-4 text-tertiary" />
          <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
            <Lock className="h-3 w-3" /> Requires login
          </span>
        </div>

        <p className="text-sm text-muted-foreground mb-3">
          Type a question or topic prompt and get a list of video ideas. Click the script button on any idea to generate a full script with your chosen tone.
        </p>

        {/* Example prompts */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {examplePrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => setQuestion(prompt)}
              className="text-[10px] px-2 py-1 rounded-full border border-border/50 text-muted-foreground hover:text-foreground hover:border-secondary/50 hover:bg-secondary/5 transition-colors"
            >
              {prompt.length > 50 ? prompt.slice(0, 50) + "…" : prompt}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="e.g. 10 questions every family should ask their funeral home..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            className="flex-1"
            maxLength={200}
            disabled={loading}
          />
          <Button
            onClick={() => handleGenerate()}
            disabled={loading}
            className="gap-1.5 bg-secondary text-secondary-foreground hover:bg-secondary/90 shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Generate
          </Button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">
              {isRegenerating ? "Generating new suggestions..." : "Creating your video ideas..."}
            </span>
          </div>
        )}

        {result && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-secondary truncate flex-1 mr-2">
                {result.prompt}
              </h3>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleGenerate(true)}
                  className="gap-1 text-[10px] h-6 text-muted-foreground hover:text-secondary"
                >
                  <RefreshCw className="h-3 w-3" />
                  New Suggestions
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportVideoIdeasPdf(result.prompt, result.ideas)}
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
                    onSave={() => saveIdea({ type: "idea", ideaText: idea, source: `Series: ${result.prompt.slice(0, 50)}` })}
                    saved={isSaved(idea)}
                    saving={saving}
                    className="opacity-0 group-hover:opacity-100"
                  />
                  <button
                    onClick={() => setScriptIdea(idea)}
                    className="shrink-0 p-0.5 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-secondary opacity-0 group-hover:opacity-100"
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

export default QuestionSeriesGenerator;
