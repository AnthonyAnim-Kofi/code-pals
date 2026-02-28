/**
 * StudyStatsSection – Monthly study calendar heatmap and time-per-language bar chart.
 */
import { useStudyStats } from "@/hooks/useUserProgress";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis } from "recharts";
import { Loader2, Calendar, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const HEATMAP_WEEKS = 12;
const DAYS_PER_WEEK = 7;

function StudyHeatmap() {
  const { data, isLoading } = useStudyStats();

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-[120px] rounded-xl bg-muted/30">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const { byDate } = data;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxMinutes = Math.max(1, ...Object.values(byDate));

  const cells: { date: string; minutes: number }[] = [];
  for (let i = HEATMAP_WEEKS * DAYS_PER_WEEK - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    cells.push({ date: dateStr, minutes: byDate[dateStr] || 0 });
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">Last {HEATMAP_WEEKS} weeks — minutes studied per day</p>
      <div
        className="flex flex-wrap gap-1"
        style={{ width: "100%", maxWidth: HEATMAP_WEEKS * 14 }}
      >
        {cells.map((cell) => {
          const level =
            cell.minutes <= 0
              ? 0
              : cell.minutes >= maxMinutes
                ? 4
                : Math.ceil((cell.minutes / maxMinutes) * 4);
          return (
            <div
              key={cell.date}
              title={`${cell.date}: ${cell.minutes} min`}
              className={cn(
                "w-3 h-3 rounded-sm border border-border/50 transition-colors",
                level === 0 && "bg-muted/40",
                level === 1 && "bg-primary/30",
                level === 2 && "bg-primary/50",
                level === 3 && "bg-primary/70",
                level === 4 && "bg-primary"
              )}
            />
          );
        })}
      </div>
    </div>
  );
}

function TimePerLanguageChart() {
  const { data, isLoading } = useStudyStats();

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-[200px] rounded-xl bg-muted/30">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const { byLanguage } = data;
  if (byLanguage.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        Complete lessons to see time spent per language here.
      </p>
    );
  }

  const chartConfig = {
    minutes: { label: "Minutes", color: "hsl(var(--primary))" },
  };

  return (
    <ChartContainer config={chartConfig} className="h-[200px] w-full">
      <BarChart data={byLanguage} margin={{ top: 8, right: 8, bottom: 24, left: 8 }}>
        <XAxis
          dataKey="languageName"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12 }}
        />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="minutes" fill="var(--color-minutes)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}

export function StudyStatsSection() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-foreground">Study stats</h2>

      <div className="p-4 bg-card rounded-2xl border border-border card-elevated space-y-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="w-5 h-5" />
          <span className="font-medium text-foreground">Monthly activity</span>
        </div>
        <StudyHeatmap />
      </div>

      <div className="p-4 bg-card rounded-2xl border border-border card-elevated space-y-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <BarChart3 className="w-5 h-5" />
          <span className="font-medium text-foreground">Time per language</span>
        </div>
        <TimePerLanguageChart />
      </div>
    </div>
  );
}
