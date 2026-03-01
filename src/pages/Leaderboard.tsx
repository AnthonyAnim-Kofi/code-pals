/**
 * Leaderboard – Redesigned with podium-style top 3 and ranked list below.
 * Mobile: pill toggle (This Week / All Time), no league tabs.
 * Desktop: same layout, no league tabs either.
 */
import { useState, useMemo } from "react";
import { Trophy, Loader2, Users, Clock, ChevronLeft, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserProfile } from "@/hooks/useUserProgress";
import { useLeagueLeaderboard, getDaysUntilWeekEnd, getLeagueInfo, LeagueUser } from "@/hooks/useLeague";
import { useLeagueThresholds } from "@/hooks/useLeagueThresholds";
import { useIsMobile } from "@/hooks/use-mobile";
import mascot from "@/assets/mascot.png";

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
  return (
    <div
      className={cn(
        "flex flex-col items-center",
        isFirst ? "order-2" : rank === 2 ? "order-1 mt-6" : "order-3 mt-6"
      )}
    >
      {/* Crown for #1 */}
      {isFirst && <span className="text-2xl mb-1">👑</span>}
      {/* Avatar */}
      <div className="relative">
        <div
          className={cn(
            "rounded-full overflow-hidden border-3 flex items-center justify-center",
            isFirst
              ? "w-20 h-20 border-golden"
              : "w-16 h-16 border-muted-foreground/30"
          )}
        >
          {user.avatar_url ? (
            <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <img src={mascot} alt="" className={cn("object-contain", isFirst ? "w-16 h-16" : "w-12 h-12")} />
          )}
        </div>
        <div
          className={cn(
            "absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white",
            isFirst ? "bg-golden" : rank === 2 ? "bg-slate-400" : "bg-amber-700"
          )}
        >
          {rank}
        </div>
      </div>
      {/* Name */}
      <p
        className={cn(
          "mt-3 text-sm font-semibold truncate max-w-[90px] text-center",
          isCurrentUser && "text-primary"
        )}
      >
        {user.display_name || user.username || "Learner"}
        {isCurrentUser && " (You)"}
      </p>
      {/* XP badge */}
      <div
        className={cn(
          "mt-1 px-3 py-1 rounded-full text-xs font-bold",
          isFirst
            ? "bg-golden/20 text-golden"
            : "bg-muted text-muted-foreground"
        )}
      >
        {xp.toLocaleString()} XP
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
  const isMobile = useIsMobile();

  const daysLeft = getDaysUntilWeekEnd();
  const currentLeagueInfo = getLeagueInfo(userLeague);
  const isWeekly = timeRange === "weekly";

  const getXp = (u: LeagueUser) => (isWeekly ? u.weekly_xp : u.xp) ?? 0;

  const users = useMemo(() => leaderboardData || [], [leaderboardData]);
  const topThree = useMemo(() => users.slice(0, 3), [users]);
  const restUsers = useMemo(() => users.slice(3), [users]);
  const currentUserRank = users.findIndex((u) => u.user_id === profile?.user_id) + 1;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-foreground">Weekly League</h1>
      </div>

      {/* Time range toggle */}
      <div className="flex justify-center">
        <div className="inline-flex items-center rounded-full bg-muted p-1 text-sm">
          <button
            type="button"
            onClick={() => setTimeRange("weekly")}
            className={cn(
              "px-5 py-1.5 rounded-full font-semibold transition-all",
              isWeekly ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"
            )}
          >
            This Week
          </button>
          <button
            type="button"
            onClick={() => setTimeRange("allTime")}
            className={cn(
              "px-5 py-1.5 rounded-full font-semibold transition-all",
              !isWeekly ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"
            )}
          >
            All Time
          </button>
        </div>
      </div>

      {/* Week countdown */}
      {isWeekly && (
        <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-xl text-sm">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">
            Week resets in{" "}
            <span className="font-bold text-foreground">{daysLeft} days</span>
          </span>
        </div>
      )}

      {users.length === 0 ? (
        <div className="p-8 bg-card rounded-2xl border border-border text-center">
          <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-2">No learners yet</h3>
          <p className="text-muted-foreground">Be the first to join!</p>
        </div>
      ) : (
        <>
          {/* ── Top 3 Podium ── */}
          {topThree.length >= 3 && (
            <div className="flex justify-center items-end gap-4 pt-4 pb-2">
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
          )}

          {/* ── Rankings list (4+) ── */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            {(topThree.length < 3 ? users : restUsers).map((u, index) => {
              const rank = topThree.length < 3 ? index + 1 : index + 4;
              const isCurrentUser = u.user_id === profile?.user_id;
              const leagueInfo = getLeagueInfo(u.league);

              return (
                <div
                  key={u.id}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0 transition-colors",
                    isCurrentUser && "bg-primary/5"
                  )}
                >
                  {/* Rank number */}
                  <span className="w-6 text-center text-sm font-bold text-muted-foreground">
                    {rank}
                  </span>

                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <img src={mascot} alt="" className="w-8 h-8 object-contain" />
                    )}
                  </div>

                  {/* Name + league label */}
                  <div className="flex-1 min-w-0">
                    <p className={cn("font-bold truncate text-sm", isCurrentUser ? "text-primary" : "text-foreground")}>
                      {u.display_name || u.username || "Learner"}
                      {isCurrentUser && " (You)"}
                    </p>
                    <p className={cn("text-xs capitalize", leagueInfo.color)}>
                      {u.league} League
                    </p>
                  </div>

                  {/* XP */}
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-golden text-sm">
                      {getXp(u).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">XP</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Current rank footer */}
          {currentUserRank > 0 && (
            <div className="p-4 bg-primary/10 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Current Rank</p>
                <p className="text-lg font-extrabold text-foreground">#{currentUserRank}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  {isWeekly ? "Weekly XP" : "Total XP"}
                </p>
                <p className="text-lg font-extrabold text-golden">
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
