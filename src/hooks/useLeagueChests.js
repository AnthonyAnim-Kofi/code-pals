/**
 * useLeagueChests – Hooks for league chest rewards.
 * Provides querying chest configs (admin & user), fetching awards, and claiming chests.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/** Fetch chest configs for a specific league (all 3 ranks) */
export function useLeagueChestConfig(league) {
  return useQuery({
    queryKey: ["league-chest-config", league],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("league_chest_config")
        .select("*")
        .eq("league", league)
        .order("rank_position", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!league,
  });
}

/** Fetch ALL chest configs across all leagues (for admin panel) */
export function useAllChestConfigs() {
  return useQuery({
    queryKey: ["league-chest-config-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("league_chest_config")
        .select("*")
        .order("league", { ascending: true })
        .order("rank_position", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

/** Admin: upsert (create/update) a chest config */
export function useUpsertChestConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (config) => {
      const { data, error } = await supabase
        .from("league_chest_config")
        .upsert(config, { onConflict: "league,rank_position" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["league-chest-config"] });
      queryClient.invalidateQueries({ queryKey: ["league-chest-config-all"] });
    },
  });
}

/** Fetch unclaimed chest awards for the current user */
export function useMyChestAwards() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-chest-awards", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("league_chest_awards")
        .select("*, league_chest_config(*)")
        .eq("user_id", user.id)
        .eq("claimed", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

/** Claim a chest: mark claimed + apply rewards to profile */
export function useClaimChest() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (award) => {
      // 1. Mark chest as claimed
      const { error: updateError } = await supabase
        .from("league_chest_awards")
        .update({ claimed: true })
        .eq("id", award.id);
      if (updateError) throw updateError;

      // 2. Apply rewards to profile
      const config = award.league_chest_config;
      if (config) {
        const { data: profile, error: profileErr } = await supabase
          .from("profiles")
          .select("xp, gems, hearts, streak_freeze_count")
          .eq("user_id", user.id)
          .single();
        if (profileErr) throw profileErr;

        const { error: rewardErr } = await supabase
          .from("profiles")
          .update({
            xp: (profile.xp || 0) + (config.xp_reward || 0),
            gems: (profile.gems || 0) + (config.gems_reward || 0),
            hearts: Math.min((profile.hearts || 0) + (config.hearts_reward || 0), 5),
            streak_freeze_count: (profile.streak_freeze_count || 0) + (config.streak_freezes_reward || 0),
          })
          .eq("user_id", user.id);
        if (rewardErr) throw rewardErr;
      }

      return award;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-chest-awards"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

/** Fetch recent chest awards for a league (visible to all members) */
export function useLeagueChestHistory(league) {
  return useQuery({
    queryKey: ["league-chest-history", league],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("league_chest_awards")
        .select("*, league_chest_config(*), profiles!league_chest_awards_user_id_fkey(display_name, username, avatar_url)")
        .eq("league", league)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!league,
  });
}
