import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Skull, TrendingUp, Video, Hash, ArrowRight, BarChart3, Zap, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: TrendingUp,
    title: "Google Trends Tracking",
    description: "Monitor real-time funeral-related search trends with volume data and sparkline charts.",
  },
  {
    icon: BarChart3,
    title: "Reddit Sentiment",
    description: "Track Reddit discussions with sentiment analysis, upvotes, and engagement metrics.",
  },
  {
    icon: Video,
    title: "AI Video Ideas",
    description: "Generate short-form video content ideas powered by AI, based on trending topics.",
  },
  {
    icon: Hash,
    title: "Hashtag Intelligence",
    description: "TikTok and Instagram hashtag tracking with growth rates and category analysis.",
  },
  {
    icon: Globe,
    title: "Keyword Watchlist",
    description: "Save keywords to your personal watchlist and get notified on volume spikes.",
  },
  {
    icon: Zap,
    title: "Script Generation",
    description: "One-click AI script generation for any video idea - ready to record or customize for your funeral home.",
  },
];

const stats = [
  { value: "24h", label: "Data freshness" },
  { value: "50+", label: "Keywords tracked" },
  { value: "AI", label: "Powered insights" },
  { value: "Free", label: "To get started" },
];

const Landing = () => {
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
            <Link to="/auth">
              <Button variant="ghost" size="sm" className="text-muted-foreground text-xs">
                Sign In
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button size="sm" className="text-xs font-semibold gap-1">
                Open Dashboard <ArrowRight className="h-3.5 w-3.5" />
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
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-tertiary/30 bg-tertiary/5 text-tertiary text-xs font-medium mb-6">
              <Zap className="h-3 w-3" />
              AI-Powered Funeral Profession Intelligence
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-foreground leading-tight mb-6">
              Track funeral trends
              <br />
              <span className="text-gradient-primary">before they peak</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto leading-relaxed">
              Real-time search trends. Social listening from Reddit. AI-powered video ideas. Customizable scroll-stopping scripts. Hashtag intelligence - all in one dashboard for the funeral profession.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link to="/dashboard">
                <Button size="lg" className="font-semibold gap-2 px-6 bg-tertiary text-tertiary-foreground hover:bg-tertiary/90">
                  Explore Dashboard <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button variant="outline" size="lg" className="font-semibold px-6 border-border text-muted-foreground hover:text-foreground">
                  Create Account
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto"
          >
            {stats.map((stat) => (
              <div key={stat.label} className="text-center p-4 rounded-xl border border-border bg-card/50">
                <p className="text-2xl font-display font-bold text-primary">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-display font-bold text-foreground mb-3">
              Everything you need to stay ahead
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              A comprehensive toolkit for funeral profession content creators.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="section-panel hover:border-tertiary/30 transition-colors group"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-4.5 w-4.5 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
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
            className="section-panel text-center py-12 px-6 glow-primary"
          >
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-3">
              Ready to track what matters?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Start exploring trends, generating content ideas, and tracking hashtags - completely free.
            </p>
            <Link to="/dashboard">
              <Button size="lg" className="font-semibold gap-2 px-8 bg-tertiary text-tertiary-foreground hover:bg-tertiary/90">
                Get Started <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
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
            © 2026 FuneralTrends. AI-powered funeral profession intelligence. · Powered by DISRUPT Media
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
