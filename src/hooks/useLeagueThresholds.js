import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
export function useLeagueThresholds() {
    return useQuery({
        queryKey: ["league-thresholds"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("league_thresholds")
                .select("*")
                .order("league");
            if (error)
                throw error;
            return data;
        },
    });
}
export function useUpdateLeagueThreshold() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, promotion_xp_threshold, demotion_xp_threshold, }) => {
            const { error } = await supabase
                .from("league_thresholds")
                .update({
                promotion_xp_threshold,
                demotion_xp_threshold,
            })
                .eq("id", id);
            if (error)
                throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["league-thresholds"] });
        },
    });
}
