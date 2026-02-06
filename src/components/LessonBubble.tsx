/**
 * LessonBubble – Individual lesson node on the learning path.
 * Renders as a circle with status indicators (complete/current/locked).
 * Positioned in a zig-zag pattern with SVG connecting lines between lessons.
 * Includes a bear jump animation when a lesson transitions to "current" after completion.
 */
import { Link } from "react-router-dom";
import { Check, Lock, Star, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import mascot from "@/assets/mascot.png";

interface LessonBubbleProps {
  /** Lesson ID for navigation link */
  id: string | number;
  /** Current status of the lesson */
  status: "complete" | "current" | "locked";
  /** Horizontal position in the zig-zag pattern */
  position: "left" | "center" | "right";
  /** 1-based lesson number for display */
  lessonNumber: number;
  /** Whether to show the connecting line from the previous lesson */
  showConnector?: boolean;
  /** Position of the previous lesson (for drawing connector) */
  prevPosition?: "left" | "center" | "right";
}

/** Maps position names to pixel offsets for zig-zag layout */
const getOffsetX = (position: "left" | "center" | "right") => {
  switch (position) {
    case "left": return -60;
    case "right": return 60;
    default: return 0;
  }
};

export function LessonBubble({ 
  id, status, position, lessonNumber, 
  showConnector = false, prevPosition 
}: LessonBubbleProps) {
  const offsetX = getOffsetX(position);
  const isClickable = status !== "locked";

  const bubbleContent = (
    <div className="relative flex flex-col items-center" style={{ marginLeft: offsetX }}>
      {/* Bear mascot sitting on the current lesson */}
      {status === "current" && (
        <div className="absolute -top-10 z-10 animate-bounce-gentle">
          <img src={mascot} alt="Bear" className="w-10 h-10 object-contain drop-shadow-md" />
        </div>
      )}

      <div
        className={cn(
          "lesson-bubble",
          status === "complete" && "lesson-bubble-complete",
          status === "current" && "lesson-bubble-current",
          status === "locked" && "lesson-bubble-locked"
        )}
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

        {/* Star crown for completed lessons */}
        {status === "complete" && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2">
            <Star className="w-5 h-5 text-golden fill-golden" />
          </div>
        )}
      </div>
    </div>
  );

  if (isClickable) {
    return (
      <div className="flex justify-center relative">
        {bubbleContent}
      </div>
    );
  }

  return (
    <div className="flex justify-center cursor-not-allowed relative">
      {bubbleContent}
    </div>
  );
}

/**
 * LessonPath – Wraps multiple LessonBubbles with SVG connecting lines.
 * Creates a visual path showing lesson progression through the unit.
 */
interface LessonPathProps {
  children: React.ReactNode;
  lessons: Array<{
    id: string;
    status: "complete" | "current" | "locked";
    position: "left" | "center" | "right";
  }>;
}

export function LessonPath({ children, lessons }: LessonPathProps) {
  return (
    <div className="relative flex flex-col items-center py-4">
      {/* SVG connector lines between lessons */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 0 }}
      >
        {lessons.map((lesson, i) => {
          if (i === 0) return null;
          const prev = lessons[i - 1];
          
          // Calculate positions (center of container + offset)
          const centerX = "50%";
          const prevOffsetX = getOffsetX(prev.position);
          const currOffsetX = getOffsetX(lesson.position);
          
          // Vertical spacing: each lesson is ~88px apart (space-y-6 = 24px + 64px bubble)
          const spacing = 88;
          const prevY = (i - 1) * spacing + 32; // center of bubble
          const currY = i * spacing + 32;
          
          const isCompleted = prev.status === "complete";
          const isCurrent = lesson.status === "current";
          
          return (
            <line
              key={`connector-${i}`}
              x1={`calc(50% + ${prevOffsetX}px)`}
              y1={prevY}
              x2={`calc(50% + ${currOffsetX}px)`}
              y2={currY}
              stroke={isCompleted || isCurrent ? "hsl(var(--primary))" : "hsl(var(--border))"}
              strokeWidth={isCompleted || isCurrent ? 4 : 3}
              strokeLinecap="round"
              strokeDasharray={isCompleted ? "none" : "8 6"}
              opacity={isCompleted ? 1 : 0.5}
            />
          );
        })}
      </svg>
      
      {/* Lesson bubbles with z-index above connectors */}
      <div className="relative z-10 flex flex-col items-center space-y-6">
        {children}
      </div>
    </div>
  );
}
