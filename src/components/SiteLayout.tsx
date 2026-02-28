import { Link, useLocation, useNavigate } from "react-router-dom";
import { Skull, BarChart3, Video, Hash, LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { to: "/video-ideas", label: "Video Ideas", icon: Video },
  { to: "/hashtags", label: "Hashtags", icon: Hash },
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
            <span className="font-display font-bold text-foreground text-lg tracking-tight">
              Funeral<span className="text-primary">Trends</span>
            </span>
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
                      ? "bg-accent text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {loading ? null : user ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground hidden sm:inline">{user.email}</span>
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
                  isActive ? "text-primary bg-accent" : "text-muted-foreground"
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

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Skull className="h-4 w-4 text-primary" />
              <span className="font-display font-semibold text-sm text-foreground">
                Funeral<span className="text-primary">Trends</span>
              </span>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Real-time funeral industry insights · Data refreshes daily
            </p>
            <div className="flex items-center gap-4">
              {navItems.map(({ to, label }) => (
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
