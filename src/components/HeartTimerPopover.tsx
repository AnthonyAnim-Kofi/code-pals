import { useState } from "react";
import { Heart, Clock, X } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProgress";
import { useHeartRegeneration } from "@/hooks/useHeartRegeneration";
import { cn } from "@/lib/utils";

interface HeartTimerPopoverProps {
  hearts: number;
  compact?: boolean;
}

export function HeartTimerPopover({ hearts, compact = false }: HeartTimerPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: profile } = useUserProfile();
  const { formattedTime, isRegenerating, timeUntilFull } = useHeartRegeneration(
    hearts, 
    profile?.heart_regeneration_started_at
  );
  
  const maxHearts = 5;
  
  if (compact) {
    return (
      <div className="relative">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 text-destructive font-bold text-sm"
        >
          <Heart className="w-5 h-5 fill-current" />
          <span>{hearts}</span>
          {isRegenerating && (
            <span className="text-xs font-mono text-muted-foreground">
              ({formattedTime})
            </span>
          )}
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
            <div className="absolute top-full right-0 mt-2 z-50 w-64 p-4 bg-card rounded-2xl border border-border shadow-xl animate-scale-in">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-foreground">Hearts</h3>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-muted rounded-lg"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              
              {/* Hearts display */}
              <div className="flex items-center justify-center gap-1 mb-4">
                {Array.from({ length: maxHearts }).map((_, i) => (
                  <Heart
                    key={i}
                    className={cn(
                      "w-8 h-8 transition-all",
                      i < hearts ? "text-destructive fill-destructive" : "text-muted-foreground"
                    )}
                  />
                ))}
              </div>
              
              {/* Timer info */}
              {isRegenerating ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-destructive/10 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Next heart in</span>
                    </div>
                    <span className="font-mono font-bold text-foreground">{formattedTime}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-muted rounded-xl">
                    <span className="text-sm text-muted-foreground">Full hearts in</span>
                    <span className="font-mono font-bold text-foreground">{timeUntilFull}</span>
                  </div>
                  
                  <p className="text-xs text-center text-muted-foreground">
                    Hearts regenerate 1 every 50 minutes
                  </p>
                </div>
              ) : (
                <div className="text-center p-3 bg-primary/10 rounded-xl">
                  <p className="font-semibold text-primary">Hearts are full! 🎉</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ready to learn more
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  }
  
  return (
    <div className="flex items-center gap-1 text-destructive font-bold text-sm">
      <Heart className="w-5 h-5 fill-current" />
      <span>{hearts}</span>
    </div>
  );
}
