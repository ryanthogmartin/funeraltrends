import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface SaveIdeaParams {
  type: "idea" | "script";
  ideaText: string;
  scriptHook?: string;
  scriptBody?: string;
  scriptCta?: string;
  scriptTone?: string;
  source?: string;
}

export function useSaveIdea() {
  const [saving, setSaving] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const { toast } = useToast();

  const saveIdea = async (params: SaveIdeaParams) => {
    if (!user) {
      toast({ title: "Sign in required", description: "Log in to save ideas to your account.", variant: "destructive" });
      return false;
    }

    const key = params.type === "script" 
      ? `script:${params.ideaText}:${params.scriptTone}` 
      : `idea:${params.ideaText}`;

    if (savedIds.has(key)) {
      toast({ title: "Already saved", description: "This item is already in your saved ideas." });
      return false;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("saved_ideas" as any).insert({
        user_id: user.id,
        type: params.type,
        idea_text: params.ideaText,
        script_hook: params.scriptHook || null,
        script_body: params.scriptBody || null,
        script_cta: params.scriptCta || null,
        script_tone: params.scriptTone || null,
        source: params.source || null,
      } as any);

      if (error) throw error;

      setSavedIds((prev) => new Set(prev).add(key));
      toast({ title: "Saved!", description: params.type === "script" ? "Script saved to your account." : "Idea saved to your account." });
      return true;
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message || "Try again later.", variant: "destructive" });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const isSaved = (ideaText: string, type: "idea" | "script" = "idea", tone?: string) => {
    const key = type === "script" ? `script:${ideaText}:${tone}` : `idea:${ideaText}`;
    return savedIds.has(key);
  };

  return { saveIdea, saving, isSaved };
}
