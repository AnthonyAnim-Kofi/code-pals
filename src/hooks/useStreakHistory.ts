import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface StreakHistoryEntry {
  activity_date: string;
  activity_type: string; // 'practice' | 'freeze'
}

export function useStreakHistory() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["streak-history", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await (supabase as any)
        .from("streak_history")
        .select("activity_date, activity_type")
        .eq("user_id", user.id)
        .order("activity_date", { ascending: false });

      if (error) throw error;
      return (data || []) as StreakHistoryEntry[];
    },
    enabled: !!user,
  });
}
