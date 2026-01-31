import { Heart, Flame, Zap, Gem, Infinity, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useUserProfile } from "@/hooks/useUserProgress";
import { HeartTimer } from "@/components/HeartTimer";
import { LeagueTimer } from "@/components/LeagueTimer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { StreakCalendar } from "@/components/StreakCalendar";

export function UserProgress() {
  const { data: profile, isLoading } = useUserProfile();
  const [streakOpen, setStreakOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="p-4 bg-card rounded-2xl border border-border card-elevated">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const streak = profile?.streak_count || 0;
  const xp = profile?.xp || 0;
  const hearts = profile?.hearts || 5;
  const gems = profile?.gems || 0;

  // Daily goal: use daily_xp (resets each day)
  const dailyGoal = 50;
  const todayXp = profile?.daily_xp ?? 0;
  const dailyProgress = Math.min((todayXp / dailyGoal) * 100, 100);

  return (
    <div className="space-y-4">
      {/* Stats Card */}
      <div className="p-4 bg-card rounded-2xl border border-border card-elevated">
        <div className="grid grid-cols-2 gap-4">
          {/* Streak */}
          <button
            type="button"
            onClick={() => setStreakOpen(true)}
            className="flex items-center gap-3 p-3 bg-accent/10 rounded-xl text-left hover:bg-accent/15 transition-colors"
            aria-label="Open streak calendar"
          >
            <div className="flex items-center justify-center w-10 h-10 bg-accent rounded-lg">
              <Flame className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-accent">{streak}</p>
              <p className="text-xs text-muted-foreground font-semibold">Day streak</p>
            </div>
          </button>

          {/* XP */}
          <div className="flex items-center gap-3 p-3 bg-golden/10 rounded-xl">
            <div className="flex items-center justify-center w-10 h-10 bg-golden rounded-lg">
              <Zap className="w-5 h-5 text-golden-foreground" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-golden">{xp.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground font-semibold">Total XP</p>
            </div>
          </div>

          {/* Hearts */}
          <div className="flex items-center gap-3 p-3 bg-destructive/10 rounded-xl">
            <div className="flex items-center justify-center w-10 h-10 bg-destructive rounded-lg">
              <Heart className="w-5 h-5 text-destructive-foreground fill-current" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-destructive">{hearts}</p>
              <p className="text-xs text-muted-foreground font-semibold">Hearts</p>
            </div>
          </div>

          {/* Gems */}
          <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-xl">
            <div className="flex items-center justify-center w-10 h-10 bg-secondary rounded-lg">
              <Gem className="w-5 h-5 text-secondary-foreground" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-secondary">{gems.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground font-semibold">Gems</p>
            </div>
          </div>
        </div>

        {/* Heart Timer */}
        {hearts < 5 && (
          <div className="mt-4">
            <HeartTimer 
              currentHearts={hearts} 
              regenStartedAt={profile?.heart_regeneration_started_at || null} 
            />
          </div>
        )}
      </div>

      {/* League Timer */}
      <LeagueTimer />

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
          <span className="text-sm text-muted-foreground">{todayXp} / {dailyGoal} XP</span>
        </div>
        <Progress value={dailyProgress} size="lg" indicatorColor="gradient" />
      </div>

      {/* Streak calendar dialog (only) */}
      <Dialog open={streakOpen} onOpenChange={setStreakOpen}>
        <DialogContent className="w-[95vw] max-w-md max-h-[85dvh] overflow-auto p-0">
          <div className="p-6">
            <StreakCalendar
              currentStreak={streak}
              lastPracticeDate={profile?.last_practice_date || null}
              streakFreezeCount={profile?.streak_freeze_count || 0}
              lastStreakFreezeUsed={profile?.last_streak_freeze_used || null}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
