import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface VoiceProfile {
  id?: string;
  tone_descriptor: string;
  vocabulary_level: string;
  catchphrases: string;
  audience_address: string;
  pacing_style: string;
  humor_comfort: string;
  sample_script: string;
  cta_style: string;
  funeral_home_name: string;
  years_experience: string;
  specialties: string;
  origin_story: string;
  content_pillars: string;
  target_audience_age: string;
  signature_opening: string;
  video_style: string;
  faith_lens: string;
  taboo_topics: string;
  anecdote_style: string;
}

const defaults: VoiceProfile = {
  tone_descriptor: "warm-empathetic",
  vocabulary_level: "everyday",
  catchphrases: "",
  audience_address: "families",
  pacing_style: "mixed",
  humor_comfort: "no-humor",
  sample_script: "",
  cta_style: "soft-ask",
  funeral_home_name: "",
  years_experience: "",
  specialties: "",
  origin_story: "",
  content_pillars: "",
  target_audience_age: "all-ages",
  signature_opening: "",
  video_style: "talking-head",
  faith_lens: "prefer-not",
  taboo_topics: "",
  anecdote_style: "occasionally",
};

export function useVoiceProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<VoiceProfile>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("voice_profiles" as any)
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data && !error) {
        const d = data as any;
        setProfile({
          id: d.id,
          tone_descriptor: d.tone_descriptor,
          vocabulary_level: d.vocabulary_level,
          catchphrases: d.catchphrases || "",
          audience_address: d.audience_address,
          pacing_style: d.pacing_style,
          humor_comfort: d.humor_comfort,
          sample_script: d.sample_script || "",
          cta_style: d.cta_style,
          funeral_home_name: d.funeral_home_name || "",
          years_experience: d.years_experience || "",
          specialties: d.specialties || "",
          origin_story: d.origin_story || "",
          content_pillars: d.content_pillars || "",
          target_audience_age: d.target_audience_age || "all-ages",
          signature_opening: d.signature_opening || "",
          video_style: d.video_style || "talking-head",
          faith_lens: d.faith_lens || "prefer-not",
          taboo_topics: d.taboo_topics || "",
          anecdote_style: d.anecdote_style || "occasionally",
        });
        setHasProfile(true);
      }
      setLoading(false);
    })();
  }, [user]);

  const save = async (values: VoiceProfile) => {
    if (!user) return;
    setSaving(true);
    try {
      if (hasProfile) {
        const { error } = await supabase
          .from("voice_profiles" as any)
          .update({
            ...values,
            updated_at: new Date().toISOString(),
          } as any)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("voice_profiles" as any)
          .insert({
            ...values,
            user_id: user.id,
          } as any);
        if (error) throw error;
        setHasProfile(true);
      }
      setProfile(values);
      toast({ title: "Voice profile saved", description: "Your scripts will now match your personal style." });
    } catch (err: any) {
      toast({ title: "Failed to save", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return { profile, loading, saving, save, hasProfile };
}
