import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "./useNotifications";

export function useLeagueNotifications() {
  const { user } = useAuth();
  const { sendNotification } = useNotifications();
  const lastCheckedRef = useRef<string | null>(null);

  // Fetch most recent league history entry
  const { data: latestChange } = useQuery({
    queryKey: ["latest-league-change", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("league_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
    refetchInterval: 60000, // Check every minute
  });

  useEffect(() => {
    if (!latestChange) return;

    // If we've already notified about this change, skip
    if (lastCheckedRef.current === latestChange.id) return;

    // Check if this is a recent change (within last 5 minutes)
    const changeTime = new Date(latestChange.created_at).getTime();
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    if (now - changeTime < fiveMinutes) {
      const leagueEmojis: Record<string, string> = {
        bronze: "🥉",
        silver: "🥈",
        gold: "🥇",
        diamond: "💎",
      };

      if (latestChange.action === "promoted") {
        sendNotification("League Promotion! 🎉", {
          body: `Congratulations! You've been promoted to ${latestChange.to_league.charAt(0).toUpperCase() + latestChange.to_league.slice(1)} League ${leagueEmojis[latestChange.to_league] || ""}!`,
          tag: "league-change",
        });
      } else if (latestChange.action === "demoted") {
        sendNotification("League Update 📊", {
          body: `You've moved to ${latestChange.to_league.charAt(0).toUpperCase() + latestChange.to_league.slice(1)} League. Keep practicing to climb back up!`,
          tag: "league-change",
        });
      }
    }

    lastCheckedRef.current = latestChange.id;
  }, [latestChange, sendNotification]);

  return { latestChange };
}
