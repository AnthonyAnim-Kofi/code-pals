import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  BookOpen, 
  Trophy, 
  Target, 
  ShoppingBag, 
  User,
  Home,
  Code2,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import mascot from "@/assets/mascot.png";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const navItems = [
  { icon: Home, label: "Learn", path: "/learn" },
  { icon: Trophy, label: "Leaderboard", path: "/leaderboard" },
  { icon: Target, label: "Quests", path: "/quests" },
  { icon: ShoppingBag, label: "Shop", path: "/shop" },
  { icon: User, label: "Profile", path: "/profile" },
];

import { Users, RotateCcw, Award, Settings, Globe, History } from "lucide-react";

const moreItems = [
  { icon: Globe, label: "Languages", path: "/languages" },
  { icon: Users, label: "Social", path: "/social" },
  { icon: Award, label: "Achievements", path: "/achievements" },
  { icon: RotateCcw, label: "Practice", path: "/practice" },
  { icon: History, label: "League History", path: "/league-history" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <aside className="fixed left-0 top-0 z-50 flex h-full w-[256px] flex-col border-r border-sidebar-border bg-sidebar lg:flex hidden overflow-hidden">
      {/* Logo */}
      <Link 
        to="/" 
        className="flex items-center gap-3 px-6 py-6 border-b border-sidebar-border shrink-0"
      >
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-sidebar-primary">
          <Code2 className="w-6 h-6 text-sidebar-primary-foreground" />
        </div>
        <span className="text-xl font-extrabold text-sidebar-foreground">
          CodeOwl
        </span>
      </Link>

      {/* Navigation - Scrollable */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
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
        
        <div className="border-t border-sidebar-border my-4" />
        
        {moreItems.map((item) => {
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
        
        <div className="border-t border-sidebar-border my-4" />
        
        <button
          onClick={() => setShowLogoutDialog(true)}
          className={cn(
            "flex items-center gap-4 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-200 w-full text-left",
            "text-sidebar-foreground hover:bg-sidebar-accent hover:text-destructive"
          )}
        >
          <LogOut className="w-5 h-5" />
          Log Out
        </button>
      </nav>

      {/* Mascot */}
      <div className="px-4 py-6 border-t border-sidebar-border shrink-0">
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

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to log out? Your progress will be saved, but you'll need to log in again to continue learning.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Log Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  );
}
