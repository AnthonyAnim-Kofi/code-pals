import React, { createContext, useContext, useEffect, useState } from 'react';

// Define the precise holiday boundaries
// Month is 1-indexed (1 = Jan, 12 = Dec)
// Easter is NOT listed here — it uses computed Western Easter (see isEasterThemeActive) so it does not stay on through April.
export const HOLIDAYS = [
  { name: 'theme-newyear', start: { m: 12, d: 31 }, end: { m: 1, d: 2 } },
  { name: 'theme-lunar', start: { m: 1, d: 20 }, end: { m: 2, d: 15 } }, // Approx Lunar New Year Window
  { name: 'theme-valentine', start: { m: 2, d: 10 }, end: { m: 2, d: 15 } },
  { name: 'theme-stpatricks', start: { m: 3, d: 15 }, end: { m: 3, d: 17 } },
  { name: 'theme-earth', start: { m: 4, d: 20 }, end: { m: 4, d: 22 } },
  { name: 'theme-summer', start: { m: 6, d: 20 }, end: { m: 7, d: 10 } },
  { name: 'theme-independence', start: { m: 7, d: 1 }, end: { m: 7, d: 7 } }, // July 4th week
  { name: 'theme-anniversary', start: { m: 10, d: 10 }, end: { m: 10, d: 15 } }, // Oct 10th
  { name: 'theme-halloween', start: { m: 10, d: 25 }, end: { m: 10, d: 31 } },
  { name: 'theme-diwali', start: { m: 10, d: 20 }, end: { m: 11, d: 15 } }, // Approx Diwali window
  { name: 'theme-autumn', start: { m: 11, d: 16 }, end: { m: 11, d: 30 } }, // Thanksgiving / Late Autumn
  { name: 'theme-christmas', start: { m: 12, d: 15 }, end: { m: 12, d: 30 } },
  { name: 'theme-ramadan', start: { m: 2, d: 17 }, end: { m: 3, d: 19 } }, // Approx Ramadan window 2026
];

/** For Settings dropdown — includes Easter (calendar-driven separately). */
export const HOLIDAYS_FOR_SETTINGS = [...HOLIDAYS, { name: 'theme-easter' }];

/** Gregorian Western Easter Sunday (Anonymous algorithm). */
export function getWesternEasterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

/** Easter theme: Palm Sunday through Easter Monday only (local calendar dates). */
function isEasterThemeActive(date) {
  const y = date.getFullYear();
  const easter = getWesternEasterSunday(y);
  const start = new Date(easter);
  start.setDate(easter.getDate() - 7);
  start.setHours(0, 0, 0, 0);
  const end = new Date(easter);
  end.setDate(easter.getDate() + 1);
  end.setHours(23, 59, 59, 999);
  const t = date.getTime();
  return t >= start.getTime() && t <= end.getTime();
}

const ROOT_SEASONAL_CLASSES = ['theme-default', 'theme-easter', ...HOLIDAYS.map((h) => h.name)];

function isDateInRange(date, start, end) {
  const m = date.getMonth() + 1;
  const d = date.getDate();

  // Handle cross-year holidays (e.g., Dec 31 to Jan 2)
  if (start.m > end.m) {
    return (m === start.m && d >= start.d) || (m === end.m && d <= end.d);
  }

  // Same month
  if (start.m === end.m) {
    return m === start.m && d >= start.d && d <= end.d;
  }

  // Cross-month within the same year
  if (m === start.m && d >= start.d) return true;
  if (m === end.m && d <= end.d) return true;
  if (m > start.m && m < end.m) return true;

  return false;
}

function getCurrentHolidayTheme(mockDate) {
  const now = mockDate ? new Date(mockDate) : new Date();

  if (isEasterThemeActive(now)) {
    return 'theme-easter';
  }

  for (const holiday of HOLIDAYS) {
    if (isDateInRange(now, holiday.start, holiday.end)) {
      return holiday.name;
    }
  }
  return 'theme-default'; // No active holiday theme
}

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // Allow manual override for testing/admin
  const [overrideTheme, setOverrideTheme] = useState(null);
  const [currentTheme, setCurrentTheme] = useState('theme-default');

  useEffect(() => {
    const applyTheme = () => {
      const activeTheme = overrideTheme || getCurrentHolidayTheme();
      setCurrentTheme(activeTheme);

      const root = document.documentElement;
      ROOT_SEASONAL_CLASSES.forEach((cls) => root.classList.remove(cls));
      root.classList.add(activeTheme);
    };

    applyTheme();

    // Re-check periodically so themes auto-revert when a holiday window ends
    const intervalId = setInterval(applyTheme, 60 * 60 * 1000); // hourly

    // Re-check when tab becomes visible again (covers day rollovers on idle tabs)
    const onVisible = () => {
      if (document.visibilityState === 'visible') applyTheme();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [overrideTheme]);

  return (
    <ThemeContext.Provider value={{ currentTheme, overrideTheme, setOverrideTheme, HOLIDAYS, HOLIDAYS_FOR_SETTINGS }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
