/**
 * Leaderboard – Podium-style top 3, ranked list below, league labels & XP badges.
 */
import { useState, useMemo } from "react";
import { Trophy, Loader2, Users, Clock, Crown, Medal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserProfile } from "@/hooks/useUserProgress";
import { useLeagueLeaderboard, getDaysUntilWeekEnd, getLeagueInfo, LeagueUser } from "@/hooks/useLeague";
import { useLeagueThresholds } from "@/hooks/useLeagueThresholds";
import mascot from "@/assets/mascot.png";

/* ── Avatar helper ── */
function UserAvatar({ user, size = "md" }: { user: LeagueUser; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-14 h-14",
    lg: "w-20 h-20",
  };
  const imgSize = { sm: "w-8 h-8", md: "w-10 h-10", lg: "w-16 h-16" };

  return (
    <div className={cn("rounded-full bg-muted flex items-center justify-center overflow-hidden", sizeClasses[size])}>
      {user.avatar_url ? (
        <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
      ) : (
        <img src={mascot} alt="" className={cn("object-contain", imgSize[size])} />
      )}
    </div>
  );
}

/* ── Podium card for top 3 ── */
function PodiumCard({
  user,
  rank,
  isCurrentUser,
  xp,
}: {
  user: LeagueUser;
  rank: number;
  isCurrentUser: boolean;
  xp: number;
}) {
  const isFirst = rank === 1;
  const leagueInfo = getLeagueInfo(user.league);

  const rankStyles: Record<number, { ring: string; badge: string; height: string }> = {
    1: { ring: "ring-4 ring-golden/60 shadow-lg shadow-golden/20", badge: "bg-golden text-golden-foreground", height: "pb-8" },
    2: { ring: "ring-3 ring-muted-foreground/30", badge: "bg-muted-foreground text-background", height: "pb-4" },
    3: { ring: "ring-3 ring-amber-700/40", badge: "bg-amber-700 text-white", height: "pb-4" },
  };
  const style = rankStyles[rank];

  return (
    <div
      className={cn(
        "flex flex-col items-center relative",
        isFirst ? "order-2 -mt-4 z-10" : rank === 2 ? "order-1 mt-6" : "order-3 mt-6",
        style.height
      )}
    >
      {/* Crown for #1 */}
      {isFirst && (
        <div className="mb-1 animate-bounce">
          <Crown className="w-7 h-7 text-golden fill-golden/30" />
        </div>
      )}

      {/* Avatar with ring */}
      <div className="relative">
        <div className={cn("rounded-full", style.ring)}>
          <UserAvatar user={user} size={isFirst ? "lg" : "md"} />
        </div>
        {/* Rank badge */}
        <div
          className={cn(
            "absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shadow-md",
            style.badge
          )}
        >
          {rank}
        </div>
      </div>

      {/* Name */}
      <p
        className={cn(
          "mt-4 text-sm font-bold truncate max-w-[100px] text-center",
          isCurrentUser ? "text-primary" : "text-foreground"
        )}
      >
        {user.display_name || user.username || "Learner"}
      </p>
      {isCurrentUser && (
        <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">You</span>
      )}

      {/* League label */}
      <span className={cn("text-[10px] font-semibold capitalize mt-0.5", leagueInfo.color)}>
        {user.league} League
      </span>

      {/* XP badge */}
      <div
        className={cn(
          "mt-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wide",
          isFirst
            ? "bg-golden/15 text-golden border border-golden/30"
            : "bg-muted text-muted-foreground"
        )}
      >
        {xp.toLocaleString()} XP
      </div>
    </div>
  );
}

/* ── Rank row for users #4+ (or all users if < 3 total) ── */
function RankRow({
  user,
  rank,
  isCurrentUser,
  xp,
}: {
  user: LeagueUser;
  rank: number;
  isCurrentUser: boolean;
  xp: number;
}) {
  const leagueInfo = getLeagueInfo(user.league);

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0 transition-colors",
        isCurrentUser && "bg-primary/5"
      )}
    >
      {/* Rank */}
      <span className="w-7 text-center text-sm font-black text-muted-foreground">{rank}</span>

      {/* Avatar */}
      <UserAvatar user={user} size="sm" />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={cn("font-bold truncate text-sm", isCurrentUser ? "text-primary" : "text-foreground")}>
          {user.display_name || user.username || "Learner"}
          {isCurrentUser && <span className="ml-1 text-xs opacity-70">(You)</span>}
        </p>
        <p className={cn("text-xs capitalize font-semibold", leagueInfo.color)}>
          {user.league} League
        </p>
      </div>

      {/* XP */}
      <div className="text-right flex-shrink-0">
        <p className="font-black text-golden text-sm">{xp.toLocaleString()}</p>
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">XP</p>
      </div>
    </div>
  );
}

