import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useVoiceProfile, VoiceProfile } from "@/hooks/useVoiceProfile";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Mic, MicOff, Save, User, Target, Video, Heart, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const toneOptions = [
  { value: "warm-empathetic", label: "Warm & Empathetic", desc: "Caring, gentle, comforting — like talking to a trusted friend" },
  { value: "professional-authoritative", label: "Professional & Authoritative", desc: "Confident, knowledgeable, the expert families trust" },
  { value: "down-to-earth", label: "Down to Earth", desc: "Casual, approachable, real talk about a tough topic" },
  { value: "reverent-formal", label: "Reverent & Formal", desc: "Dignified, respectful, traditional tone" },
];

const vocabOptions = [
  { value: "everyday", label: "Everyday Language", desc: "Simple words families understand" },
  { value: "mixed", label: "Mix of Both", desc: "Industry terms with quick explanations" },
  { value: "professional", label: "Professional / Industry", desc: "Speak like a peer to other funeral pros" },
];

const audienceOptions = [
  { value: "families", label: '"Families"' },
  { value: "folks", label: '"Folks"' },
  { value: "friends", label: '"Friends"' },
  { value: "everyone", label: '"Everyone"' },
  { value: "yall", label: '"Y\'all"' },
];

const pacingOptions = [
  { value: "short-punchy", label: "Short & Punchy", desc: "Quick sentences, rapid-fire delivery" },
  { value: "mixed", label: "Natural Mix", desc: "Varies between short and longer thoughts" },
  { value: "flowing", label: "Flowing & Conversational", desc: "Longer, storytelling-style sentences" },
];

const humorOptions = [
  { value: "no-humor", label: "Keep It Serious", desc: "Strictly professional, no humor" },
  { value: "light-humor", label: "Light Humor OK", desc: "Occasional gentle humor when appropriate" },
  { value: "personality-driven", label: "Let My Personality Shine", desc: "I'm naturally funny and my audience expects it" },
];

const ctaOptions = [
  { value: "soft-ask", label: "Soft Ask", desc: '"If this helped, consider sharing it"' },
  { value: "direct-cta", label: "Direct CTA", desc: '"Follow for more and drop a comment below"' },
  { value: "question", label: "Ask a Question", desc: '"What do you think? Let me know in the comments"' },
  { value: "emotional-close", label: "Emotional Close", desc: '"Remember, you don\'t have to go through this alone"' },
];

const contentPillarOptions = [
  { value: "pre-planning", label: "Pre-Planning Education" },
  { value: "grief-support", label: "Grief Support" },
  { value: "behind-scenes", label: "Behind the Scenes" },
  { value: "myth-busting", label: "Myth Busting" },
  { value: "celebration-of-life", label: "Celebration of Life" },
  { value: "cost-transparency", label: "Cost & Transparency" },
  { value: "cultural-traditions", label: "Cultural Traditions" },
  { value: "industry-advocacy", label: "Industry Advocacy" },
];

const targetAudienceOptions = [
  { value: "millennials", label: "Millennials (25–40)", desc: "Casual, digital-native language" },
  { value: "gen-x", label: "Gen X (40–55)", desc: "Practical, no-nonsense tone" },
  { value: "boomers", label: "Boomers (55+)", desc: "Traditional, respectful approach" },
  { value: "all-ages", label: "All Ages", desc: "Universal language that works for everyone" },
];

const videoStyleOptions = [
  { value: "talking-head", label: "Talking Head", desc: "You on camera, speaking directly to the viewer" },
  { value: "storytelling", label: "Storytelling", desc: "Narrative-driven, like telling a story to a friend" },
  { value: "quick-tips", label: "Quick Tips / Listicle", desc: "Fast, numbered tips — easy to follow" },
  { value: "emotional", label: "Emotional / Heartfelt", desc: "Pulls at heartstrings, moving and powerful" },
  { value: "educational", label: "Educational / Explainer", desc: "Teaching something step-by-step" },
];

const faithLensOptions = [
  { value: "faith-based", label: "Faith-Based", desc: "Comfortable referencing faith, God, scripture" },
  { value: "secular", label: "Secular", desc: "Keep it non-religious, universal" },
  { value: "culturally-diverse", label: "Culturally Diverse", desc: "Respectful of many traditions and beliefs" },
  { value: "prefer-not", label: "Prefer Not to Specify", desc: "Leave it flexible — I'll adjust per video" },
];

const anecdoteOptions = [
  { value: "never", label: "Never", desc: "I keep things factual and professional" },
  { value: "occasionally", label: "Occasionally", desc: "Sometimes a personal story fits naturally" },
  { value: "frequently", label: "Frequently", desc: "I love sharing stories — it's how I connect" },
];

