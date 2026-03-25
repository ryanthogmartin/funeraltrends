import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Copy, Check, FileText, Download, Bookmark, Pencil, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { exportScriptPdf } from "@/lib/exportPdf";
import { useSaveIdea } from "@/hooks/useSaveIdea";
import { useAuth } from "@/hooks/useAuth";
import { useVoiceProfile } from "@/hooks/useVoiceProfile";

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
  const [editing, setEditing] = useState(false);
  const [editHook, setEditHook] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editCta, setEditCta] = useState("");
  const { toast } = useToast();
  const { saveIdea, saving: savingIdea, isSaved } = useSaveIdea();
  const { user } = useAuth();
  const { hasProfile } = useVoiceProfile();

  const generateScript = async (tone: string) => {
    setSelectedTone(tone);
    setIsLoading(true);
    setScript(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-script', {
        body: { idea, tone, userId: user?.id },
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || 'Failed to generate script');
      setScript(data.data);
      setEditHook(data.data.hook);
      setEditBody(data.data.body);
      setEditCta(data.data.cta);
      setEditing(false);
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

  const currentHook = editing ? editHook : (script?.hook || "");
  const currentBody = editing ? editBody : (script?.body || "");
  const currentCta = editing ? editCta : (script?.cta || "");
  const fullScript = script ? `${currentHook}\n\n${currentBody}\n\n${currentCta}` : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(fullScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setSelectedTone(null);
      setScript(null);
      setEditing(false);
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
          {hasProfile && (
            <button
              onClick={() => generateScript("my-voice")}
              disabled={isLoading}
              className={`w-full text-left p-3 rounded-lg border transition-all text-xs flex items-center gap-2 ${
                selectedTone === "my-voice"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-primary/30 hover:border-primary/50 hover:bg-primary/5 bg-primary/5"
              } disabled:opacity-50`}
            >
              <User className="h-4 w-4 shrink-0" />
              <div>
                <p className="font-semibold">My Voice Persona</p>
                <p className="text-muted-foreground mt-0.5">Use your custom voice profile</p>
              </div>
            </button>
          )}
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
              {editing ? (
                <Textarea value={editHook} onChange={(e) => setEditHook(e.target.value)} className="text-sm min-h-[40px]" />
              ) : (
                <p className="text-sm text-foreground font-medium">{currentHook}</p>
              )}
            </div>

            <div className="p-3 bg-accent/30 rounded-lg border border-border/50">
              <p className="text-xs font-semibold text-primary mb-1 uppercase tracking-wide">📝 Script</p>
              {editing ? (
                <Textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} className="text-sm min-h-[120px]" />
              ) : (
                <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{currentBody}</p>
              )}
            </div>

            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-xs font-semibold text-primary mb-1 uppercase tracking-wide">📣 Call to Action</p>
              {editing ? (
                <Textarea value={editCta} onChange={(e) => setEditCta(e.target.value)} className="text-sm min-h-[40px]" />
              ) : (
                <p className="text-sm text-foreground font-medium">{currentCta}</p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2">
              <span className="text-xs text-muted-foreground">~{script.wordCount} words · ~45 seconds</span>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant={editing ? "default" : "outline"}
                  onClick={() => setEditing(!editing)}
                  className="gap-1.5 text-xs"
                >
                  <Pencil className="h-3 w-3" />
                  {editing ? "Done" : "Edit"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => saveIdea({
                    type: "script",
                    ideaText: idea,
                    scriptHook: currentHook,
                    scriptBody: currentBody,
                    scriptCta: currentCta,
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
                  onClick={() => exportScriptPdf(idea, { hook: currentHook, body: currentBody, cta: currentCta, wordCount: script.wordCount }, tones.find(t => t.id === selectedTone)?.label || selectedTone || "")}
                  className="gap-1.5 text-xs"
                >
                  <Download className="h-3 w-3" />
                  PDF
                </Button>
                <Button size="sm" variant="outline" onClick={handleCopy} className="gap-1.5 text-xs">
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied ? "Copied!" : "Copy"}
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
