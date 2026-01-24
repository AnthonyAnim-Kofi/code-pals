import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { UnitNotes } from "@/components/UnitNotes";

interface UnitBannerProps {
  title: string;
  description: string;
  color: "green" | "blue" | "orange" | "purple";
  isActive?: boolean;
  currentLessonId?: number;
  unitId?: string;
}

const colorClasses = {
  green: "from-primary to-[hsl(120,70%,35%)]",
  blue: "from-secondary to-[hsl(210,100%,45%)]",
  orange: "from-accent to-[hsl(20,100%,45%)]",
  purple: "from-premium to-[hsl(280,80%,50%)]",
};

export function UnitBanner({ title, description, color, isActive = false, currentLessonId, unitId }: UnitBannerProps) {
  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-2xl p-6 bg-gradient-to-r",
        colorClasses[color]
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-xl font-extrabold text-white mb-1">{title}</h2>
          <p className="text-sm text-white/80">{description}</p>
        </div>
        <div className="flex gap-2">
          {unitId && <UnitNotes unitId={unitId} isAccessible={isActive || false} />}
          {isActive && currentLessonId && (
            <Button 
              variant="golden"
              className="shadow-none"
              asChild
            >
              <Link to={`/lesson/${currentLessonId}`}>
                <BookOpen className="w-5 h-5" />
                Continue
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full" />
      <div className="absolute -right-4 -top-4 w-16 h-16 bg-white/10 rounded-full" />
    </div>
  );
}
