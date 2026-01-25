import { Snowflake } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakFreezeIndicatorProps {
  freezeCount: number;
  lastUsed: string | null;
  className?: string;
}

export function StreakFreezeIndicator({ 
  freezeCount, 
  lastUsed,
  className 
}: StreakFreezeIndicatorProps) {
  const formatLastUsed = (date: string | null) => {
    if (!date) return "Never used";
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Used today";
    if (diffDays === 1) return "Used yesterday";
    if (diffDays < 7) return `Used ${diffDays} days ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className={cn("p-4 bg-card rounded-2xl border border-border card-elevated", className)}>
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-secondary/10 text-secondary">
          <Snowflake className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-2xl font-extrabold text-foreground">{freezeCount}</p>
            <div className="flex gap-0.5">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-2 h-2 rounded-full",
                    i < freezeCount ? "bg-secondary" : "bg-muted"
                  )}
                />
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Streak Freezes</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">{formatLastUsed(lastUsed)}</p>
        </div>
      </div>
    </div>
  );
}
