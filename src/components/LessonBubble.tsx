import { Link } from "react-router-dom";
import { Check, Lock, Star, Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface LessonBubbleProps {
  /** Lesson ID for the link (UUID string from DB, or number for fallback) */
  id: string | number;
  status: "complete" | "current" | "locked";
  position: "left" | "center" | "right";
  lessonNumber: number;
}

export function LessonBubble({ id, status, position, lessonNumber }: LessonBubbleProps) {
  const offsetX = position === "left" ? -50 : position === "right" ? 50 : 0;
  
  const isClickable = status !== "locked";

  const bubbleContent = (
    <div 
      className={cn(
        "lesson-bubble",
        status === "complete" && "lesson-bubble-complete",
        status === "current" && "lesson-bubble-current",
        status === "locked" && "lesson-bubble-locked"
      )}
      style={{ 
        marginLeft: offsetX,
      }}
    >
      {status === "complete" && (
        <Check className="w-8 h-8 text-primary-foreground" strokeWidth={3} />
      )}
      {status === "current" && (
        <Play className="w-8 h-8 text-primary-foreground ml-1" fill="currentColor" />
      )}
      {status === "locked" && (
        <Lock className="w-6 h-6 text-muted-foreground" />
      )}
      
      {/* Crown for completed lessons */}
      {status === "complete" && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <Star className="w-5 h-5 text-golden fill-golden" />
        </div>
      )}
    </div>
  );

  if (isClickable) {
    return (
      <Link to={`/lesson/${String(id)}`} className="flex justify-center">
        {bubbleContent}
      </Link>
    );
  }

  return <div className="flex justify-center cursor-not-allowed">{bubbleContent}</div>;
}
