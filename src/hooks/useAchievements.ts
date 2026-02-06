/**
 * useAchievements – Hooks for fetching achievements and checking/awarding new ones.
 * Achievement types: lessons_completed, streak, xp, following, challenges, perfect_lesson, league.
 * Sends browser notifications AND in-app toast notifications when achievements are earned.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { toast } from "sonner";

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

/** Fetches all available achievements sorted by requirement value */
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

/** Fetches the current user's earned achievements */
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

/**
 * Checks user stats against all achievements and awards any newly earned ones.
 * Sends both browser push notifications and in-app toast notifications.
 */
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
      
      const { data: achievements } = await supabase
        .from("achievements")
        .select("*");
      
      const { data: userAchievements } = await supabase
        .from("user_achievements")
        .select("achievement_id")
        .eq("user_id", user.id);
      
      const earnedIds = new Set(userAchievements?.map(ua => ua.achievement_id) || []);
      const newAchievements: Array<{ id: string; name: string; icon: string }> = [];
      
      // Check each achievement against user's current stats
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
          newAchievements.push({ id: achievement.id, name: achievement.name, icon: achievement.icon });
        }
      }
      
      // Insert newly earned achievements and send notifications
      if (newAchievements.length > 0) {
        await supabase
          .from("user_achievements")
          .insert(newAchievements.map(a => ({
            user_id: user.id,
            achievement_id: a.id,
          })));
        
        // Send both browser notification AND in-app toast for each achievement
        for (const achievement of newAchievements) {
          // Browser push notification
          notifyAchievementUnlock(achievement.name);
          
          // In-app toast notification with achievement icon
          toast.success(`🏆 Achievement Unlocked!`, {
            description: `${achievement.icon} ${achievement.name}`,
            duration: 6000,
          });
        }
      }
      
      return newAchievements.length;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-achievements"] });
    },
  });
}
