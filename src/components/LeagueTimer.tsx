import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

export function LeagueTimer() {
  const [timeRemaining, setTimeRemaining] = useState("");

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0 = Sunday
      
      // Calculate days until next Sunday at midnight
      const daysUntilSunday = dayOfWeek === 0 ? 7 : 7 - dayOfWeek;
      
      // Get next Sunday at midnight
      const nextSunday = new Date(now);
      nextSunday.setDate(now.getDate() + daysUntilSunday);
      nextSunday.setHours(0, 0, 0, 0);
      
      const diff = nextSunday.getTime() - now.getTime();
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      if (days > 0) {
        return `${days}d ${hours}h ${minutes}m`;
      }
      return `${hours}h ${minutes}m ${seconds}s`;
    };

    const updateTimer = () => {
      setTimeRemaining(calculateTimeRemaining());
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl border border-primary/20">
      <Clock className="w-5 h-5 text-primary" />
      <div>
        <p className="text-xs text-muted-foreground">League ends in</p>
        <p className="font-bold text-foreground">{timeRemaining}</p>
      </div>
    </div>
  );
}
