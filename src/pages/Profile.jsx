/**
 * Profile – User profile page displaying stats, and streak info,
 * Contains a logout button with confirmation dialog and a referral code section.
 */
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile, useLessonProgress } from "@/hooks/useUserProgress";
import { Settings, LogOut, Flame, Zap, Trophy, Calendar, Loader2, Gift, Copy, Check, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StreakFreezeIndicator } from "@/components/StreakFreezeIndicator";
import { StreakCalendar } from "@/components/StreakCalendar";
import { StudyStatsSection } from "@/components/StudyStatsSection";
import { LogoutConfirmDialog } from "@/components/LogoutConfirmDialog";
import { useToast } from "@/hooks/use-toast";
import mascot from "@/assets/mascot.png";
export default function Profile() {
    const { user, signOut } = useAuth();
    const { data: profile, isLoading: profileLoading } = useUserProfile();
    const { data: lessonProgress, isLoading: progressLoading } = useLessonProgress();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);
    const [copiedReferral, setCopiedReferral] = useState(false);
    /** Handles confirmed logout */
    const handleLogout = async () => {
        await signOut();
        navigate("/");
    };
    const referralCode = profile?.referral_code;
    const referralLink = referralCode ?
        `${window.location.origin}/signup?ref=${referralCode}` :
        null;
    const handleCopyReferral = () => {
        if (referralLink) {
            navigator.clipboard.writeText(referralLink);
            setCopiedReferral(true);
            toast({ title: "Referral link copied!" });
            setTimeout(() => setCopiedReferral(false), 2000);
        }
    };
    const isLoading = profileLoading || progressLoading;
    if (isLoading) {
        return (<div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary"/>
      </div>);
    }
    const completedLessons = lessonProgress?.filter((l) => l.completed).length || 0;
    const totalLessons = 17;
    const courseProgress = Math.round(completedLessons / totalLessons * 100);
    const getLeague = (xp) => {
        if (xp >= 1000)
            return "Diamond";
        if (xp >= 800)
            return "Gold";
        if (xp >= 200)
            return "Silver";
        return "Bronze";
    };
    const formatDate = (date) => {
        if (!date)
            return "Just started";
        return new Date(date).toLocaleDateString("en-US", { month: "short", year: "numeric" });
    };
    const stats = [
        { icon: Flame, label: "Day Streak", value: profile?.streak_count?.toString() || "0", color: "text-accent" },
        { icon: Zap, label: "Weekly XP", value: profile?.weekly_xp?.toLocaleString() || "0", color: "text-amber-500" },
        { icon: Zap, label: "Total XP", value: profile?.xp?.toLocaleString() || "0", color: "text-golden" },
        { icon: Trophy, label: "League", value: getLeague(profile?.xp || 0), color: "text-secondary" },
        { icon: Calendar, label: "Joined", value: formatDate(profile?.created_at || null), color: "text-muted-foreground" }
    ];
    return (<div className="space-y-8">
      {/* Profile Header */}
      <div className="p-6 bg-card rounded-2xl border border-border card-elevated">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-primary/10 border-4 border-primary flex items-center justify-center overflow-hidden">
            {profile?.avatar_url ?
            <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover"/> :
            <img src={mascot} alt="Avatar" className="w-14 h-14 object-contain"/>}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-extrabold text-foreground truncate">
              {profile?.display_name || user?.user_metadata?.full_name || "Learner"}
            </h1>
            <p className="text-muted-foreground truncate">{user?.email}</p>
          </div>
          <Button variant="outline" size="icon" asChild>
            <Link to="/settings">
              <Pencil className="w-5 h-5"/>
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {stats.map((stat, i) => <div key={i} className="p-4 bg-card rounded-2xl border border-border card-elevated">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl bg-muted ${stat.color}`}>
                <stat.icon className="w-5 h-5"/>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-extrabold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </div>)}
      </div>

      {/* Streak Freeze */}
      <StreakFreezeIndicator freezeCount={profile?.streak_freeze_count || 0} lastUsed={profile?.last_streak_freeze_used || null}/>
      

      {/* Streak Calendar */}
      <StreakCalendar currentStreak={profile?.streak_count || 0} lastPracticeDate={profile?.last_practice_date || null} streakFreezeCount={profile?.streak_freeze_count || 0} lastStreakFreezeUsed={profile?.last_streak_freeze_used || null}/>
      

      {/* Study stats: heatmap + time per language */}
      <StudyStatsSection />

      {/* Referral Section */}
      {referralCode &&
            <div className="p-4 bg-card rounded-2xl border border-border card-elevated">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-primary"/>
              <h3 className="font-bold text-foreground">Invite Friends</h3>
            </div>
            <Button size="sm" variant="ghost" asChild>
              <Link to="/referral" className="text-primary font-medium">Referral page</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Share your referral code and earn <span className="font-bold text-golden">50 gems</span> for each friend who joins!
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-3 py-2 bg-muted rounded-lg font-mono text-sm font-bold text-foreground truncate">
              {referralCode}
            </div>
            <Button size="sm" variant="outline" onClick={handleCopyReferral} className="shrink-0">
              {copiedReferral ? <Check className="w-4 h-4 text-primary"/> : <Copy className="w-4 h-4"/>}
            </Button>
          </div>
        </div>}

      {/* Actions */}
      <div className="space-y-3">
        <Button variant="outline" className="w-full justify-start" size="lg" asChild>
          <Link to="/settings">
            <Settings className="w-5 h-5"/>
            Settings
          </Link>
        </Button>
        <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive" size="lg" onClick={() => setShowLogoutDialog(true)}>
          
          <LogOut className="w-5 h-5"/>
          Log Out
        </Button>
      </div>

      {/* Logout Confirmation Dialog */}
      <LogoutConfirmDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog} onConfirm={handleLogout}/>
      
    </div>);
}
