import React, { createContext, useContext, useEffect, useState } from 'react';

// Define the precise holiday boundaries
// Month is 1-indexed (1 = Jan, 12 = Dec)
export const HOLIDAYS = [
  { name: 'theme-newyear', start: { m: 12, d: 31 }, end: { m: 1, d: 2 } },
  { name: 'theme-lunar', start: { m: 1, d: 20 }, end: { m: 2, d: 15 } }, // Approx Lunar New Year Window
  { name: 'theme-valentine', start: { m: 2, d: 10 }, end: { m: 2, d: 15 } },
  { name: 'theme-stpatricks', start: { m: 3, d: 15 }, end: { m: 3, d: 17 } },
  { name: 'theme-easter', start: { m: 3, d: 22 }, end: { m: 4, d: 25 } }, // Approx Easter window
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
    // Determine active theme based on override or calendar
    const activeTheme = overrideTheme || getCurrentHolidayTheme();
    setCurrentTheme(activeTheme);

    // Remove all previous theme classes
    const root = document.documentElement;
    HOLIDAYS.forEach(h => root.classList.remove(h.name));
    root.classList.remove('theme-default');

    // Add new theme class
    root.classList.add(activeTheme);
  }, [overrideTheme]);

  return (
    <ThemeContext.Provider value={{ currentTheme, overrideTheme, setOverrideTheme, HOLIDAYS }}>
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
