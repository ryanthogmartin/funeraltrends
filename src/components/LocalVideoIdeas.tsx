import { useState } from "react";
import { motion } from "framer-motion";
import { Video, Sparkles, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import ScriptModal from "./ScriptModal";
import SaveIdeaButton from "./SaveIdeaButton";
import { useSaveIdea } from "@/hooks/useSaveIdea";

interface LocalVideoIdeasProps {
  keyword: string;
}


const LocalVideoIdeas = ({ keyword }: LocalVideoIdeasProps) => {
  const [ideas, setIdeas] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [scriptIdea, setScriptIdea] = useState<string | null>(null);
  const { saveIdea, saving, isSaved } = useSaveIdea();

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-video-topics", {
        body: { keywords: [keyword] },
      });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || "Failed");
      const group = data.data?.[0];
      setIdeas(group?.ideas || []);
      setGenerated(true);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!generated) {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={handleGenerate}
        disabled={loading}
        className="gap-1.5 text-xs mt-1"
      >
        {loading ? (
          <><Loader2 className="h-3 w-3 animate-spin" /> Generating…</>
        ) : (
          <><Video className="h-3 w-3" /> Generate Video Hooks</>
        )}
      </Button>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-2 p-3 rounded-lg bg-accent/30 border border-border/50 space-y-1.5"
      >
        <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
          <Sparkles className="h-3 w-3" /> Video Ideas for "{keyword}"
        </p>
        {ideas.map((idea, i) => (
          <div key={i} className="flex items-start gap-2 py-1.5 px-2 rounded hover:bg-secondary/50 transition-colors">
            <span className="text-xs text-muted-foreground mt-0.5 shrink-0">{i + 1}.</span>
            <span className="text-xs text-foreground flex-1">{idea}</span>
            <div className="flex items-center gap-1 shrink-0">
              <SaveIdeaButton
                onSave={() => saveIdea({ type: "idea", ideaText: idea, source: `local-trends:${keyword}` })}
                saving={saving}
                saved={isSaved(idea)}
              />
              <button
                onClick={() => setScriptIdea(idea)}
                className="shrink-0 p-0.5 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-primary"
                title="Generate script"
              >
                <FileText className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
      </motion.div>

      <ScriptModal
        open={!!scriptIdea}
        onOpenChange={(open) => !open && setScriptIdea(null)}
        idea={scriptIdea || ""}
      />
    </>
  );
};

export default LocalVideoIdeas;
