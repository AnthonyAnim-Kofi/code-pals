/**
 * useShopItems – Hooks for fetching and managing admin-configurable shop items.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
export function useShopItems() {
    return useQuery({
        queryKey: ["shop-items"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("shop_items")
                .select("*")
                .order("order_index", { ascending: true });
            if (error)
                throw error;
            return data;
        },
    });
}
export function useCreateShopItem() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (item) => {
            const { error } = await supabase.from("shop_items").insert(item);
            if (error)
                throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["shop-items"] });
        },
    });
}
export function useUpdateShopItem() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...updates }) => {
            const { error } = await supabase
                .from("shop_items")
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq("id", id);
            if (error)
                throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["shop-items"] });
        },
    });
}
export function useDeleteShopItem() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id) => {
            const { error } = await supabase.from("shop_items").delete().eq("id", id);
            if (error)
                throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["shop-items"] });
        },
    });
}
