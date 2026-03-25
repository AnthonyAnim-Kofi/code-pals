import { Trophy, Flame, X, UserPlus, Swords, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import mascot from "@/assets/mascot.png";

export function SocialUserCard({ 
  user, 
  onFollow, 
  onUnfollow, 
  onChallenge, 
  isFollowing, 
  isMutual,
  variant = "list" // "list" or "discover"
}) {
  if (!user) return null;

  return (
    <div className="social-card-container group">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Avatar */}
        <div className="w-14 h-14 rounded-full bg-muted overflow-hidden shrink-0 shadow-sm border-2 border-background">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <img src={mascot} alt="" className="w-10 h-10 m-2 object-contain" />
          )}
        </div>

        {/* User Info */}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-bold text-foreground text-lg truncate">
              {user.display_name || user.username || "Learner"}
            </h3>
            {isMutual && (
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                <UserCheck className="w-3 h-3 text-primary shrink-0" />
              </div>
            )}
            {/* Mockup Badge Icon (Purple User) */}
            <div className="text-premium opacity-60">
               <UserPlus className="w-3.5 h-3.5" />
            </div>
          </div>
          
          <div className="flex items-center gap-3 mt-0.5 text-sm font-bold tracking-tight text-muted-foreground/80">
            <div className="flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-golden" />
              <span>{user.xp} XP</span>
            </div>
            <div className="flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-accent" />
              <span>{user.streak_count || 0} days</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 ml-4">
        {isFollowing ? (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => onUnfollow(user.user_id)}
              className="social-card-btn min-w-[100px] text-[11px] tracking-widest uppercase"
            >
              Unfollow
            </button>
            {isMutual && onChallenge && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => onChallenge(user)}
                className="w-10 h-10 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors"
              >
                <Swords className="w-5 h-5" />
              </Button>
            )}
          </div>
        ) : (
          <button 
            onClick={() => onFollow(user.user_id)}
            className="social-card-btn min-w-[100px] text-[11px] tracking-widest uppercase hover:bg-muted/50"
          >
            {variant === "discover" ? "Follow" : "Follow Back"}
          </button>
        )}
      </div>
    </div>
  );
}
