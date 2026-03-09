import { Link, useLocation, useNavigate } from "react-router-dom";
import { Skull, BarChart3, Video, Hash, LogIn, LogOut, Bookmark, Mic, ArrowRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import ThemeToggle from "@/components/ThemeToggle";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { to: "/video-ideas", label: "Video Ideas", icon: Video },
  { to: "/hashtags", label: "Hashtags", icon: Hash },
  { to: "/saved", label: "Saved", icon: Bookmark },
];

const SiteLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Sticky Nav */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-2 group">
            <Skull className="h-5 w-5 text-primary" />
            <div>
              <span className="font-display font-bold text-foreground text-lg tracking-tight">
                Funeral<span className="text-primary">Trends</span>
              </span>
              <p className="text-[9px] text-muted-foreground leading-none -mt-0.5">powered by DISRUPT Media</p>
            </div>
          </Link>

          <nav className="hidden sm:flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon }) => {
              const isActive = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-accent text-tertiary"
                      : "text-muted-foreground hover:text-tertiary hover:bg-accent/50"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {loading ? null : user ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground hidden sm:inline">{user.email}</span>
                <Button variant="ghost" size="sm" onClick={() => navigate("/voice-profile")} className="gap-1 text-xs h-8">
                  <Mic className="h-3.5 w-3.5" /> Voice
                </Button>
                <Button variant="ghost" size="sm" onClick={signOut} className="gap-1 text-xs h-8">
                  <LogOut className="h-3.5 w-3.5" /> Sign Out
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => navigate("/auth")} className="gap-1 text-xs h-8 border-primary/30 text-primary hover:bg-primary/10">
                <LogIn className="h-3.5 w-3.5" /> Sign In
              </Button>
            )}
          </div>
        </div>

        {/* Mobile nav */}
        <div className="sm:hidden border-t border-border flex">
          {navItems.map(({ to, label, icon: Icon }) => {
            const isActive = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex-1 flex items-center justify-center gap-1 py-2 text-xs font-medium transition-colors ${
                  isActive ? "text-tertiary bg-accent" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            );
          })}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">{children}</main>

      {/* CTA Banner */}
      <section className="border-t border-border/50 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center">
          <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground mb-3">
            Ready for a custom social media strategy and plan?
          </h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Let DISRUPT Media build a personalized content strategy tailored to your funeral home.
          </p>
          <a
            href="https://disruptmedia.lpages.co/the-disrupt-system/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="lg" className="font-semibold gap-2 px-6 sm:px-8 bg-tertiary text-tertiary-foreground hover:bg-tertiary/90">
              Schedule a Demo with DISRUPT Media <ArrowRight className="h-4 w-4" />
            </Button>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Skull className="h-4 w-4 text-primary" />
            <div>
              <span className="font-display font-semibold text-sm text-foreground">
                Funeral<span className="text-primary">Trends</span>
              </span>
              <p className="text-[8px] text-muted-foreground leading-none">powered by DISRUPT Media</p>
            </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Real-time funeral profession insights · Data refreshes daily
            </p>
            <div className="flex items-center gap-4">
              {navItems.map(({ to, label }) => (
                <Link key={to} to={to} className="text-xs text-muted-foreground hover:text-tertiary transition-colors">
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SiteLayout;
