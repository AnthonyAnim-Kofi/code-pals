import { Trophy, Medal, Crown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const leaderboardData = [
  { rank: 1, name: "CodeMaster", xp: 12500, avatar: "🧑‍💻", isCurrentUser: false },
  { rank: 2, name: "DevNinja", xp: 11200, avatar: "🥷", isCurrentUser: false },
  { rank: 3, name: "ByteWizard", xp: 10800, avatar: "🧙", isCurrentUser: false },
  { rank: 4, name: "You", xp: 9250, avatar: "😎", isCurrentUser: true },
  { rank: 5, name: "AlgoQueen", xp: 8900, avatar: "👑", isCurrentUser: false },
  { rank: 6, name: "LoopLord", xp: 8500, avatar: "🔄", isCurrentUser: false },
  { rank: 7, name: "BugHunter", xp: 8100, avatar: "🐛", isCurrentUser: false },
  { rank: 8, name: "SyntaxStar", xp: 7800, avatar: "⭐", isCurrentUser: false },
  { rank: 9, name: "FuncFan", xp: 7500, avatar: "📦", isCurrentUser: false },
  { rank: 10, name: "ClassClimber", xp: 7200, avatar: "🧗", isCurrentUser: false },
];

const getRankIcon = (rank: number) => {
  if (rank === 1) return <Crown className="w-6 h-6 text-golden fill-golden" />;
  if (rank === 2) return <Medal className="w-6 h-6 text-[#C0C0C0]" />;
  if (rank === 3) return <Medal className="w-6 h-6 text-[#CD7F32]" />;
  return <span className="w-6 h-6 flex items-center justify-center font-bold text-muted-foreground">{rank}</span>;
};

export default function Leaderboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground mb-2 flex items-center gap-2">
          <Trophy className="w-7 h-7 text-golden" />
          Leaderboard
        </h1>
        <p className="text-muted-foreground">
          See how you stack up against other learners this week
        </p>
      </div>

      {/* League Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {["Bronze", "Silver", "Gold", "Diamond"].map((league, i) => (
          <button
            key={league}
            className={cn(
              "px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition-all",
              i === 1
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {league} League
          </button>
        ))}
      </div>

      {/* Leaderboard List */}
      <div className="bg-card rounded-2xl border border-border card-elevated overflow-hidden">
        {leaderboardData.map((user, index) => (
          <div
            key={user.rank}
            className={cn(
              "flex items-center gap-4 p-4 transition-colors",
              index !== leaderboardData.length - 1 && "border-b border-border",
              user.isCurrentUser && "bg-primary/5",
              user.rank <= 3 && "bg-golden/5"
            )}
          >
            {/* Rank */}
            <div className="w-8 flex justify-center">
              {getRankIcon(user.rank)}
            </div>

            {/* Avatar */}
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-2xl">
              {user.avatar}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className={cn(
                "font-bold truncate",
                user.isCurrentUser ? "text-primary" : "text-foreground"
              )}>
                {user.name}
              </p>
              <p className="text-sm text-muted-foreground">{user.xp.toLocaleString()} XP</p>
            </div>

            {/* Arrow */}
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        ))}
      </div>

      {/* Your Position Banner */}
      <div className="p-4 bg-gradient-to-r from-primary to-[hsl(120,70%,35%)] rounded-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-primary-foreground/80 text-sm">Your position</p>
            <p className="text-2xl font-extrabold text-primary-foreground">#4 in Silver League</p>
          </div>
          <div className="text-right">
            <p className="text-primary-foreground/80 text-sm">XP to next rank</p>
            <p className="text-2xl font-extrabold text-primary-foreground">1,550 XP</p>
          </div>
        </div>
      </div>
    </div>
  );
}
