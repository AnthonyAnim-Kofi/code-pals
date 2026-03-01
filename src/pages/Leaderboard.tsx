/**
 * Leaderboard – Displays league rankings with weekly and all-time views.
 * Weekly view uses weekly_xp for rankings; all-time uses total xp.
 */
import { useState, useMemo } from "react";
import { Trophy, Medal, Loader2, Users, ArrowUp, ArrowDown, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserProfile } from "@/hooks/useUserProgress";
import { useLeagueLeaderboard, LEAGUES, getDaysUntilWeekEnd, getLeagueInfo } from "@/hooks/useLeague";
import { useLeagueThresholds } from "@/hooks/useLeagueThresholds";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import mascot from "@/assets/mascot.png";

export default function Leaderboard() {
  const { data: profile } = useUserProfile();
  const [selectedLeague, setSelectedLeague] = useState(profile?.league || "bronze");
  const [timeRange, setTimeRange] = useState<"weekly" | "allTime">("weekly");
  const { data: leaderboardData, isLoading } = useLeagueLeaderboard(selectedLeague, timeRange === "weekly" ? "weekly" : "allTime");
  const { data: thresholds } = useLeagueThresholds();

  const daysLeft = getDaysUntilWeekEnd();
  const currentLeagueInfo = getLeagueInfo(profile?.league || "bronze");

  /** Get XP threshold for promotion from the admin-defined thresholds table */
  const getPromotionThreshold = (league: string) => {
    const t = thresholds?.find(th => th.league === league);
    return t?.promotion_xp_threshold ?? Infinity;
  };

  /** Get XP threshold for demotion from the admin-defined thresholds table */
  const getDemotionThreshold = (league: string) => {
    const t = thresholds?.find(th => th.league === league);
    return t?.demotion_xp_threshold ?? 0;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const users = leaderboardData || [];
  const currentUserRank = users.findIndex((u) => u.user_id === profile?.user_id) + 1;
  
  // Determine promotion/demotion based on weekly_xp thresholds
  const promotionXp = timeRange === "weekly" ? getPromotionThreshold(selectedLeague) : Infinity;
  const demotionXp = timeRange === "weekly" ? getDemotionThreshold(selectedLeague) : 0;
  const userWeeklyXp = profile?.weekly_xp || 0;
  const userTotalXp = profile?.xp || 0;

  const isWeekly = timeRange === "weekly";

  const topThree = useMemo(() => users.slice(0, 3), [users]);
  const restUsers = useMemo(() => users.slice(3), [users]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="w-5 h-5 text-golden" />;
      case 2: return <Medal className="w-5 h-5 text-[#C0C0C0]" />;
      case 3: return <Medal className="w-5 h-5 text-[#CD7F32]" />;
      default: return <span className="text-sm font-bold text-muted-foreground w-5 text-center">{rank}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground mb-2 flex items-center gap-2">
          <Trophy className="w-7 h-7 text-golden" />
          Weekly League
        </h1>
        <p className="text-muted-foreground">
          Compete with learners in your league {isWeekly ? "this week" : "all time"}.
        </p>
      </div>

      {/* Time range toggle – mobile only */}
      <div className="flex justify-center md:hidden">
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

      {/* Week countdown info – only relevant in weekly view */}
      {isWeekly && (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-xl text-sm">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">
            Week resets in{" "}
            <span className="font-bold text-foreground">{daysLeft} days</span>
          </span>
        </div>
      )}

      {/* Current league card showing user's position and XP */}
      <div className={cn("p-6 rounded-2xl border", currentLeagueInfo.bgColor, "border-current/20")}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cn("w-16 h-16 rounded-full flex items-center justify-center", currentLeagueInfo.bgColor)}>
              <Trophy className={cn("w-8 h-8", currentLeagueInfo.color)} />
            </div>
            <div>
              <p className={cn("text-2xl font-extrabold capitalize", currentLeagueInfo.color)}>
                {profile?.league} League
              </p>
              <p className="text-muted-foreground">
                {isWeekly ? `${userWeeklyXp} XP this week` : `${userTotalXp.toLocaleString()} XP all time`}
              </p>
            </div>
          </div>
          {currentUserRank > 0 && (
            <div className="text-right">
              <p className="text-3xl font-extrabold text-foreground">#{currentUserRank}</p>
              <div className="flex items-center gap-1 text-sm">
                {isWeekly && userWeeklyXp >= promotionXp && selectedLeague !== "diamond" && (
                  <span className="text-green-600 flex items-center gap-1"><ArrowUp className="w-4 h-4" /> Promotion</span>
                )}
                {isWeekly && userWeeklyXp < demotionXp && selectedLeague !== "bronze" && (
                  <span className="text-red-600 flex items-center gap-1"><ArrowDown className="w-4 h-4" /> Demotion</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* League tier tabs – show on desktop, keep mobile focused on current league */}
      <div className="hidden md:block">
        <Tabs value={selectedLeague} onValueChange={setSelectedLeague}>
          <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-muted rounded-xl">
            {LEAGUES.map((league) => (
              <TabsTrigger key={league.key} value={league.key} className={cn("rounded-lg py-2 capitalize", league.color)}>
                {league.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Top 3 podium style + full rankings list */}
      {users.length === 0 ? (
        <div className="p-8 bg-card rounded-2xl border border-border text-center">
          <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-2">No learners in this league</h3>
          <p className="text-muted-foreground">Be the first to join!</p>
        </div>
      ) : (
        <>
          {/* Top 3 cards */}
          {topThree.length > 0 && (
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {topThree.map((leaderUser, index) => {
                const rank = index + 1;
                const isCurrentUser = leaderUser.user_id === profile?.user_id;
                return (
                  <div
                    key={leaderUser.id}
                    className={cn(
                      "rounded-2xl p-3 sm:p-4 bg-card border border-border flex flex-col items-center gap-2",
                      rank === 2 && "mt-3",
                      rank === 3 && "mt-3",
                      rank === 1 && "shadow-lg shadow-golden/25",
                      isCurrentUser && "ring-2 ring-primary"
                    )}
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                      {getRankIcon(rank)}
                    </div>
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                      {leaderUser.avatar_url ? (
                        <img src={leaderUser.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <img src={mascot} alt="" className="w-10 h-10 object-contain" />
                      )}
                    </div>
                    <div className="text-center">
                      <p className={cn("text-sm font-semibold truncate max-w-[80px]", isCurrentUser && "text-primary")}>
                        {leaderUser.display_name || leaderUser.username || "Learner"}
                        {isCurrentUser && " (You)"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(isWeekly ? leaderUser.weekly_xp : leaderUser.xp)?.toLocaleString() || 0} XP
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full list (including top 3 for clarity) */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden mt-4">
          {users.map((leaderUser, index) => {
            const rank = index + 1;
            const isCurrentUser = leaderUser.user_id === profile?.user_id;
            // Determine promotion/demotion zone based on weekly XP thresholds
            const inPromotionZone = isWeekly && leaderUser.weekly_xp >= promotionXp && selectedLeague !== "diamond";
            const inDemotionZone = isWeekly && leaderUser.weekly_xp < demotionXp && selectedLeague !== "bronze";

            return (
              <div
                key={leaderUser.id}
                className={cn(
                  "flex items-center gap-4 p-4 border-b border-border last:border-b-0 transition-colors",
                  isCurrentUser && "bg-primary/5",
                  inPromotionZone && !isCurrentUser && "bg-green-50 dark:bg-green-950/20",
                  inDemotionZone && !isCurrentUser && "bg-red-50 dark:bg-red-950/20"
                )}
              >
                <div className="w-8 flex justify-center">{getRankIcon(rank)}</div>
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                  {leaderUser.avatar_url ? (
                    <img src={leaderUser.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <img src={mascot} alt="" className="w-8 h-8 object-contain" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("font-bold truncate", isCurrentUser ? "text-primary" : "text-foreground")}>
                    {leaderUser.display_name || leaderUser.username || "Learner"}
                    {isCurrentUser && " (You)"}
                  </p>
                  <p className="text-sm text-muted-foreground">🔥 {leaderUser.streak_count || 0} day streak</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-golden">
                    {(isWeekly ? leaderUser.weekly_xp : leaderUser.xp)?.toLocaleString() || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">
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
