import { Link, useLocation } from "react-router-dom";
import { 
  BookOpen, 
  Trophy, 
  Target, 
  ShoppingBag, 
  User,
  Home,
  Code2
} from "lucide-react";
import { cn } from "@/lib/utils";
import mascot from "@/assets/mascot.png";

const navItems = [
  { icon: Home, label: "Learn", path: "/learn" },
  { icon: Trophy, label: "Leaderboard", path: "/leaderboard" },
  { icon: Target, label: "Quests", path: "/quests" },
  { icon: ShoppingBag, label: "Shop", path: "/shop" },
  { icon: User, label: "Profile", path: "/profile" },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 z-50 flex h-full w-[256px] flex-col border-r border-sidebar-border bg-sidebar lg:flex hidden">
      {/* Logo */}
      <Link 
        to="/" 
        className="flex items-center gap-3 px-6 py-6 border-b border-sidebar-border"
      >
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-sidebar-primary">
          <Code2 className="w-6 h-6 text-sidebar-primary-foreground" />
        </div>
        <span className="text-xl font-extrabold text-sidebar-foreground">
          CodeOwl
        </span>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-4 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-200",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Mascot */}
      <div className="px-4 py-6 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-sidebar-accent">
          <img 
            src={mascot} 
            alt="CodeOwl mascot" 
            className="w-12 h-12 object-contain"
          />
          <div>
            <p className="text-sm font-bold text-sidebar-foreground">Keep going!</p>
            <p className="text-xs text-sidebar-foreground/70">5 day streak 🔥</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
