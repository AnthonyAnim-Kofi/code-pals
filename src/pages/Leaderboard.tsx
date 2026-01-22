import { Trophy, Medal, Loader2, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLeaderboard, useUserProfile } from "@/hooks/useUserProgress";
import mascot from "@/assets/mascot.png";

export default function Leaderboard() {
  const { data: leaderboardData, isLoading } = useLeaderboard();
  const { data: profile } = useUserProfile();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const users = leaderboardData || [];
  const currentUserRank = users.findIndex((u) => u.id === profile?.id) + 1;

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-golden" />;
      case 2:
        return <Medal className="w-5 h-5 text-[#C0C0C0]" />;
      case 3:
        return <Medal className="w-5 h-5 text-[#CD7F32]" />;
      default:
        return <span className="text-sm font-bold text-muted-foreground w-5 text-center">{rank}</span>;
    }
  };

  const getLeague = (xp: number) => {
    if (xp >= 5000) return { name: "Diamond", color: "text-secondary" };
    if (xp >= 2500) return { name: "Gold", color: "text-golden" };
    if (xp >= 1000) return { name: "Silver", color: "text-muted-foreground" };
    return { name: "Bronze", color: "text-accent" };
  };

  const currentLeague = getLeague(profile?.xp || 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground mb-2 flex items-center gap-2">
          <Trophy className="w-7 h-7 text-golden" />
          Leaderboard
        </h1>
        <p className="text-muted-foreground">
          Compete with other learners and climb the ranks
        </p>
      </div>

      {/* League Card */}
      <div className="p-6 bg-gradient-to-br from-secondary/20 to-secondary/5 rounded-2xl border border-secondary/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center">
              <Trophy className={cn("w-8 h-8", currentLeague.color)} />
            </div>
            <div>
              <p className={cn("text-2xl font-extrabold", currentLeague.color)}>
                {currentLeague.name} League
              </p>
              <p className="text-muted-foreground">
                {profile?.xp?.toLocaleString() || 0} XP total
              </p>
            </div>
          </div>
          {currentUserRank > 0 && (
            <div className="text-right">
              <p className="text-3xl font-extrabold text-foreground">#{currentUserRank}</p>
              <p className="text-sm text-muted-foreground">Your rank</p>
            </div>
          )}
        </div>
      </div>

      {/* Rankings */}
      {users.length === 0 ? (
        <div className="p-8 bg-card rounded-2xl border border-border text-center">
          <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-2">No learners yet</h3>
          <p className="text-muted-foreground">
            Complete lessons to appear on the leaderboard!
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden card-elevated">
          {users.map((leaderUser, index) => {
            const rank = index + 1;
            const isCurrentUser = leaderUser.id === profile?.id;

            return (
              <div
                key={leaderUser.id}
                className={cn(
                  "flex items-center gap-4 p-4 border-b border-border last:border-b-0 transition-colors",
                  isCurrentUser && "bg-primary/5",
                  rank <= 3 && "bg-gradient-to-r from-golden/5 to-transparent"
                )}
              >
                <div className="w-8 flex justify-center">
                  {getRankIcon(rank)}
                </div>

                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                  {leaderUser.avatar_url ? (
                    <img src={leaderUser.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <img src={mascot} alt="" className="w-8 h-8 object-contain" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "font-bold truncate",
                    isCurrentUser ? "text-primary" : "text-foreground"
                  )}>
                    {leaderUser.display_name || leaderUser.username || "Learner"}
                    {isCurrentUser && " (You)"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    🔥 {leaderUser.streak_count || 0} day streak
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-bold text-golden">{leaderUser.xp?.toLocaleString() || 0}</p>
                  <p className="text-xs text-muted-foreground">XP</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
