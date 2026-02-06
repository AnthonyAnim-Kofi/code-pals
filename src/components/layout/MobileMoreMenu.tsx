/**
 * MobileMoreMenu – Bottom sheet menu for mobile navigation overflow items.
 * Contains links to Languages, Social, Achievements, Practice, and Settings.
 * Includes a logout button with confirmation dialog.
 */
import { Link, useLocation } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  MoreHorizontal,
  Users,
  Award,
  RotateCcw,
  Settings,
  Globe,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { LogoutConfirmDialog } from "@/components/LogoutConfirmDialog";

/** Navigation items shown in the "More" menu */
const moreItems = [
  { icon: Globe, label: "Languages", path: "/languages" },
  { icon: Users, label: "Social", path: "/social" },
  { icon: Award, label: "Achievements", path: "/achievements" },
  { icon: RotateCcw, label: "Practice", path: "/practice" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export function MobileMoreMenu() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  /** Handles confirmed logout – signs out and redirects to landing */
  const handleLogout = async () => {
    await signOut();
    navigate("/");
    setOpen(false);
    setShowLogoutDialog(false);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors text-muted-foreground hover:text-foreground">
            <MoreHorizontal className="w-6 h-6" />
            <span className="text-xs font-semibold">More</span>
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-auto pb-safe">
          <SheetHeader className="pb-4">
            <SheetTitle>More Options</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-3 gap-3 pb-4">
            {moreItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavigate(item.path)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
                    isActive
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-card border-border hover:bg-muted"
                  )}
                >
                  <item.icon className="w-6 h-6" />
                  <span className="text-xs font-semibold">{item.label}</span>
                </button>
              );
            })}
            <button
              onClick={() => {
                setOpen(false);
                setShowLogoutDialog(true);
              }}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-card hover:bg-destructive/10 hover:border-destructive hover:text-destructive transition-all"
            >
              <LogOut className="w-6 h-6" />
              <span className="text-xs font-semibold">Log Out</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Logout confirmation – rendered outside Sheet to avoid z-index issues */}
      <LogoutConfirmDialog
        open={showLogoutDialog}
        onOpenChange={setShowLogoutDialog}
        onConfirm={handleLogout}
      />
    </>
  );
}
