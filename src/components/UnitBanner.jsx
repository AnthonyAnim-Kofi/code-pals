import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";
import { UnitNotes } from "@/components/UnitNotes";
import { UnitProgressIndicator } from "@/components/UnitProgressIndicator";

const colorClasses = {
    green: "from-primary to-[hsl(120,70%,35%)]",
    blue: "from-secondary to-[hsl(210,100%,45%)]",
    orange: "from-accent to-[hsl(20,100%,45%)]",
    purple: "from-premium to-[hsl(280,80%,50%)]"
};

export function UnitBanner({ 
  title, description, color, isActive = false, 
  currentLessonId, unitId, completedLessons = 0, 
  totalLessons = 0, canJump = false, onJump = null,
  isLocked = false
}) {
    return <div className={cn("relative overflow-hidden rounded-xl sm:rounded-2xl p-4 sm:p-6 bg-gradient-to-r", colorClasses[color])}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 relative z-20">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
            <h2 className="text-base sm:text-xl font-extrabold text-white truncate">{title}</h2>
            {totalLessons > 0 && <UnitProgressIndicator completedLessons={completedLessons} totalLessons={totalLessons}/>}
          </div>
          <p className="text-xs sm:text-sm text-white/80 line-clamp-2 sm:line-clamp-none">{description}</p>
        </div>
        
        {/* Actions Button Group - z-20 for clickability */}
        <div className="flex flex-nowrap items-center gap-2 shrink-0">
          {unitId && <UnitNotes unitId={unitId} isAccessible={isActive || (completedLessons > 0)}/>}
          
          {isActive && currentLessonId && (
            <Button variant="golden" size="sm" className="shadow-none shrink-0" asChild>
              <Link to={`/lesson/${String(currentLessonId)}`}>
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5"/>
                <span className="ml-1 sm:ml-2">Continue</span>
              </Link>
            </Button>
          )}

          {isLocked && canJump && onJump && (
            <Button 
                variant="secondary" 
                size="sm" 
                className="bg-white/20 hover:bg-white/30 text-white border-none shadow-none shrink-0"
                onClick={() => onJump(unitId)}
            >
              <Rocket className="w-4 h-4 sm:w-5 sm:h-5"/>
              <span className="ml-1 sm:ml-2">Jump Here</span>
            </Button>
          )}
        </div>
      </div>

      {/* Decorative elements - moved slightly and kept background */}
      <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/5 rounded-full z-10 pointer-events-none"/>
      <div className="absolute -right-4 -top-4 w-16 h-16 bg-white/5 rounded-full z-10 pointer-events-none"/>
    </div>;
}
