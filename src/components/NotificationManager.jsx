import { useEffect, useRef } from "react";
import { useUserProfile, useUpdateProfile } from "@/hooks/useUserProgress";
import { useStreakReminder } from "@/hooks/useNotifications";
import { useChallenges } from "@/hooks/useSocial";
import { useNotifications } from "@/hooks/useNotifications";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function NotificationManager() {
    const { data: profile } = useUserProfile();
    const updateProfile = useUpdateProfile();
    const { data: challenges } = useChallenges();
    const { notifyChallengeAlert, notifyChallengeWin, notifyChallengeLoss, notifyChallengeTie } = useNotifications();
    const notifiedChallengesRef = useRef(new Set());
    const notifiedCompletedRef = useRef(new Set());
    const streakFreezeNoticeShownRef = useRef(false);

    // Enable streak reminders if user has a profile
    useStreakReminder(profile?.last_practice_date || null, !!profile);

    // One-time login notice when auto streak freeze was used while away.
    useEffect(() => {
        if (!profile || streakFreezeNoticeShownRef.current)
            return;
        if (!profile.auto_use_streak_freeze || !profile.last_streak_freeze_used)
            return;
        const noticeSeenAt = profile.streak_freeze_notice_seen_at
            ? new Date(profile.streak_freeze_notice_seen_at).getTime()
            : 0;
        const freezeUsedAt = new Date(profile.last_streak_freeze_used).getTime();
        if (Number.isNaN(freezeUsedAt) || freezeUsedAt <= noticeSeenAt)
            return;
        streakFreezeNoticeShownRef.current = true;
        toast.success("Your streak was saved while you were away using a Streak Freeze.");
        updateProfile.mutate({
            streak_freeze_notice_seen_at: new Date().toISOString(),
        });
    }, [profile, updateProfile]);

    // Check for new (pending) challenges
    useEffect(() => {
        if (!challenges || challenges.length === 0 || !profile)
            return;
        const pendingChallenges = challenges.filter(
            (c) => c.status === "pending" && c.challenged_id === profile.user_id
        );
        for (const challenge of pendingChallenges) {
            if (notifiedChallengesRef.current.has(challenge.id))
                continue;
            const challengeDate = new Date(challenge.created_at);
            const now = new Date();
            const diffMinutes = (now.getTime() - challengeDate.getTime()) / (1000 * 60);
            if (diffMinutes < 10) {
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

    // Check for newly completed challenges and notify outcome
    useEffect(() => {
        if (!challenges || challenges.length === 0 || !profile)
            return;

        const completedChallenges = challenges.filter(
            (c) =>
                c.status === "completed" &&
                c.challenger_score !== null &&
                c.challenger_score !== undefined &&
                c.challenged_score !== null &&
                c.challenged_score !== undefined
        );

        for (const challenge of completedChallenges) {
            if (notifiedCompletedRef.current.has(challenge.id))
                continue;

            const isChallenger = challenge.challenger_id === profile.user_id;
            const myScore = isChallenger ? challenge.challenger_score : challenge.challenged_score;
            const opponentScore = isChallenger ? challenge.challenged_score : challenge.challenger_score;
            const opponentUserId = isChallenger ? challenge.challenged_id : challenge.challenger_id;

            // Only notify about recently completed challenges (within last 30 mins)
            const completedAt = challenge.completed_at ? new Date(challenge.completed_at) : null;
            if (completedAt) {
                const diffMinutes = (Date.now() - completedAt.getTime()) / (1000 * 60);
                if (diffMinutes > 30) {
                    // Mark as already handled so we don't re-process old challenges
                    notifiedCompletedRef.current.add(challenge.id);
                    continue;
                }
            }

            supabase
                .from("profiles")
                .select("display_name, username")
                .eq("user_id", opponentUserId)
                .single()
                .then(({ data }) => {
                    const opponentName = data?.display_name || data?.username || "Your opponent";
                    if (myScore > opponentScore) {
                        notifyChallengeWin(opponentName);
                    } else if (myScore < opponentScore) {
                        notifyChallengeLoss(opponentName);
                    } else {
                        notifyChallengeTie(opponentName);
                    }
                    notifiedCompletedRef.current.add(challenge.id);
                });
        }
    }, [challenges, profile, notifyChallengeWin, notifyChallengeLoss, notifyChallengeTie]);

    return null;
}
