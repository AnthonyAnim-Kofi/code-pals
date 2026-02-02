import { useEffect, useState } from "react";
import { Target, Gift, Zap, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useQuests, useQuestProgress, useInitializeQuestProgress, useClaimQuestReward, getWeekStartSundayISO } from "@/hooks/useQuests";
import { useUserProfile } from "@/hooks/useUserProgress";
import { toast } from "sonner";

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

interface QuestCardProps {
  quest: {
    id: string;
    title: string;
    description: string;
    target_value: number;
    gem_reward: number;
  };
  progress: {
    id: string;
    current_value: number;
    completed: boolean;
    claimed: boolean;
  } | null;
  onClaim: (progressId: string, gemReward: number) => Promise<void>;
  claimingId: string | null;
}

function QuestCard({ quest, progress, onClaim, claimingId }: QuestCardProps) {
  const currentValue = progress?.current_value || 0;
  const progressPercent = Math.min((currentValue / quest.target_value) * 100, 100);
  const isCompleted = progress?.completed || false;
  const isClaimed = progress?.claimed || false;
  const isThisOneClaiming = claimingId === progress?.id;

  return (
    <div
      className={cn(
        "p-4 bg-card rounded-2xl border border-border card-elevated transition-all",
        isCompleted && !isClaimed && "bg-primary/5 border-primary/30",
        isClaimed && "opacity-60"
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
            isCompleted ? "bg-primary" : "bg-muted"
          )}
        >
          {isCompleted ? (
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
              <span className="text-sm font-bold text-golden">{quest.gem_reward}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Progress 
              value={progressPercent} 
              size="sm" 
              indicatorColor={isClaimed ? "secondary" : isCompleted ? "primary" : "gradient"} 
            />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {currentValue} / {quest.target_value}
              </span>
              {isCompleted && !isClaimed && (
                <Button 
                  size="sm" 
                  variant="golden" 
                  className="h-8"
                  onClick={() => onClaim(progress!.id, quest.gem_reward)}
                  disabled={claimingId !== null}
                >
                  {isThisOneClaiming ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Claim"
                  )}
                </Button>
              )}
              {isClaimed && (
                <span className="text-sm text-muted-foreground font-medium">Claimed ✓</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Quests() {
  const { data: quests, isLoading: questsLoading } = useQuests();
  const { data: progressData, isLoading: progressLoading } = useQuestProgress();
  const { data: profile } = useUserProfile();
  const initializeProgress = useInitializeQuestProgress();
  const claimReward = useClaimQuestReward();
  const [claimingId, setClaimingId] = useState<string | null>(null);

  // Initialize quest progress for today when quests are loaded
  useEffect(() => {
    if (quests && quests.length > 0) {
      initializeProgress.mutate(quests);
    }
  }, [quests]);

  const handleClaim = async (progressId: string, gemReward: number) => {
    setClaimingId(progressId);
    try {
      await claimReward.mutateAsync({ progressId, gemReward });
      toast.success(`+${gemReward} gems claimed!`, {
        description: "Your reward has been added to your account",
      });
    } catch (error) {
      toast.error("Failed to claim reward");
    } finally {
      setClaimingId(null);
    }
  };

  const isLoading = questsLoading || progressLoading;

  const dailyQuests = quests?.filter((q) => !q.is_weekly) || [];
  const weeklyQuests = quests?.filter((q) => q.is_weekly) || [];
  const today = todayISO();
  const weekStart = getWeekStartSundayISO();

  const getProgressForQuest = (quest: { id: string; is_weekly: boolean }) => {
    const questDate = quest.is_weekly ? weekStart : today;
    return progressData?.find((p) => p.quest_id === quest.id && p.quest_date === questDate) || null;
  };

  const totalClaimableGems = progressData
    ?.filter((p) => p.completed && !p.claimed)
    .reduce((acc, p) => {
      const quest = quests?.find((q) => q.id === p.quest_id);
      return acc + (quest?.gem_reward || 0);
    }, 0) || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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
            <QuestCard 
              key={quest.id} 
              quest={quest} 
              progress={getProgressForQuest(quest)}
              onClaim={handleClaim}
              claimingId={claimingId}
            />
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
            <QuestCard 
              key={quest.id} 
              quest={quest} 
              progress={getProgressForQuest(quest)}
              onClaim={handleClaim}
              claimingId={claimingId}
            />
          ))}
        </div>
      </div>

      {/* Reward Summary */}
      <div className="p-4 bg-gradient-to-r from-golden to-accent rounded-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-golden-foreground/80 text-sm">Available rewards</p>
            <p className="text-2xl font-extrabold text-golden-foreground">
              {totalClaimableGems} Gems
            </p>
          </div>
          <div className="text-right">
            <p className="text-golden-foreground/80 text-sm">Your gems</p>
            <p className="text-2xl font-extrabold text-golden-foreground">
              {profile?.gems || 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