// Reusable radio card renderer
const RadioCard = ({ options, value, onChange, grid }: {
  options: { value: string; label: string; desc?: string }[];
  value: string;
  onChange: (v: string) => void;
  grid?: boolean;
}) => (
  <RadioGroup value={value} onValueChange={onChange} className={grid ? "grid grid-cols-2 sm:grid-cols-3 gap-2" : "space-y-2"}>
    {options.map((opt) => (
      <label
        key={opt.value}
        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
          value === opt.value
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/40"
        }`}
      >
        <RadioGroupItem value={opt.value} className="mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground">{opt.label}</p>
          {opt.desc && <p className="text-xs text-muted-foreground">{opt.desc}</p>}
        </div>
      </label>
    ))}
  </RadioGroup>
);

const VoiceProfilePage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { profile, loading, saving, save, hasProfile } = useVoiceProfile();
  const [form, setForm] = useState<VoiceProfile>(profile);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading]);

  useEffect(() => {
    setForm(profile);
  }, [profile]);

  const update = (field: keyof VoiceProfile, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const togglePillar = (pillar: string) => {
    const current = form.content_pillars ? form.content_pillars.split(",").filter(Boolean) : [];
    const updated = current.includes(pillar)
      ? current.filter((p) => p !== pillar)
      : [...current, pillar].slice(0, 4);
    update("content_pillars", updated.join(","));
  };

  const selectedPillars = form.content_pillars ? form.content_pillars.split(",").filter(Boolean) : [];

  const toggleRecording = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: "Not supported", description: "Speech recognition isn't available in this browser. Try Chrome.", variant: "destructive" });
      return;
    }

    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;

    let finalTranscript = form.sample_script ? form.sample_script + "\n\n" : "";

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
          update("sample_script", finalTranscript.slice(0, 2000));
        } else {
          interim += transcript;
        }
      }
      update("sample_script", (finalTranscript + interim).slice(0, 2000));
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsRecording(false);
      if (event.error === "not-allowed") {
        toast({ title: "Microphone access denied", description: "Please allow microphone access and try again.", variant: "destructive" });
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
    setIsRecording(true);
    toast({ title: "Recording started", description: "Speak naturally — answer the prompt below." });
  }, [isRecording, form.sample_script, toast]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    save(form);
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
          <Mic className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Your Voice Profile</h1>
          <p className="text-sm text-muted-foreground">
            Teach us how you speak so generated scripts sound like <span className="text-primary font-medium">you</span>
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* About You */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-primary" /> About You
            </CardTitle>
            <CardDescription>Help us personalize your scripts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="funeral_home_name">Funeral Home Name</Label>
              <Input
                id="funeral_home_name"
                placeholder="e.g. Smith Family Funeral Home"
                value={form.funeral_home_name}
                onChange={(e) => update("funeral_home_name", e.target.value)}
                maxLength={100}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="years_experience">Years in the Profession</Label>
                <Input
                  id="years_experience"
                  placeholder="e.g. 15"
                  value={form.years_experience}
                  onChange={(e) => update("years_experience", e.target.value)}
                  maxLength={20}
                />
              </div>
              <div>
                <Label htmlFor="specialties">Specialties</Label>
                <Input
                  id="specialties"
                  placeholder="e.g. Cremation, Celebration of Life"
                  value={form.specialties}
                  onChange={(e) => update("specialties", e.target.value)}
                  maxLength={200}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Origin Story */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Heart className="h-4 w-4 text-primary" /> Your Origin Story
            </CardTitle>
            <CardDescription>Why did you get into funeral service? This gives your scripts authentic backstory.</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="e.g. I'm a 3rd generation funeral director. My grandfather started this home in 1962, and I grew up knowing this was my calling. I got into this work because I saw how much it meant to families during their hardest days."
              value={form.origin_story}
              onChange={(e) => update("origin_story", e.target.value)}
              maxLength={500}
              className="min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground mt-1">{form.origin_story.length}/500 characters</p>
          </CardContent>
        </Card>

        {/* Signature Opening */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">How do you typically open your videos?</CardTitle>
            <CardDescription>Your go-to greeting or opening line</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              placeholder='e.g. "Hey friends, it\'s Mike from Smith Funeral Home…" or "Listen up, I need to tell you something…"'
              value={form.signature_opening}
              onChange={(e) => update("signature_opening", e.target.value)}
              maxLength={150}
            />
            <p className="text-xs text-muted-foreground mt-1">Leave blank to let the AI craft hooks for each topic</p>
          </CardContent>
        </Card>

        {/* Content Pillars */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" /> Your Content Pillars
            </CardTitle>
            <CardDescription>Pick up to 4 topics you focus on most — scripts will lean into these</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {contentPillarOptions.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors text-sm ${
                    selectedPillars.includes(opt.value)
                      ? "border-primary bg-primary/5 font-medium"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <Checkbox
                    checked={selectedPillars.includes(opt.value)}
                    onCheckedChange={() => togglePillar(opt.value)}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">{selectedPillars.length}/4 selected</p>
          </CardContent>
        </Card>

        {/* Target Audience Age */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Who are you primarily speaking to?</CardTitle>
            <CardDescription>This adjusts language, references, and energy level</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioCard options={targetAudienceOptions} value={form.target_audience_age} onChange={(v) => update("target_audience_age", v)} />
          </CardContent>
        </Card>

        {/* Video Style */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Video className="h-4 w-4 text-primary" /> What's your preferred video style?
            </CardTitle>
            <CardDescription>This shapes how scripts are structured</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioCard options={videoStyleOptions} value={form.video_style} onChange={(v) => update("video_style", v)} />
          </CardContent>
        </Card>

        {/* Tone */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">How would you describe your on-camera personality?</CardTitle>
            <CardDescription>This shapes the overall feel of your scripts</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioCard options={toneOptions} value={form.tone_descriptor} onChange={(v) => update("tone_descriptor", v)} />
          </CardContent>
        </Card>

        {/* Vocabulary */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">What kind of language do you prefer?</CardTitle>
            <CardDescription>Are you talking to families or fellow funeral professionals?</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioCard options={vocabOptions} value={form.vocabulary_level} onChange={(v) => update("vocabulary_level", v)} />
          </CardContent>
        </Card>

        {/* Audience Address */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">How do you address your audience?</CardTitle>
            <CardDescription>What feels natural when you're speaking to camera?</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioCard options={audienceOptions} value={form.audience_address} onChange={(v) => update("audience_address", v)} grid />
          </CardContent>
        </Card>

        {/* Pacing */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">How do you naturally speak?</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioCard options={pacingOptions} value={form.pacing_style} onChange={(v) => update("pacing_style", v)} />
          </CardContent>
        </Card>

        {/* Humor */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">How comfortable are you with humor in your content?</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioCard options={humorOptions} value={form.humor_comfort} onChange={(v) => update("humor_comfort", v)} />
          </CardContent>
        </Card>

        {/* Personal Anecdote Style */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Do you share personal stories in your content?</CardTitle>
            <CardDescription>Controls how much vulnerability and personal narrative the AI includes</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioCard options={anecdoteOptions} value={form.anecdote_style} onChange={(v) => update("anecdote_style", v)} />
          </CardContent>
        </Card>

        {/* Faith / Cultural Lens */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" /> Faith & Cultural Lens
            </CardTitle>
            <CardDescription>Helps the AI match (or avoid) religious references</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioCard options={faithLensOptions} value={form.faith_lens} onChange={(v) => update("faith_lens", v)} />
          </CardContent>
        </Card>

        {/* CTA Style */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">How do you like to end your videos?</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioCard options={ctaOptions} value={form.cta_style} onChange={(v) => update("cta_style", v)} />
          </CardContent>
        </Card>

        {/* Taboo Topics */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Any topics you want the AI to AVOID?</CardTitle>
            <CardDescription>List anything off-limits — the AI will never include these in your scripts</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="e.g. Never mention embalming details, avoid politics, don't reference specific religions"
              value={form.taboo_topics}
              onChange={(e) => update("taboo_topics", e.target.value)}
              maxLength={300}
              className="min-h-[80px]"
            />
            <p className="text-xs text-muted-foreground mt-1">{form.taboo_topics.length}/300 characters</p>
          </CardContent>
        </Card>

        {/* Catchphrases */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Do you have any go-to phrases or sayings?</CardTitle>
            <CardDescription>Things you naturally say on camera that feel like "you"</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder={`e.g.\n"Here's what most people don't realize…"\n"Let me walk you through this…"\n"At the end of the day, it's about honoring their story"`}
              value={form.catchphrases}
              onChange={(e) => update("catchphrases", e.target.value)}
              maxLength={500}
              className="min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground mt-1">{form.catchphrases.length}/500 characters</p>
          </CardContent>
        </Card>

        {/* Sample Script */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Paste a script or record yourself speaking</CardTitle>
            <CardDescription>This is the most powerful way to teach us your voice — type, paste, or hit record and answer the prompt below</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <p className="text-xs font-medium text-primary mb-1">🎤 Voice Prompt</p>
              <p className="text-sm text-foreground italic">
                "Here are 3 things I wish every consumer knew about preplanning."
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Hit record, speak naturally for 30–60 seconds, then stop. We'll transcribe it for you.
              </p>
              <Button
                type="button"
                variant={isRecording ? "destructive" : "outline"}
                size="sm"
                className="mt-3 gap-2"
                onClick={toggleRecording}
              >
                {isRecording ? (
                  <>
                    <MicOff className="h-4 w-4" />
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive-foreground opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive-foreground" />
                    </span>
                    Stop Recording
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4" />
                    Start Recording
                  </>
                )}
              </Button>
            </div>
            <Textarea
              placeholder="Paste any script, caption, or transcript you've written — or use the record button above to speak your answer..."
              value={form.sample_script}
              onChange={(e) => update("sample_script", e.target.value)}
              maxLength={2000}
              className="min-h-[140px]"
            />
            <p className="text-xs text-muted-foreground">{form.sample_script.length}/2000 characters</p>
          </CardContent>
        </Card>

        <Button type="submit" disabled={saving} className="w-full gap-2 h-12 text-base font-semibold">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {hasProfile ? "Update Voice Profile" : "Save Voice Profile"}
        </Button>
      </form>
    </div>
  );
};

export default VoiceProfilePage;
