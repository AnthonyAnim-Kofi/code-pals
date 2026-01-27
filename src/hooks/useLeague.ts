import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface LeagueUser {
  id: string;
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  xp: number;
  weekly_xp: number;
  streak_count: number;
  league: string;
}

export interface LeagueHistory {
  id: string;
  user_id: string;
  from_league: string;
  to_league: string;
  week_ending: string;
  weekly_xp: number;
  rank_in_league: number;
  action: string;
  created_at: string;
}

export const LEAGUES = [
  { name: "Bronze", key: "bronze", color: "text-amber-600", bgColor: "bg-amber-100", minXp: 0 },
  { name: "Silver", key: "silver", color: "text-slate-500", bgColor: "bg-slate-100", minXp: 500 },
  { name: "Gold", key: "gold", color: "text-yellow-500", bgColor: "bg-yellow-100", minXp: 1500 },
  { name: "Diamond", key: "diamond", color: "text-cyan-500", bgColor: "bg-cyan-100", minXp: 3000 },
];

export function useLeagueLeaderboard(league?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Set up realtime subscription
  useEffect(() => {
    if (!user) return;
    
    const channel = supabase
      .channel('leaderboard-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
        },
        () => {
          // Invalidate query to refetch leaderboard data
          queryClient.invalidateQueries({ queryKey: ["league-leaderboard", league] });
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, league, queryClient]);
  
  return useQuery({
    queryKey: ["league-leaderboard", league],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select("id, user_id, display_name, username, avatar_url, xp, weekly_xp, streak_count, league")
        .order("weekly_xp", { ascending: false })
        .limit(50);
      
      if (league) {
        query = query.eq("league", league);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as LeagueUser[];
    },
    enabled: !!user,
  });
}

export function useLeagueHistory() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["league-history", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("league_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as LeagueHistory[];
    },
    enabled: !!user,
  });
}

export function getLeagueInfo(league: string) {
  return LEAGUES.find(l => l.key === league) || LEAGUES[0];
}

export function getNextLeague(currentLeague: string) {
  const currentIndex = LEAGUES.findIndex(l => l.key === currentLeague);
  if (currentIndex < LEAGUES.length - 1) {
    return LEAGUES[currentIndex + 1];
  }
  return null;
}

export function getDaysUntilWeekEnd() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilSunday = (7 - dayOfWeek) % 7 || 7;
  return daysUntilSunday;
}
