import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement_type: string;
  requirement_value: number;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
  achievement?: Achievement;
}

export function useAchievements() {
  return useQuery({
    queryKey: ["achievements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .order("requirement_value", { ascending: true });
      
      if (error) throw error;
      return data as Achievement[];
    },
  });
}

export function useUserAchievements() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["user-achievements", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("user_achievements")
        .select("*, achievement:achievements(*)")
        .eq("user_id", user.id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}

export function useCheckAndAwardAchievements() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { notifyAchievementUnlock } = useNotifications();
  
  return useMutation({
    mutationFn: async (stats: {
      lessonsCompleted: number;
      streak: number;
      xp: number;
      following: number;
      challenges: number;
      perfectLessons: number;
      league: string;
    }) => {
      if (!user) throw new Error("Not authenticated");
      
      // Get all achievements
      const { data: achievements } = await supabase
        .from("achievements")
        .select("*");
      
      // Get user's existing achievements
      const { data: userAchievements } = await supabase
        .from("user_achievements")
        .select("achievement_id")
        .eq("user_id", user.id);
      
      const earnedIds = new Set(userAchievements?.map(ua => ua.achievement_id) || []);
      const newAchievements: Array<{ id: string; name: string }> = [];
      
      for (const achievement of achievements || []) {
        if (earnedIds.has(achievement.id)) continue;
        
        let earned = false;
        switch (achievement.requirement_type) {
          case "lessons_completed":
            earned = stats.lessonsCompleted >= achievement.requirement_value;
            break;
          case "streak":
            earned = stats.streak >= achievement.requirement_value;
            break;
          case "xp":
            earned = stats.xp >= achievement.requirement_value;
            break;
          case "following":
            earned = stats.following >= achievement.requirement_value;
            break;
          case "challenges":
            earned = stats.challenges >= achievement.requirement_value;
            break;
          case "perfect_lesson":
            earned = stats.perfectLessons >= achievement.requirement_value;
            break;
          case "league":
            const leagueLevel = { bronze: 0, silver: 1, gold: 2, diamond: 3 }[stats.league] || 0;
            earned = leagueLevel >= achievement.requirement_value;
            break;
        }
        
        if (earned) {
          newAchievements.push({ id: achievement.id, name: achievement.name });
        }
      }
      
      // Insert new achievements
      if (newAchievements.length > 0) {
        await supabase
          .from("user_achievements")
          .insert(newAchievements.map(a => ({
            user_id: user.id,
            achievement_id: a.id,
          })));
        
        // Send notifications for each new achievement
        for (const achievement of newAchievements) {
          notifyAchievementUnlock(achievement.name);
        }
      }
      
      return newAchievements.length;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-achievements"] });
    },
  });
}
