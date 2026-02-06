/**
 * Shop – In-app store where users spend gems on power-ups and view premium features.
 * Items include Heart Refill, Streak Freeze, and Double XP.
 * The "Try 7 Days Free" button displays a subscription-required message.
 */
import { ShoppingBag, Heart, Zap, Gem, Infinity, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUserProfile } from "@/hooks/useUserProgress";
import { usePurchaseHeartRefill, usePurchaseStreakFreeze, usePurchaseDoubleXP } from "@/hooks/useShop";
import { toast } from "sonner";

/** Premium feature list displayed in the Pro section */
const premiumFeatures = [
  "Unlimited hearts",
  "No ads",
  "Unlimited streak freezes",
  "Progress insights",
  "Personalized practice",
];

export default function Shop() {
  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const purchaseHeartRefill = usePurchaseHeartRefill();
  const purchaseStreakFreeze = usePurchaseStreakFreeze();
  const purchaseDoubleXP = usePurchaseDoubleXP();

  const gems = profile?.gems ?? 0;
  const streakFreezes = profile?.streak_freeze_count ?? 0;

  /** Shop items with pricing, icons, and purchase handlers */
  const shopItems = [
    {
      id: 1,
      title: "Heart Refill",
      description: "Get all your hearts back",
      icon: Heart,
      price: 450,
      currency: "gems",
      color: "bg-destructive",
      onPurchase: () => purchaseHeartRefill.mutate(),
      isLoading: purchaseHeartRefill.isPending,
      disabled: gems < 450,
    },
    {
      id: 2,
      title: "Streak Freeze",
      description: `Protect your streak if you miss a day (You have ${streakFreezes})`,
      icon: Zap,
      price: 200,
      currency: "gems",
      color: "bg-secondary",
      onPurchase: () => purchaseStreakFreeze.mutate(),
      isLoading: purchaseStreakFreeze.isPending,
      disabled: gems < 200,
    },
    {
      id: 3,
      title: "Double XP",
      description: "Earn 2x XP for 15 minutes",
      icon: Zap,
      price: 100,
      currency: "gems",
      color: "bg-golden",
      onPurchase: () => purchaseDoubleXP.mutate(),
      isLoading: purchaseDoubleXP.isPending,
      disabled: gems < 100,
    },
  ];

  /** Shows a toast message that subscription is required for premium features */
  const handleTryFree = () => {
    toast.info("Subscription Required", {
      description: "You need to be on a subscription before you can enjoy this feature. Subscriptions are coming soon!",
      duration: 5000,
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground mb-2 flex items-center gap-2">
          <ShoppingBag className="w-7 h-7 text-secondary" />
          Shop
        </h1>
        <p className="text-muted-foreground">Spend your gems on power-ups and perks</p>
      </div>

      {/* Gem Balance Card */}
      <div className="p-4 bg-card rounded-2xl border border-border card-elevated">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
              <Gem className="w-6 h-6 text-secondary-foreground" />
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shopItems.map((item) => (
            <div key={item.id} className="p-4 bg-card rounded-2xl border border-border card-elevated">
              <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-4 mx-auto", item.color)}>
                <item.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-center text-foreground mb-1">{item.title}</h3>
              <p className="text-sm text-center text-muted-foreground mb-4">{item.description}</p>
              <Button 
                className="w-full" 
                variant={item.disabled ? "outline" : "default"}
                onClick={item.onPurchase}
                disabled={item.disabled || item.isLoading}
              >
                {item.isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Gem className="w-4 h-4 text-secondary" />
                    {item.price}
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Premium / Pro Section */}
      <div className="p-6 bg-gradient-to-br from-premium to-premium/80 rounded-2xl">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
            <Infinity className="w-8 h-8 text-premium-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-premium-foreground mb-1">CodeBear Pro</h2>
            <p className="text-premium-foreground/80">Learn without limits. Cancel anytime.</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 mb-6">
          {premiumFeatures.map((feature, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                <Zap className="w-3 h-3 text-premium-foreground" />
              </div>
              <span className="text-sm text-premium-foreground">{feature}</span>
            </div>
          ))}
        </div>

        {/* Subscription-required button */}
        <Button variant="golden" size="lg" className="w-full" onClick={handleTryFree}>
          Try 7 Days Free
        </Button>
      </div>
    </div>
  );
}
