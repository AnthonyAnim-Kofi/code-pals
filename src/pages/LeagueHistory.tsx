import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowUp, ArrowDown, Trophy, Calendar, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeagueHistoryEntry {
  id: string;
  from_league: string;
  to_league: string;
  week_ending: string;
  weekly_xp: number;
  rank_in_league: number;
  action: string;
  created_at: string;
}

const leagueColors: Record<string, string> = {
  bronze: "from-amber-700 to-amber-900",
  silver: "from-slate-400 to-slate-600",
  gold: "from-yellow-400 to-yellow-600",
  diamond: "from-cyan-400 to-blue-500",
};

const leagueIcons: Record<string, string> = {
  bronze: "🥉",
  silver: "🥈",
  gold: "🥇",
  diamond: "💎",
};

export default function LeagueHistory() {
  const { user } = useAuth();

  const { data: history = [], isLoading } = useQuery({
    queryKey: ["league-history", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("league_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as LeagueHistoryEntry[];
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Trophy className="w-8 h-8 text-golden" />
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">League History</h1>
          <p className="text-muted-foreground">Your journey through the leagues</p>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-2xl border border-border">
          <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-2">No History Yet</h3>
          <p className="text-muted-foreground">
            Complete weekly leagues to see your promotion and demotion history here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((entry) => (
            <div
              key={entry.id}
              className={cn(
                "p-4 rounded-2xl border border-border bg-card card-elevated",
                entry.action === "promoted" && "border-l-4 border-l-primary",
                entry.action === "demoted" && "border-l-4 border-l-destructive"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center",
                      entry.action === "promoted" 
                        ? "bg-primary/10 text-primary" 
                        : "bg-destructive/10 text-destructive"
                    )}
                  >
                    {entry.action === "promoted" ? (
                      <ArrowUp className="w-6 h-6" />
                    ) : (
                      <ArrowDown className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {leagueIcons[entry.from_league]}
                      </span>
                      <span className="text-muted-foreground">→</span>
                      <span className="text-lg">
                        {leagueIcons[entry.to_league]}
                      </span>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-bold uppercase",
                          entry.action === "promoted"
                            ? "bg-primary/10 text-primary"
                            : "bg-destructive/10 text-destructive"
                        )}
                      >
                        {entry.action}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <span className="capitalize">{entry.from_league}</span>
                      {" → "}
                      <span className="capitalize">{entry.to_league}</span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-golden">{entry.weekly_xp} XP</p>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {new Date(entry.week_ending).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Rank #{entry.rank_in_league}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
