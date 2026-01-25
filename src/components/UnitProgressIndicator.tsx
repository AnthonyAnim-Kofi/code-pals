import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

interface UnitProgressIndicatorProps {
  completedLessons: number;
  totalLessons: number;
  className?: string;
}

export function UnitProgressIndicator({
  completedLessons,
  totalLessons,
  className,
}: UnitProgressIndicatorProps) {
  const isComplete = completedLessons >= totalLessons && totalLessons > 0;
  const percentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {isComplete ? (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/20 text-white">
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-xs font-bold">Complete</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-white/20 text-white">
          <div className="flex gap-0.5">
            {[...Array(totalLessons)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-colors",
                  i < completedLessons ? "bg-white" : "bg-white/30"
                )}
              />
            ))}
          </div>
          <span className="text-xs font-bold">
            {completedLessons}/{totalLessons}
          </span>
        </div>
      )}
    </div>
  );
}
