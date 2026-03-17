import { useState } from "react";
import { ChevronLeft, ChevronRight, Flame, Snowflake } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStreakHistory } from "@/hooks/useStreakHistory";
export function StreakCalendar({ currentStreak, streakFreezeCount, }) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const { data: history = [] } = useStreakHistory();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Build lookup sets from permanent history
    const practiceDays = new Set();
    const frozenDays = new Set();
    for (const entry of history) {
        if (entry.activity_type === "practice") {
            practiceDays.add(entry.activity_date);
        }
        else if (entry.activity_type === "freeze") {
            frozenDays.add(entry.activity_date);
        }
    }
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    const navigateMonth = (direction) => {
        setCurrentMonth((prev) => {
            const d = new Date(prev);
            d.setMonth(prev.getMonth() + (direction === "next" ? 1 : -1));
            return d;
        });
    };
    const getDayStatus = (day) => {
        const date = new Date(year, month, day);
        date.setHours(0, 0, 0, 0);
        if (date > today)
            return "future";
        const dateStr = date.toISOString().split("T")[0];
        if (frozenDays.has(dateStr))
            return "frozen";
        if (practiceDays.has(dateStr))
            return "streak";
        return "none";
    };
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
    ];
    return (<div className="p-4 bg-card rounded-2xl border border-border">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-foreground">Streak Calendar</h3>
        <div className="flex items-center gap-2">
          <button onClick={() => navigateMonth("prev")} className="p-1 hover:bg-muted rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5 text-muted-foreground"/>
          </button>
          <span className="text-sm font-medium text-foreground min-w-[120px] text-center">
            {monthNames[month]} {year}
          </span>
          <button onClick={() => navigateMonth("next")} className="p-1 hover:bg-muted rounded-lg transition-colors">
            <ChevronRight className="w-5 h-5 text-muted-foreground"/>
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (<div key={i} className="text-center text-xs font-semibold text-muted-foreground py-1">{d}</div>))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startingDay }).map((_, i) => (<div key={`e-${i}`} className="aspect-square"/>))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const status = getDayStatus(day);
            const isToday = day === today.getDate() &&
                month === today.getMonth() &&
                year === today.getFullYear();
            return (<div key={day} className={cn("aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all relative", status === "streak" && "bg-accent/20 text-accent", status === "frozen" && "bg-secondary/20 text-secondary", status === "future" && "text-muted-foreground/50", status === "none" && "text-muted-foreground", isToday && "ring-2 ring-primary ring-offset-2 ring-offset-card")}>
              {status === "streak" && <Flame className="w-4 h-4 absolute top-0 right-0 text-accent"/>}
              {status === "frozen" && <Snowflake className="w-4 h-4 absolute top-0 right-0 text-secondary"/>}
              {day}
            </div>);
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-border text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-accent/20 flex items-center justify-center">
            <Flame className="w-2 h-2 text-accent"/>
          </div>
          <span className="text-muted-foreground">Practice day</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-secondary/20 flex items-center justify-center">
            <Snowflake className="w-2 h-2 text-secondary"/>
          </div>
          <span className="text-muted-foreground">Freeze used</span>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-accent"/>
          <span className="font-bold text-foreground">{currentStreak} day streak</span>
        </div>
        <div className="flex items-center gap-2">
          <Snowflake className="w-5 h-5 text-secondary"/>
          <span className="font-bold text-foreground">{streakFreezeCount} freezes</span>
        </div>
      </div>
    </div>);
}
