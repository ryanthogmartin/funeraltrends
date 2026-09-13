import { useState, useMemo, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useVoiceProfile } from "@/hooks/useVoiceProfile";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, FileText, ArrowRight } from "lucide-react";
import ScriptModal from "@/components/ScriptModal";

type BizType = "funeral-home" | "cemetery" | "crematory" | "pet-cremation";
type Category = "demystify" | "value" | "legal" | "preplanning" | "mythbust";

const BIZ_OPTIONS: { value: BizType; emoji: string; label: string }[] = [
  { value: "funeral-home", emoji: "🏛️", label: "Funeral Home" },
  { value: "cemetery", emoji: "🪦", label: "Cemetery" },
  { value: "crematory", emoji: "🔥", label: "Crematory" },
  { value: "pet-cremation", emoji: "🐾", label: "Pet Cremation" },
];

const CATEGORY_OPTIONS: { value: Category; label: string; desc: string }[] = [
  { value: "demystify", label: "Demystify", desc: "Explain what families most need to understand, plainly and clearly." },
  { value: "value", label: "Value/Price", desc: "Help families understand what shapes cost and how to weigh their options." },
  { value: "legal", label: "Legal", desc: "Who has decision-making authority. What POA covers. Organ donation types. Pre-arrangement rights." },
  { value: "preplanning", label: "Pre-Planning", desc: "Pre-planning as a gift to the family left behind. Make it feel manageable with one concrete next step." },
  { value: "mythbust", label: "Myth Bust", desc: "Clear up a common misconception gently and honestly." },
];

const VideoIdeas = () => {
  const { user, loading } = useAuth();
  const { hasProfile } = useVoiceProfile();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isAuthenticated = !loading && !!user;

  const [bizType, setBizType] = useState<BizType>("funeral-home");
  const [topic, setTopic] = useState<string>("");
  const [category, setCategory] = useState<Category>("demystify");
  const platform = "facebook";
  const inputMode = "free";
  const [useSavedVoice, setUseSavedVoice] = useState(false);
  const tone = useSavedVoice && hasProfile ? "my-voice" : "compassionate-educator";
  const [resultContext, setResultContext] = useState({ bizType, category, platform, tone });

  const [ideas, setIdeas] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [activeTopic, setActiveTopic] = useState<string>("");

  // Every idea title already shown for the current topic, across regenerations,
  // so the backend can steer new runs away from repeating them.
  const seenIdeasRef = useRef<{ topic: string; titles: string[] }>({ topic: "", titles: [] });

  const [scriptOpen, setScriptOpen] = useState(false);
  const [scriptIdea, setScriptIdea] = useState<string>("");

  const handleBizChange = (val: BizType) => {
    setBizType(val);
    setTopic("");
    setIdeas([]);
    setActiveTopic("");
  };

  const generateIdeas = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (!topic.trim() || generating) return;
    setGenerating(true);
    setIdeas([]);
    const trimmedTopic = topic.trim();
    const previousIdeas = seenIdeasRef.current.topic === trimmedTopic ? seenIdeasRef.current.titles : [];
    try {
      const { data, error } = await supabase.functions.invoke("generate-video-topics", {
        body: { topic: trimmedTopic, inputMode, bizType, category, platform, tone, previousIdeas },
      });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || "Failed to generate ideas");
      if (!Array.isArray(data.ideas) || !data.ideas.length || data.ideas.some((value: unknown) => typeof value !== "string" || !value.trim())) {
        throw new Error("We couldn't generate ideas for this topic. Please try again.");
      }
      setIdeas(data.ideas);
      setResultContext({ bizType, category, platform, tone });
      setActiveTopic(trimmedTopic);
      seenIdeasRef.current = {
        topic: trimmedTopic,
        titles: [...previousIdeas, ...(data.ideas || [])].slice(-24),
      };
    } catch (err: any) {
      toast({ title: "Generation failed", description: err.message || "Try again later", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const openScript = (idea: string) => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setScriptIdea(idea);
    setScriptOpen(true);
  };

  const selectedCategoryDesc = useMemo(
    () => CATEGORY_OPTIONS.find((c) => c.value === category)?.desc || "",
    [category]
  );

  const topicSelected = topic.trim().length > 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* SECTION 1 — HEADER */}
      <header className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground">Video Content Engine</h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
          Built for funeral homes, cemeteries, crematories, and pet cremation businesses.
          Not generic AI — this knows your profession, your language, and your audience.
        </p>
      </header>

      {/* SECTION 2 — BUSINESS TYPE */}
      <section className="rounded-xl border border-border bg-card p-5 space-y-3 shadow-sm">
        <p className="text-sm font-semibold text-foreground">What kind of business are you?</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {BIZ_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleBizChange(opt.value)}
              disabled={generating}
              className={`px-3 py-3 rounded-lg border text-sm font-medium transition-all ${
                bizType === opt.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/50 hover:bg-accent text-foreground"
              }`}
            >
              <span className="mr-1.5">{opt.emoji}</span>
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5 space-y-3 shadow-sm">
        <label htmlFor="video-topic" className="text-sm font-semibold text-foreground">What would you like to talk about?</label>
        <Textarea
          id="video-topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Enter a topic or a question families ask you, such as what to expect at a funeral service."
          className="min-h-[120px]"
          disabled={generating}
        />
        <p className="text-xs text-muted-foreground">Start with one question or idea. We'll suggest eight ways to approach it.</p>
        {hasProfile && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={useSavedVoice} onChange={(e) => setUseSavedVoice(e.target.checked)} disabled={generating} />
            Use my saved voice profile
          </label>
        )}
      </section>

      {/* SECTION 5 — CONTENT ANGLE */}
      <section className="rounded-xl border border-border bg-card p-5 space-y-3 shadow-sm">
        <p className="text-sm font-semibold text-foreground">Content angle</p>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setCategory(opt.value)}
              disabled={generating}
              className={`px-3 py-2 rounded-md border text-xs font-medium transition-all ${
                category === opt.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:border-primary/50 hover:bg-accent text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground italic">{selectedCategoryDesc}</p>
      </section>

      {/* SECTION 7 — GENERATE BUTTON */}
      <Button
        onClick={generateIdeas}
        disabled={!topicSelected || generating || !isAuthenticated}
        className="w-full h-14 text-sm font-bold uppercase tracking-wide"
        size="lg"
      >
        {generating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Generating Ideas...
          </>
        ) : !topicSelected ? (
          "Enter a topic above to continue"
        ) : (
          <>
            Generate 8 Video Ideas
            <ArrowRight className="h-4 w-4 ml-2" />
          </>
        )}
      </Button>

      {/* SECTION 8 — IDEAS OUTPUT */}
      {ideas.length > 0 && (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-display font-bold text-foreground uppercase tracking-wide">
              {ideas.length} Ideas — {activeTopic.toUpperCase()}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Click any idea to get a 45-second script
            </p>
          </div>
          <div className="space-y-2">
            {ideas.map((idea, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:border-primary/50 transition-all shadow-sm"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-md bg-foreground text-primary font-bold text-sm shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <p className="flex-1 text-sm text-foreground">{idea}</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openScript(idea)}
                  className="gap-1 text-xs font-bold uppercase shrink-0 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  <FileText className="h-3 w-3" />
                  Script
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}

      <ScriptModal
        open={scriptOpen}
        onOpenChange={setScriptOpen}
        idea={scriptIdea}
        bizType={resultContext.bizType}
        category={resultContext.category}
        platform={resultContext.platform}
        defaultTone={resultContext.tone}
      />
    </div>
  );
};

export default VideoIdeas;
