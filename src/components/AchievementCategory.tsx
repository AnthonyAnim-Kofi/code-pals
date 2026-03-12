import React from "react";
import { AchievementCard } from "./AchievementCard";
import { cn } from "@/lib/utils";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement_type: string;
}


interface AchievementCategoryProps {
  title: string;
  Icon: React.ComponentType<{ className?: string }>;
  achievements: Achievement[];
  earnedIds: Set<string>;
  getProgress: (achievement: Achievement) => {
    percent: number;
    current: number;
    target: number;
  };
  categoryClassNames: {
    icon: string;
    earned: {
      bg: string;
      border: string;
      iconBg: string;
      iconText: string;
    };
  };
}

export function AchievementCategory({
  title,
  Icon,
  achievements,
  earnedIds,
  getProgress,
  categoryClassNames,
}: AchievementCategoryProps) {
  if (achievements.length === 0) {
    return null;
  }
  return (
    <div className="animate-slide-in-up">
      <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
        <div className={cn("p-2 rounded-lg", categoryClassNames.earned?.bg || "bg-muted")}>
          <Icon className={`w-5 h-5 ${categoryClassNames.icon}`} />
        </div>
        {title}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {achievements.map((achievement, index) => (
          <div key={achievement.id} style={{ animationDelay: `${index * 50}ms` }} className="animate-slide-in-up flex">
            <div className="w-full">
              <AchievementCard
                achievement={achievement}
                isEarned={earnedIds.has(achievement.id)}
                progress={getProgress(achievement)}
                earnedClassNames={categoryClassNames.earned}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
