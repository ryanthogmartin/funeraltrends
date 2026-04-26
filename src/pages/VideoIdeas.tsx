import { useState, useMemo } from "react";
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
type InputMode = "keyword" | "question" | "free";
type Category = "demystify" | "value" | "legal" | "preplanning" | "mythbust";
type Platform = "facebook" | "reels" | "youtube";
type Tone = "straight-shooter" | "myth-buster" | "insider" | "neighbor" | "my-voice";

const BIZ_OPTIONS: { value: BizType; emoji: string; label: string }[] = [
  { value: "funeral-home", emoji: "🏛️", label: "Funeral Home" },
  { value: "cemetery", emoji: "🪦", label: "Cemetery" },
  { value: "crematory", emoji: "🔥", label: "Crematory" },
  { value: "pet-cremation", emoji: "🐾", label: "Pet Cremation" },
];

const INPUT_MODE_OPTIONS: { value: InputMode; emoji: string; label: string; desc: string }[] = [
  { value: "keyword", emoji: "📋", label: "Keyword Database", desc: "Pick from funeral-industry keywords organized by search volume and topic" },
  { value: "question", emoji: "❓", label: "Families Ask Me…", desc: "Type a question families ask you at the arrangement conference or viewing" },
  { value: "free", emoji: "✏️", label: "Free Topic", desc: "Type any topic you want to make a video about" },
];

const KEYWORDS: Record<BizType, string[]> = {
  "funeral-home": [
    "do you have to be embalmed", "who makes decisions after death", "what happens to power of attorney after death",
    "how does embalming work", "how long does embalming last", "why do funeral homes take a thumbprint",
    "the two types of organ donation", "difference between a memorial service and a funeral", "can you personalize a casket",
    "can you make changes to a prearrangement", "direct cremation vs full service cremation", "why did the funeral cost that much",
    "how to transfer a prearrangement", "what happens during the first call", "how do you position the body during embalming",
    "what tools are used in embalming", "difference between a celebration of life and a traditional funeral",
    "can you personalize an urn", "pre-planning vs pre-paying",
  ],
  "cemetery": [
    "what does perpetual care actually cover", "difference between a burial plot and a mausoleum",
    "how to find someone buried in a cemetery", "veteran burial benefits explained", "can you resell a cemetery lot",
    "green burial at a traditional cemetery", "what happens if a cemetery closes", "columbarium niche vs burial plot",
    "how to buy a cemetery plot in advance", "what is a cemetery deed",
  ],
  "crematory": [
    "what actually happens during cremation", "flame cremation vs water cremation", "how long does cremation take",
    "what is aquamation", "how does the cremation ID process work", "what does direct cremation include",
    "individual vs communal cremation", "what are cremated remains actually made of",
    "can you have a service after cremation", "what to do with ashes after cremation",
  ],
  "pet-cremation": [
    "individual vs communal pet cremation", "how do I know the ashes are really my pet",
    "how the pet cremation ID process works", "how to memorialize a pet", "pet loss grief is valid",
    "in-home pet euthanasia what to expect", "what happens to my pet before cremation",
    "how long does pet cremation take", "options for pet ashes", "is it normal to grieve this hard for a pet",
  ],
};

const CATEGORY_OPTIONS: { value: Category; label: string; desc: string }[] = [
  { value: "demystify", label: "Demystify", desc: "Pull back the curtain. Answer what families are afraid to Google. Specific steps, real tools, actual timeframes." },
  { value: "value", label: "Value/Price", desc: "Price transparency from confidence. What they're paying for and what they give up by going cheaper." },
  { value: "legal", label: "Legal", desc: "Who has decision-making authority. What POA covers. Organ donation types. Pre-arrangement rights." },
  { value: "preplanning", label: "Pre-Planning", desc: "Pre-planning as a gift to the family left behind. Make it feel manageable with one concrete next step." },
  { value: "mythbust", label: "Myth Bust", desc: "State the myth-bust in the first sentence. Pattern interrupt = scroll stop." },
];

const PLATFORM_OPTIONS: { value: Platform; label: string }[] = [
  { value: "facebook", label: "Facebook" },
  { value: "reels", label: "Instagram Reels / TikTok" },
  { value: "youtube", label: "YouTube Shorts" },
];

const TONE_OPTIONS: { value: Tone; label: string; desc: string }[] = [
  { value: "straight-shooter", label: "Straight Shooter", desc: "Direct, confident, says it plainly" },
  { value: "myth-buster", label: "Myth Buster", desc: "Provocative, pattern interrupt" },
  { value: "insider", label: "Industry Insider", desc: "Shares what others won't say" },
  { value: "neighbor", label: "Community Neighbor", desc: "Warm, real, human" },
];

