import { Heart, Clock } from "lucide-react";
import { useHeartRegeneration } from "@/hooks/useHeartRegeneration";
import { cn } from "@/lib/utils";

interface HeartTimerProps {
  currentHearts: number;
  regenStartedAt: string | null;
  maxHearts?: number;
}

export function HeartTimer({ currentHearts, regenStartedAt, maxHearts = 5 }: HeartTimerProps) {
  const { formattedTime, isRegenerating } = useHeartRegeneration(currentHearts, regenStartedAt);

  if (!isRegenerating) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {Array.from({ length: maxHearts }).map((_, i) => (
            <Heart
              key={i}
              className={cn(
                "w-5 h-5 transition-all",
                i < currentHearts ? "text-destructive fill-destructive" : "text-muted-foreground"
              )}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-2 bg-destructive/10 rounded-xl">
      <div className="flex items-center gap-1">
        {Array.from({ length: maxHearts }).map((_, i) => (
          <Heart
            key={i}
            className={cn(
              "w-5 h-5 transition-all",
              i < currentHearts ? "text-destructive fill-destructive" : "text-muted-foreground"
            )}
          />
        ))}
      </div>
      <div className="flex items-center gap-1.5 text-sm">
        <Clock className="w-4 h-4 text-muted-foreground" />
        <span className="font-mono font-medium text-foreground">{formattedTime}</span>
      </div>
    </div>
  );
}
