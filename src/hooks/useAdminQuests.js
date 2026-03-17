import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
export function useAdminQuests() {
    return useQuery({
        queryKey: ["admin-quests"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("daily_quests")
                .select("*")
                .order("is_weekly", { ascending: false })
                .order("created_at", { ascending: false });
            if (error)
                throw error;
            return data;
        },
    });
}
export function useCreateQuest() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (quest) => {
            const { error } = await supabase.from("daily_quests").insert(quest);
            if (error)
                throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-quests"] });
            queryClient.invalidateQueries({ queryKey: ["quests"] });
        },
    });
}
export function useUpdateQuest() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...updates }) => {
            const { error } = await supabase
                .from("daily_quests")
                .update(updates)
                .eq("id", id);
            if (error)
                throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-quests"] });
            queryClient.invalidateQueries({ queryKey: ["quests"] });
        },
    });
}
export function useDeleteQuest() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (questId) => {
            const { error } = await supabase.from("daily_quests").delete().eq("id", questId);
            if (error)
                throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-quests"] });
            queryClient.invalidateQueries({ queryKey: ["quests"] });
        },
    });
}
