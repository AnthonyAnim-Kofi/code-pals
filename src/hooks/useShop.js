import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
export function usePurchaseHeartRefill() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (priceFromShop) => {
            if (!user)
                throw new Error("Not authenticated");
            // Get current profile
            const { data: profile, error: fetchError } = await supabase
                .from("profiles")
                .select("gems, hearts")
                .eq("user_id", user.id)
                .single();
            if (fetchError)
                throw fetchError;
            const cost = Number(priceFromShop) > 0 ? Number(priceFromShop) : 450;
            if ((profile?.gems || 0) < cost) {
                throw new Error("Not enough gems");
            }
            // Deduct gems and refill hearts
            const { data, error } = await supabase
                .from("profiles")
                .update({
                gems: (profile?.gems || 0) - cost,
                hearts: 5, // Full hearts
            })
                .eq("user_id", user.id)
                .select()
                .single();
            if (error)
                throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
            toast.success("Hearts refilled! ❤️");
        },
        onError: (error) => {
            if (error.message === "Not enough gems") {
                toast.error("Not enough gems.");
            }
            else {
                toast.error("Failed to purchase heart refill");
            }
        },
    });
}
export function usePurchaseStreakFreeze() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (priceFromShop) => {
            if (!user)
                throw new Error("Not authenticated");
            // Get current profile
            const { data: profile, error: fetchError } = await supabase
                .from("profiles")
                .select("gems, streak_freeze_count")
                .eq("user_id", user.id)
                .single();
            if (fetchError)
                throw fetchError;
            const cost = Number(priceFromShop) > 0 ? Number(priceFromShop) : 200;
            if ((profile?.gems || 0) < cost) {
                throw new Error("Not enough gems");
            }
            // Deduct gems and add a streak freeze token
            const { data, error } = await supabase
                .from("profiles")
                .update({
                gems: (profile?.gems || 0) - cost,
                streak_freeze_count: (profile?.streak_freeze_count || 0) + 1,
            })
                .eq("user_id", user.id)
                .select()
                .single();
            if (error)
                throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
            toast.success("Streak Freeze purchased! 🧊 It will auto-save your streak if you miss a day.");
        },
        onError: (error) => {
            if (error.message === "Not enough gems") {
                toast.error("Not enough gems.");
            }
            else {
                toast.error("Failed to purchase streak freeze");
            }
        },
    });
}
export function usePurchaseDoubleXP() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (priceFromShop) => {
            if (!user)
                throw new Error("Not authenticated");
            // Get current profile
            const { data: profile, error: fetchError } = await supabase
                .from("profiles")
                .select("gems, double_xp_until")
                .eq("user_id", user.id)
                .single();
            if (fetchError)
                throw fetchError;
            const cost = Number(priceFromShop) > 0 ? Number(priceFromShop) : 100;
            if ((profile?.gems || 0) < cost) {
                throw new Error("Not enough gems");
            }
            // Deduct gems and activate/extend double XP by 15 minutes.
            const now = new Date();
            const activeUntil = profile?.double_xp_until ? new Date(profile.double_xp_until) : null;
            const baseTime = activeUntil && activeUntil > now ? activeUntil : now;
            const nextDoubleXpUntil = new Date(baseTime.getTime() + 15 * 60 * 1000).toISOString();
            const { data, error } = await supabase
                .from("profiles")
                .update({
                gems: (profile?.gems || 0) - cost,
                double_xp_until: nextDoubleXpUntil,
            })
                .eq("user_id", user.id)
                .select()
                .single();
            if (error)
                throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
            toast.success("Double XP activated! ⚡ Earn 2x XP for 15 minutes.");
        },
        onError: (error) => {
            if (error.message === "Not enough gems") {
                toast.error("Not enough gems.");
            }
            else {
                toast.error("Failed to purchase double XP");
            }
        },
    });
}
export function useRefillHearts() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            if (!user)
                throw new Error("Not authenticated");
            const { data, error } = await supabase
                .from("profiles")
                .update({ hearts: 5 })
                .eq("user_id", user.id)
                .select()
                .single();
            if (error)
                throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
        },
    });
}