/* ── Main Component ── */
export default function Leaderboard() {
  const { data: profile } = useUserProfile();
  const userLeague = profile?.league || "bronze";
  const [timeRange, setTimeRange] = useState<"weekly" | "allTime">("weekly");
  const { data: leaderboardData, isLoading } = useLeagueLeaderboard(userLeague, timeRange);
  const { data: thresholds } = useLeagueThresholds();

  const daysLeft = getDaysUntilWeekEnd();
  const isWeekly = timeRange === "weekly";
  const getXp = (u: LeagueUser) => (isWeekly ? u.weekly_xp : u.xp) ?? 0;

  const users = useMemo(() => leaderboardData || [], [leaderboardData]);
  const topThree = useMemo(() => users.slice(0, 3), [users]);
  const restUsers = useMemo(() => users.slice(3), [users]);
  const currentUserRank = users.findIndex((u) => u.user_id === profile?.user_id) + 1;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-golden/15 flex items-center justify-center">
          <Trophy className="w-5 h-5 text-golden" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-foreground">Leaderboard</h1>
          <p className="text-xs text-muted-foreground">Compete & climb the ranks</p>
        </div>
      </div>

      {/* Time range toggle */}
      <div className="flex justify-center">
        <div className="inline-flex items-center rounded-full bg-muted p-1 text-sm">
          {(["weekly", "allTime"] as const).map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => setTimeRange(range)}
              className={cn(
                "px-5 py-1.5 rounded-full font-semibold transition-all",
                timeRange === range
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {range === "weekly" ? "This Week" : "All Time"}
            </button>
          ))}
        </div>
      </div>

      {/* Week countdown */}
      {isWeekly && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/60 rounded-xl text-sm">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">
            Week resets in{" "}
            <span className="font-bold text-foreground">{daysLeft} day{daysLeft !== 1 ? "s" : ""}</span>
          </span>
        </div>
      )}

      {users.length === 0 ? (
        <div className="p-10 bg-card rounded-2xl border border-border text-center">
          <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-1">No learners yet</h3>
          <p className="text-sm text-muted-foreground">Be the first to earn XP and claim the top spot!</p>
        </div>
      ) : (
        <>
          {/* ── Top 3 Podium ── */}
          {topThree.length >= 3 ? (
            <div className="bg-card rounded-2xl border border-border p-6 pt-8">
              <div className="flex justify-center items-end gap-3 sm:gap-6">
                {topThree.map((u, i) => (
                  <PodiumCard
                    key={u.id}
                    user={u}
                    rank={i + 1}
                    isCurrentUser={u.user_id === profile?.user_id}
                    xp={getXp(u)}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {/* ── Rankings list ── */}
          {(topThree.length < 3 ? users : restUsers).length > 0 && (
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="px-4 py-2.5 border-b border-border">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  {topThree.length >= 3 ? "Rankings" : "All Rankings"}
                </p>
              </div>
              {(topThree.length < 3 ? users : restUsers).map((u, index) => {
                const rank = topThree.length < 3 ? index + 1 : index + 4;
                return (
                  <RankRow
                    key={u.id}
                    user={u}
                    rank={rank}
                    isCurrentUser={u.user_id === profile?.user_id}
                    xp={getXp(u)}
                  />
                );
              })}
            </div>
          )}

          {/* Current rank footer */}
          {currentUserRank > 0 && (
            <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Your Rank</p>
                <p className="text-2xl font-black text-foreground">#{currentUserRank}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                  {isWeekly ? "Weekly XP" : "Total XP"}
                </p>
                <p className="text-2xl font-black text-golden">
                  {(isWeekly ? profile?.weekly_xp : profile?.xp)?.toLocaleString() ?? 0}
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
