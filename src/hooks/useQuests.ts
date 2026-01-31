import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

function isoDate(d: Date) {
  return d.toISOString().split("T")[0];
}

// Week resets on Sunday (use local time to match UX)
export function getWeekStartSundayISO(now = new Date()) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 = Sunday
  d.setDate(d.getDate() - day);
  return isoDate(d);
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  quest_type: string;
  target_value: number;
  gem_reward: number;
  is_weekly: boolean;
}

export interface QuestProgress {
  id: string;
  user_id: string;
  quest_id: string;
  current_value: number;
  completed: boolean;
  claimed: boolean;
  quest_date: string;
  quest?: Quest;
}

export function useQuests() {
  return useQuery({
    queryKey: ["quests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_quests")
        .select("*")
        .order("is_weekly", { ascending: true });
      
      if (error) throw error;
      return data as Quest[];
    },
  });
}

export function useQuestProgress() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["quest-progress", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const today = isoDate(new Date());
      const weekStart = getWeekStartSundayISO();
      
      const { data, error } = await supabase
        .from("user_quest_progress")
        .select(`
          *,
          quest:daily_quests(*)
        `)
        .eq("user_id", user.id)
        .in("quest_date", [today, weekStart]);
      
      if (error) throw error;
      return data as (QuestProgress & { quest: Quest })[];
    },
    enabled: !!user,
  });
}

export function useInitializeQuestProgress() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (quests: Quest[]) => {
      if (!user) throw new Error("Not authenticated");
      
      const today = isoDate(new Date());
      const weekStart = getWeekStartSundayISO();
      
      // Check existing progress for today (daily) and this week start (weekly)
      const { data: existing } = await supabase
        .from("user_quest_progress")
        .select("quest_id")
        .eq("user_id", user.id)
        .in("quest_date", [today, weekStart]);
      
      const existingQuestIds = new Set(existing?.map((p) => p.quest_id) || []);
      
      // Create progress entries for new quests (daily uses today, weekly uses weekStart)
      const newEntries = quests
        .filter((q) => !existingQuestIds.has(q.id))
        .map((quest) => ({
          user_id: user.id,
          quest_id: quest.id,
          current_value: 0,
          completed: false,
          claimed: false,
          quest_date: quest.is_weekly ? weekStart : today,
        }));
      
      if (newEntries.length > 0) {
        const { error } = await supabase
          .from("user_quest_progress")
          .insert(newEntries);
        
        if (error) throw error;
      }
      
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quest-progress"] });
    },
  });
}

export function useUpdateQuestProgress() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      questType,
      incrementBy,
    }: {
      questType: string;
      incrementBy: number;
    }) => {
      if (!user) throw new Error("Not authenticated");
      
      const today = isoDate(new Date());
      const weekStart = getWeekStartSundayISO();
      
      // Get all quests of this type (daily + weekly)
      const { data: quests } = await supabase
        .from("daily_quests")
        .select("id, target_value, is_weekly")
        .eq("quest_type", questType);
      
      if (!quests || quests.length === 0) return;
      
      // Update progress for each matching quest (create row if missing so lesson activity counts)
      for (const quest of quests) {
        const questDate = quest.is_weekly ? weekStart : today;
        const { data: progress } = await supabase
          .from("user_quest_progress")
          .select("*")
          .eq("user_id", user.id)
          .eq("quest_id", quest.id)
          .eq("quest_date", questDate)
          .maybeSingle();

        const currentValue = progress?.current_value ?? 0;
        const newValue = Math.min(currentValue + incrementBy, quest.target_value);
        const isCompleted = newValue >= quest.target_value;

        if (progress && !progress.claimed) {
          await supabase
            .from("user_quest_progress")
            .update({
              current_value: newValue,
              completed: isCompleted,
              completed_at: isCompleted && !progress.completed ? new Date().toISOString() : progress.completed_at,
            })
            .eq("id", progress.id);
        } else if (!progress) {
          // Create progress row so quest page reflects lesson activity even if user hasn't visited Quests
          await supabase.from("user_quest_progress").insert({
            user_id: user.id,
            quest_id: quest.id,
            quest_date: questDate,
            current_value: newValue,
            completed: isCompleted,
            completed_at: isCompleted ? new Date().toISOString() : null,
            claimed: false,
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quest-progress"] });
    },
  });
}

export function useClaimQuestReward() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ progressId, gemReward }: { progressId: string; gemReward: number }) => {
      if (!user) throw new Error("Not authenticated");
      
      // Mark as claimed
      const { error: updateError } = await supabase
        .from("user_quest_progress")
        .update({
          claimed: true,
          claimed_at: new Date().toISOString(),
        })
        .eq("id", progressId)
        .eq("user_id", user.id);
      
      if (updateError) throw updateError;
      
      // Add gems to user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("gems")
        .eq("user_id", user.id)
        .single();
      
      const { error: gemsError } = await supabase
        .from("profiles")
        .update({ gems: (profile?.gems || 0) + gemReward })
        .eq("user_id", user.id);
      
      if (gemsError) throw gemsError;
      
      return { gemReward };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quest-progress"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}
