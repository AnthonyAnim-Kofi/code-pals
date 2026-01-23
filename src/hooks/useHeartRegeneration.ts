import { useEffect, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "./useNotifications";

const REGEN_INTERVAL_MS = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
const MAX_HEARTS = 5;

export function useHeartRegeneration(currentHearts: number, regenStartedAt: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { notifyHeartRefilled } = useNotifications();
  const [timeUntilNextHeart, setTimeUntilNextHeart] = useState<number | null>(null);

  const regenerateHeart = useCallback(async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("hearts, heart_regeneration_started_at")
        .eq("user_id", user.id)
        .single();

      if (!profile) return;

      const hearts = profile.hearts ?? 0;
      if (hearts >= MAX_HEARTS) {
        // Stop regeneration timer
        await supabase
          .from("profiles")
          .update({ heart_regeneration_started_at: null })
          .eq("user_id", user.id);
        setTimeUntilNextHeart(null);
        return;
      }

      // Add one heart
      const newHearts = Math.min(hearts + 1, MAX_HEARTS);
      await supabase
        .from("profiles")
        .update({
          hearts: newHearts,
          heart_regeneration_started_at: newHearts < MAX_HEARTS ? new Date().toISOString() : null,
        })
        .eq("user_id", user.id);

      queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      notifyHeartRefilled();
    } catch (error) {
      console.error("Error regenerating heart:", error);
    }
  }, [user, queryClient, notifyHeartRefilled]);

  useEffect(() => {
    if (!user || currentHearts >= MAX_HEARTS) {
      setTimeUntilNextHeart(null);
      return;
    }

    // Start regeneration timer if not already started
    const startRegeneration = async () => {
      if (!regenStartedAt && currentHearts < MAX_HEARTS) {
        await supabase
          .from("profiles")
          .update({ heart_regeneration_started_at: new Date().toISOString() })
          .eq("user_id", user.id);
      }
    };
    startRegeneration();

    const calculateTimeRemaining = () => {
      if (!regenStartedAt) return REGEN_INTERVAL_MS;
      const startTime = new Date(regenStartedAt).getTime();
      const elapsed = Date.now() - startTime;
      return Math.max(0, REGEN_INTERVAL_MS - elapsed);
    };

    const updateTimer = () => {
      const remaining = calculateTimeRemaining();
      setTimeUntilNextHeart(remaining);

      if (remaining <= 0) {
        regenerateHeart();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [user, currentHearts, regenStartedAt, regenerateHeart]);

  const formatTimeRemaining = useCallback((ms: number | null): string => {
    if (ms === null) return "";
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }, []);

  return {
    timeUntilNextHeart,
    formattedTime: formatTimeRemaining(timeUntilNextHeart),
    isRegenerating: currentHearts < MAX_HEARTS,
  };
}
