/**
 * LessonBubble – Individual lesson node on the learning path.
 * Rendered as a hexagonal shape inspired by coding journey apps.
 * Status: complete (filled + star), current (glowing + bear mascot), locked (dimmed).
 */
import { Link } from "react-router-dom";
import { Check, Lock, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import mascot from "@/assets/mascot.png";

interface LessonBubbleProps {
  id: string | number;
  status: "complete" | "current" | "locked";
  position: "left" | "center" | "right";
  lessonNumber: number;
  showConnector?: boolean;
  prevPosition?: "left" | "center" | "right";
}

const getOffsetX = (position: "left" | "center" | "right") => {
  switch (position) {
    case "left": return -70;
    case "right": return 70;
    default: return 0;
  }
};

/** Hexagon SVG clip path for the lesson bubble */
function HexagonBubble({ status }: { status: "complete" | "current" | "locked" }) {
  return (
    <svg viewBox="0 0 80 92" className="absolute inset-0 w-full h-full" aria-hidden>
      <polygon
        points="40,2 78,22 78,70 40,90 2,70 2,22"
        className={cn(
          "transition-all duration-300",
          status === "complete" && "fill-primary stroke-primary",
          status === "current" && "fill-primary stroke-primary",
          status === "locked" && "fill-muted stroke-border"
        )}
        strokeWidth="3"
      />
      {/* Inner highlight for depth */}
      <polygon
        points="40,10 72,28 72,64 40,82 8,64 8,28"
        className={cn(
          "transition-all",
          status === "complete" && "fill-primary/80",
          status === "current" && "fill-primary/70",
          status === "locked" && "fill-muted/50"
        )}
      />
    </svg>
  );
}

export function LessonBubble({
  id, status, position, lessonNumber,
  showConnector = false, prevPosition
}: LessonBubbleProps) {
  const offsetX = getOffsetX(position);
  const isClickable = status !== "locked";

  const bubbleContent = (
    <div className="relative flex flex-col items-center" style={{ marginLeft: offsetX }}>
      {/* Bear mascot on current lesson */}
      {status === "current" && (
        <div className="absolute -top-11 z-10 animate-bounce-gentle">
          <img src={mascot} alt="Bear" className="w-10 h-10 object-contain drop-shadow-md" />
        </div>
      )}

      {/* Glow ring for current lesson */}
      {status === "current" && (
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl scale-125 animate-pulse" />
      )}

      {/* Hexagon bubble */}
      <div
        className={cn(
          "relative w-16 h-[74px] flex items-center justify-center",
          status === "current" && "drop-shadow-[0_0_12px_hsl(var(--primary)/0.7)]",
          status === "locked" && "opacity-50"
        )}
      >
        <HexagonBubble status={status} />

        {/* Icon */}
        <div className="relative z-10 flex items-center justify-center">
          {status === "complete" && (
            <Check className="w-7 h-7 text-primary-foreground" strokeWidth={3} />
          )}
          {status === "current" && (
            <Play className="w-7 h-7 text-primary-foreground ml-1" fill="currentColor" />
          )}
          {status === "locked" && (
            <Lock className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Lesson label */}
      <p className={cn(
        "text-xs font-semibold mt-1.5",
        status === "locked" ? "text-muted-foreground/60" : "text-muted-foreground"
      )}>
        {lessonNumber}
      </p>
    </div>
  );

  if (isClickable) {
    return (
      <Link to={`/lesson/${id}`} className="flex justify-center relative">
        {bubbleContent}
      </Link>
    );
  }

  return (
    <div className="flex justify-center cursor-not-allowed relative">
      {bubbleContent}
    </div>
  );
}

/**
 * LessonPath – Wraps multiple LessonBubbles with smooth curved SVG connector lines.
 * Creates an organic winding path between hexagonal lesson nodes.
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
  const BUBBLE_HEIGHT = 110; // px per row including gap
  const BUBBLE_CENTER_Y = 37; // center of hex bubble from top

  return (
    <div className="relative flex flex-col items-center py-4">
      {/* SVG curved organic connector lines */}
      <svg
        className="absolute inset-0 w-full pointer-events-none"
        style={{ zIndex: 0, height: `${lessons.length * BUBBLE_HEIGHT + 40}px` }}
        overflow="visible"
      >
        <defs>
          <linearGradient id="pathGradientComplete" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="1" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="pathGradientLocked" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--border))" stopOpacity="0.6" />
            <stop offset="100%" stopColor="hsl(var(--border))" stopOpacity="0.3" />
          </linearGradient>
        </defs>

        {lessons.map((lesson, i) => {
          if (i === 0) return null;
          const prev = lessons[i - 1];

          const x1 = getOffsetX(prev.position);
          const x2 = getOffsetX(lesson.position);

          // Y positions (center of each bubble)
          const y1 = (i - 1) * BUBBLE_HEIGHT + BUBBLE_CENTER_Y + 16;
          const y2 = i * BUBBLE_HEIGHT + BUBBLE_CENTER_Y + 16;

          // Control points for smooth S-curve
          const cp1y = y1 + (y2 - y1) * 0.4;
          const cp2y = y1 + (y2 - y1) * 0.6;

          const isCompleted = prev.status === "complete";
          const isCurrent = lesson.status === "current";
          const showFilled = isCompleted || isCurrent;

          return (
            <g key={`connector-${i}`}>
              {/* Background dashed line (always shown) */}
              <path
                d={`M calc(50% + ${x1}px) ${y1} C calc(50% + ${x1}px) ${cp1y}, calc(50% + ${x2}px) ${cp2y}, calc(50% + ${x2}px) ${y2}`}
                fill="none"
                stroke="url(#pathGradientLocked)"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray="6 8"
              />
              {/* Filled colored line for completed/current path */}
              {showFilled && (
                <path
                  d={`M calc(50% + ${x1}px) ${y1} C calc(50% + ${x1}px) ${cp1y}, calc(50% + ${x2}px) ${cp2y}, calc(50% + ${x2}px) ${y2}`}
                  fill="none"
                  stroke="url(#pathGradientComplete)"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              )}
            </g>
          );
        })}
      </svg>

      {/* Lesson bubbles above connectors */}
      <div
        className="relative z-10 flex flex-col items-center"
        style={{ gap: `${BUBBLE_HEIGHT - 74}px` }}
      >
        {children}
      </div>
    </div>
  );
}
