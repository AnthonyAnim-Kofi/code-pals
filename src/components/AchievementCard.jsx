import { Trophy, Star, Flame, BookOpen, Users, Swords, Target, Medal, Award, Gem, Crown, Zap, GraduationCap, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
const iconMap = {
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
export function AchievementCard({ achievement, isEarned, progress, earnedClassNames }) {
    const Icon = iconMap[achievement.icon] || Trophy;
    return (<div className={cn("p-4 bg-card rounded-2xl border border-border card-elevated", !isEarned && "border-dashed text-muted-foreground")}>

      <div className="flex items-start gap-4">
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", isEarned ? earnedClassNames.iconBg : "bg-muted")}>

          {isEarned ?
            <Icon className={cn("w-6 h-6", earnedClassNames.iconText)}/> :
            <Lock className="w-6 h-6 text-muted-foreground"/>}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-foreground">
            {achievement.name}
          </h3>
          <p className="text-sm mb-1.5 line-clamp-2 text-muted-foreground">
            {achievement.description}
          </p>
          {!isEarned &&
            <div className="mt-2">
              <Progress value={progress.percent} className="h-1.5"/>
              <p className="text-xs text-muted-foreground mt-1.5 text-right font-medium">
                <span className="text-foreground">{progress.current}</span> / {progress.target}
              </p>
            </div>}
        </div>
      </div>
    </div>);
}
