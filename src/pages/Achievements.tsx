import { useMemo } from "react";
import { Trophy, Star, Flame, BookOpen, Users, Loader2, Target } from "lucide-react";
import { useAchievements, useUserAchievements, useGlobalAchievementMonitor } from "@/hooks/useAchievements";
import { Progress } from "@/components/ui/progress";
import { AchievementCard } from "@/components/AchievementCard";
import { AchievementCategory } from "@/components/AchievementCategory";

// Define structured categories for achievements
const achievementCategories = [
  {
    title: "Learning",
    icon: BookOpen,
    types: ["lessons_completed", "perfect_lesson"],
    classNames: {
      icon: "text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]",
      earned: {
        bg: "bg-card shadow-sm hover:card-elevated",
        border: "border-border",
        iconBg: "bg-primary/20",
        iconText: "text-primary",
      },
    },
  },
  {
    title: "Streaks",
    icon: Flame,
    types: ["streak"],
    classNames: {
      icon: "text-accent drop-shadow-[0_0_8px_rgba(var(--accent),0.5)]",
      earned: {
        bg: "bg-card shadow-sm hover:card-elevated",
        border: "border-border",
        iconBg: "bg-accent/20",
        iconText: "text-accent",
      },
    },
  },
  {
    title: "Experience & Leagues",
    icon: Star,
    types: ["xp", "league"],
    classNames: {
      icon: "text-golden drop-shadow-[0_0_8px_rgba(var(--golden),0.5)]",
      earned: {
        bg: "bg-card shadow-sm hover:card-elevated",
        border: "border-border",
        iconBg: "bg-golden/20",
        iconText: "text-golden",
      },
    },
  },
  {
    title: "Social",
    icon: Users,
    types: ["following", "challenges"],
    classNames: {
      icon: "text-secondary drop-shadow-[0_0_8px_rgba(var(--secondary),0.5)]",
      earned: {
        bg: "bg-card shadow-sm hover:card-elevated",
        border: "border-border",
        iconBg: "bg-secondary/20",
        iconText: "text-secondary",
      },
    },
  },
];

export default function Achievements() {
  // Hooks for fetching data
  const { data: achievements, isLoading: loadingAchievements } = useAchievements();
  const { data: userAchievements, isLoading: loadingUserAchievements } = useUserAchievements();

  // Use the global monitor to get the unified stats object.
  // The checking and awarding logic now runs behind the scenes inside MainLayout.
  const stats = useGlobalAchievementMonitor();

  // Memoize user's earned achievement IDs
  const earnedIds = useMemo(() => new Set(userAchievements?.map(ua => ua.achievement_id) || []), [userAchievements]);

  // Function to calculate progress for a given achievement
  const getProgress = (achievement: any): { percent: number; current: number; target: number } => {
    let current = 0;
    switch (achievement.requirement_type) {
      case "lessons_completed": current = stats.lessonsCompleted; break;
      case "streak": current = stats.streak; break;
      case "xp": current = stats.xp; break;
      case "following": current = stats.following; break;
      case "challenges": current = stats.challenges; break;
      case "perfect_lesson": current = stats.perfectLessons; break;
      case "league": current = { "bronze": 0, "silver": 1, "gold": 2, "diamond": 3 }[stats.league] || 0; break;
      default: current = 0;
    }
    const target = achievement.requirement_value;
    const percent = target > 0 ? Math.min(100, (current / target) * 100) : 0;
    return { percent, current, target };
  };

  // Find the next achievement the user is closest to unlocking
  const nextAchievement = useMemo(() => {
    if (!achievements) return null;
    let closestAchievement = null;
    let maxProgress = -1;

    for (const achievement of achievements) {
      if (!earnedIds.has(achievement.id)) {
        const { percent } = getProgress(achievement);
        if (percent > maxProgress) {
          maxProgress = percent;
          closestAchievement = achievement;
        }
      }
    }
    return closestAchievement;
  }, [achievements, earnedIds, stats]);

  const isLoading = loadingAchievements || loadingUserAchievements;
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const earnedCount = userAchievements?.length || 0;
  const totalCount = achievements?.length || 0;

  // Empty state if no achievements are configured
  if (!totalCount) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground mb-2 flex items-center gap-2">
            <Trophy className="w-7 h-7 text-golden" />
            Achievements
          </h1>
          <p className="text-muted-foreground">
            Achievement badges will appear here once they’re configured in the admin panel.
          </p>
        </div>
        <div className="p-6 rounded-2xl border border-dashed border-border bg-card/60 text-sm text-muted-foreground">
          <p className="mb-2 font-semibold text-foreground">No achievements defined yet</p>
          <p>
            Use the admin tools to add goals and they'll show up here for learners.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 relative">
      {/* Background glowing orb */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-64 bg-golden/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="relative">
        <h1 className="text-3xl font-extrabold text-foreground mb-2 flex items-center gap-3">
          <Trophy className="w-8 h-8 text-golden drop-shadow-[0_0_12px_rgba(var(--golden),0.5)]" />
          Achievements
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Collect badges by completing milestones, reaching new levels, and mastering your skills.
        </p>
      </div>

      {/* Main Stats and Next Achievement */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Overview */}
        <div className="lg:col-span-1 p-6 bg-gradient-to-br from-golden/20 via-golden/5 to-transparent rounded-2xl border border-golden/30 shadow-[0_0_20px_rgba(var(--golden),0.1)] flex flex-col justify-center backdrop-blur-md relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div>
              <p className="text-3xl font-extrabold text-foreground">
                {earnedCount} / {totalCount}
              </p>
              <p className="text-muted-foreground font-medium">Unlocked</p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-golden/20 flex items-center justify-center shadow-inner relative overflow-hidden group-hover:scale-105 transition-transform duration-300">
              <Trophy className="w-9 h-9 text-golden drop-shadow-md relative z-10 group-hover:rotate-12 transition-transform duration-500" />
            </div>
          </div>
          <Progress
            value={totalCount > 0 ? (earnedCount / totalCount) * 100 : 0}
            className="h-3 relative z-10"
          />
        </div>

        {/* Next Achievement to Unlock */}
        <div className="lg:col-span-2 p-6 bg-card/60 backdrop-blur-md rounded-2xl border border-border/50 shadow-sm relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2 relative z-10">
            <Target className="w-5 h-5 text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
            Next Achievement
          </h2>
          {nextAchievement ? (
            <div className="relative z-10">
              <AchievementCard
                achievement={nextAchievement}
                isEarned={false}
                progress={getProgress(nextAchievement)}
                earnedClassNames={
                  achievementCategories.find(c => c.types.includes(nextAchievement.requirement_type))
                    ?.classNames.earned || achievementCategories[0].classNames.earned
                }
              />
            </div>
          ) : (
            <div className="text-center p-6 bg-muted/30 rounded-xl relative z-10 border border-dashed border-border/50">
              <p className="font-semibold text-foreground">All achievements unlocked!</p>
              <p className="text-sm text-muted-foreground">Congratulations!</p>
            </div>
          )}
        </div>
      </div>

      {/* Achievement Categories */}
      <div className="space-y-12 pb-10 relative z-10">
        {achievementCategories.map((category, index) => (
          <div key={category.title}>
            <AchievementCategory
              title={category.title}
              Icon={category.icon}
              achievements={achievements?.filter(a => category.types.includes(a.requirement_type)) || []}
              earnedIds={earnedIds}
              getProgress={getProgress}
              categoryClassNames={category.classNames}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
