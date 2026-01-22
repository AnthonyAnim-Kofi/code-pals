import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface UserFollow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface Challenge {
  id: string;
  challenger_id: string;
  challenged_id: string;
  lesson_id: number;
  challenger_score: number | null;
  challenged_score: number | null;
  status: string;
  created_at: string;
  completed_at: string | null;
}

export function useFollowers() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["followers", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("user_follows")
        .select("*, follower:profiles!user_follows_follower_id_fkey(id, display_name, username, avatar_url, xp, streak_count, league)")
        .eq("following_id", user.id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}

export function useFollowing() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["following", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("user_follows")
        .select("*, following:profiles!user_follows_following_id_fkey(id, user_id, display_name, username, avatar_url, xp, streak_count, league)")
        .eq("follower_id", user.id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}

export function useFollowUser() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (followingUserId: string) => {
      if (!user) throw new Error("Not authenticated");
      
      const { error } = await supabase
        .from("user_follows")
        .insert({ follower_id: user.id, following_id: followingUserId });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["following"] });
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
    },
  });
}

export function useUnfollowUser() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (followingUserId: string) => {
      if (!user) throw new Error("Not authenticated");
      
      const { error } = await supabase
        .from("user_follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", followingUserId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["following"] });
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
    },
  });
}

export function useAllUsers() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["all-users", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, display_name, username, avatar_url, xp, streak_count, league")
        .neq("user_id", user.id)
        .order("xp", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}

export function useChallenges() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["challenges", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("challenges")
        .select("*")
        .or(`challenger_id.eq.${user.id},challenged_id.eq.${user.id}`)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}

export function useCreateChallenge() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ challengedId, lessonId }: { challengedId: string; lessonId: number }) => {
      if (!user) throw new Error("Not authenticated");
      
      const { error } = await supabase
        .from("challenges")
        .insert({
          challenger_id: user.id,
          challenged_id: challengedId,
          lesson_id: lessonId,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["challenges"] });
    },
  });
}

export function useUpdateChallengeScore() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ challengeId, score, isChallenger }: { challengeId: string; score: number; isChallenger: boolean }) => {
      if (!user) throw new Error("Not authenticated");
      
      const updateData = isChallenger 
        ? { challenger_score: score }
        : { challenged_score: score, status: "completed", completed_at: new Date().toISOString() };
      
      const { error } = await supabase
        .from("challenges")
        .update(updateData)
        .eq("id", challengeId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["challenges"] });
    },
  });
}
