import { useState } from "react";
import { Loader2, Plus, Trash2, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAdminQuests, useCreateQuest, useDeleteQuest } from "@/hooks/useAdminQuests";
import { cn } from "@/lib/utils";

const questTypes = [
  { value: "complete_lessons", label: "Complete Lessons" },
  { value: "earn_xp", label: "Earn XP" },
  { value: "perfect_lessons", label: "Perfect Lessons" },
  { value: "maintain_streak", label: "Maintain Streak" },
  { value: "spend_gems", label: "Spend Gems" },
];

export function QuestManager() {
  const { toast } = useToast();
  const { data: quests = [], isLoading } = useAdminQuests();
  const createQuest = useCreateQuest();
  const deleteQuest = useDeleteQuest();

  const [newQuest, setNewQuest] = useState({
    title: "",
    description: "",
    quest_type: "complete_lessons",
    target_value: 1,
    gem_reward: 10,
    is_weekly: false,
  });

  const handleCreate = async () => {
    if (!newQuest.title || !newQuest.description) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }

    try {
      await createQuest.mutateAsync(newQuest);
      setNewQuest({
        title: "",
        description: "",
        quest_type: "complete_lessons",
        target_value: 1,
        gem_reward: 10,
        is_weekly: false,
      });
      toast({ title: "Quest created successfully!" });
    } catch (error) {
      toast({ title: "Error creating quest", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteQuest.mutateAsync(id);
      toast({ title: "Quest deleted successfully!" });
    } catch (error) {
      toast({ title: "Error deleting quest", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
      </div>
    );
  }

  const dailyQuests = quests.filter(q => !q.is_weekly);
  const weeklyQuests = quests.filter(q => q.is_weekly);

  return (
    <div className="space-y-6">
      {/* Create Quest Form */}
      <div className="bg-slate-700 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Target className="w-5 h-5 text-amber-500" />
          <h3 className="text-lg font-bold">Create New Quest</h3>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Title</Label>
            <Input
              value={newQuest.title}
              onChange={(e) => setNewQuest({ ...newQuest, title: e.target.value })}
              className="bg-slate-600 border-slate-500"
              placeholder="Complete 3 lessons"
            />
          </div>
          <div>
            <Label>Quest Type</Label>
            <Select
              value={newQuest.quest_type}
              onValueChange={(v) => setNewQuest({ ...newQuest, quest_type: v })}
            >
              <SelectTrigger className="bg-slate-600 border-slate-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {questTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label>Description</Label>
            <Textarea
              value={newQuest.description}
              onChange={(e) => setNewQuest({ ...newQuest, description: e.target.value })}
              className="bg-slate-600 border-slate-500"
              placeholder="Complete 3 lessons to earn gems"
            />
          </div>
          <div>
            <Label>Target Value</Label>
            <Input
              type="number"
              value={newQuest.target_value}
              onChange={(e) => setNewQuest({ ...newQuest, target_value: parseInt(e.target.value) || 1 })}
              className="bg-slate-600 border-slate-500"
              min={1}
            />
          </div>
          <div>
            <Label>Gem Reward</Label>
            <Input
              type="number"
              value={newQuest.gem_reward}
              onChange={(e) => setNewQuest({ ...newQuest, gem_reward: parseInt(e.target.value) || 10 })}
              className="bg-slate-600 border-slate-500"
              min={1}
            />
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={newQuest.is_weekly}
              onCheckedChange={(checked) => setNewQuest({ ...newQuest, is_weekly: checked })}
            />
            <Label>Weekly Quest</Label>
          </div>
        </div>

        <Button
          onClick={handleCreate}
          disabled={createQuest.isPending}
          className="mt-4 bg-amber-600 hover:bg-amber-700"
        >
          {createQuest.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Plus className="w-4 h-4 mr-2" />
          )}
          Create Quest
        </Button>
      </div>

      {/* Existing Quests */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Daily Quests */}
        <div className="bg-slate-700 rounded-xl p-6">
          <h4 className="font-bold mb-4 text-amber-400">Daily Quests ({dailyQuests.length})</h4>
          <div className="space-y-3">
            {dailyQuests.map((quest) => (
              <QuestCard key={quest.id} quest={quest} onDelete={handleDelete} />
            ))}
            {dailyQuests.length === 0 && (
              <p className="text-slate-400 text-center py-4">No daily quests</p>
            )}
          </div>
        </div>

        {/* Weekly Quests */}
        <div className="bg-slate-700 rounded-xl p-6">
          <h4 className="font-bold mb-4 text-purple-400">Weekly Quests ({weeklyQuests.length})</h4>
          <div className="space-y-3">
            {weeklyQuests.map((quest) => (
              <QuestCard key={quest.id} quest={quest} onDelete={handleDelete} />
            ))}
            {weeklyQuests.length === 0 && (
              <p className="text-slate-400 text-center py-4">No weekly quests</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function QuestCard({ 
  quest, 
  onDelete 
}: { 
  quest: { id: string; title: string; description: string; quest_type: string; target_value: number; gem_reward: number; is_weekly: boolean };
  onDelete: (id: string) => void;
}) {
  return (
    <div className="p-3 bg-slate-600 rounded-lg">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{quest.title}</p>
          <p className="text-xs text-slate-400 truncate">{quest.description}</p>
          <div className="flex items-center gap-2 mt-1 text-xs">
            <span className={cn(
              "px-2 py-0.5 rounded",
              quest.is_weekly ? "bg-purple-600" : "bg-amber-600"
            )}>
              {quest.quest_type}
            </span>
            <span>Target: {quest.target_value}</span>
            <span>💎 {quest.gem_reward}</span>
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDelete(quest.id)}
          className="text-red-400 hover:text-red-300 shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
