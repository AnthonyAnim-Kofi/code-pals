import { useEffect, useRef } from "react";
import { useUserProfile } from "@/hooks/useUserProgress";
import { useStreakReminder } from "@/hooks/useNotifications";
import { useChallenges } from "@/hooks/useSocial";
import { useNotifications } from "@/hooks/useNotifications";
import { supabase } from "@/integrations/supabase/client";

export function NotificationManager() {
  const { data: profile } = useUserProfile();
  const { data: challenges } = useChallenges();
  const { notifyChallengeAlert } = useNotifications();
  const notifiedChallengesRef = useRef<Set<string>>(new Set());

  // Enable streak reminders if user has a profile
  useStreakReminder(profile?.last_practice_date || null, !!profile);

  // Check for new challenges
  useEffect(() => {
    if (!challenges || challenges.length === 0 || !profile) return;

    // Get pending challenges where user is challenged
    const pendingChallenges = challenges.filter(
      (c) => c.status === "pending" && c.challenged_id === profile.user_id
    );

    // Notify about new challenges
    for (const challenge of pendingChallenges) {
      // Skip if already notified
      if (notifiedChallengesRef.current.has(challenge.id)) continue;

      // Only notify if challenge was created recently (within last 10 minutes)
      const challengeDate = new Date(challenge.created_at);
      const now = new Date();
      const diffMinutes = (now.getTime() - challengeDate.getTime()) / (1000 * 60);

      if (diffMinutes < 10) {
        // Fetch challenger's name
        supabase
          .from("profiles")
          .select("display_name, username")
          .eq("user_id", challenge.challenger_id)
          .single()
          .then(({ data }) => {
            const challengerName = data?.display_name || data?.username || "Someone";
            notifyChallengeAlert(challengerName);
            notifiedChallengesRef.current.add(challenge.id);
          });
      }
    }
  }, [challenges, profile, notifyChallengeAlert]);

  return null; // This component doesn't render anything
}
