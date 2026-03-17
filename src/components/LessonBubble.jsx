/**
 * LessonBubble – Individual lesson node on the learning path.
 * Rendered as a hexagonal shape inspired by coding journey apps.
 * Status: complete (filled + star), current (glowing + bear mascot), locked (dimmed).
 */
import { Link } from "react-router-dom";
import { Check, Lock, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import mascot from "@/assets/mascot.png";
const getOffsetX = (position) => {
    switch (position) {
        case "left": return -70;
        case "right": return 70;
        default: return 0;
    }
};
/** Hexagon SVG with inner highlight for 3D depth; wrapper provides clickable 3D lift */
function HexagonBubble({ status }) {
    return (<svg viewBox="0 0 80 92" className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden>
      <polygon points="40,2 78,22 78,70 40,90 2,70 2,22" className={cn("transition-all duration-300", status === "complete" && "fill-primary stroke-primary", status === "current" && "fill-primary stroke-primary", status === "locked" && "fill-muted stroke-border")} strokeWidth="3"/>
      {/* Inner highlight for depth */}
      <polygon points="40,10 72,28 72,64 40,82 8,64 8,28" className={cn("transition-all", status === "complete" && "fill-primary/80", status === "current" && "fill-primary/70", status === "locked" && "fill-muted/50")}/>
    </svg>);
}
export function LessonBubble({ id, status, position, lessonNumber, showConnector = false, prevPosition }) {
    const offsetX = getOffsetX(position);
    const isClickable = status !== "locked";
    const bubbleContent = (<div className="relative flex flex-col items-center" style={{ marginLeft: offsetX }}>
      {/* Bear mascot on current lesson */}
      {status === "current" && (<div className="absolute -top-11 z-10 animate-bounce-gentle">
          <img src={mascot} alt="Bear" className="w-10 h-10 object-contain drop-shadow-md"/>
        </div>)}

      {/* Glow ring for current lesson */}
      {status === "current" && (<div className="absolute inset-0 rounded-full bg-primary/20 blur-xl scale-125 animate-pulse"/>)}

      {/* Hexagon bubble with 3D-like clickable effect (lift on hover, press on click) */}
      <div className={cn("relative w-16 h-[74px] flex items-center justify-center transition-all duration-200 ease-out", status === "current" && "drop-shadow-[0_0_12px_hsl(var(--primary)/0.7)]", status === "locked" && "opacity-50", isClickable && "cursor-pointer hover:scale-110 hover:-translate-y-1 hover:drop-shadow-[0_8px_20px_rgba(0,0,0,0.25)] active:scale-[0.97] active:translate-y-0.5 active:drop-shadow-[0_2px_6px_rgba(0,0,0,0.2)]")}>
        <HexagonBubble status={status}/>

        {/* Icon */}
        <div className="relative z-10 flex items-center justify-center">
          {status === "complete" && (<Check className="w-7 h-7 text-primary-foreground" strokeWidth={3}/>)}
          {status === "current" && (<Play className="w-7 h-7 text-primary-foreground ml-1" fill="currentColor"/>)}
          {status === "locked" && (<Lock className="w-5 h-5 text-muted-foreground"/>)}
        </div>
      </div>

      {/* Lesson label */}
      <p className={cn("text-xs font-semibold mt-1.5", status === "locked" ? "text-muted-foreground/60" : "text-muted-foreground")}>
        {lessonNumber}
      </p>
    </div>);
    if (isClickable) {
        return (<Link to={`/lesson/${id}`} className="flex justify-center relative">
        {bubbleContent}
      </Link>);
    }
    return (<div className="flex justify-center cursor-not-allowed relative">
      {bubbleContent}
    </div>);
}
export function LessonPath({ children, lessons }) {
    const BUBBLE_HEIGHT = 110; // px per row including gap
    return (<div className="relative flex flex-col items-center py-4 w-full">
      {/* Lesson bubbles */}
      <div className="relative z-10 flex flex-col items-center" style={{ gap: `${BUBBLE_HEIGHT - 74}px` }}>
        {children}
      </div>
    </div>);
}
