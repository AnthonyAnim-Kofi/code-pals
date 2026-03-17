import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
export function useStreakHistory() {
    const { user } = useAuth();
    return useQuery({
        queryKey: ["streak-history", user?.id],
        queryFn: async () => {
            if (!user)
                return [];
            const { data, error } = await supabase
                .from("streak_history")
                .select("activity_date, activity_type")
                .eq("user_id", user.id)
                .order("activity_date", { ascending: false });
            if (error) {
                if (error.code === "42P01")
                    return []; // relation does not exist (migration not run yet)
                throw error;
            }
            return (data || []);
        },
        enabled: !!user,
    });
}
