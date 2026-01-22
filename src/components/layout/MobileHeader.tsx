import { Link, useLocation } from "react-router-dom";
import { 
  Home, 
  Trophy, 
  Target, 
  ShoppingBag, 
  User,
  Code2,
  Heart,
  Flame,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, label: "Learn", path: "/learn" },
  { icon: Trophy, label: "Ranks", path: "/leaderboard" },
  { icon: Target, label: "Quests", path: "/quests" },
  { icon: ShoppingBag, label: "Shop", path: "/shop" },
  { icon: User, label: "Profile", path: "/profile" },
];

export function MobileHeader() {
  const location = useLocation();

  return (
    <>
      {/* Top Header - Stats */}
      <header className="fixed top-0 left-0 right-0 z-50 lg:hidden bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
              <Code2 className="w-5 h-5 text-primary-foreground" />
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-accent font-bold text-sm">
              <Flame className="w-5 h-5" />
              <span>5</span>
            </div>
            <div className="flex items-center gap-1 text-golden font-bold text-sm">
              <Zap className="w-5 h-5" />
              <span>1,250</span>
            </div>
            <div className="flex items-center gap-1 text-destructive font-bold text-sm">
              <Heart className="w-5 h-5 fill-current" />
              <span>5</span>
            </div>
          </div>
        </div>
      </header>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-card border-t border-border">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className={cn("w-6 h-6", isActive && "fill-primary/20")} />
                <span className="text-xs font-semibold">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
