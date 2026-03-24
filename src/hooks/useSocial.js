import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
export function useFollowers() {
    const { user } = useAuth();
    return useQuery({
        queryKey: ["followers", user?.id],
        queryFn: async () => {
            if (!user)
                return [];
            const { data, error } = await supabase
                .from("user_follows")
                .select("*, follower:profiles!user_follows_follower_id_fkey(id, display_name, username, avatar_url, xp, streak_count, league)")
                .eq("following_id", user.id);
            if (error)
                throw error;
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
            if (!user)
                return [];
            const { data, error } = await supabase
                .from("user_follows")
                .select("*, following:profiles!user_follows_following_id_fkey(id, user_id, display_name, username, avatar_url, xp, streak_count, league)")
                .eq("follower_id", user.id);
            if (error)
                throw error;
            return data || [];
        },
        enabled: !!user,
    });
}
export function useFollowUser() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (followingUserId) => {
            if (!user)
                throw new Error("Not authenticated");
            const { error } = await supabase
                .from("user_follows")
                .insert({ follower_id: user.id, following_id: followingUserId });
            if (error)
                throw error;
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
        mutationFn: async (followingUserId) => {
            if (!user)
                throw new Error("Not authenticated");
            const { error } = await supabase
                .from("user_follows")
                .delete()
                .eq("follower_id", user.id)
                .eq("following_id", followingUserId);
            if (error)
                throw error;
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
            if (!user)
                return [];
            const { data, error } = await supabase
                .from("profiles")
                .select("id, user_id, display_name, username, avatar_url, xp, streak_count, league")
                .neq("user_id", user.id)
                .order("xp", { ascending: false });
            if (error)
                throw error;
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
            if (!user)
                return [];
            const { data, error } = await supabase
                .from("challenges")
                .select("*, lesson:lessons(id, title)")
                .or(`challenger_id.eq.${user.id},challenged_id.eq.${user.id}`)
                .order("created_at", { ascending: false });
            if (error)
                throw error;
            return data || [];
        },
        enabled: !!user,
    });
}
export function useCreateChallenge() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ challengedId, lessonId }) => {
            if (!user)
                throw new Error("Not authenticated");
            const { error } = await supabase
                .from("challenges")
                .insert({
                challenger_id: user.id,
                challenged_id: challengedId,
                lesson_id: lessonId,
            });
            if (error)
                throw error;
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
        mutationFn: async ({ challengeId, score, isChallenger }) => {
            if (!user)
                throw new Error("Not authenticated");
            // Fetch current challenge state first
            const { data: current, error: fetchError } = await supabase
                .from("challenges")
                .select("challenger_score, challenged_score")
                .eq("id", challengeId)
                .single();
            if (fetchError) throw fetchError;
            // Determine if both sides have now submitted
            const challengerScore = isChallenger ? score : current.challenger_score;
            const challengedScore = isChallenger ? current.challenged_score : score;
            const bothSubmitted = challengerScore !== null && challengerScore !== undefined
                && challengedScore !== null && challengedScore !== undefined;
            const updateData = {
                ...(isChallenger ? { challenger_score: score } : { challenged_score: score }),
                ...(bothSubmitted ? { status: "completed", completed_at: new Date().toISOString() } : {}),
            };
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

export function useDeclineChallenge() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (challengeId) => {
            if (!user) throw new Error("Not authenticated");
            // Just delete the challenge to decline it
            const { error } = await supabase
                .from("challenges")
                .delete()
                .eq("id", challengeId);
            
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["challenges"] });
        },
    });
}
