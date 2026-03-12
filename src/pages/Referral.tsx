/**
 * Referral – Dedicated page: share link, referral history (who joined), total gems from referrals.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProgress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Gift, Share2, Copy, Check, Loader2, UserPlus, Gem } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReferralRow {
  id: string;
  referral_code: string;
  gems_awarded: number;
  created_at: string;
  referred_user_id: string;
  referred_display_name: string | null;
}

export default function Referral() {
  const { user } = useAuth();
  const { data: profile } = useUserProfile();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const referralCode = (profile as {referral_code?: string | null;})?.referral_code ?? null;
  const referralLink = referralCode ?
  `${typeof window !== "undefined" ? window.location.origin : ""}/signup?ref=${referralCode}` :
  null;

  const { data: referrals, isLoading } = useQuery({
    queryKey: ["referrals-as-referrer", user?.id],
    queryFn: async (): Promise<ReferralRow[]> => {
      if (!user) return [];
      const { data: rows, error } = await supabase.
      from("referrals").
      select("id, referral_code, gems_awarded, created_at, referred_user_id").
      eq("referrer_id", user.id).
      order("created_at", { ascending: false });
      if (error) throw error;
      if (!rows?.length) return [];
      const ids = [...new Set(rows.map((r) => r.referred_user_id))];
      const { data: profiles } = await supabase.
      from("profiles").
      select("user_id, display_name").
      in("user_id", ids);
      const nameByUserId = new Map(
        (profiles || []).map((p) => [p.user_id, p.display_name ?? null])
      );
      return rows.map((r) => ({
        ...r,
        referred_display_name: nameByUserId.get(r.referred_user_id) ?? "Learner"
      }));
    },
    enabled: !!user
  });

  const totalGemsEarned = referrals?.reduce((sum, r) => sum + r.gems_awarded, 0) ?? 0;

  const handleShare = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast({ title: "Referral link copied!" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareNative = () => {
    if (referralLink && navigator.share) {
      navigator.
      share({
        title: "Join me on CodeBear",
        text: "Learn to code with me on CodeBear! Use my link to sign up and we both get 50 gems.",
        url: referralLink
      }).
      then(() => toast({ title: "Shared!" })).
      catch(() => handleShare());
    } else {
      handleShare();
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>);

  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Gift className="w-7 h-7 text-primary" />
          Referrals
        </h1>
        <p className="text-muted-foreground mt-1">
          Invite friends and earn gems when they join.
        </p>
      </div>

      {/* Share + code + total gems */}
      <div className="p-6 bg-card rounded-2xl border border-border card-elevated space-y-4">
        <div className="flex items-center gap-2">
          <Gem className="w-5 h-5 text-blue-600" />
          <span className="font-bold text-foreground">Total gems from referrals</span>
        </div>
        <p className="text-3xl font-extrabold text-secondary">{totalGemsEarned}</p>

        {referralCode ?
        <>
            <div className="flex items-center gap-2 pt-2">
              <span className="text-sm text-muted-foreground">Your code:</span>
              <code className="px-2 py-1 bg-muted rounded font-mono font-bold text-foreground">
                {referralCode}
              </code>
            </div>
            <p className="text-sm text-muted-foreground">
              You and your friend each get <span className="font-semibold text-blue-600">50 gems</span> when they sign up with your link and finish onboarding.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button onClick={handleShareNative} className="gap-2">
                <Share2 className="w-4 h-4" />
                Share
              </Button>
              <Button variant="outline" onClick={handleShare} className="gap-2">
                {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy link"}
              </Button>
            </div>
          </> :

        <p className="text-sm text-muted-foreground">Your referral code is being generated. Refresh in a moment.</p>
        }
      </div>

      {/* Referral history */}
      <div className="p-6 bg-card rounded-2xl border border-border card-elevated">
        <div className="flex items-center gap-2 mb-4">
          <UserPlus className="w-5 h-5 text-muted-foreground" />
          <h2 className="font-bold text-foreground">Who joined</h2>
        </div>
        {isLoading ?
        <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div> :
        !referrals?.length ?
        <p className="text-sm text-muted-foreground py-4">
            No one has used your referral link yet. Share your link to invite friends!
          </p> :

        <ul className="space-y-3">
            {referrals.map((r) =>
          <li
            key={r.id}
            className="flex items-center justify-between py-2 border-b border-border last:border-0">
            
                <span className="font-medium text-foreground">
                  {r.referred_display_name || "Learner"}
                </span>
                <span className="text-sm text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric"
              })}{" "}
                  · <span className="font-semibold text-sky-600">+{r.gems_awarded} gems</span>
                </span>
              </li>
          )}
          </ul>
        }
      </div>

      <Button variant="outline" asChild>
        <Link to="/profile">Back to Profile</Link>
      </Button>
    </div>);

}