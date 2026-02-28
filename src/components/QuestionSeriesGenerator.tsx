import { useState } from "react";
import { motion } from "framer-motion";
import { HelpCircle, Sparkles, Loader2, Copy, Check, Lock, Bookmark, ChevronDown, ChevronUp, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import SaveIdeaButton from "./SaveIdeaButton";
import { useSaveIdea } from "@/hooks/useSaveIdea";
import { exportVideoIdeasPdf } from "@/lib/exportPdf";

interface QuestionSeriesGeneratorProps {
  isAuthenticated: boolean;
  onRequireAuth: () => void;
}

interface SeriesItem {
  number: number;
  title: string;
  script: string;
}

interface SeriesResult {
  prompt: string;
  count: number;
  items: SeriesItem[];
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

const ScriptAccordion = ({ item }: { item: SeriesItem }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-border/50 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start gap-2 p-3 text-left hover:bg-accent/30 transition-colors"
      >
        <span className="text-[10px] font-mono text-primary mt-0.5 shrink-0 w-5 text-right font-bold">
          {item.number}.
        </span>
        <span className="text-sm text-foreground flex-1 font-medium leading-snug">
          {item.title}
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        )}
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="px-3 pb-3 border-t border-border/30"
        >
          <div className="mt-3 p-3 bg-accent/20 rounded-lg">
            <p className="text-[10px] font-semibold text-primary uppercase tracking-wide mb-1.5">📹 Script</p>
            <p className="text-xs text-foreground whitespace-pre-line leading-relaxed">{item.script}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

const QuestionSeriesGenerator = ({ isAuthenticated, onRequireAuth }: QuestionSeriesGeneratorProps) => {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<SeriesResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { saveIdea, saving, isSaved } = useSaveIdea();

  const handleGenerate = async () => {
    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }

    const trimmed = question.trim();
    if (!trimmed) {
      toast({ title: "Enter a question", description: "Type a question or prompt to generate a video series.", variant: "destructive" });
      return;
    }
    if (trimmed.length > 200) {
      toast({ title: "Prompt too long", description: "Keep your prompt under 200 characters.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("generate-question-series", {
        body: { question: trimmed },
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || "Failed to generate series");
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

  const examplePrompts = [
    "10 questions every family should ask their funeral home but they don't",
    "7 myths about cremation that I hear every single week",
    "5 things I wish people knew before walking into a funeral home",
    "8 ways to personalize a funeral service on any budget",
  ];

  return (
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
        Type a question or topic prompt and get a full video series with scripts for each item. Perfect for list-style content.
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
          disabled={isLoading}
        />
        <Button
          onClick={handleGenerate}
          disabled={isLoading}
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

      {isLoading && (
        <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Creating your video series with scripts...</span>
        </div>
      )}

      {result && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-secondary">
              {result.prompt}
            </h3>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  exportVideoIdeasPdf(
                    result.prompt,
                    result.items.map((it) => `${it.number}. ${it.title}\n\nScript:\n${it.script}`)
                  )
                }
                className="gap-1.5 text-xs h-7"
              >
                <Download className="h-3 w-3" />
                Download PDF
              </Button>
              <span className="text-xs text-muted-foreground">{result.items.length} videos</span>
            </div>
          </div>

          <div className="space-y-2">
            {result.items.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="group"
              >
                <div className="flex items-start gap-1">
                  <div className="flex-1">
                    <ScriptAccordion item={item} />
                  </div>
                  <div className="flex flex-col gap-0.5 mt-2.5">
                    <SaveIdeaButton
                      onSave={() =>
                        saveIdea({
                          type: "script",
                          ideaText: item.title,
                          scriptHook: item.title,
                          scriptBody: item.script,
                          scriptCta: "",
                          scriptTone: "Question Series",
                          source: `Series: ${result.prompt.slice(0, 50)}`,
                        })
                      }
                      saved={isSaved(item.title, "script", "Question Series")}
                      saving={saving}
                    />
                    <CopyButton text={`${item.title}\n\n${item.script}`} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.section>
  );
};

export default QuestionSeriesGenerator;
