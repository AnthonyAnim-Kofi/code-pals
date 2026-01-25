import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LeagueThreshold {
  id: string;
  league: string;
  promotion_xp_threshold: number;
  demotion_xp_threshold: number;
  created_at: string;
  updated_at: string;
}

export function useLeagueThresholds() {
  return useQuery({
    queryKey: ["league-thresholds"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("league_thresholds")
        .select("*")
        .order("league");
      
      if (error) throw error;
      return data as LeagueThreshold[];
    },
  });
}

export function useUpdateLeagueThreshold() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      promotion_xp_threshold,
      demotion_xp_threshold,
    }: {
      id: string;
      promotion_xp_threshold: number;
      demotion_xp_threshold: number;
    }) => {
      const { error } = await supabase
        .from("league_thresholds")
        .update({
          promotion_xp_threshold,
          demotion_xp_threshold,
        })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["league-thresholds"] });
    },
  });
}
