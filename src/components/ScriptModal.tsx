import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Copy, Check, FileText, Download, Bookmark } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { exportScriptPdf } from "@/lib/exportPdf";
import { useSaveIdea } from "@/hooks/useSaveIdea";

interface ScriptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  idea: string;
}

interface ScriptData {
  hook: string;
  body: string;
  cta: string;
  wordCount: number;
}

const tones = [
  { id: "compassionate-educator", label: "Compassionate Educator", desc: "Warm, empathetic, educational" },
  { id: "industry-insider", label: "Industry Insider", desc: "Confident, authoritative insider knowledge" },
  { id: "myth-buster", label: "Myth Buster", desc: "Bold, provocative, challenge misconceptions" },
  { id: "comforting-guide", label: "Comforting Guide", desc: "Soft, supportive, nurturing" },
];

const ScriptModal = ({ open, onOpenChange, idea }: ScriptModalProps) => {
  const [selectedTone, setSelectedTone] = useState<string | null>(null);
  const [script, setScript] = useState<ScriptData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { saveIdea, saving: savingIdea, isSaved } = useSaveIdea();

  const generateScript = async (tone: string) => {
    setSelectedTone(tone);
    setIsLoading(true);
    setScript(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-script', {
        body: { idea, tone },
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || 'Failed to generate script');
      setScript(data.data);
    } catch (err: any) {
      toast({
        title: "Script generation failed",
        description: err.message || "Try again later",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fullScript = script ? `${script.hook}\n\n${script.body}\n\n${script.cta}` : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(fullScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setSelectedTone(null);
      setScript(null);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            45-Second Script Generator
          </DialogTitle>
        </DialogHeader>

        <div className="mb-3 p-3 bg-accent/50 rounded-lg border border-border/50">
          <p className="text-xs text-muted-foreground mb-1">Topic</p>
          <p className="text-sm font-medium text-foreground">{idea}</p>
        </div>

        {/* Tone Selection */}
        <div className="space-y-2 mb-4">
          <p className="text-sm font-medium text-foreground">Choose a tone:</p>
          <div className="grid grid-cols-2 gap-2">
            {tones.map((tone) => (
              <button
                key={tone.id}
                onClick={() => generateScript(tone.id)}
                disabled={isLoading}
                className={`text-left p-3 rounded-lg border transition-all text-xs ${
                  selectedTone === tone.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/50 hover:border-primary/50 hover:bg-accent/50"
                } disabled:opacity-50`}
              >
                <p className="font-semibold">{tone.label}</p>
                <p className="text-muted-foreground mt-0.5">{tone.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Writing your script...</span>
          </div>
        )}

        {/* Script Output */}
        {script && !isLoading && (
          <div className="space-y-3">
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-xs font-semibold text-primary mb-1 uppercase tracking-wide">🎬 Hook (3 sec)</p>
              <p className="text-sm text-foreground font-medium">{script.hook}</p>
            </div>

            <div className="p-3 bg-accent/30 rounded-lg border border-border/50">
              <p className="text-xs font-semibold text-primary mb-1 uppercase tracking-wide">📝 Script</p>
              <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{script.body}</p>
            </div>

            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-xs font-semibold text-primary mb-1 uppercase tracking-wide">📣 Call to Action</p>
              <p className="text-sm text-foreground font-medium">{script.cta}</p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-muted-foreground">~{script.wordCount} words · ~45 seconds</span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => saveIdea({
                    type: "script",
                    ideaText: idea,
                    scriptHook: script.hook,
                    scriptBody: script.body,
                    scriptCta: script.cta,
                    scriptTone: tones.find(t => t.id === selectedTone)?.label || selectedTone || "",
                  })}
                  disabled={savingIdea || isSaved(idea, "script", selectedTone || "")}
                  className="gap-1.5 text-xs"
                >
                  <Bookmark className="h-3 w-3" />
                  {isSaved(idea, "script", selectedTone || "") ? "Saved" : "Save"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => exportScriptPdf(idea, script, tones.find(t => t.id === selectedTone)?.label || selectedTone || "")}
                  className="gap-1.5 text-xs"
                >
                  <Download className="h-3 w-3" />
                  PDF
                </Button>
                <Button size="sm" variant="outline" onClick={handleCopy} className="gap-1.5 text-xs">
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied ? "Copied!" : "Copy Script"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ScriptModal;
