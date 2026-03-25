import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Trash2, Loader2, Pencil, Download, RefreshCw, Check, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useVoiceProfile } from "@/hooks/useVoiceProfile";
import { exportScriptPdf } from "@/lib/exportPdf";

interface SavedIdea {
  id: string;
  type: string;
  idea_text: string;
  script_hook: string | null;
  script_body: string | null;
  script_cta: string | null;
  script_tone: string | null;
  source: string | null;
  created_at: string;
}

const tones = [
  { id: "compassionate-educator", label: "Compassionate Educator" },
  { id: "industry-insider", label: "Industry Insider" },
  { id: "myth-buster", label: "Myth Buster" },
  { id: "comforting-guide", label: "Comforting Guide" },
];

interface SavedScriptCardProps {
  item: SavedIdea;
  index: number;
  deletingId: string | null;
  onDelete: (id: string) => void;
  onUpdate: (updated: SavedIdea) => void;
}

const SavedScriptCard = ({ item, index, deletingId, onDelete, onUpdate }: SavedScriptCardProps) => {
  const [editing, setEditing] = useState(false);
  const [editHook, setEditHook] = useState(item.script_hook || "");
  const [editBody, setEditBody] = useState(item.script_body || "");
  const [editCta, setEditCta] = useState(item.script_cta || "");
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [showTones, setShowTones] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { hasProfile } = useVoiceProfile();

  const handleSaveEdit = async () => {
    setSaving(true);
    const { error } = await (supabase.from("saved_ideas" as any).update({
      script_hook: editHook,
      script_body: editBody,
      script_cta: editCta,
    } as any).eq("id", item.id) as any);

    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      onUpdate({ ...item, script_hook: editHook, script_body: editBody, script_cta: editCta });
      toast({ title: "Saved", description: "Script updated successfully." });
      setEditing(false);
    }
    setSaving(false);
  };

  const handleCancelEdit = () => {
    setEditHook(item.script_hook || "");
    setEditBody(item.script_body || "");
    setEditCta(item.script_cta || "");
    setEditing(false);
  };

  const handleChangeTone = async (toneId: string) => {
    setRegenerating(true);
    setShowTones(false);
    try {
      const { data, error } = await supabase.functions.invoke("generate-script", {
        body: { idea: item.idea_text, tone: toneId, userId: user?.id },
      });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || "Failed to regenerate");

      const toneLabel = tones.find((t) => t.id === toneId)?.label || toneId;
      const updated = {
        script_hook: data.data.hook,
        script_body: data.data.body,
        script_cta: data.data.cta,
        script_tone: toneLabel,
      };

      const { error: updateErr } = await (supabase.from("saved_ideas" as any).update(updated as any).eq("id", item.id) as any);
      if (updateErr) throw updateErr;

      const newItem = { ...item, ...updated };
      onUpdate(newItem);
      setEditHook(newItem.script_hook || "");
      setEditBody(newItem.script_body || "");
      setEditCta(newItem.script_cta || "");
      toast({ title: "Tone changed", description: `Script regenerated with ${toneLabel} tone.` });
    } catch (err: any) {
      toast({ title: "Regeneration failed", description: err.message, variant: "destructive" });
    } finally {
      setRegenerating(false);
    }
  };

  const handleDownload = () => {
    exportScriptPdf(
      item.idea_text,
      {
        hook: editing ? editHook : (item.script_hook || ""),
        body: editing ? editBody : (item.script_body || ""),
        cta: editing ? editCta : (item.script_cta || ""),
        wordCount: (item.script_body || "").split(/\s+/).length,
      },
      item.script_tone || "Default"
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="glass-card p-4 relative group"
    >
      <div className="flex items-start gap-2 mb-2">
        <FileText className="h-4 w-4 text-tertiary shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Script · {item.script_tone || ""}
            {item.source && ` · ${item.source}`}
          </span>
          <p className="text-sm text-foreground font-medium mt-0.5 leading-snug">
            {item.idea_text}
          </p>
        </div>
        <button
          onClick={() => onDelete(item.id)}
          disabled={deletingId === item.id}
          className="shrink-0 p-1 rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100"
          title="Delete"
        >
          {deletingId === item.id ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {regenerating ? (
        <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Regenerating script...</span>
        </div>
      ) : (
        item.script_hook && (
          <div className="mt-3 space-y-2 text-xs">
            <div className="p-2 bg-primary/5 rounded border border-primary/20">
              <p className="font-semibold text-primary mb-0.5 uppercase tracking-wide text-[10px]">🎬 Hook</p>
              {editing ? (
                <Textarea value={editHook} onChange={(e) => setEditHook(e.target.value)} className="text-xs min-h-[40px]" />
              ) : (
                <p className="text-foreground">{item.script_hook}</p>
              )}
            </div>
            <div className="p-2 bg-accent/30 rounded border border-border/50">
              <p className="font-semibold text-primary mb-0.5 uppercase tracking-wide text-[10px]">📝 Script</p>
              {editing ? (
                <Textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} className="text-xs min-h-[100px]" />
              ) : (
                <p className="text-foreground whitespace-pre-line leading-relaxed">{item.script_body}</p>
              )}
            </div>
            <div className="p-2 bg-primary/5 rounded border border-primary/20">
              <p className="font-semibold text-primary mb-0.5 uppercase tracking-wide text-[10px]">📣 CTA</p>
              {editing ? (
                <Textarea value={editCta} onChange={(e) => setEditCta(e.target.value)} className="text-xs min-h-[40px]" />
              ) : (
                <p className="text-foreground">{item.script_cta}</p>
              )}
            </div>
          </div>
        )
      )}

      {/* Action buttons for scripts */}
      <div className="flex items-center gap-1.5 mt-3 flex-wrap">
        {editing ? (
          <>
            <Button size="sm" onClick={handleSaveEdit} disabled={saving} className="gap-1 text-xs h-7">
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancelEdit} className="gap-1 text-xs h-7">
              <X className="h-3 w-3" />
              Cancel
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="gap-1 text-xs h-7">
              <Pencil className="h-3 w-3" />
              Edit
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowTones(!showTones)} disabled={regenerating} className="gap-1 text-xs h-7">
              <RefreshCw className="h-3 w-3" />
              Change Tone
            </Button>
            <Button size="sm" variant="outline" onClick={handleDownload} className="gap-1 text-xs h-7">
              <Download className="h-3 w-3" />
              PDF
            </Button>
          </>
        )}
      </div>

      {/* Tone picker */}
      {showTones && !editing && (
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          {tones.map((tone) => (
            <button
              key={tone.id}
              onClick={() => handleChangeTone(tone.id)}
              className={`text-left p-2 rounded border text-xs transition-all ${
                item.script_tone === tone.label
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/50 hover:border-primary/50 hover:bg-accent/50 text-foreground"
              }`}
            >
              {tone.label}
            </button>
          ))}
        </div>
      )}

      <p className="text-[10px] text-muted-foreground mt-2">
        {new Date(item.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </p>
    </motion.div>
  );
};

export default SavedScriptCard;
