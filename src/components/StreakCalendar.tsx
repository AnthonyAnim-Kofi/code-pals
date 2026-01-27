import { useState } from "react";
import { ChevronLeft, ChevronRight, Flame, Snowflake, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakCalendarProps {
  currentStreak: number;
  lastPracticeDate: string | null;
  streakFreezeCount: number;
  lastStreakFreezeUsed: string | null;
}

export function StreakCalendar({ 
  currentStreak, 
  lastPracticeDate,
  streakFreezeCount,
  lastStreakFreezeUsed 
}: StreakCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastPractice = lastPracticeDate ? new Date(lastPracticeDate) : null;
  const lastFreezeUsed = lastStreakFreezeUsed ? new Date(lastStreakFreezeUsed) : null;
  
  // Calculate streak days - work backwards from last practice date
  const streakDays = new Set<string>();
  const frozenDays = new Set<string>();
  
  if (lastPractice && currentStreak > 0) {
    const practiceDate = new Date(lastPractice);
    practiceDate.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < currentStreak; i++) {
      const date = new Date(practiceDate);
      date.setDate(date.getDate() - i);
      streakDays.add(date.toISOString().split('T')[0]);
    }
  }
  
  // Mark frozen days
  if (lastFreezeUsed) {
    const freezeDate = new Date(lastFreezeUsed);
    freezeDate.setHours(0, 0, 0, 0);
    frozenDays.add(freezeDate.toISOString().split('T')[0]);
  }
  
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    return { daysInMonth, startingDay };
  };
  
  const { daysInMonth, startingDay } = getDaysInMonth(currentMonth);
  
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };
  
  const getDayStatus = (day: number): 'streak' | 'frozen' | 'missed' | 'future' | 'none' => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    date.setHours(0, 0, 0, 0);
    const dateStr = date.toISOString().split('T')[0];
    
    if (date > today) return 'future';
    if (frozenDays.has(dateStr)) return 'frozen';
    if (streakDays.has(dateStr)) return 'streak';
    
    // Check if this day was a missed day (within streak period but not practiced)
    if (lastPractice && date < lastPractice && date >= new Date(lastPractice.getTime() - (currentStreak * 24 * 60 * 60 * 1000))) {
      if (!streakDays.has(dateStr) && !frozenDays.has(dateStr)) {
        return 'missed';
      }
    }
    
    return 'none';
  };
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  return (
    <div className="p-4 bg-card rounded-2xl border border-border">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-foreground">Streak Calendar</h3>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigateMonth('prev')}
            className="p-1 hover:bg-muted rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <span className="text-sm font-medium text-foreground min-w-[120px] text-center">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </span>
          <button 
            onClick={() => navigateMonth('next')}
            className="p-1 hover:bg-muted rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>
      
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <div key={i} className="text-center text-xs font-semibold text-muted-foreground py-1">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for days before the 1st */}
        {Array.from({ length: startingDay }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}
        
        {/* Days */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const status = getDayStatus(day);
          const isToday = 
            day === today.getDate() && 
            currentMonth.getMonth() === today.getMonth() && 
            currentMonth.getFullYear() === today.getFullYear();
          
          return (
            <div
              key={day}
              className={cn(
                "aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all relative",
                status === 'streak' && "bg-accent/20 text-accent",
                status === 'frozen' && "bg-secondary/20 text-secondary",
                status === 'missed' && "bg-destructive/20 text-destructive",
                status === 'future' && "text-muted-foreground/50",
                status === 'none' && "text-muted-foreground",
                isToday && "ring-2 ring-primary ring-offset-2 ring-offset-card"
              )}
            >
              {status === 'streak' && (
                <Flame className="w-4 h-4 absolute top-0 right-0 text-accent" />
              )}
              {status === 'frozen' && (
                <Snowflake className="w-4 h-4 absolute top-0 right-0 text-secondary" />
              )}
              {status === 'missed' && (
                <X className="w-3 h-3 absolute top-0 right-0 text-destructive" />
              )}
              {day}
            </div>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-border text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-accent/20 flex items-center justify-center">
            <Flame className="w-2 h-2 text-accent" />
          </div>
          <span className="text-muted-foreground">Streak day</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-secondary/20 flex items-center justify-center">
            <Snowflake className="w-2 h-2 text-secondary" />
          </div>
          <span className="text-muted-foreground">Freeze used</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-destructive/20 flex items-center justify-center">
            <X className="w-2 h-2 text-destructive" />
          </div>
          <span className="text-muted-foreground">Missed</span>
        </div>
      </div>
      
      {/* Stats */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-accent" />
          <span className="font-bold text-foreground">{currentStreak} day streak</span>
        </div>
        <div className="flex items-center gap-2">
          <Snowflake className="w-5 h-5 text-secondary" />
          <span className="font-bold text-foreground">{streakFreezeCount} freezes</span>
        </div>
      </div>
    </div>
  );
}
