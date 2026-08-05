import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Skull, Video, ArrowRight, Zap, Sparkles, Lock, Bookmark, Mic, ListChecks, Split, Clapperboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import ThemeToggle from "@/components/ThemeToggle";

interface FeatureItem {
  icon: any;
  title: string;
  description: string;
  link: string;
  requiresAuth: boolean;
}

const features: FeatureItem[] = [
{
  icon: ListChecks,
  title: "Curated Topic Library",
  description: "Hand-picked topics for funeral homes, cemeteries, crematories, and pet cremation — or bring the questions families actually ask you.",
  link: "/video-ideas",
  requiresAuth: false
},
{
  icon: Video,
  title: "8 Video Ideas, Instantly",
  description: "Pick a business type, topic, angle, platform, and tone — get eight scroll-stopping video concepts built for the funeral profession.",
  link: "/video-ideas",
  requiresAuth: true
},
{
  icon: Clapperboard,
  title: "45-Second Scripts",
  description: "Every idea turns into a full script — hook, body with pause cues, and a clear call to action, with word count and runtime.",
  link: "/video-ideas",
  requiresAuth: true
},
{
  icon: Split,
  title: "Three Hook Variants",
  description: "Each script comes with alternate hooks so you can test the opening line that stops the scroll for your community.",
  link: "/video-ideas",
  requiresAuth: true
},
{
  icon: Mic,
  title: "Custom Voice Persona",
  description: "Train the engine on your tone, phrasing, and brand so every script sounds like you said it — not like AI wrote it.",
  link: "/voice-profile",
  requiresAuth: true
},
{
  icon: Bookmark,
  title: "Saved Script Library",
  description: "Keep your best ideas and finished scripts in one place, ready to copy, export, or record whenever you're in front of the camera.",
  link: "/saved",
  requiresAuth: true
}];

const stats = [
{ value: "8", label: "Ideas per run" },
{ value: "45s", label: "Script length" },
{ value: "3", label: "Hook variants" },
{ value: "Free", label: "To get started" }];

const steps = [
{ n: "01", title: "Pick your business", desc: "Funeral home, cemetery, crematory, or pet cremation — the engine adapts its insider knowledge to you." },
{ n: "02", title: "Choose a topic & angle", desc: "Curated keyword, a question families ask, or your own topic — then demystify, price, legal, pre-planning, or myth bust." },
{ n: "03", title: "Generate & record", desc: "Get eight ideas, open any one into a full script with hooks and pause cues, then save it and hit record." }];


