import { useState } from "react";
import { Users, UserPlus, Swords, Share2, Loader2, Trophy, Flame, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useFollowing, useAllUsers, useFollowUser, useUnfollowUser, useChallenges, useCreateChallenge } from "@/hooks/useSocial";
import { useUserProfile } from "@/hooks/useUserProgress";
import { useToast } from "@/hooks/use-toast";
import mascot from "@/assets/mascot.png";

export default function Social() {
  const { toast } = useToast();
  const { data: profile } = useUserProfile();
  const { data: following, isLoading: loadingFollowing } = useFollowing();
  const { data: allUsers, isLoading: loadingUsers } = useAllUsers();
  const { data: challenges, isLoading: loadingChallenges } = useChallenges();
  const followUser = useFollowUser();
  const unfollowUser = useUnfollowUser();
  const createChallenge = useCreateChallenge();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [challengeDialogOpen, setChallengeDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("friends");

  const followingIds = new Set(following?.map((f: any) => f.following?.user_id) || []);
  
  const filteredUsers = allUsers?.filter(user => 
    user.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleFollow = async (userId: string) => {
    try {
      await followUser.mutateAsync(userId);
      toast({ title: "Following!", description: "You're now following this user." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to follow user.", variant: "destructive" });
    }
  };

  const handleUnfollow = async (userId: string) => {
    try {
      await unfollowUser.mutateAsync(userId);
      toast({ title: "Unfollowed", description: "You've unfollowed this user." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to unfollow user.", variant: "destructive" });
    }
  };

  const handleChallenge = async (lessonId: number) => {
    if (!selectedUser) return;
    try {
      await createChallenge.mutateAsync({ 
        challengedId: selectedUser.user_id, 
        lessonId 
      });
      toast({ title: "Challenge sent!", description: `You've challenged ${selectedUser.display_name}!` });
      setChallengeDialogOpen(false);
    } catch (error) {
      toast({ title: "Error", description: "Failed to send challenge.", variant: "destructive" });
    }
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/profile/${profile?.user_id}`;
    navigator.clipboard.writeText(shareUrl);
    toast({ title: "Link copied!", description: "Share your progress with friends." });
  };

  const isLoading = loadingFollowing || loadingUsers || loadingChallenges;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
            <Users className="w-7 h-7 text-primary" />
            Social
          </h1>
          <p className="text-muted-foreground">Connect with other learners</p>
        </div>
        <Button onClick={handleShare} variant="outline" className="rounded-xl">
          <Share2 className="w-4 h-4 mr-2" />
          Share Progress
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-muted rounded-xl">
          <TabsTrigger value="friends" className="rounded-lg py-2 data-[state=active]:bg-background">
            <Users className="w-4 h-4 mr-2" />
            Friends ({following?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="discover" className="rounded-lg py-2 data-[state=active]:bg-background">
            <UserPlus className="w-4 h-4 mr-2" />
            Discover
          </TabsTrigger>
          <TabsTrigger value="challenges" className="rounded-lg py-2 data-[state=active]:bg-background">
            <Swords className="w-4 h-4 mr-2" />
            Challenges
          </TabsTrigger>
        </TabsList>

        {/* Friends Tab */}
        <TabsContent value="friends" className="space-y-4">
          {following?.length === 0 ? (
            <div className="p-8 bg-card rounded-2xl border border-border text-center">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-bold text-foreground mb-2">No friends yet</h3>
              <p className="text-muted-foreground mb-4">
                Find and follow other learners to see their progress!
              </p>
              <Button onClick={() => setActiveTab("discover")}>
                <UserPlus className="w-4 h-4 mr-2" />
                Find Friends
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {following?.map((follow: any) => {
                const user = follow.following;
                if (!user) return null;
                return (
                  <div
                    key={follow.id}
                    className="flex items-center gap-4 p-4 bg-card rounded-2xl border border-border"
                  >
                    <div className="w-12 h-12 rounded-full bg-muted overflow-hidden">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <img src={mascot} alt="" className="w-10 h-10 m-1 object-contain" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground truncate">
                        {user.display_name || user.username || "Learner"}
                      </p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Trophy className="w-4 h-4 text-golden" />
                          {user.xp} XP
                        </span>
                        <span className="flex items-center gap-1">
                          <Flame className="w-4 h-4 text-accent" />
                          {user.streak_count} days
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedUser(user);
                          setChallengeDialogOpen(true);
                        }}
                        className="rounded-lg"
                      >
                        <Swords className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleUnfollow(user.user_id)}
                        className="rounded-lg text-muted-foreground hover:text-destructive"
                      >
                        Unfollow
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Discover Tab */}
        <TabsContent value="discover" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-xl"
            />
          </div>
          
          <div className="space-y-3">
            {filteredUsers.map((user) => {
              const isFollowing = followingIds.has(user.user_id);
              return (
                <div
                  key={user.id}
                  className="flex items-center gap-4 p-4 bg-card rounded-2xl border border-border"
                >
                  <div className="w-12 h-12 rounded-full bg-muted overflow-hidden">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <img src={mascot} alt="" className="w-10 h-10 m-1 object-contain" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground truncate">
                      {user.display_name || user.username || "Learner"}
                    </p>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-medium",
                        user.league === "diamond" && "bg-cyan-100 text-cyan-700",
                        user.league === "gold" && "bg-yellow-100 text-yellow-700",
                        user.league === "silver" && "bg-slate-100 text-slate-700",
                        user.league === "bronze" && "bg-amber-100 text-amber-700"
                      )}>
                        {user.league?.charAt(0).toUpperCase() + user.league?.slice(1)} League
                      </span>
                      <span>{user.xp} XP</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={isFollowing ? "outline" : "default"}
                    onClick={() => isFollowing ? handleUnfollow(user.user_id) : handleFollow(user.user_id)}
                    disabled={followUser.isPending || unfollowUser.isPending}
                    className="rounded-lg"
                  >
                    {isFollowing ? "Following" : "Follow"}
                  </Button>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* Challenges Tab */}
        <TabsContent value="challenges" className="space-y-4">
          {challenges?.length === 0 ? (
            <div className="p-8 bg-card rounded-2xl border border-border text-center">
              <Swords className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-bold text-foreground mb-2">No challenges yet</h3>
              <p className="text-muted-foreground">
                Challenge your friends to complete lessons and compete for the best score!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {challenges?.map((challenge) => (
                <div
                  key={challenge.id}
                  className={cn(
                    "p-4 bg-card rounded-2xl border border-border",
                    challenge.status === "pending" && "border-primary/50"
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-medium",
                      challenge.status === "pending" && "bg-primary/10 text-primary",
                      challenge.status === "completed" && "bg-green-100 text-green-700"
                    )}>
                      {challenge.status.charAt(0).toUpperCase() + challenge.status.slice(1)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Lesson {challenge.lesson_id}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">You</p>
                      <p className="text-xl font-bold text-foreground">
                        {challenge.challenger_score ?? "-"}
                      </p>
                    </div>
                    <Swords className="w-6 h-6 text-muted-foreground" />
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Opponent</p>
                      <p className="text-xl font-bold text-foreground">
                        {challenge.challenged_score ?? "-"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Challenge Dialog */}
      <Dialog open={challengeDialogOpen} onOpenChange={setChallengeDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Challenge {selectedUser?.display_name || "Friend"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Choose a lesson to challenge your friend:
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6].map((lessonId) => (
                <Button
                  key={lessonId}
                  variant="outline"
                  onClick={() => handleChallenge(lessonId)}
                  disabled={createChallenge.isPending}
                  className="rounded-xl h-16"
                >
                  Lesson {lessonId}
                </Button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
