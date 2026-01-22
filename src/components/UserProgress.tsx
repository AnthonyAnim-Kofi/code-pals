import { Heart, Flame, Zap, Gem, Infinity } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function UserProgress() {
  return (
    <div className="space-y-4">
      {/* Stats Card */}
      <div className="p-4 bg-card rounded-2xl border border-border card-elevated">
        <div className="grid grid-cols-2 gap-4">
          {/* Streak */}
          <div className="flex items-center gap-3 p-3 bg-accent/10 rounded-xl">
            <div className="flex items-center justify-center w-10 h-10 bg-accent rounded-lg">
              <Flame className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-accent">5</p>
              <p className="text-xs text-muted-foreground font-semibold">Day streak</p>
            </div>
          </div>

          {/* XP */}
          <div className="flex items-center gap-3 p-3 bg-golden/10 rounded-xl">
            <div className="flex items-center justify-center w-10 h-10 bg-golden rounded-lg">
              <Zap className="w-5 h-5 text-golden-foreground" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-golden">1,250</p>
              <p className="text-xs text-muted-foreground font-semibold">Total XP</p>
            </div>
          </div>

          {/* Hearts */}
          <div className="flex items-center gap-3 p-3 bg-destructive/10 rounded-xl">
            <div className="flex items-center justify-center w-10 h-10 bg-destructive rounded-lg">
              <Heart className="w-5 h-5 text-destructive-foreground fill-current" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-destructive">5</p>
              <p className="text-xs text-muted-foreground font-semibold">Hearts</p>
            </div>
          </div>

          {/* Gems */}
          <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-xl">
            <div className="flex items-center justify-center w-10 h-10 bg-secondary rounded-lg">
              <Gem className="w-5 h-5 text-secondary-foreground" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-secondary">500</p>
              <p className="text-xs text-muted-foreground font-semibold">Gems</p>
            </div>
          </div>
        </div>
      </div>

      {/* Unlimited Hearts Promo */}
      <div className="p-4 bg-gradient-to-br from-premium to-premium/80 rounded-2xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center justify-center w-10 h-10 bg-white/20 rounded-lg">
            <Infinity className="w-5 h-5 text-premium-foreground" />
          </div>
          <div>
            <p className="font-bold text-premium-foreground">Unlimited Hearts</p>
            <p className="text-xs text-premium-foreground/80">Learn without limits</p>
          </div>
        </div>
        <Button variant="golden" size="sm" className="w-full" asChild>
          <Link to="/shop">Try Free</Link>
        </Button>
      </div>

      {/* Daily Goal */}
      <div className="p-4 bg-card rounded-2xl border border-border card-elevated">
        <div className="flex items-center justify-between mb-3">
          <p className="font-bold text-foreground">Daily Goal</p>
          <span className="text-sm text-muted-foreground">30 / 50 XP</span>
        </div>
        <Progress value={60} size="lg" indicatorColor="gradient" />
      </div>
    </div>
  );
}
