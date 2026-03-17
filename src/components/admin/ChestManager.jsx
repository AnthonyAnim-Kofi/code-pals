/**
 * ChestManager – Admin component for configuring league chest rewards.
 * Displays a grid of all leagues × 3 ranks with editable reward values.
 */
import { useState } from "react";
import { Gift, Star, Gem, Heart, Flame, Loader2, Save, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAllChestConfigs, useUpsertChestConfig } from "@/hooks/useLeagueChests";
import { cn } from "@/lib/utils";

const LEAGUES = [
  { key: "bronze", label: "Bronze", color: "text-amber-600", bgColor: "bg-amber-100" },
  { key: "silver", label: "Silver", color: "text-slate-400", bgColor: "bg-slate-200" },
  { key: "gold", label: "Gold", color: "text-yellow-500", bgColor: "bg-yellow-100" },
  { key: "diamond", label: "Diamond", color: "text-cyan-400", bgColor: "bg-cyan-100" },
];

const RANK_LABELS = { 1: "🥇 1st Place", 2: "🥈 2nd Place", 3: "🥉 3rd Place" };

export function ChestManager() {
  const { data: configs = [], isLoading } = useAllChestConfigs();
  const upsertConfig = useUpsertChestConfig();
  const { toast } = useToast();
  const [editing, setEditing] = useState(null); // { league, rank_position }
  const [form, setForm] = useState({});

  const getConfig = (league, rank) =>
    configs.find((c) => c.league === league && c.rank_position === rank);

  const startEdit = (config) => {
    setEditing({ league: config.league, rank_position: config.rank_position });
    setForm({
      chest_name: config.chest_name || "",
      xp_reward: config.xp_reward || 0,
      gems_reward: config.gems_reward || 0,
      hearts_reward: config.hearts_reward || 0,
      streak_freezes_reward: config.streak_freezes_reward || 0,
    });
  };

  const handleSave = async () => {
    try {
      await upsertConfig.mutateAsync({
        league: editing.league,
        rank_position: editing.rank_position,
        chest_name: form.chest_name,
        xp_reward: parseInt(form.xp_reward) || 0,
        gems_reward: parseInt(form.gems_reward) || 0,
        hearts_reward: parseInt(form.hearts_reward) || 0,
        streak_freezes_reward: parseInt(form.streak_freezes_reward) || 0,
        updated_at: new Date().toISOString(),
      });
      toast({ title: "Chest config updated!" });
      setEditing(null);
    } catch (err) {
      toast({ title: "Error saving chest config", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
        <div className="flex items-center gap-3 mb-1">
          <Gift className="w-5 h-5 text-amber-400" />
          <h3 className="text-lg font-bold text-white">League Chest Rewards</h3>
        </div>
        <p className="text-xs text-slate-400">
          Configure what the top 3 weekly earners in each league receive as chest rewards.
          All league members can see these rewards on the leaderboard.
        </p>
      </div>

      {LEAGUES.map((league) => (
        <div key={league.key} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          {/* League header */}
          <div className="px-4 py-3 border-b border-slate-700 flex items-center gap-2">
            <Trophy className={cn("w-4 h-4", league.color)} />
            <h4 className={cn("font-bold capitalize", league.color)}>
              {league.label} League
            </h4>
          </div>

          {/* 3 rank slots */}
          <div className="divide-y divide-slate-700">
            {[1, 2, 3].map((rank) => {
              const config = getConfig(league.key, rank);
              const isEditing =
                editing?.league === league.key && editing?.rank_position === rank;

              if (isEditing) {
                return (
                  <div key={rank} className="p-4 bg-slate-700/50 space-y-3">
                    <p className="text-sm font-bold text-amber-400">{RANK_LABELS[rank]}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <Label className="text-slate-300 text-xs">Chest Name</Label>
                        <Input
                          value={form.chest_name}
                          onChange={(e) => setForm({ ...form, chest_name: e.target.value })}
                          className="bg-slate-600 border-slate-500 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-300 text-xs flex items-center gap-1">
                          <Star className="w-3 h-3 text-golden" /> XP
                        </Label>
                        <Input
                          type="number"
                          value={form.xp_reward}
                          onChange={(e) => setForm({ ...form, xp_reward: e.target.value })}
                          className="bg-slate-600 border-slate-500 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-300 text-xs flex items-center gap-1">
                          <Gem className="w-3 h-3 text-cyan-400" /> Gems
                        </Label>
                        <Input
                          type="number"
                          value={form.gems_reward}
                          onChange={(e) => setForm({ ...form, gems_reward: e.target.value })}
                          className="bg-slate-600 border-slate-500 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-300 text-xs flex items-center gap-1">
                          <Heart className="w-3 h-3 text-red-400" /> Hearts
                        </Label>
                        <Input
                          type="number"
                          value={form.hearts_reward}
                          onChange={(e) => setForm({ ...form, hearts_reward: e.target.value })}
                          className="bg-slate-600 border-slate-500 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-300 text-xs flex items-center gap-1">
                          <Flame className="w-3 h-3 text-blue-400" /> Streak Freezes
                        </Label>
                        <Input
                          type="number"
                          value={form.streak_freezes_reward}
                          onChange={(e) =>
                            setForm({ ...form, streak_freezes_reward: e.target.value })
                          }
                          className="bg-slate-600 border-slate-500 text-white"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSave} disabled={upsertConfig.isPending} className="bg-amber-600 hover:bg-amber-700">
                        <Save className="w-4 h-4 mr-1" />
                        Save
                      </Button>
                      <Button variant="ghost" onClick={() => setEditing(null)} className="text-slate-300">
                        Cancel
                      </Button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={rank}
                  className="flex items-center justify-between px-4 py-3 hover:bg-slate-700/30 cursor-pointer transition-colors"
                  onClick={() => config && startEdit(config)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-300">
                      {RANK_LABELS[rank]}
                    </span>
                    <span className="text-xs text-slate-400">
                      {config?.chest_name || "Not configured"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    {config && (
                      <>
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-golden" /> {config.xp_reward}
                        </span>
                        <span className="flex items-center gap-1">
                          <Gem className="w-3 h-3 text-cyan-400" /> {config.gems_reward}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3 text-red-400" /> {config.hearts_reward}
                        </span>
                        <span className="flex items-center gap-1">
                          <Flame className="w-3 h-3 text-blue-400" /> {config.streak_freezes_reward}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
