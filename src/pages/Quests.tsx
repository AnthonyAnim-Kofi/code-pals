import { Target, Gift, Zap, CheckCircle2, Circle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const dailyQuests = [
  {
    id: 1,
    title: "Earn 50 XP",
    description: "Complete lessons to earn XP",
    current: 30,
    target: 50,
    reward: 10,
    completed: false,
  },
  {
    id: 2,
    title: "Complete 3 lessons",
    description: "Finish any 3 lessons today",
    current: 2,
    target: 3,
    reward: 15,
    completed: false,
  },
  {
    id: 3,
    title: "Get 5 answers correct",
    description: "Answer correctly without hints",
    current: 5,
    target: 5,
    reward: 20,
    completed: true,
  },
];

const weeklyQuests = [
  {
    id: 4,
    title: "7-day streak",
    description: "Practice every day for a week",
    current: 5,
    target: 7,
    reward: 100,
    completed: false,
  },
  {
    id: 5,
    title: "Earn 500 XP",
    description: "Total XP earned this week",
    current: 320,
    target: 500,
    reward: 50,
    completed: false,
  },
];

interface QuestCardProps {
  quest: {
    id: number;
    title: string;
    description: string;
    current: number;
    target: number;
    reward: number;
    completed: boolean;
  };
}

function QuestCard({ quest }: QuestCardProps) {
  const progress = (quest.current / quest.target) * 100;

  return (
    <div
      className={cn(
        "p-4 bg-card rounded-2xl border border-border card-elevated transition-all",
        quest.completed && "bg-primary/5 border-primary/30"
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
            quest.completed ? "bg-primary" : "bg-muted"
          )}
        >
          {quest.completed ? (
            <CheckCircle2 className="w-6 h-6 text-primary-foreground" />
          ) : (
            <Target className="w-6 h-6 text-muted-foreground" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h3 className="font-bold text-foreground">{quest.title}</h3>
              <p className="text-sm text-muted-foreground">{quest.description}</p>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-golden/20 rounded-lg shrink-0">
              <Gift className="w-4 h-4 text-golden" />
              <span className="text-sm font-bold text-golden">{quest.reward}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Progress value={progress} size="sm" indicatorColor={quest.completed ? "primary" : "gradient"} />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {quest.current} / {quest.target}
              </span>
              {quest.completed && (
                <Button size="sm" variant="golden" className="h-8">
                  Claim
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Quests() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground mb-2 flex items-center gap-2">
          <Target className="w-7 h-7 text-accent" />
          Quests
        </h1>
        <p className="text-muted-foreground">
          Complete quests to earn bonus rewards and gems
        </p>
      </div>

      {/* Daily Quests */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <Circle className="w-5 h-5 text-primary fill-primary" />
          Daily Quests
        </h2>
        <div className="space-y-3">
          {dailyQuests.map((quest) => (
            <QuestCard key={quest.id} quest={quest} />
          ))}
        </div>
      </div>

      {/* Weekly Quests */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-golden" />
          Weekly Quests
        </h2>
        <div className="space-y-3">
          {weeklyQuests.map((quest) => (
            <QuestCard key={quest.id} quest={quest} />
          ))}
        </div>
      </div>

      {/* Reward Summary */}
      <div className="p-4 bg-gradient-to-r from-golden to-accent rounded-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-golden-foreground/80 text-sm">Available rewards</p>
            <p className="text-2xl font-extrabold text-golden-foreground">20 Gems</p>
          </div>
          <Button variant="outline" className="bg-white/20 border-white/30 text-golden-foreground hover:bg-white/30">
            Claim All
          </Button>
        </div>
      </div>
    </div>
  );
}
