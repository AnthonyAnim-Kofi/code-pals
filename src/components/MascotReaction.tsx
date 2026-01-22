import { cn } from "@/lib/utils";
import mascotImage from "@/assets/mascot.png";

interface MascotReactionProps {
  reaction: "idle" | "correct" | "incorrect" | "celebrate";
  message?: string;
}

const reactionMessages = {
  idle: "",
  correct: ["Great job! 🎉", "Amazing! 🌟", "You got it! ✨", "Perfect! 💪", "Brilliant! 🚀"],
  incorrect: ["Don't give up! 💪", "Try again! 🌟", "You can do it! ✨", "Keep going! 🎯", "Almost there! 🌈"],
  celebrate: ["Champion! 🏆", "Superstar! ⭐", "Incredible! 🎊", "You're amazing! 🎉"],
};

export function MascotReaction({ reaction, message }: MascotReactionProps) {
  const getMessage = () => {
    if (message) return message;
    if (reaction === "idle") return "";
    const messages = reactionMessages[reaction];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const displayMessage = getMessage();

  return (
    <div className="flex items-center gap-4">
      <div
        className={cn(
          "relative w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20 transition-all duration-300",
          reaction === "correct" && "animate-bounce-gentle",
          reaction === "incorrect" && "animate-wiggle",
          reaction === "celebrate" && "animate-float"
        )}
      >
        <img
          src={mascotImage}
          alt="CodeOwl mascot"
          className={cn(
            "w-full h-full object-cover transition-transform duration-300",
            reaction === "correct" && "scale-110",
            reaction === "incorrect" && "opacity-80",
            reaction === "celebrate" && "scale-125"
          )}
        />
        
        {/* Reaction overlay effects */}
        {reaction === "correct" && (
          <div className="absolute inset-0 bg-primary/20 animate-pulse-gentle" />
        )}
        {reaction === "celebrate" && (
          <div className="absolute inset-0 bg-golden/30 animate-pulse-gentle" />
        )}
      </div>
      
      {displayMessage && (
        <div
          className={cn(
            "relative px-4 py-2 rounded-2xl rounded-bl-sm font-bold text-sm animate-scale-in",
            reaction === "correct" && "bg-primary/10 text-primary border-2 border-primary/30",
            reaction === "incorrect" && "bg-destructive/10 text-destructive border-2 border-destructive/30",
            reaction === "celebrate" && "bg-golden/10 text-golden border-2 border-golden/30"
          )}
        >
          {displayMessage}
          
          {/* Speech bubble tail */}
          <div
            className={cn(
              "absolute -left-2 bottom-2 w-3 h-3 rotate-45",
              reaction === "correct" && "bg-primary/10 border-l-2 border-b-2 border-primary/30",
              reaction === "incorrect" && "bg-destructive/10 border-l-2 border-b-2 border-destructive/30",
              reaction === "celebrate" && "bg-golden/10 border-l-2 border-b-2 border-golden/30"
            )}
          />
        </div>
      )}
    </div>
  );
}
