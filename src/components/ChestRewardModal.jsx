/**
 * ChestRewardModal – Animated chest-opening experience when a user has unclaimed chests.
 * Shows chest contents with a reveal animation and lets the user claim rewards.
 */
import { useState } from "react";
import { Gift, Sparkles, Star, Heart, Gem, Flame, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useMyChestAwards, useClaimChest } from "@/hooks/useLeagueChests";
import { useToast } from "@/hooks/use-toast";

const RANK_LABELS = { 1: "🥇 1st Place", 2: "🥈 2nd Place", 3: "🥉 3rd Place" };
const RANK_COLORS = {
  1: "from-yellow-400 to-amber-600",
  2: "from-slate-300 to-slate-500",
  3: "from-amber-600 to-amber-800",
};

export function ChestRewardModal() {
  const { data: awards = [] } = useMyChestAwards();
  const claimChest = useClaimChest();
  const { toast } = useToast();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [claiming, setClaiming] = useState(false);

  if (awards.length === 0) return null;

  const award = awards[currentIndex];
  if (!award) return null;

  const config = award.league_chest_config;

  const handleReveal = () => setRevealed(true);

  const handleClaim = async () => {
    setClaiming(true);
    try {
      await claimChest.mutateAsync(award);
      toast({
        title: "🎉 Chest Claimed!",
        description: `You received ${config?.xp_reward || 0} XP, ${config?.gems_reward || 0} Gems, ${config?.hearts_reward || 0} Hearts, and ${config?.streak_freezes_reward || 0} Streak Freezes!`,
      });
      setRevealed(false);
      if (currentIndex < awards.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    } catch (err) {
      toast({ title: "Error claiming chest", variant: "destructive" });
    } finally {
      setClaiming(false);
    }
  };

  const isOpen = awards.some((a) => !a.claimed);

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0 bg-transparent shadow-none [&>button]:hidden">
        <DialogTitle className="sr-only">
          {revealed ? (config?.chest_name || "Reward Chest") : "You Won a Chest"}
        </DialogTitle>
        <div className="relative bg-card rounded-3xl border-2 border-golden/30 overflow-hidden">
          {/* Glowing header */}
          <div className={cn(
            "relative py-8 px-6 text-center bg-gradient-to-br",
            RANK_COLORS[award.rank_position] || RANK_COLORS[1]
          )}>
            <div className="absolute inset-0 bg-black/20" />
            <div className="relative z-10">
              <div className="text-4xl mb-2">
                {!revealed ? "🎁" : "✨"}
              </div>
              <h2 className="text-xl font-black text-white drop-shadow-lg">
                {!revealed ? "You Won a Chest!" : config?.chest_name || "Reward Chest"}
              </h2>
              <p className="text-sm text-white/80 font-semibold mt-1">
                {RANK_LABELS[award.rank_position]} • {award.league?.charAt(0).toUpperCase() + award.league?.slice(1)} League
              </p>
            </div>
          </div>

          {/* Chest content */}
          <div className="p-6">
            {!revealed ? (
              <div className="text-center space-y-4">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-golden/20 to-golden/5 rounded-2xl flex items-center justify-center animate-pulse">
                  <Gift className="w-12 h-12 text-golden" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Tap to reveal your rewards!
                </p>
                <Button
                  onClick={handleReveal}
                  className="w-full bg-golden text-golden-foreground hover:bg-golden/90 font-bold text-lg py-6 rounded-xl btn-primary-shadow"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Open Chest
                </Button>
              </div>
            ) : (
              <div className="space-y-4 animate-scale-in">
                {/* Reward items */}
                <div className="grid grid-cols-2 gap-3">
                  {(config?.xp_reward || 0) > 0 && (
                    <div className="flex items-center gap-3 p-3 bg-golden/10 rounded-xl border border-golden/20">
                      <div className="w-10 h-10 rounded-full bg-golden/20 flex items-center justify-center">
                        <Star className="w-5 h-5 text-golden" />
                      </div>
                      <div>
                        <p className="text-lg font-black text-golden">+{config.xp_reward}</p>
                        <p className="text-xs text-muted-foreground font-semibold">XP</p>
                      </div>
                    </div>
                  )}
                  {(config?.gems_reward || 0) > 0 && (
                    <div className="flex items-center gap-3 p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
                      <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                        <Gem className="w-5 h-5 text-cyan-500" />
                      </div>
                      <div>
                        <p className="text-lg font-black text-cyan-500">+{config.gems_reward}</p>
                        <p className="text-xs text-muted-foreground font-semibold">Gems</p>
                      </div>
                    </div>
                  )}
                  {(config?.hearts_reward || 0) > 0 && (
                    <div className="flex items-center gap-3 p-3 bg-destructive/10 rounded-xl border border-destructive/20">
                      <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                        <Heart className="w-5 h-5 text-destructive" />
                      </div>
                      <div>
                        <p className="text-lg font-black text-destructive">+{config.hearts_reward}</p>
                        <p className="text-xs text-muted-foreground font-semibold">Hearts</p>
                      </div>
                    </div>
                  )}
                  {(config?.streak_freezes_reward || 0) > 0 && (
                    <div className="flex items-center gap-3 p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <Flame className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-lg font-black text-blue-500">+{config.streak_freezes_reward}</p>
                        <p className="text-xs text-muted-foreground font-semibold">Freezes</p>
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleClaim}
                  disabled={claiming}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-lg py-6 rounded-xl btn-primary-shadow"
                >
                  {claiming ? "Claiming..." : "🎉 Claim Rewards"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
