import { User, Settings, LogOut, Flame, Zap, Trophy, Calendar, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import mascot from "@/assets/mascot.png";

const stats = [
  { icon: Flame, label: "Day Streak", value: "5", color: "text-accent" },
  { icon: Zap, label: "Total XP", value: "1,250", color: "text-golden" },
  { icon: Trophy, label: "League", value: "Silver", color: "text-secondary" },
  { icon: Calendar, label: "Joined", value: "Jan 2025", color: "text-muted-foreground" },
];

const achievements = [
  { emoji: "🔥", title: "7 Day Streak", unlocked: true },
  { emoji: "⚡", title: "100 XP in a Day", unlocked: true },
  { emoji: "🏆", title: "First Place", unlocked: false },
  { emoji: "📚", title: "Complete Unit", unlocked: false },
  { emoji: "💎", title: "1000 Gems", unlocked: false },
  { emoji: "🎯", title: "Perfect Lesson", unlocked: true },
];

export default function Profile() {
  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <div className="p-6 bg-card rounded-2xl border border-border card-elevated">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-primary/10 border-4 border-primary flex items-center justify-center">
            <img src={mascot} alt="Avatar" className="w-14 h-14 object-contain" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-extrabold text-foreground">Learner</h1>
            <p className="text-muted-foreground">@codelearner2025</p>
          </div>
          <Button variant="outline" size="icon">
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="p-4 bg-card rounded-2xl border border-border card-elevated"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl bg-muted ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Current Course */}
      <div className="p-4 bg-card rounded-2xl border border-border card-elevated">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🐍</span>
            <div>
              <h3 className="font-bold text-foreground">Python</h3>
              <p className="text-sm text-muted-foreground">Current course</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-bold text-foreground">35%</span>
          </div>
          <Progress value={35} indicatorColor="gradient" />
        </div>
      </div>

      {/* Achievements */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-4">Achievements</h2>
        <div className="grid grid-cols-3 gap-3">
          {achievements.map((achievement, i) => (
            <div
              key={i}
              className={`p-4 rounded-2xl border text-center transition-all ${
                achievement.unlocked
                  ? "bg-card border-border card-elevated"
                  : "bg-muted/50 border-transparent opacity-50"
              }`}
            >
              <span className="text-3xl mb-2 block">{achievement.emoji}</span>
              <p className="text-xs font-semibold text-foreground truncate">
                {achievement.title}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <Button variant="outline" className="w-full justify-start" size="lg">
          <Settings className="w-5 h-5" />
          Settings
        </Button>
        <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive" size="lg">
          <LogOut className="w-5 h-5" />
          Log Out
        </Button>
      </div>
    </div>
  );
}
