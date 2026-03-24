/**
 * useNotifications – Browser push notification hooks for streaks, achievements,
 * challenges, hearts, and league changes. Uses Service Worker for reliability.
 */
import { useCallback, useEffect } from "react";
async function showViaServiceWorker(title, options) {
    if (!("serviceWorker" in navigator))
        return false;
    const reg = await navigator.serviceWorker.ready.catch(() => null);
    if (!reg)
        return false;
    if (!("showNotification" in reg))
        return false;
    await reg.showNotification(title, options);
    return true;
}
export function useNotifications() {
    const requestPermission = useCallback(async () => {
        if (!("Notification" in window)) {
            console.log("Browser doesn't support notifications");
            return false;
        }
        if (Notification.permission === "granted") {
            return true;
        }
        if (Notification.permission !== "denied") {
            const permission = await Notification.requestPermission();
            return permission === "granted";
        }
        return false;
    }, []);
    const sendNotification = useCallback(async (title, options) => {
        const hasPermission = await requestPermission();
        if (!hasPermission)
            return null;
        const merged = {
            icon: "/favicon.ico",
            badge: "/favicon.ico",
            ...options,
        };
        // Prefer Service Worker notifications (more reliable on mobile)
        const swShown = await showViaServiceWorker(title, merged);
        if (swShown)
            return null;
        return new Notification(title, merged);
    }, [requestPermission]);
    const notifyStreakReminder = useCallback(() => {
        sendNotification("Don't lose your streak! 🔥", {
            body: "Practice today to keep your streak alive!",
            tag: "streak-reminder",
        });
    }, [sendNotification]);
    const notifyChallengeAlert = useCallback((challengerName) => {
        sendNotification("New Challenge! ⚔️", {
            body: `${challengerName} has challenged you to a lesson battle!`,
            tag: "challenge-alert",
        });
    }, [sendNotification]);
    const notifyChallengeWin = useCallback((opponentName) => {
        sendNotification("You Won! 🏆", {
            body: `Congratulations! You beat ${opponentName} in the challenge!`,
            tag: "challenge-result",
        });
    }, [sendNotification]);
    const notifyChallengeLoss = useCallback((opponentName) => {
        sendNotification("Challenge Complete 💪", {
            body: `${opponentName} beat you this time. Better luck next time!`,
            tag: "challenge-result",
        });
    }, [sendNotification]);
    const notifyChallengeTie = useCallback((opponentName) => {
        sendNotification("It's a Tie! 🤝", {
            body: `You and ${opponentName} finished with the same score!`,
            tag: "challenge-result",
        });
    }, [sendNotification]);
    const notifyAchievementUnlock = useCallback((achievementName) => {
        sendNotification("Achievement Unlocked! 🏆", {
            body: `Congratulations! You earned: ${achievementName}`,
            tag: "achievement-unlock",
        });
    }, [sendNotification]);
    const notifyHeartRefilled = useCallback(() => {
        sendNotification("Heart Refilled! ❤️", {
            body: "You have a new heart! Keep learning!",
            tag: "heart-refilled",
        });
    }, [sendNotification]);
    const notifyLeaguePromotion = useCallback((newLeague) => {
        const leagueEmojis = {
            bronze: "🥉",
            silver: "🥈",
            gold: "🥇",
            diamond: "💎",
        };
        sendNotification("League Promotion! 🎉", {
            body: `Congratulations! You've been promoted to ${newLeague.charAt(0).toUpperCase() + newLeague.slice(1)} League ${leagueEmojis[newLeague] || ""}!`,
            tag: "league-change",
        });
    }, [sendNotification]);
    const notifyLeagueDemotion = useCallback((newLeague) => {
        sendNotification("League Update 📊", {
            body: `You've moved to ${newLeague.charAt(0).toUpperCase() + newLeague.slice(1)} League. Keep practicing to climb back up!`,
            tag: "league-change",
        });
    }, [sendNotification]);
    return {
        requestPermission,
        sendNotification,
        notifyStreakReminder,
        notifyChallengeAlert,
        notifyChallengeWin,
        notifyChallengeLoss,
        notifyChallengeTie,
        notifyAchievementUnlock,
        notifyHeartRefilled,
        notifyLeaguePromotion,
        notifyLeagueDemotion,
    };
}
// Hook to check streak and remind user
export function useStreakReminder(lastPracticeDate, enabled) {
    const { notifyStreakReminder, requestPermission } = useNotifications();
    useEffect(() => {
        if (!enabled || !lastPracticeDate)
            return;
        const checkStreak = () => {
            const last = new Date(lastPracticeDate);
            const now = new Date();
            const diffHours = (now.getTime() - last.getTime()) / (1000 * 60 * 60);
            // If it's been more than 20 hours since last practice, remind
            if (diffHours >= 20 && diffHours < 24) {
                notifyStreakReminder();
            }
        };
        // Request permission on mount
        requestPermission();
        // Check every hour
        const interval = setInterval(checkStreak, 60 * 60 * 1000);
        checkStreak(); // Check immediately
        return () => clearInterval(interval);
    }, [lastPracticeDate, enabled, notifyStreakReminder, requestPermission]);
}
