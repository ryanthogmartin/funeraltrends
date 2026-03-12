import { Link, useLocation, useNavigate } from "react-router-dom";
import { Skull, BarChart3, Video, Hash, LogIn, LogOut, Bookmark, Mic, ArrowRight, MapPin, ChevronDown, Menu, TrendingUp, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import ThemeToggle from "@/components/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";

const researchItems = [
  { to: "/dashboard", label: "Dashboard", icon: BarChart3, desc: "Trends overview & stats" },
  { to: "/local-trends", label: "Local Trends", icon: MapPin, desc: "City & state keyword research" },
];

const contentItems = [
  { to: "/video-ideas", label: "Video Ideas", icon: Video, desc: "AI-generated video topics & scripts" },
  { to: "/hashtags", label: "Hashtags", icon: Hash, desc: "TikTok & Instagram tracking" },
];

const libraryItems = [
  { to: "/saved", label: "Saved Ideas", icon: Bookmark, desc: "Your saved ideas & scripts" },
  { to: "/voice-profile", label: "Custom Voice Persona", icon: Mic, desc: "Custom tone & branding" },
];

const allNavItems = [...researchItems, ...contentItems, ...libraryItems];

const SiteLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const NavDropdown = ({ label, icon: Icon, items }: { label: string; icon: React.ElementType; items: typeof researchItems }) => {
    const groupActive = items.some((item) => isActive(item.to));
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors outline-none ${
              groupActive
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
            <ChevronDown className="h-3 w-3 opacity-60" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {items.map(({ to, label: itemLabel, icon: ItemIcon, desc }) => (
            <DropdownMenuItem
              key={to}
              onClick={() => navigate(to)}
              className={`flex items-start gap-3 p-3 cursor-pointer ${
                isActive(to) ? "bg-accent text-accent-foreground" : ""
              }`}
            >
              <ItemIcon className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{itemLabel}</span>
                <span className="text-xs text-muted-foreground">{desc}</span>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Sticky Nav */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <Skull className="h-5 w-5 text-primary" />
            <div>
              <span className="font-display font-bold text-foreground text-lg tracking-tight">
                Funeral<span className="text-primary">Trends</span>
              </span>
              <p className="text-[9px] text-muted-foreground leading-none -mt-0.5">powered by DISRUPT Media</p>
            </div>
          </Link>

          {/* Desktop nav with dropdowns */}
          <nav className="hidden md:flex items-center gap-1">
            <NavDropdown label="Research" icon={TrendingUp} items={researchItems} />
            <NavDropdown label="Content" icon={Video} items={contentItems} />
            <NavDropdown label="Library" icon={Bookmark} items={libraryItems} />
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />

            {/* Mobile hamburger */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden h-8 w-8 p-0">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 p-0">
                <SheetHeader className="p-4 border-b border-border">
                  <SheetTitle className="flex items-center gap-2 text-left">
                    <Skull className="h-4 w-4 text-primary" />
                    <span className="font-display font-bold text-foreground">
                      Funeral<span className="text-primary">Trends</span>
                    </span>
                  </SheetTitle>
                </SheetHeader>
                <div className="py-2">
                  <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Research</p>
                  {researchItems.map(({ to, label, icon: Icon }) => (
                    <Link
                      key={to}
                      to={to}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                        isActive(to) ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                      }`}
                    >
                      <Icon className="h-4 w-4 text-primary" />
                      {label}
                    </Link>
                  ))}

                  <p className="px-4 py-2 mt-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Content</p>
                  {contentItems.map(({ to, label, icon: Icon }) => (
                    <Link
                      key={to}
                      to={to}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                        isActive(to) ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                      }`}
                    >
                      <Icon className="h-4 w-4 text-primary" />
                      {label}
                    </Link>
                  ))}

                  <p className="px-4 py-2 mt-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Library</p>
                  {libraryItems.map(({ to, label, icon: Icon }) => (
                    <Link
                      key={to}
                      to={to}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                        isActive(to) ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                      }`}
                    >
                      <Icon className="h-4 w-4 text-primary" />
                      {label}
                    </Link>
                  ))}

                  {user && (
                    <>
                      <div className="border-t border-border my-2" />
                      <button
                        onClick={() => { signOut(); setMobileOpen(false); }}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 w-full"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            {/* Auth controls (desktop) */}
            {loading ? null : user ? (
              <div className="hidden md:flex items-center gap-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-8">
                      <Settings className="h-3.5 w-3.5" />
                      Account
                      <ChevronDown className="h-3 w-3 opacity-60" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuLabel className="text-xs font-normal text-muted-foreground truncate">
                      {user.email}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/voice-profile")} className="gap-2 cursor-pointer">
                      <Mic className="h-3.5 w-3.5 text-primary" />
                      Voice Profile
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut} className="gap-2 cursor-pointer text-destructive">
                      <LogOut className="h-3.5 w-3.5" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => navigate("/auth")} className="gap-1 text-xs h-8 border-primary/30 text-primary hover:bg-primary/10">
                <LogIn className="h-3.5 w-3.5" /> Sign In
              </Button>
            )}
          </div>
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
              {allNavItems.map(({ to, label }) => (
                <Link key={to} to={to} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
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