const Landing = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const isAuthenticated = authLoading || !!user;

  const handleFeatureClick = (feature: FeatureItem) => {
    if (feature.requiresAuth && !isAuthenticated) {
      navigate("/auth");
    } else {
      navigate(feature.link);
    }
  };

  const handleGenerateIdeas = () => {
    if (!isAuthenticated) {
      navigate("/auth");
    } else {
      navigate("/video-ideas");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <Skull className="h-5 w-5 text-primary" />
            <div>
              <span className="font-display font-bold text-foreground text-lg tracking-tight">
                Funeral<span className="text-primary">Trends</span>
              </span>
              <p className="text-[9px] text-muted-foreground leading-none -mt-0.5">powered by DISRUPT Media</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {!authLoading && !user &&
            <Link to="/auth">
                <Button variant="ghost" size="sm" className="text-muted-foreground text-xs">
                  Sign In
                </Button>
              </Link>
            }
            <Link to="/video-ideas">
              <Button size="sm" className="text-xs font-semibold gap-1">
                Video Content Engine <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(49_100%_48%_/_0.08)_0%,_transparent_60%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center max-w-3xl mx-auto">
            
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-tertiary/30 bg-tertiary/5 text-tertiary text-xs font-medium mb-6">
              <Zap className="h-3 w-3" />
              The Video Content Engine for the Funeral Profession
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-foreground leading-tight mb-6">
              Never wonder what
              <br />
              <span className="text-gradient-primary">to post again</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto leading-relaxed">
              Pick your business type, a topic, and a tone. Get eight video ideas and full 45-second scripts — hook, body, and call to action — written in your voice and ready to record.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link to="/video-ideas">
                <Button size="lg" className="font-semibold gap-2 px-6 bg-tertiary text-tertiary-foreground hover:bg-tertiary/90">
                  Open the Content Engine <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                onClick={handleGenerateIdeas}
                className="font-semibold gap-2 px-6 border-secondary/50 text-secondary hover:bg-secondary/10">
                
                <Sparkles className="h-4 w-4" />
                Generate Video Scripts
                {!isAuthenticated && <Lock className="h-3 w-3 ml-1 text-muted-foreground" />}
              </Button>
              {!authLoading && !user &&
              <Link to="/auth">
                  <Button variant="ghost" size="lg" className="font-semibold px-6 text-muted-foreground hover:text-foreground">
                    Create Account
                  </Button>
                </Link>
              }
            </div>
          </motion.div>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
            
            {stats.map((stat) =>
            <div key={stat.label} className="text-center p-4 rounded-xl border border-border bg-card/50">
                <p className="text-2xl font-display font-bold text-primary">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12">

            <h2 className="text-3xl font-display font-bold text-foreground mb-3">
              From blank page to filmed in minutes
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Three steps, no guesswork, no trend chasing.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {steps.map((step, i) =>
            <motion.div
              key={step.n}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="section-panel">

                <p className="text-xs font-mono text-primary mb-3">{step.n}</p>
                <h3 className="font-display font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12">
            
            <h2 className="text-3xl font-display font-bold text-foreground mb-3">
              Built for one job: better videos
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Everything in the engine exists to get a script in your hands.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, i) => {
              const isLocked = feature.requiresAuth && !isAuthenticated;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.5 }}
                  onClick={() => handleFeatureClick(feature)}
                  className={`section-panel transition-all duration-300 group cursor-pointer relative overflow-hidden ${
                  isLocked ?
                  "hover:border-secondary/50 hover:shadow-[0_0_20px_-5px_hsl(var(--secondary)/0.2)]" :
                  "hover:border-tertiary/30"}`
                  }>
                  
                  {/* Locked overlay gradient on hover */}
                  {isLocked &&
                  <div className="absolute inset-0 bg-gradient-to-t from-secondary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  }

                  <div className="flex items-start justify-between mb-4 relative">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors duration-300 ${
                    isLocked ?
                    "bg-secondary/10 group-hover:bg-secondary/20" :
                    "bg-primary/10"}`
                    }>
                      <feature.icon className={`h-4.5 w-4.5 transition-colors duration-300 ${
                      isLocked ? "text-secondary" : "text-primary"}`
                      } />
                    </div>
                    {isLocked &&
                    <motion.span
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-secondary/30 bg-secondary/10 text-secondary text-[10px] font-medium"
                      whileHover={{ scale: 1.05 }}>
                      
                        <Lock className="h-2.5 w-2.5" />
                        Sign in to unlock
                      </motion.span>
                    }
                  </div>
                  <h3 className={`font-display font-semibold mb-2 transition-colors duration-300 ${
                  isLocked ?
                  "text-foreground group-hover:text-secondary" :
                  "text-foreground group-hover:text-primary"}`
                  }>{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  <div className={`mt-3 flex items-center gap-1 text-xs transition-all duration-300 ${
                  isLocked ?
                  "text-muted-foreground group-hover:text-secondary" :
                  "text-muted-foreground group-hover:text-primary"}`
                  }>
                    {isLocked ?
                    <>
                        <Lock className="h-3 w-3" />
                        <span className="group-hover:hidden">Requires account</span>
                        <span className="hidden group-hover:inline">Sign in to get started</span>
                        <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </> :

                    <>
                        Explore <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                      </>
                    }
                  </div>
                </motion.div>);

            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="section-panel text-center py-12 px-6 glow-primary">
            
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-3">
              Ready to write your next video?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Generate ideas, build scripts, and save your library — completely free to start.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link to="/video-ideas">
                <Button size="lg" className="font-semibold gap-2 px-8 bg-tertiary text-tertiary-foreground hover:bg-tertiary/90">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                onClick={handleGenerateIdeas}
                className="font-semibold gap-2 px-6 border-secondary/50 text-secondary hover:bg-secondary/10">
                
                <Sparkles className="h-4 w-4" />
                Generate Video Scripts
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Skull className="h-4 w-4 text-primary" />
            <div>
              <span className="font-display font-semibold text-sm">
                Funeral<span className="text-primary">Trends</span>
              </span>
              <p className="text-[8px] text-muted-foreground leading-none">powered by DISRUPT Media</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            © 2026 FuneralTrends. AI video scripts for the funeral profession. · Powered by DISRUPT Media
          </p>
        </div>
      </footer>
    </div>);

};

export default Landing;