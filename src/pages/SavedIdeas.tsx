import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bookmark, Trash2, Lightbulb, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import SavedScriptCard from "@/components/SavedScriptCard";

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

const SavedIdeas = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [ideas, setIdeas] = useState<SavedIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "idea" | "script">("all");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchSaved = async () => {
      setLoading(true);
      const { data, error } = await (supabase.from("saved_ideas" as any).select("*").eq("user_id", user.id).order("created_at", { ascending: false }) as any);
      if (error) {
        toast({ title: "Error loading saved ideas", description: error.message, variant: "destructive" });
      } else {
        setIdeas((data || []) as SavedIdea[]);
      }
      setLoading(false);
    };
    fetchSaved();
  }, [user]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const { error } = await (supabase.from("saved_ideas" as any).delete().eq("id", id) as any);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      setIdeas((prev) => prev.filter((i) => i.id !== id));
      toast({ title: "Deleted", description: "Item removed from saved ideas." });
    }
    setDeletingId(null);
  };

  const filtered = filter === "all" ? ideas : ideas.filter((i) => i.type === filter);
  const ideaCount = ideas.filter((i) => i.type === "idea").length;
  const scriptCount = ideas.filter((i) => i.type === "script").length;

  if (authLoading) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
          <Bookmark className="h-6 w-6 text-primary" />
          Saved Ideas
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your saved video ideas and scripts, all in one place.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-6">
        {[
          { key: "all" as const, label: "All", count: ideas.length },
          { key: "idea" as const, label: "Ideas", count: ideaCount },
          { key: "script" as const, label: "Scripts", count: scriptCount },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filter === tab.key
                ? "bg-accent text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading saved ideas...</span>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16">
          <Bookmark className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {filter === "all"
              ? "No saved ideas yet. Save video ideas or scripts from the Video Ideas page."
              : `No saved ${filter}s yet.`}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/video-ideas")}
            className="mt-4 gap-1.5"
          >
            Browse Video Ideas
          </Button>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((item, i) =>
            item.type === "script" ? (
              <SavedScriptCard
                key={item.id}
                item={item}
                index={i}
                deletingId={deletingId}
                onDelete={handleDelete}
                onUpdate={(updated) =>
                  setIdeas((prev) => prev.map((idea) => (idea.id === updated.id ? updated : idea)))
                }
              />
            ) : (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="glass-card p-4 relative group"
              >
                <div className="flex items-start gap-2 mb-2">
                  <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Video Idea
                      {item.source && ` · ${item.source}`}
                    </span>
                    <p className="text-sm text-foreground font-medium mt-0.5 leading-snug">
                      {item.idea_text}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(item.id)}
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
                <p className="text-[10px] text-muted-foreground mt-2">
                  {new Date(item.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </motion.div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default SavedIdeas;
