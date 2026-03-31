/**
 * Shop – In-app store where users spend gems on power-ups and view premium features.
 * Items are now loaded from the database (admin-managed).
 */
import { ShoppingBag, Zap, Gem, Infinity, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUserProfile } from "@/hooks/useUserProgress";
import { usePurchaseHeartRefill, usePurchaseStreakFreeze, usePurchaseDoubleXP } from "@/hooks/useShop";
import { useShopItems } from "@/hooks/useShopItems";
import { toast } from "sonner";
const premiumFeatures = [
    "Unlimited hearts",
    "No ads",
    "Unlimited streak freezes",
    "Progress insights",
    "Personalized practice",
];
export default function Shop() {
    const { data: profile, isLoading: profileLoading } = useUserProfile();
    const { data: dbItems = [], isLoading: itemsLoading } = useShopItems();
    const purchaseHeartRefill = usePurchaseHeartRefill();
    const purchaseStreakFreeze = usePurchaseStreakFreeze();
    const purchaseDoubleXP = usePurchaseDoubleXP();
    const gems = profile?.gems ?? 0;
    const streakFreezes = profile?.streak_freeze_count ?? 0;
    const getPurchaseHandler = (item) => {
        const price = item?.price;
        switch (item?.action_type) {
            case "heart_refill": return () => purchaseHeartRefill.mutate(price);
            case "streak_freeze": return () => purchaseStreakFreeze.mutate(price);
            case "double_xp": return () => purchaseDoubleXP.mutate(price);
            default: return () => toast.info("This item is not yet available for purchase.");
        }
    };
    const getIsLoading = (actionType) => {
        switch (actionType) {
            case "heart_refill": return purchaseHeartRefill.isPending;
            case "streak_freeze": return purchaseStreakFreeze.isPending;
            case "double_xp": return purchaseDoubleXP.isPending;
            default: return false;
        }
    };
    const activeItems = dbItems.filter((i) => i.is_active);
    const handleTryFree = () => {
        toast.info("Subscription Required", {
            description: "You need to be on a subscription before you can enjoy this feature. Subscriptions are coming soon!",
            duration: 5000,
        });
    };
    return (<div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground mb-2 flex items-center gap-2">
          <ShoppingBag className="w-7 h-7 text-secondary"/>
          Shop
        </h1>
        <p className="text-muted-foreground">Spend your gems on power-ups and perks</p>
      </div>

      {/* Gem Balance Card */}
      <div className="p-4 bg-card rounded-2xl border border-border card-elevated">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
              <Gem className="w-6 h-6 text-secondary-foreground"/>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Your balance</p>
              <p className="text-2xl font-extrabold text-foreground">
                {profileLoading ? "..." : `${gems} Gems`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Power-up Shop Items */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-4">Power-ups</h2>
        {itemsLoading ? (<div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary"/></div>) : (<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeItems.map((item) => {
                const disabled = gems < item.price;
                const loading = getIsLoading(item.action_type);
                return (<div key={item.id} className="p-4 bg-card rounded-2xl border border-border card-elevated">
                  <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-4 mx-auto", item.color)}>
                    <span className="text-3xl">{item.icon}</span>
                  </div>
                  <h3 className="font-bold text-center text-foreground mb-1">{item.title}</h3>
                  <p className="text-sm text-center text-muted-foreground mb-4">
                    {item.action_type === "streak_freeze"
                        ? `${item.description} (You have ${streakFreezes})`
                        : item.action_type === "double_xp"
                            ? "Earn 2x XP for 15 minutes"
                            : item.description}
                  </p>
                  <Button className="w-full" variant={disabled ? "outline" : "default"} onClick={getPurchaseHandler(item)} disabled={disabled || loading}>
                    {loading ? (<Loader2 className="w-4 h-4 animate-spin"/>) : (<>
                        <Gem className="w-4 h-4 text-secondary"/>
                        {item.price}
                      </>)}
                  </Button>
                </div>);
            })}
          </div>)}
      </div>

      {/* Premium / Pro Section */}
      <div className="p-6 bg-gradient-to-br from-premium to-premium/80 rounded-2xl">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
            <Infinity className="w-8 h-8 text-premium-foreground"/>
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-premium-foreground mb-1">CodeBear Pro</h2>
            <p className="text-premium-foreground/80">Learn without limits. Cancel anytime.</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 mb-6">
          {premiumFeatures.map((feature, i) => (<div key={i} className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                <Zap className="w-3 h-3 text-premium-foreground"/>
              </div>
              <span className="text-sm text-premium-foreground">{feature}</span>
            </div>))}
        </div>

        <Button variant="golden" size="lg" className="w-full" onClick={handleTryFree}>
          Try 7 Days Free
        </Button>
      </div>
    </div>);
}
