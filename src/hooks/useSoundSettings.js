/**
 * useSoundSettings – Hooks for fetching and managing admin-configurable sound settings.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
export function useSoundSettings() {
    return useQuery({
        queryKey: ["sound-settings"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("sound_settings")
                .select("*")
                .order("sound_key", { ascending: true });
            if (error)
                throw error;
            return data;
        },
    });
}
export function useUpdateSoundSetting() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...updates }) => {
            const { error } = await supabase
                .from("sound_settings")
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq("id", id);
            if (error)
                throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sound-settings"] });
        },
    });
}
export function useCreateSoundSetting() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (setting) => {
            const { error } = await supabase.from("sound_settings").insert(setting);
            if (error)
                throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sound-settings"] });
        },
    });
}
