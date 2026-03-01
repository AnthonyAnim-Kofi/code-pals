/**
 * Leaderboard – Displays league rankings with weekly and all-time views.
 * Weekly view uses weekly_xp for rankings; all-time uses total xp.
 */
import { useState, useMemo } from "react";
import { Trophy, Medal, Loader2, Users, ArrowUp, ArrowDown, Clock, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserProfile } from "@/hooks/useUserProgress";
import { useLeagueLeaderboard, LEAGUES, getDaysUntilWeekEnd, getLeagueInfo, LeagueUser } from "@/hooks/useLeague";
import { useLeagueThresholds } from "@/hooks/useLeagueThresholds";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import mascot from "@/assets/mascot.png";

/* ── Avatar helper ── */
function UserAvatar({ user, size = "md" }: { user: LeagueUser; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = { sm: "w-10 h-10", md: "w-14 h-14", lg: "w-20 h-20" };
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

  const rankStyles: Record<number, { ring: string; badge: string }> = {
    1: { ring: "ring-4 ring-golden/60 shadow-lg shadow-golden/20", badge: "bg-golden text-golden-foreground" },
    2: { ring: "ring-3 ring-muted-foreground/30", badge: "bg-muted-foreground text-background" },
    3: { ring: "ring-3 ring-amber-700/40", badge: "bg-amber-700 text-white" },
  };
  const style = rankStyles[rank];

  return (
    <div
      className={cn(
        "flex flex-col items-center relative",
        isFirst ? "order-2 -mt-4 z-10" : rank === 2 ? "order-1 mt-6" : "order-3 mt-6",
        isFirst ? "pb-8" : "pb-4"
      )}
    >
      {isFirst && (
        <div className="mb-1 animate-bounce">
          <Crown className="w-7 h-7 text-golden fill-golden/30" />
        </div>
      )}

      <div className="relative">
        <div className={cn("rounded-full", style.ring)}>
          <UserAvatar user={user} size={isFirst ? "lg" : "md"} />
        </div>
        <div
          className={cn(
            "absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shadow-md",
            style.badge
          )}
        >
          {rank}
        </div>
      </div>

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

export default function Leaderboard() {
  const { data: profile } = useUserProfile();
  const [selectedLeague, setSelectedLeague] = useState(profile?.league || "bronze");
  const [timeRange, setTimeRange] = useState<"weekly" | "allTime">("weekly");
  const { data: leaderboardData, isLoading } = useLeagueLeaderboard(selectedLeague, timeRange === "weekly" ? "weekly" : "allTime");
  const { data: thresholds } = useLeagueThresholds();

  const daysLeft = getDaysUntilWeekEnd();
  const currentLeagueInfo = getLeagueInfo(profile?.league || "bronze");

  const getPromotionThreshold = (league: string) => {
    const t = thresholds?.find(th => th.league === league);
    return t?.promotion_xp_threshold ?? Infinity;
  };

  const getDemotionThreshold = (league: string) => {
    const t = thresholds?.find(th => th.league === league);
    return t?.demotion_xp_threshold ?? 0;
  };

  const users = leaderboardData || [];
  const isWeekly = timeRange === "weekly";
  const topThree = useMemo(() => users.slice(0, 3), [users]);
  const restUsers = useMemo(() => users.slice(3), [users]);
  const getXp = (u: LeagueUser) => (isWeekly ? u.weekly_xp : u.xp) ?? 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentUserRank = users.findIndex((u) => u.user_id === profile?.user_id) + 1;
  const promotionXp = isWeekly ? getPromotionThreshold(selectedLeague) : Infinity;
  const demotionXp = isWeekly ? getDemotionThreshold(selectedLeague) : 0;
  const userWeeklyXp = profile?.weekly_xp || 0;
  const userTotalXp = profile?.xp || 0;

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="w-5 h-5 text-golden" />;
      case 2: return <Medal className="w-5 h-5 text-muted-foreground" />;
      case 3: return <Medal className="w-5 h-5 text-amber-700" />;
      default: return <span className="text-sm font-black text-muted-foreground">{rank}</span>;
    }
  };

  return (
    <div className="space-y-5 pb-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-golden/15 flex items-center justify-center">
          <Trophy className="w-5 h-5 text-golden" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-foreground">Weekly League</h1>
          <p className="text-xs text-muted-foreground">
            Compete with learners in your league {isWeekly ? "this week" : "all time"}.
          </p>
        </div>
      </div>

      {/* Time range toggle */}
      <div className="flex justify-center">
        <div className="inline-flex items-center rounded-full bg-muted p-1 text-sm">
          <button
            type="button"
            onClick={() => setTimeRange("weekly")}
            className={cn(
              "px-4 py-1.5 rounded-full font-semibold transition-all",
              isWeekly ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
            )}
          >
            This Week
          </button>
          <button
            type="button"
            onClick={() => setTimeRange("allTime")}
            className={cn(
              "px-4 py-1.5 rounded-full font-semibold transition-all",
              !isWeekly ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
            )}
          >
            All Time
          </button>
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

      {/* Current league card */}
      <div className="bg-card rounded-2xl border border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", currentLeagueInfo.bgColor)}>
              <Trophy className={cn("w-5 h-5", currentLeagueInfo.color)} />
            </div>
            <div>
              <p className={cn("font-bold capitalize", currentLeagueInfo.color)}>
                {profile?.league} League
              </p>
              <p className="text-xs text-muted-foreground">
                {isWeekly ? `${userWeeklyXp} XP this week` : `${userTotalXp.toLocaleString()} XP all time`}
              </p>
            </div>
          </div>
          {currentUserRank > 0 && (
            <div className="text-right">
              <p className="text-2xl font-black text-foreground">#{currentUserRank}</p>
              <div className="flex items-center gap-1">
                {isWeekly && userWeeklyXp >= promotionXp && selectedLeague !== "diamond" && (
                  <span className="text-xs text-green-500 flex items-center gap-0.5 font-semibold">
                    <ArrowUp className="w-3 h-3" /> Promotion
                  </span>
                )}
                {isWeekly && userWeeklyXp < demotionXp && selectedLeague !== "bronze" && (
                  <span className="text-xs text-destructive flex items-center gap-0.5 font-semibold">
                    <ArrowDown className="w-3 h-3" /> Demotion
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* League tier tabs (available on mobile + desktop) */}
      <div className="w-full">
        <Tabs value={selectedLeague} onValueChange={setSelectedLeague}>
          <TabsList className="w-full">
            {LEAGUES.map((league) => (
              <TabsTrigger key={league.key} value={league.key} className="flex-1 capitalize">
                {league.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      {users.length === 0 ? (
        <div className="p-10 bg-card rounded-2xl border border-border text-center">
          <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-1">No learners in this league</h3>
          <p className="text-sm text-muted-foreground">Be the first to join!</p>
        </div>
      ) : (
        <>
          {/* ── Top 3 Podium ── */}
          {topThree.length >= 3 && (
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
          )}

          {/* ── Full Rankings list ── */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                {topThree.length >= 3 ? "Full Rankings" : "Rankings"}
              </p>
            </div>
            {users.map((leaderUser, index) => {
              const rank = index + 1;
              const isCurrentUser = leaderUser.user_id === profile?.user_id;
              const inPromotionZone = isWeekly && leaderUser.weekly_xp >= promotionXp && selectedLeague !== "diamond";
              const inDemotionZone = isWeekly && leaderUser.weekly_xp < demotionXp && selectedLeague !== "bronze";

              return (
                <div
                  key={leaderUser.id}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0 transition-colors",
                    isCurrentUser && "bg-primary/5",
                    inPromotionZone && "border-l-2 border-l-green-500",
                    inDemotionZone && "border-l-2 border-l-destructive"
                  )}
                >
                  <div className="w-7 text-center">{getRankIcon(rank)}</div>
                  <UserAvatar user={leaderUser} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className={cn("font-bold truncate text-sm", isCurrentUser ? "text-primary" : "text-foreground")}>
                      {leaderUser.display_name || leaderUser.username || "Learner"}
                      {isCurrentUser && <span className="ml-1 text-xs opacity-70">(You)</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">🔥 {leaderUser.streak_count || 0} day streak</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-black text-golden text-sm">
                      {(isWeekly ? leaderUser.weekly_xp : leaderUser.xp)?.toLocaleString() || 0}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                      {isWeekly ? "XP this week" : "All-time XP"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
