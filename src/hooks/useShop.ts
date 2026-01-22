import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function usePurchaseHeartRefill() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");

      // Get current profile
      const { data: profile, error: fetchError } = await supabase
        .from("profiles")
        .select("gems, hearts")
        .eq("user_id", user.id)
        .single();

      if (fetchError) throw fetchError;

      const cost = 450;
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

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      toast.success("Hearts refilled! ❤️");
    },
    onError: (error) => {
      if (error.message === "Not enough gems") {
        toast.error("Not enough gems! You need 450 gems.");
      } else {
        toast.error("Failed to purchase heart refill");
      }
    },
  });
}

export function usePurchaseStreakFreeze() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");

      // Get current profile
      const { data: profile, error: fetchError } = await supabase
        .from("profiles")
        .select("gems")
        .eq("user_id", user.id)
        .single();

      if (fetchError) throw fetchError;

      const cost = 200;
      if ((profile?.gems || 0) < cost) {
        throw new Error("Not enough gems");
      }

      // Deduct gems - streak freeze is applied when streak would break
      const { data, error } = await supabase
        .from("profiles")
        .update({
          gems: (profile?.gems || 0) - cost,
        })
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      toast.success("Streak Freeze activated! 🧊 Your streak is protected for one day.");
    },
    onError: (error) => {
      if (error.message === "Not enough gems") {
        toast.error("Not enough gems! You need 200 gems.");
      } else {
        toast.error("Failed to purchase streak freeze");
      }
    },
  });
}

export function usePurchaseDoubleXP() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");

      // Get current profile
      const { data: profile, error: fetchError } = await supabase
        .from("profiles")
        .select("gems")
        .eq("user_id", user.id)
        .single();

      if (fetchError) throw fetchError;

      const cost = 100;
      if ((profile?.gems || 0) < cost) {
        throw new Error("Not enough gems");
      }

      // Deduct gems
      const { data, error } = await supabase
        .from("profiles")
        .update({
          gems: (profile?.gems || 0) - cost,
        })
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      toast.success("Double XP activated! ⚡ Earn 2x XP for 15 minutes.");
    },
    onError: (error) => {
      if (error.message === "Not enough gems") {
        toast.error("Not enough gems! You need 100 gems.");
      } else {
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
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("profiles")
        .update({ hearts: 5 })
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
  });
}
