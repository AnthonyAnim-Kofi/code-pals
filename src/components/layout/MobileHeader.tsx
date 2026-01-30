import { Link, useLocation } from "react-router-dom";
import { 
  Home, 
  Trophy, 
  Target, 
  ShoppingBag,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserProfile } from "@/hooks/useUserProgress";
import { HeartTimerPopover } from "@/components/HeartTimerPopover";
import { StreakPopover } from "@/components/StreakPopover";
import { MobileMoreMenu } from "./MobileMoreMenu";

const navItems = [
  { icon: Home, label: "Learn", path: "/learn" },
  { icon: Trophy, label: "Ranks", path: "/leaderboard" },
  { icon: Target, label: "Quests", path: "/quests" },
  { icon: ShoppingBag, label: "Shop", path: "/shop" },
];

export function MobileHeader() {
  const location = useLocation();
  const { data: profile } = useUserProfile();

  const hearts = profile?.hearts ?? 5;
  const streak = profile?.streak_count ?? 0;
  const gems = profile?.gems ?? 0;

  return (
    <>
      {/* Top Header - Stats */}
      <header className="fixed top-0 left-0 right-0 z-50 lg:hidden bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <Link to="/profile" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-bold text-primary">
                  {profile?.display_name?.[0] || "U"}
                </span>
              )}
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <StreakPopover streak={streak} />
            <div className="flex items-center gap-1 text-golden font-bold text-sm">
              <Zap className="w-5 h-5" />
              <span>{gems.toLocaleString()}</span>
            </div>
            <HeartTimerPopover hearts={hearts} compact />
          </div>
        </div>
      </header>

      {/* Bottom Navigation - Fixed and always visible */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-card border-t border-border" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
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
          <MobileMoreMenu />
        </div>
      </nav>
    </>
  );
}
