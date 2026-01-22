import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile, useLessonProgress } from "@/hooks/useUserProgress";
import { Settings, LogOut, Flame, Zap, Trophy, Calendar, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import mascot from "@/assets/mascot.png";

const achievements = [
  { emoji: "🔥", title: "7 Day Streak", condition: (streak: number) => streak >= 7 },
  { emoji: "⚡", title: "100 XP in a Day", condition: (xp: number) => xp >= 100 },
  { emoji: "🏆", title: "First Place", condition: () => false },
  { emoji: "📚", title: "Complete Unit", condition: (lessons: number) => lessons >= 5 },
  { emoji: "💎", title: "1000 Gems", condition: (gems: number) => gems >= 1000 },
  { emoji: "🎯", title: "Perfect Lesson", condition: () => true },
];

export default function Profile() {
  const { user, signOut } = useAuth();
  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const { data: lessonProgress, isLoading: progressLoading } = useLessonProgress();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const isLoading = profileLoading || progressLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const completedLessons = lessonProgress?.filter((l) => l.completed).length || 0;
  const totalLessons = 17; // Total lessons in the course
  const courseProgress = Math.round((completedLessons / totalLessons) * 100);

  const getLeague = (xp: number) => {
    if (xp >= 5000) return "Diamond";
    if (xp >= 2500) return "Gold";
    if (xp >= 1000) return "Silver";
    return "Bronze";
  };

  const formatDate = (date: string | null) => {
    if (!date) return "Just started";
    return new Date(date).toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };

  const stats = [
    { icon: Flame, label: "Day Streak", value: profile?.streak_count?.toString() || "0", color: "text-accent" },
    { icon: Zap, label: "Total XP", value: profile?.xp?.toLocaleString() || "0", color: "text-golden" },
    { icon: Trophy, label: "League", value: getLeague(profile?.xp || 0), color: "text-secondary" },
    { icon: Calendar, label: "Joined", value: formatDate(profile?.created_at || null), color: "text-muted-foreground" },
  ];

  // Check which achievements are unlocked
  const unlockedAchievements = achievements.map((achievement, i) => {
    let unlocked = false;
    switch (i) {
      case 0: unlocked = (profile?.streak_count || 0) >= 7; break;
      case 1: unlocked = (profile?.xp || 0) >= 100; break;
      case 2: unlocked = false; break; // First place needs leaderboard check
      case 3: unlocked = completedLessons >= 5; break;
      case 4: unlocked = (profile?.gems || 0) >= 1000; break;
      case 5: unlocked = lessonProgress?.some((l) => l.accuracy === 100) || false; break;
    }
    return { ...achievement, unlocked };
  });

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <div className="p-6 bg-card rounded-2xl border border-border card-elevated">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-primary/10 border-4 border-primary flex items-center justify-center overflow-hidden">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <img src={mascot} alt="Avatar" className="w-14 h-14 object-contain" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-extrabold text-foreground truncate">
              {profile?.display_name || user?.user_metadata?.full_name || "Learner"}
            </h1>
            <p className="text-muted-foreground truncate">{user?.email}</p>
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
              <p className="text-sm text-muted-foreground">
                {completedLessons} of {totalLessons} lessons completed
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-bold text-foreground">{courseProgress}%</span>
          </div>
          <Progress value={courseProgress} indicatorColor="gradient" />
        </div>
      </div>

      {/* Achievements */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-4">Achievements</h2>
        <div className="grid grid-cols-3 gap-3">
          {unlockedAchievements.map((achievement, i) => (
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
        <Button 
          variant="outline" 
          className="w-full justify-start text-destructive hover:text-destructive" 
          size="lg"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5" />
          Log Out
        </Button>
      </div>
    </div>
  );
}