const VideoIdeas = () => {
  const { user, loading } = useAuth();
  const { hasProfile } = useVoiceProfile();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isAuthenticated = loading || !!user;

  const [bizType, setBizType] = useState<BizType>("funeral-home");
  const [inputMode, setInputMode] = useState<InputMode>("keyword");
  const [topic, setTopic] = useState<string>("");
  const [category, setCategory] = useState<Category>("demystify");
  const [platform, setPlatform] = useState<Platform>("facebook");
  const [tone, setTone] = useState<Tone>("straight-shooter");

  const [ideas, setIdeas] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [activeTopic, setActiveTopic] = useState<string>("");

  const [scriptOpen, setScriptOpen] = useState(false);
  const [scriptIdea, setScriptIdea] = useState<string>("");

  const handleBizChange = (val: BizType) => {
    setBizType(val);
    setTopic("");
    setIdeas([]);
    setActiveTopic("");
  };

  const handleInputModeChange = (val: InputMode) => {
    setInputMode(val);
    setTopic("");
    setIdeas([]);
    setActiveTopic("");
  };

  const generateIdeas = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (!topic.trim()) return;
    setGenerating(true);
    setIdeas([]);
    try {
      const { data, error } = await supabase.functions.invoke("generate-video-topics", {
        body: { topic: topic.trim(), inputMode, bizType, category, platform, tone },
      });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || "Failed to generate ideas");
      setIdeas(data.ideas || []);
      setActiveTopic(topic.trim());
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
          Not generic AI — this knows your industry, your language, and your audience.
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

      {/* SECTION 3 — INPUT MODE */}
      <section className="rounded-xl border border-border bg-card p-5 space-y-3 shadow-sm">
        <p className="text-sm font-semibold text-foreground">How are you finding your topic?</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {INPUT_MODE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleInputModeChange(opt.value)}
              className={`text-left p-4 rounded-lg border transition-all ${
                inputMode === opt.value
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50 hover:bg-accent"
              }`}
            >
              <p className="font-semibold text-sm text-foreground mb-1">
                {opt.emoji} {opt.label}
              </p>
              <p className="text-xs text-muted-foreground">{opt.desc}</p>
            </button>
          ))}
        </div>
      </section>

      {/* SECTION 4 — TOPIC INPUT */}
      <section className="rounded-xl border border-border bg-card p-5 space-y-3 shadow-sm">
        <p className="text-sm font-semibold text-foreground">Choose your topic</p>
        {inputMode === "keyword" && (
          <div className="max-h-72 overflow-y-auto pr-1">
            <div className="flex flex-wrap gap-2">
              {KEYWORDS[bizType].map((kw) => (
                <button
                  key={kw}
                  onClick={() => setTopic(kw)}
                  className={`px-3 py-2 rounded-md border text-xs font-medium transition-all ${
                    topic === kw
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background hover:border-primary/50 hover:bg-accent text-foreground"
                  }`}
                >
                  {kw}
                </button>
              ))}
            </div>
          </div>
        )}
        {inputMode === "question" && (
          <Textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Type the question families ask you... e.g. 'Do I have to be embalmed?' or 'Who gets to make the decisions after my husband dies?'"
            className="min-h-[100px]"
          />
        )}
        {inputMode === "free" && (
          <Textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Type any topic... e.g. 'What actually happens during embalming' or 'Why we cost more than the funeral home down the street'"
            className="min-h-[100px]"
          />
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

      {/* SECTION 6 — PLATFORM + TONE */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-5 space-y-3 shadow-sm">
          <p className="text-sm font-semibold text-foreground">Platform</p>
          <div className="space-y-2">
            {PLATFORM_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  platform === opt.value
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50 hover:bg-accent"
                }`}
              >
                <input
                  type="radio"
                  name="platform"
                  checked={platform === opt.value}
                  onChange={() => setPlatform(opt.value)}
                  className="accent-primary"
                />
                <span className="text-sm font-medium text-foreground">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 space-y-3 shadow-sm">
          <p className="text-sm font-semibold text-foreground">Tone</p>
          <div className="space-y-2">
            {TONE_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  tone === opt.value
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50 hover:bg-accent"
                }`}
              >
                <input
                  type="radio"
                  name="tone"
                  checked={tone === opt.value}
                  onChange={() => setTone(opt.value)}
                  className="accent-primary mt-1"
                />
                <div>
                  <p className="text-sm font-medium text-foreground">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.desc}</p>
                </div>
              </label>
            ))}
            {hasProfile && (
              <label
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  tone === "my-voice"
                    ? "border-primary bg-primary/10"
                    : "border-primary/40 bg-primary/5 hover:border-primary/60"
                }`}
              >
                <input
                  type="radio"
                  name="tone"
                  checked={tone === "my-voice"}
                  onChange={() => setTone("my-voice")}
                  className="accent-primary mt-1"
                />
                <div>
                  <p className="text-sm font-semibold text-primary">My Voice</p>
                  <p className="text-xs text-muted-foreground">Use your saved voice profile</p>
                </div>
              </label>
            )}
          </div>
        </div>
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
          "Select a topic above to continue"
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
              8 Ideas — {activeTopic.toUpperCase()}
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
        bizType={bizType}
        category={category}
        platform={platform}
        defaultTone={tone}
      />
    </div>
  );
};

export default VideoIdeas;
