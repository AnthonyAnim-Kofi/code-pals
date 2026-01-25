import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AdminQuest {
  id: string;
  title: string;
  description: string;
  quest_type: string;
  target_value: number;
  gem_reward: number;
  is_weekly: boolean;
  created_at: string;
}

export function useAdminQuests() {
  return useQuery({
    queryKey: ["admin-quests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_quests")
        .select("*")
        .order("is_weekly", { ascending: false })
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as AdminQuest[];
    },
  });
}

export function useCreateQuest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (quest: {
      title: string;
      description: string;
      quest_type: string;
      target_value: number;
      gem_reward: number;
      is_weekly: boolean;
    }) => {
      const { error } = await supabase
        .from("daily_quests")
        .insert(quest);
      
      if (error) throw error;
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
    mutationFn: async (questId: string) => {
      const { error } = await supabase
        .from("daily_quests")
        .delete()
        .eq("id", questId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-quests"] });
      queryClient.invalidateQueries({ queryKey: ["quests"] });
    },
  });
}
