import { useState, useEffect } from "react";
import { Loader2, Save, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLeagueThresholds, useUpdateLeagueThreshold } from "@/hooks/useLeagueThresholds";

const leagueOrder = ["bronze", "silver", "gold", "diamond"];
const leagueIcons: Record<string, string> = {
  bronze: "🥉",
  silver: "🥈",
  gold: "🥇",
  diamond: "💎",
};

export function LeagueThresholdsManager() {
  const { toast } = useToast();
  const { data: thresholds = [], isLoading } = useLeagueThresholds();
  const updateThreshold = useUpdateLeagueThreshold();
  
  const [editedThresholds, setEditedThresholds] = useState<Record<string, { promotion: number; demotion: number }>>({});

  useEffect(() => {
    if (thresholds.length > 0) {
      const initial: Record<string, { promotion: number; demotion: number }> = {};
      thresholds.forEach(t => {
        initial[t.id] = {
          promotion: t.promotion_xp_threshold,
          demotion: t.demotion_xp_threshold,
        };
      });
      setEditedThresholds(initial);
    }
  }, [thresholds]);

  const handleSave = async (id: string) => {
    const edited = editedThresholds[id];
    if (!edited) return;

    try {
      await updateThreshold.mutateAsync({
        id,
        promotion_xp_threshold: edited.promotion,
        demotion_xp_threshold: edited.demotion,
      });
      toast({ title: "Threshold updated successfully!" });
    } catch (error) {
      toast({ title: "Error updating threshold", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
      </div>
    );
  }

  const sortedThresholds = [...thresholds].sort(
    (a, b) => leagueOrder.indexOf(a.league) - leagueOrder.indexOf(b.league)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="w-6 h-6 text-amber-500" />
        <h3 className="text-lg font-bold">League Promotion/Demotion Thresholds</h3>
      </div>
      
      <p className="text-sm text-slate-400 mb-4">
        Set the weekly XP required for automatic promotion and the threshold below which users get demoted.
        The system processes these at the end of each week.
      </p>

      <div className="grid gap-4">
        {sortedThresholds.map((threshold) => {
          const edited = editedThresholds[threshold.id];
          const hasChanges = edited && (
            edited.promotion !== threshold.promotion_xp_threshold ||
            edited.demotion !== threshold.demotion_xp_threshold
          );

          return (
            <div
              key={threshold.id}
              className="p-4 bg-slate-700 rounded-lg space-y-4"
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">{leagueIcons[threshold.league]}</span>
                <span className="font-bold capitalize text-lg">{threshold.league}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">
                    Promotion XP Threshold
                    {threshold.league === "diamond" && (
                      <span className="text-xs text-slate-500 ml-2">(N/A - top league)</span>
                    )}
                  </Label>
                  <Input
                    type="number"
                    value={edited?.promotion ?? threshold.promotion_xp_threshold}
                    onChange={(e) =>
                      setEditedThresholds({
                        ...editedThresholds,
                        [threshold.id]: {
                          ...edited,
                          promotion: parseInt(e.target.value) || 0,
                        },
                      })
                    }
                    className="bg-slate-600 border-slate-500"
                    disabled={threshold.league === "diamond"}
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    XP needed to move up
                  </p>
                </div>
                
                <div>
                  <Label className="text-slate-300">
                    Demotion XP Threshold
                    {threshold.league === "bronze" && (
                      <span className="text-xs text-slate-500 ml-2">(N/A - bottom league)</span>
                    )}
                  </Label>
                  <Input
                    type="number"
                    value={edited?.demotion ?? threshold.demotion_xp_threshold}
                    onChange={(e) =>
                      setEditedThresholds({
                        ...editedThresholds,
                        [threshold.id]: {
                          ...edited,
                          demotion: parseInt(e.target.value) || 0,
                        },
                      })
                    }
                    className="bg-slate-600 border-slate-500"
                    disabled={threshold.league === "bronze"}
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Below this = demotion
                  </p>
                </div>
              </div>

              {hasChanges && (
                <Button
                  onClick={() => handleSave(threshold.id)}
                  disabled={updateThreshold.isPending}
                  className="bg-amber-600 hover:bg-amber-700"
                  size="sm"
                >
                  {updateThreshold.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
