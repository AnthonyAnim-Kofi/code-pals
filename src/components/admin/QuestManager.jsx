/**
 * QuestManager – Admin panel for managing quests with full edit support.
 */
import { useState } from "react";
import { Loader2, Plus, Trash2, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAdminQuests, useCreateQuest, useDeleteQuest, useUpdateQuest } from "@/hooks/useAdminQuests";
import { AdminEditDialog } from "./AdminEditDialog";
import { cn } from "@/lib/utils";
const questTypes = [
    { value: "complete_lessons", label: "Complete Lessons" },
    { value: "earn_xp", label: "Earn XP" },
    { value: "perfect_lessons", label: "Perfect Lessons" },
    { value: "maintain_streak", label: "Maintain Streak" },
    { value: "spend_gems", label: "Spend Gems" },
    { value: "correct_answers", label: "Correct Answers" },
];
export function QuestManager() {
    const { toast } = useToast();
    const { data: quests = [], isLoading } = useAdminQuests();
    const createQuest = useCreateQuest();
    const deleteQuest = useDeleteQuest();
    const updateQuest = useUpdateQuest();
    const [newQuest, setNewQuest] = useState({
        title: "", description: "", quest_type: "complete_lessons",
        target_value: 1, gem_reward: 10, is_weekly: false,
    });
    const [editDialog, setEditDialog] = useState({ open: false, title: "", fields: [], initialValues: {}, onSave: async () => { } });
    const handleCreate = async () => {
        if (!newQuest.title || !newQuest.description) {
            toast({ title: "Please fill in all fields", variant: "destructive" });
            return;
        }
        try {
            await createQuest.mutateAsync(newQuest);
            setNewQuest({ title: "", description: "", quest_type: "complete_lessons", target_value: 1, gem_reward: 10, is_weekly: false });
            toast({ title: "Quest created successfully!" });
        }
        catch {
            toast({ title: "Error creating quest", variant: "destructive" });
        }
    };
    const editQuest = (quest) => {
        setEditDialog({
            open: true,
            title: `Edit "${quest.title}"`,
            fields: [
                { key: "title", label: "Title", type: "text" },
                { key: "description", label: "Description", type: "textarea" },
                { key: "quest_type", label: "Quest Type", type: "select", options: questTypes },
                { key: "target_value", label: "Target Value", type: "text" },
                { key: "gem_reward", label: "Gem Reward", type: "text" },
            ],
            initialValues: {
                title: quest.title, description: quest.description, quest_type: quest.quest_type,
                target_value: String(quest.target_value), gem_reward: String(quest.gem_reward),
            },
            onSave: async (values) => {
                await updateQuest.mutateAsync({
                    id: quest.id,
                    title: values.title, description: values.description, quest_type: values.quest_type,
                    target_value: parseInt(values.target_value) || 1,
                    gem_reward: parseInt(values.gem_reward) || 10,
                });
                toast({ title: "Quest updated!" });
            },
        });
    };
    if (isLoading) {
        return <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-amber-500"/></div>;
    }
    const dailyQuests = quests.filter(q => !q.is_weekly);
    const weeklyQuests = quests.filter(q => q.is_weekly);
    return (<div className="space-y-6">
      <AdminEditDialog {...editDialog} onOpenChange={(open) => setEditDialog((prev) => ({ ...prev, open }))}/>

      {/* Create Quest Form */}
      <div className="bg-slate-700 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Target className="w-5 h-5 text-amber-500"/>
          <h3 className="text-lg font-bold">Create New Quest</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Title</Label>
            <Input value={newQuest.title} onChange={(e) => setNewQuest({ ...newQuest, title: e.target.value })} className="bg-slate-600 border-slate-500" placeholder="Complete 3 lessons"/>
          </div>
          <div>
            <Label>Quest Type</Label>
            <Select value={newQuest.quest_type} onValueChange={(v) => setNewQuest({ ...newQuest, quest_type: v })}>
              <SelectTrigger className="bg-slate-600 border-slate-500"><SelectValue /></SelectTrigger>
              <SelectContent>
                {questTypes.map((type) => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label>Description</Label>
            <Textarea value={newQuest.description} onChange={(e) => setNewQuest({ ...newQuest, description: e.target.value })} className="bg-slate-600 border-slate-500" placeholder="Complete 3 lessons to earn gems"/>
          </div>
          <div>
            <Label>Target Value</Label>
            <Input type="number" value={newQuest.target_value} onChange={(e) => setNewQuest({ ...newQuest, target_value: parseInt(e.target.value) || 1 })} className="bg-slate-600 border-slate-500" min={1}/>
          </div>
          <div>
            <Label>Gem Reward</Label>
            <Input type="number" value={newQuest.gem_reward} onChange={(e) => setNewQuest({ ...newQuest, gem_reward: parseInt(e.target.value) || 10 })} className="bg-slate-600 border-slate-500" min={1}/>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={newQuest.is_weekly} onCheckedChange={(checked) => setNewQuest({ ...newQuest, is_weekly: checked })}/>
            <Label>Weekly Quest</Label>
          </div>
        </div>
        <Button onClick={handleCreate} disabled={createQuest.isPending} className="mt-4 bg-amber-600 hover:bg-amber-700">
          {createQuest.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Plus className="w-4 h-4 mr-2"/>}
          Create Quest
        </Button>
      </div>

      {/* Existing Quests */}
      <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6 max-w-full overflow-hidden">
        <div className="bg-slate-700 rounded-xl p-6">
          <h4 className="font-bold mb-4 text-amber-400">Daily Quests ({dailyQuests.length})</h4>
          <div className="space-y-3">
            {dailyQuests.map((quest) => (<QuestCard key={quest.id} quest={quest} onEdit={() => editQuest(quest)} onDelete={() => deleteQuest.mutate(quest.id)}/>))}
            {dailyQuests.length === 0 && <p className="text-slate-400 text-center py-4">No daily quests</p>}
          </div>
        </div>
        <div className="bg-slate-700 rounded-xl p-6">
          <h4 className="font-bold mb-4 text-purple-400">Weekly Quests ({weeklyQuests.length})</h4>
          <div className="space-y-3">
            {weeklyQuests.map((quest) => (<QuestCard key={quest.id} quest={quest} onEdit={() => editQuest(quest)} onDelete={() => deleteQuest.mutate(quest.id)}/>))}
            {weeklyQuests.length === 0 && <p className="text-slate-400 text-center py-4">No weekly quests</p>}
          </div>
        </div>
      </div>
    </div>);
}
function QuestCard({ quest, onEdit, onDelete }) {
    return (<div className="p-3 bg-slate-600 rounded-lg">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{quest.title}</p>
          <p className="text-xs text-slate-400 truncate">{quest.description}</p>
          <div className="flex items-center gap-2 mt-1 text-xs">
            <span className={cn("px-2 py-0.5 rounded", quest.is_weekly ? "bg-purple-600" : "bg-amber-600")}>
              {quest.quest_type}
            </span>
            <span>Target: {quest.target_value}</span>
            <span>💎 {quest.gem_reward}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button size="sm" variant="ghost" onClick={onEdit} className="text-amber-400 hover:text-amber-300">✏️</Button>
          <Button size="sm" variant="ghost" onClick={onDelete} className="text-red-400 hover:text-red-300">
            <Trash2 className="w-4 h-4"/>
          </Button>
        </div>
      </div>
    </div>);
}
