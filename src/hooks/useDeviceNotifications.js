import { useEffect, useCallback } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { HOLIDAYS, getWesternEasterSunday } from '../components/ThemeContext';
import { Capacitor } from '@capacitor/core';

/**
 * useDeviceNotifications - Hook to manage native device notifications via Capacitor.
 * Schedules holiday alerts and daily reminders based on the app's global calendar.
 */
export function useDeviceNotifications() {
  
  const scheduleHolidayAlerts = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return;

    try {
      // 1. Request permissions if not granted
      const perm = await LocalNotifications.checkPermissions();
      if (perm.display !== 'granted') {
        const req = await LocalNotifications.requestPermissions();
        if (req.display !== 'granted') return;
      }

      // 2. Clear existing scheduled notifications to avoid duplicates
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel(pending);
      }

      // 3. Map holiday themes to human-readable titles/messages
      const holidayMessages = {
        'theme-christmas': { title: "Merry Christmas! 🎄", body: "Celebrate the season with a new coding lesson!" },
        'theme-halloween': { title: "Happy Halloween! 🎃", body: "Spooky good code challenges are waiting for you." },
        'theme-valentine': { title: "Happy Valentine's! 💖", body: "Spread some love by completing a streak today." },
        'theme-easter': { title: "Happy Easter! 🌸", body: "Egg-citing new lessons have been unlocked!" },
        'theme-stpatricks': { icon: '🍀', title: "Happy St. Patrick's! 🍀", body: "Is today your lucky day to reach the top of the leaderboard?" },
        'theme-earth': { title: "Happy Earth Day! 🌍", body: "Let's keep the earth green and your code clean." },
        'theme-summer': { title: "Summer Vibes! ☀️", body: "Soak up the sun and some new programming knowledge." },
        'theme-newyear': { title: "Happy New Year! 🎆", body: "New year, new coding goals. Start 2026 strong!" },
        'theme-lunar': { title: "Happy Lunar New Year! 🏮", body: "Wishing you prosperity and bug-free code!" },
        'theme-independence': { title: "Happy Independence Day! 🇺🇸", body: "Celebrate liberty with a free practice session!" },
        'theme-anniversary': { title: "CodeBear Anniversary! 🎉", body: "We're 1 year old! Come join the celebration." },
        'theme-diwali': { title: "Happy Diwali! 🪔", body: "May your code be as bright as the festival of lights!" },
        'theme-ramadan': { title: "Ramadan Kareem! 🌙", body: "Wishing you a peaceful and productive month." },
        'theme-autumn': { title: "Happy Thanksgiving! 🍂", body: "We're thankful for learners like you. Keep it up!" },
      };

      const now = new Date();
      const year = 2026; // Site uses 2026 context as per user preference

      const notifications = HOLIDAYS.map((holiday, index) => {
        const msg = holidayMessages[holiday.name] || { title: "Holiday Surprise!", body: "Check out the special holiday theme!" };
        
        // Schedule for the START of the holiday at 9:00 AM
        const scheduleDate = new Date(year, holiday.start.m - 1, holiday.start.d, 9, 0, 0);
        
        // If the date has already passed in the real world, schedule for next year (though app context is 2026)
        // For 2026 simulation, we just schedule them all
        
        return {
          title: msg.title,
          body: msg.body,
          id: 1000 + index,
          schedule: { at: scheduleDate },
          sound: 'res://notification.mp3', // Uses custom notification sound if available in native assets
          extra: { theme: holiday.name }
        };
      });

      const easter = getWesternEasterSunday(year);
      const easterMsg = holidayMessages['theme-easter'];
      notifications.push({
        title: easterMsg.title,
        body: easterMsg.body,
        id: 1000 + HOLIDAYS.length,
        schedule: { at: new Date(year, easter.getMonth(), easter.getDate(), 9, 0, 0) },
        sound: 'res://notification.mp3',
        extra: { theme: 'theme-easter' },
      });

      // 4. Add a daily streak reminder (8 PM every day)
      notifications.push({
        title: "Don't break your streak! 🔥",
        body: "You're doing great! Keep the momentum going with one quick lesson.",
        id: 9999,
        schedule: {
          allowWhileIdle: true,
          repeats: true,
          every: 'day',
          on: { hour: 20, minute: 0 }
        }
      });

      await LocalNotifications.schedule({ notifications });
      console.log("Registered native notifications for 2026 calendar.");

    } catch (err) {
      console.error("Failed to schedule native notifications:", err);
    }
  }, []);

  useEffect(() => {
    scheduleHolidayAlerts();
  }, [scheduleHolidayAlerts]);

  return { scheduleHolidayAlerts };
}
