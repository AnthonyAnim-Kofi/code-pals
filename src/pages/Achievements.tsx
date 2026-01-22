import { Trophy, Star, Flame, BookOpen, Users, Swords, Target, Medal, Award, Gem, Crown, Zap, GraduationCap, Loader2, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAchievements, useUserAchievements } from "@/hooks/useAchievements";
import { Progress } from "@/components/ui/progress";
import { useUserProfile, useLessonProgress } from "@/hooks/useUserProgress";
import { useFollowing, useChallenges } from "@/hooks/useSocial";

const iconMap: Record<string, any> = {
  trophy: Trophy,
  "book-open": BookOpen,
  "graduation-cap": GraduationCap,
  flame: Flame,
  fire: Flame,
  zap: Zap,
  star: Star,
  stars: Star,
  crown: Crown,
  users: Users,
  swords: Swords,
  target: Target,
  medal: Medal,
  award: Award,
  gem: Gem,
};

export default function Achievements() {
  const { data: achievements, isLoading: loadingAchievements } = useAchievements();
  const { data: userAchievements, isLoading: loadingUserAchievements } = useUserAchievements();
  const { data: profile } = useUserProfile();
  const { data: lessonProgress } = useLessonProgress();
  const { data: following } = useFollowing();
  const { data: challenges } = useChallenges();

  const earnedIds = new Set(userAchievements?.map(ua => ua.achievement_id) || []);
  
  const stats = {
    lessonsCompleted: lessonProgress?.filter(p => p.completed).length || 0,
    streak: profile?.streak_count || 0,
    xp: profile?.xp || 0,
    following: following?.length || 0,
    challenges: challenges?.filter(c => c.status === "completed").length || 0,
    perfectLessons: lessonProgress?.filter(p => p.accuracy === 100).length || 0,
  };

  const getProgress = (achievement: any) => {
    let current = 0;
    switch (achievement.requirement_type) {
      case "lessons_completed":
        current = stats.lessonsCompleted;
        break;
      case "streak":
        current = stats.streak;
        break;
      case "xp":
        current = stats.xp;
        break;
      case "following":
        current = stats.following;
        break;
      case "challenges":
        current = stats.challenges;
        break;
      case "perfect_lesson":
        current = stats.perfectLessons;
        break;
      case "league":
        const leagueLevel = { bronze: 0, silver: 1, gold: 2, diamond: 3 }[profile?.league || "bronze"] || 0;
        current = leagueLevel;
        break;
    }
    return Math.min(100, (current / achievement.requirement_value) * 100);
  };

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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-foreground mb-2 flex items-center gap-2">
          <Trophy className="w-7 h-7 text-golden" />
          Achievements
        </h1>
        <p className="text-muted-foreground">
          Collect badges by completing milestones
        </p>
      </div>

      {/* Progress Overview */}
      <div className="p-6 bg-gradient-to-br from-golden/20 to-golden/5 rounded-2xl border border-golden/30">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-2xl font-extrabold text-foreground">
              {earnedCount} / {totalCount}
            </p>
            <p className="text-muted-foreground">Achievements Unlocked</p>
          </div>
          <div className="w-16 h-16 rounded-full bg-golden/20 flex items-center justify-center">
            <Trophy className="w-8 h-8 text-golden" />
          </div>
        </div>
        <Progress 
          value={(earnedCount / totalCount) * 100} 
          className="h-3"
        />
      </div>

      {/* Achievement Categories */}
      <div className="space-y-6">
        {/* Learning Achievements */}
        <div>
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Learning
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {achievements?.filter(a => 
              ["lessons_completed", "perfect_lesson"].includes(a.requirement_type)
            ).map((achievement) => {
              const isEarned = earnedIds.has(achievement.id);
              const Icon = iconMap[achievement.icon] || Trophy;
              const progress = getProgress(achievement);
              
              return (
                <div
                  key={achievement.id}
                  className={cn(
                    "p-4 rounded-2xl border transition-all",
                    isEarned
                      ? "bg-gradient-to-br from-golden/10 to-golden/5 border-golden/30"
                      : "bg-card border-border opacity-70"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center",
                      isEarned ? "bg-golden/20" : "bg-muted"
                    )}>
                      {isEarned ? (
                        <Icon className="w-6 h-6 text-golden" />
                      ) : (
                        <Lock className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "font-bold",
                        isEarned ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {achievement.name}
                      </p>
                      <p className="text-sm text-muted-foreground">{achievement.description}</p>
                      {!isEarned && (
                        <div className="mt-2">
                          <Progress value={progress} className="h-1.5" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Streak Achievements */}
        <div>
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Flame className="w-5 h-5 text-accent" />
            Streaks
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {achievements?.filter(a => a.requirement_type === "streak").map((achievement) => {
              const isEarned = earnedIds.has(achievement.id);
              const Icon = iconMap[achievement.icon] || Flame;
              const progress = getProgress(achievement);
              
              return (
                <div
                  key={achievement.id}
                  className={cn(
                    "p-4 rounded-2xl border transition-all",
                    isEarned
                      ? "bg-gradient-to-br from-accent/10 to-accent/5 border-accent/30"
                      : "bg-card border-border opacity-70"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center",
                      isEarned ? "bg-accent/20" : "bg-muted"
                    )}>
                      {isEarned ? (
                        <Icon className="w-6 h-6 text-accent" />
                      ) : (
                        <Lock className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "font-bold",
                        isEarned ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {achievement.name}
                      </p>
                      <p className="text-sm text-muted-foreground">{achievement.description}</p>
                      {!isEarned && (
                        <div className="mt-2">
                          <Progress value={progress} className="h-1.5" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* XP & League Achievements */}
        <div>
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-golden" />
            Experience & Leagues
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {achievements?.filter(a => 
              ["xp", "league"].includes(a.requirement_type)
            ).map((achievement) => {
              const isEarned = earnedIds.has(achievement.id);
              const Icon = iconMap[achievement.icon] || Star;
              const progress = getProgress(achievement);
              
              return (
                <div
                  key={achievement.id}
                  className={cn(
                    "p-4 rounded-2xl border transition-all",
                    isEarned
                      ? "bg-gradient-to-br from-golden/10 to-golden/5 border-golden/30"
                      : "bg-card border-border opacity-70"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center",
                      isEarned ? "bg-golden/20" : "bg-muted"
                    )}>
                      {isEarned ? (
                        <Icon className="w-6 h-6 text-golden" />
                      ) : (
                        <Lock className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "font-bold",
                        isEarned ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {achievement.name}
                      </p>
                      <p className="text-sm text-muted-foreground">{achievement.description}</p>
                      {!isEarned && (
                        <div className="mt-2">
                          <Progress value={progress} className="h-1.5" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Social Achievements */}
        <div>
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-secondary" />
            Social
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {achievements?.filter(a => 
              ["following", "challenges"].includes(a.requirement_type)
            ).map((achievement) => {
              const isEarned = earnedIds.has(achievement.id);
              const Icon = iconMap[achievement.icon] || Users;
              const progress = getProgress(achievement);
              
              return (
                <div
                  key={achievement.id}
                  className={cn(
                    "p-4 rounded-2xl border transition-all",
                    isEarned
                      ? "bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/30"
                      : "bg-card border-border opacity-70"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center",
                      isEarned ? "bg-secondary/20" : "bg-muted"
                    )}>
                      {isEarned ? (
                        <Icon className="w-6 h-6 text-secondary" />
                      ) : (
                        <Lock className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "font-bold",
                        isEarned ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {achievement.name}
                      </p>
                      <p className="text-sm text-muted-foreground">{achievement.description}</p>
                      {!isEarned && (
                        <div className="mt-2">
                          <Progress value={progress} className="h-1.5" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
