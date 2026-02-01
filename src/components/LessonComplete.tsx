import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Trophy, Zap, Target, Star, ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import mascot from "@/assets/mascot.png";
import confetti from "@/lib/confetti";

interface LessonCompleteProps {
  xpEarned: number;
  totalQuestions: number;
  correctAnswers: number;
  onContinue: () => void;
}

export function LessonComplete({
  xpEarned,
  totalQuestions,
  correctAnswers,
  onContinue,
}: LessonCompleteProps) {
  const accuracy = Math.round((correctAnswers / totalQuestions) * 100);
  const isPerfect = accuracy === 100;
  // Stars from correct/total: 1 star = at least 1/3 correct, 2 stars = at least 2/3, 3 stars = all correct
  const starsEarned =
    totalQuestions === 0
      ? 0
      : correctAnswers === totalQuestions
        ? 3
        : correctAnswers >= (2 / 3) * totalQuestions
          ? 2
          : correctAnswers >= totalQuestions / 3
            ? 1
            : 0;

  useEffect(() => {
    // Trigger confetti celebration
    confetti();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background flex flex-col items-center justify-center p-4 animate-fade-in">
      {/* Performance: percentage + star rating (percentage used to calculate stars out of 3) */}
      <div className="text-center mb-4 animate-scale-in">
        <p className="text-lg font-semibold text-muted-foreground mb-1">
          {totalQuestions > 0 ? `${accuracy}%` : "—"} · {starsEarned}/3 stars
        </p>
        <div className="flex justify-center gap-2">
          {[1, 2, 3].map((i) => (
            <Star
              key={i}
              className={cn(
                "w-10 h-10 transition-colors",
                i <= starsEarned ? "text-golden fill-golden" : "text-muted-foreground/30"
              )}
            />
          ))}
        </div>
      </div>

      {/* Celebration Header */}
      <div className="text-center mb-8">
        <div className="relative inline-block">
          <img
            src={mascot}
            alt="Celebrating mascot"
            className="w-32 h-32 animate-bounce-gentle drop-shadow-xl"
          />
          {isPerfect && (
            <div className="absolute -top-2 -right-2">
              <Star className="w-10 h-10 text-golden fill-golden animate-pulse" />
            </div>
          )}
        </div>
        <h1 className="text-3xl font-extrabold text-foreground mt-4 animate-scale-in">
          {isPerfect ? "Perfect!" : "Lesson Complete!"}
        </h1>
        <p className="text-muted-foreground mt-2">
          {isPerfect
            ? "You nailed every question! 🎉"
            : "Great job completing this lesson!"}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="w-full max-w-sm space-y-4 mb-8">
        {/* XP Earned */}
        <div
          className="flex items-center gap-4 p-4 bg-card rounded-2xl border border-border card-elevated animate-slide-in-up"
          style={{ animationDelay: "0.1s" }}
        >
          <div className="w-14 h-14 rounded-xl bg-golden/20 flex items-center justify-center">
            <Zap className="w-7 h-7 text-golden" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">XP Earned</p>
            <p className="text-2xl font-extrabold text-golden">+{xpEarned} XP</p>
          </div>
          <Sparkles className="w-6 h-6 text-golden animate-pulse" />
        </div>

        {/* Accuracy */}
        <div
          className="flex items-center gap-4 p-4 bg-card rounded-2xl border border-border card-elevated animate-slide-in-up"
          style={{ animationDelay: "0.2s" }}
        >
          <div
            className={cn(
              "w-14 h-14 rounded-xl flex items-center justify-center",
              accuracy >= 80 ? "bg-primary/20" : accuracy >= 50 ? "bg-secondary/20" : "bg-destructive/20"
            )}
          >
            <Target
              className={cn(
                "w-7 h-7",
                accuracy >= 80 ? "text-primary" : accuracy >= 50 ? "text-secondary" : "text-destructive"
              )}
            />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Accuracy</p>
            <p
              className={cn(
                "text-2xl font-extrabold",
                accuracy >= 80 ? "text-primary" : accuracy >= 50 ? "text-secondary" : "text-destructive"
              )}
            >
              {accuracy}%
            </p>
          </div>
          <span className="text-sm text-muted-foreground">
            {correctAnswers}/{totalQuestions}
          </span>
        </div>

        {/* Trophy for Perfect Score */}
        {isPerfect && (
          <div
            className="flex items-center gap-4 p-4 bg-gradient-to-r from-golden/20 to-accent/20 rounded-2xl border border-golden/30 animate-slide-in-up"
            style={{ animationDelay: "0.3s" }}
          >
            <div className="w-14 h-14 rounded-xl bg-golden flex items-center justify-center">
              <Trophy className="w-7 h-7 text-golden-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-golden-foreground/80">Achievement Unlocked</p>
              <p className="text-lg font-extrabold text-foreground">Perfect Lesson!</p>
            </div>
          </div>
        )}
      </div>

      {/* Continue Button */}
      <div
        className="w-full max-w-sm animate-slide-in-up"
        style={{ animationDelay: "0.4s" }}
      >
        <Button size="xl" className="w-full" onClick={onContinue}>
          Continue
          <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
