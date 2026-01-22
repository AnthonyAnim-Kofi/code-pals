import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  xp: number;
  hearts: number;
  gems: number;
  streak_count: number;
  last_practice_date: string | null;
  created_at: string;
  updated_at: string;
}

export function useUserProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as UserProfile | null;
    },
    enabled: !!user,
  });
}

export function useUpdateProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<UserProfile>) => {
      if (!user) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
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

export function useAddXP() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (xpAmount: number) => {
      if (!user) throw new Error("Not authenticated");
      
      // Get current profile
      const { data: profile, error: fetchError } = await supabase
        .from("profiles")
        .select("xp")
        .eq("user_id", user.id)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Update XP
      const { data, error } = await supabase
        .from("profiles")
        .update({ xp: (profile?.xp || 0) + xpAmount })
        .eq("user_id", user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["quest-progress"] });
    },
  });
}

export function useDeductHeart() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      
      const { data: profile, error: fetchError } = await supabase
        .from("profiles")
        .select("hearts")
        .eq("user_id", user.id)
        .single();
      
      if (fetchError) throw fetchError;
      
      const newHearts = Math.max(0, (profile?.hearts || 0) - 1);
      
      const { data, error } = await supabase
        .from("profiles")
        .update({ hearts: newHearts })
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

export function useAddGems() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (gemAmount: number) => {
      if (!user) throw new Error("Not authenticated");
      
      const { data: profile, error: fetchError } = await supabase
        .from("profiles")
        .select("gems")
        .eq("user_id", user.id)
        .single();
      
      if (fetchError) throw fetchError;
      
      const { data, error } = await supabase
        .from("profiles")
        .update({ gems: (profile?.gems || 0) + gemAmount })
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

export function useLessonProgress() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["lesson-progress", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("lesson_progress")
        .select("*")
        .eq("user_id", user.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useSaveLessonProgress() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      lessonId,
      xpEarned,
      accuracy,
    }: {
      lessonId: number;
      xpEarned: number;
      accuracy: number;
    }) => {
      if (!user) throw new Error("Not authenticated");
      
      // Check if progress exists
      const { data: existing } = await supabase
        .from("lesson_progress")
        .select("id")
        .eq("user_id", user.id)
        .eq("lesson_id", lessonId)
        .maybeSingle();
      
      if (existing) {
        // Update existing progress
        const { data, error } = await supabase
          .from("lesson_progress")
          .update({
            completed: true,
            xp_earned: xpEarned,
            accuracy,
            completed_at: new Date().toISOString(),
          })
          .eq("id", existing.id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        // Insert new progress
        const { data, error } = await supabase
          .from("lesson_progress")
          .insert({
            user_id: user.id,
            lesson_id: lessonId,
            completed: true,
            xp_earned: xpEarned,
            accuracy,
            completed_at: new Date().toISOString(),
          })
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lesson-progress", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["quest-progress"] });
    },
  });
}

export function useLeaderboard() {
  return useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, username, avatar_url, xp, streak_count")
        .order("xp", { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data;
    },
  });
}
