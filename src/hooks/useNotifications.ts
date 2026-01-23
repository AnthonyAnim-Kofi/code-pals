import { useCallback, useEffect } from "react";

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

  const sendNotification = useCallback(
    async (title: string, options?: NotificationOptions) => {
      const hasPermission = await requestPermission();
      if (!hasPermission) return null;

      return new Notification(title, {
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        ...options,
      });
    },
    [requestPermission]
  );

  const notifyStreakReminder = useCallback(() => {
    sendNotification("Don't lose your streak! 🔥", {
      body: "Practice today to keep your streak alive!",
      tag: "streak-reminder",
    });
  }, [sendNotification]);

  const notifyChallengeAlert = useCallback(
    (challengerName: string) => {
      sendNotification("New Challenge! ⚔️", {
        body: `${challengerName} has challenged you to a lesson battle!`,
        tag: "challenge-alert",
      });
    },
    [sendNotification]
  );

  const notifyAchievementUnlock = useCallback(
    (achievementName: string) => {
      sendNotification("Achievement Unlocked! 🏆", {
        body: `Congratulations! You earned: ${achievementName}`,
        tag: "achievement-unlock",
      });
    },
    [sendNotification]
  );

  const notifyHeartRefilled = useCallback(() => {
    sendNotification("Heart Refilled! ❤️", {
      body: "You have a new heart! Keep learning!",
      tag: "heart-refilled",
    });
  }, [sendNotification]);

  return {
    requestPermission,
    sendNotification,
    notifyStreakReminder,
    notifyChallengeAlert,
    notifyAchievementUnlock,
    notifyHeartRefilled,
  };
}

// Hook to check streak and remind user
export function useStreakReminder(lastPracticeDate: string | null, enabled: boolean) {
  const { notifyStreakReminder, requestPermission } = useNotifications();

  useEffect(() => {
    if (!enabled || !lastPracticeDate) return;

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
