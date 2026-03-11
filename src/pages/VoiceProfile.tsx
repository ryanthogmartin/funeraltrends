import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useVoiceProfile, VoiceProfile } from "@/hooks/useVoiceProfile";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Mic, MicOff, Save, User } from "lucide-react";
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

const VoiceProfilePage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { profile, loading, saving, save, hasProfile } = useVoiceProfile();
  const [form, setForm] = useState<VoiceProfile>(profile);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading]);

  useEffect(() => {
    setForm(profile);
  }, [profile]);

  const update = (field: keyof VoiceProfile, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

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

        {/* Tone */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">How would you describe your on-camera personality?</CardTitle>
            <CardDescription>This shapes the overall feel of your scripts</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={form.tone_descriptor} onValueChange={(v) => update("tone_descriptor", v)} className="space-y-2">
              {toneOptions.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    form.tone_descriptor === opt.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <RadioGroupItem value={opt.value} className="mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Vocabulary */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">What kind of language do you prefer?</CardTitle>
            <CardDescription>Are you talking to families or fellow funeral professionals?</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={form.vocabulary_level} onValueChange={(v) => update("vocabulary_level", v)} className="space-y-2">
              {vocabOptions.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    form.vocabulary_level === opt.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <RadioGroupItem value={opt.value} className="mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Audience Address */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">How do you address your audience?</CardTitle>
            <CardDescription>What feels natural when you're speaking to camera?</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={form.audience_address} onValueChange={(v) => update("audience_address", v)} className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {audienceOptions.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors text-sm ${
                    form.audience_address === opt.value
                      ? "border-primary bg-primary/5 font-medium"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <RadioGroupItem value={opt.value} />
                  {opt.label}
                </label>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Pacing */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">How do you naturally speak?</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={form.pacing_style} onValueChange={(v) => update("pacing_style", v)} className="space-y-2">
              {pacingOptions.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    form.pacing_style === opt.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <RadioGroupItem value={opt.value} className="mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Humor */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">How comfortable are you with humor in your content?</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={form.humor_comfort} onValueChange={(v) => update("humor_comfort", v)} className="space-y-2">
              {humorOptions.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    form.humor_comfort === opt.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <RadioGroupItem value={opt.value} className="mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        {/* CTA Style */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">How do you like to end your videos?</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={form.cta_style} onValueChange={(v) => update("cta_style", v)} className="space-y-2">
              {ctaOptions.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    form.cta_style === opt.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <RadioGroupItem value={opt.value} className="mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </RadioGroup>
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
            <CardTitle className="text-base">Paste a script or transcript that sounds like you</CardTitle>
            <CardDescription>This is the most powerful way to teach us your voice — even a caption or short clip transcript works</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Paste any script, caption, or transcript you've written that sounds like you speaking on camera..."
              value={form.sample_script}
              onChange={(e) => update("sample_script", e.target.value)}
              maxLength={2000}
              className="min-h-[140px]"
            />
            <p className="text-xs text-muted-foreground mt-1">{form.sample_script.length}/2000 characters</p>
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
