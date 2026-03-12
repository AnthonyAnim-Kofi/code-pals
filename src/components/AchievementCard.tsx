import {
  Trophy, Star, Flame, BookOpen, Users, Swords, Target, Medal, Award, Gem, Crown, Zap, GraduationCap, Lock } from
"lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

const iconMap: Record<string, React.ComponentType<{className?: string;}>> = {
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
  gem: Gem
};

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement_type: string;
}

interface AchievementCardProps {
  achievement: Achievement;
  isEarned: boolean;
  progress: {
    percent: number;
    current: number;
    target: number;
  };
  earnedClassNames: {
    bg: string;
    border: string;
    iconBg: string;
    iconText: string;
  };
}

export function AchievementCard({
  achievement,
  isEarned,
  progress,
  earnedClassNames
}: AchievementCardProps) {
  const Icon = iconMap[achievement.icon] || Trophy;

  return (
    <div
      className={cn("p-4 rounded-2xl border border-border card-elevated text-[#050505] bg-inherit",

      !isEarned && "opacity-60 bg-muted/5 border-dashed"
      )}>
      
      <div className="flex items-start gap-4 bg-inherit">
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
            isEarned ? earnedClassNames.iconBg : "bg-muted"
          )}>
          
          {isEarned ?
          <Icon className={cn("w-6 h-6", earnedClassNames.iconText)} /> :

          <Lock className="w-6 h-6 text-muted-foreground" />
          }
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-black bg-inherit">
            {achievement.name}
          </h3>
          <p className="text-sm mb-1.5 line-clamp-2 text-[#121212]">
            {achievement.description}
          </p>
          {!isEarned &&
          <div className="mt-2">
              <Progress value={progress.percent} className="h-1.5" />
              <p className="text-xs text-muted-foreground mt-1.5 text-right font-medium">
                <span className="text-foreground">{progress.current}</span> / {progress.target}
              </p>
            </div>
          }
        </div>
      </div>
    </div>);

}