import { useState } from "react";
import { Flame, X, Snowflake } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProgress";
import { StreakCalendar } from "@/components/StreakCalendar";
import { cn } from "@/lib/utils";

interface StreakPopoverProps {
  streak: number;
  className?: string;
}

export function StreakPopover({ streak, className }: StreakPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: profile } = useUserProfile();

  return (
    <div className={cn("relative", className)}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-accent font-bold text-sm"
      >
        <Flame className="w-5 h-5" />
        <span>{streak}</span>
      </button>
      
      {/* Popover */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          
          {/* Content */}
          <div className="fixed inset-x-4 top-16 z-50 max-w-sm mx-auto bg-card rounded-2xl border border-border shadow-xl animate-scale-in overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <Flame className="w-5 h-5 text-accent" />
                Your Streak
              </h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-muted rounded-lg"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            
            <div className="p-4 max-h-[70vh] overflow-y-auto">
              <StreakCalendar
                currentStreak={profile?.streak_count || 0}
                lastPracticeDate={profile?.last_practice_date || null}
                streakFreezeCount={profile?.streak_freeze_count || 0}
                lastStreakFreezeUsed={profile?.last_streak_freeze_used || null}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
