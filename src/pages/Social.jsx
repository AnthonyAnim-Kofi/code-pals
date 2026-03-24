import { useState } from "react";
import { Users, UserPlus, Swords, Loader2, Trophy, Flame, Search, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label as UiLabel } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useFollowing, useAllUsers, useFollowUser, useUnfollowUser, useChallenges, useCreateChallenge, useDeclineChallenge } from "@/hooks/useSocial";
import { useUserProfile } from "@/hooks/useUserProgress";
import { useLanguages, useUnitsForLanguage, useLessonsForUnit } from "@/hooks/useLanguages";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import mascot from "@/assets/mascot.png";

export default function Social() {
    const { toast } = useToast();
    const navigate = useNavigate();
    const { data: profile } = useUserProfile();
    const { data: following, isLoading: loadingFollowing } = useFollowing();
    const { data: allUsers, isLoading: loadingUsers } = useAllUsers();
    const { data: challenges, isLoading: loadingChallenges } = useChallenges();
    const followUser = useFollowUser();
    const unfollowUser = useUnfollowUser();
    const createChallenge = useCreateChallenge();
    const declineChallenge = useDeclineChallenge();
    const [searchQuery, setSearchQuery] = useState("");
    const [challengeDialogOpen, setChallengeDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [activeTab, setActiveTab] = useState("friends");

    const { data: languages } = useLanguages();
    const [selectedLanguageId, setSelectedLanguageId] = useState("");
    const { data: units } = useUnitsForLanguage(selectedLanguageId);
    const [selectedUnitId, setSelectedUnitId] = useState("");
    const { data: lessons } = useLessonsForUnit(selectedUnitId);
    const [selectedLessonId, setSelectedLessonId] = useState("");

    const followingIds = new Set(following?.map((f) => f.following?.user_id) || []);
    const filteredUsers = allUsers?.filter(user => user.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchQuery.toLowerCase())) || [];
    
    const handleFollow = async (userId) => {
        try {
            await followUser.mutateAsync(userId);
            toast({ title: "Following!", description: "You're now following this user." });
        }
        catch (error) {
            toast({ title: "Error", description: "Failed to follow user.", variant: "destructive" });
        }
    };
    
    const handleUnfollow = async (userId) => {
        try {
            await unfollowUser.mutateAsync(userId);
            toast({ title: "Unfollowed", description: "You've unfollowed this user." });
        }
        catch (error) {
            toast({ title: "Error", description: "Failed to unfollow user.", variant: "destructive" });
        }
    };
    
    const handleChallenge = async (lessonId) => {
        if (!selectedUser)
            return;
        try {
            await createChallenge.mutateAsync({
                challengedId: selectedUser.user_id,
                lessonId
            });
            toast({ title: "Challenge sent!", description: `You've challenged ${selectedUser.display_name}!` });
            setChallengeDialogOpen(false);
        }
        catch (error) {
            toast({ title: "Error", description: "Failed to send challenge.", variant: "destructive" });
        }
    };

    const handleAccept = (challenge) => {
        navigate(`/lesson/${challenge.lesson_id}?mode=challenge&challengeId=${challenge.id}`);
    };

    const handleDecline = async (challengeId) => {
        try {
            await declineChallenge.mutateAsync(challengeId);
            toast({ title: "Challenge declined", description: "The challenge has been removed." });
        }
        catch (error) {
            toast({ title: "Error", description: "Failed to decline challenge.", variant: "destructive" });
        }
    };

    const handleShare = () => {
        const shareUrl = `${window.location.origin}/profile/${profile?.user_id}`;
        navigator.clipboard.writeText(shareUrl);
        toast({ title: "Link copied!", description: "Share your progress with friends." });
    };
    
    const isLoading = loadingFollowing || loadingUsers || loadingChallenges;
    if (isLoading) {
        return (<div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary"/>
      </div>);
    }
    
    return (<div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
            <Users className="w-7 h-7 text-primary"/>
            Social
          </h1>
          <p className="text-muted-foreground">Connect with other learners</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-muted rounded-xl">
          <TabsTrigger value="friends" className="rounded-lg py-2 data-[state=active]:bg-background">
            <Users className="w-4 h-4 mr-2"/>
            Friends ({following?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="discover" className="rounded-lg py-2 data-[state=active]:bg-background">
            <UserPlus className="w-4 h-4 mr-2"/>
            Discover
          </TabsTrigger>
          <TabsTrigger value="challenges" className="rounded-lg py-2 data-[state=active]:bg-background">
            <Swords className="w-4 h-4 mr-2"/>
            Challenges
          </TabsTrigger>
        </TabsList>

        {/* Friends Tab */}
        <TabsContent value="friends" className="space-y-4">
          {following?.length === 0 ? (<div className="p-8 bg-card rounded-2xl border border-border text-center">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4"/>
              <h3 className="text-lg font-bold text-foreground mb-2">No friends yet</h3>
              <p className="text-muted-foreground mb-4">
                Find and follow other learners to see their progress!
              </p>
              <Button onClick={() => setActiveTab("discover")}>
                <UserPlus className="w-4 h-4 mr-2"/>
                Find Friends
              </Button>
            </div>) : (<div className="space-y-3">
              {following?.map((follow) => {
                const user = follow.following;
                if (!user)
                    return null;
                return (<div key={follow.id} className="flex items-center gap-4 p-4 bg-card rounded-2xl border border-border">
                    <div className="w-12 h-12 rounded-full bg-muted overflow-hidden">
                      {user.avatar_url ? (<img src={user.avatar_url} alt="" className="w-full h-full object-cover"/>) : (<img src={mascot} alt="" className="w-10 h-10 m-1 object-contain"/>)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground truncate">
                        {user.display_name || user.username || "Learner"}
                      </p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Trophy className="w-4 h-4 text-golden"/>
                          {user.xp} XP
                        </span>
                        <span className="flex items-center gap-1">
                          <Flame className="w-4 h-4 text-accent"/>
                          {user.streak_count} days
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => {
                        setSelectedUser(user);
                        setChallengeDialogOpen(true);
                    }} className="rounded-lg">
                        <Swords className="w-4 h-4"/>
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleUnfollow(user.user_id)} className="rounded-lg text-muted-foreground hover:text-destructive">
                        Unfollow
                      </Button>
                    </div>
                  </div>);
            })}
            </div>)}
        </TabsContent>

        {/* Discover Tab */}
        <TabsContent value="discover" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground"/>
            <Input placeholder="Search users..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 rounded-xl"/>
          </div>
          
          <div className="space-y-3">
            {filteredUsers.map((user) => {
                const isFollowing = followingIds.has(user.user_id);
                return (<div key={user.id} className="flex items-center gap-4 p-4 bg-card rounded-2xl border border-border">
                    <div className="w-12 h-12 rounded-full bg-muted overflow-hidden">
                        {user.avatar_url ? (<img src={user.avatar_url} alt="" className="w-full h-full object-cover"/>) : (<img src={mascot} alt="" className="w-10 h-10 m-1 object-contain"/>)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-foreground truncate">
                        {user.display_name || user.username || "Learner"}
                        </p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", user.league === "diamond" && "bg-cyan-100 text-cyan-700", user.league === "gold" && "bg-yellow-100 text-yellow-700", user.league === "silver" && "bg-slate-100 text-slate-700", user.league === "bronze" && "bg-amber-100 text-amber-700")}>
                            {user.league?.charAt(0).toUpperCase() + user.league?.slice(1)} League
                        </span>
                        <span>{user.xp} XP</span>
                        </div>
                    </div>
                    <Button size="sm" variant={isFollowing ? "outline" : "default"} onClick={() => isFollowing ? handleUnfollow(user.user_id) : handleFollow(user.user_id)} disabled={followUser.isPending || unfollowUser.isPending} className="rounded-lg">
                        {isFollowing ? "Following" : "Follow"}
                    </Button>
                    </div>);
            })}
          </div>
        </TabsContent>

        {/* Challenges Tab */}
        <TabsContent value="challenges" className="space-y-4">
          {challenges?.length === 0 ? (<div className="p-8 bg-card rounded-2xl border border-border text-center">
              <Swords className="w-12 h-12 mx-auto text-muted-foreground mb-4"/>
              <h3 className="text-lg font-bold text-foreground mb-2">No challenges yet</h3>
              <p className="text-muted-foreground">
                Challenge your friends to complete lessons and compete for the best score!
              </p>
            </div>) : (<div className="space-y-3">
              {challenges?.map((challenge) => {
                  const isReceived = challenge.challenged_id === profile?.user_id;
                  const isPending = challenge.status === "pending";
                  const isCompleted = challenge.status === "completed" &&
                    challenge.challenger_score !== null && challenge.challenger_score !== undefined &&
                    challenge.challenged_score !== null && challenge.challenged_score !== undefined;
                  const isChallenger = challenge.challenger_id === profile?.user_id;
                  const myScore = isChallenger ? challenge.challenger_score : challenge.challenged_score;
                  const oppScore = isChallenger ? challenge.challenged_score : challenge.challenger_score;
                  const isTie = isCompleted && myScore === oppScore;
                  const iWon = isCompleted && myScore > oppScore;
                  const iLost = isCompleted && myScore < oppScore;
                  
                  return (<div key={challenge.id} className={cn("p-4 bg-card rounded-2xl border border-border", isPending && "border-primary/50")}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", isPending && "bg-primary/10 text-primary", challenge.status === "completed" && "bg-green-100 text-green-700")}>
                      {challenge.status.charAt(0).toUpperCase() + challenge.status.slice(1)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Lesson {challenge.lesson_id}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">{isReceived ? "Opponent" : "You"}</p>
                      <p className="text-xl font-bold text-foreground">
                        {challenge.challenger_score ?? "-"}
                      </p>
                    </div>
                    <Swords className="w-6 h-6 text-muted-foreground"/>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">{isReceived ? "You" : "Opponent"}</p>
                      <p className="text-xl font-bold text-foreground">
                        {challenge.challenged_score ?? "-"}
                      </p>
                    </div>
                  </div>
                  
                  {/* Completed challenge result banner */}
                  {isCompleted && (
                    <div className={cn(
                      "mt-3 rounded-xl px-4 py-3 flex items-center gap-3 font-bold text-sm",
                      isTie && "bg-blue-50 text-blue-700 border border-blue-200",
                      iWon && "bg-yellow-50 text-yellow-700 border border-yellow-200",
                      iLost && "bg-muted text-muted-foreground border border-border"
                    )}>
                      {isTie && <span className="text-xl">🤝</span>}
                      {iWon && <Trophy className="w-5 h-5 text-yellow-500 shrink-0" />}
                      {iLost && <span className="text-xl">💪</span>}
                      <span>
                        {isTie && "It's a Tie! Great match!"}
                        {iWon && "You Won! Congratulations!"}
                        {iLost && "Better luck next time!"}
                      </span>
                    </div>
                  )}

                  {isReceived && isPending && (
                    <div className="flex gap-2 mt-4">
                      <Button className="flex-1 rounded-xl" onClick={() => handleAccept(challenge)}>
                        Accept
                      </Button>
                      <Button variant="outline" className="flex-1 rounded-xl" onClick={() => handleDecline(challenge.id)}>
                        Decline
                      </Button>
                    </div>
                  )}

                  {!isReceived && isPending && !challenge.challenger_score && (
                    <div className="mt-4">
                      <Button className="w-full rounded-xl" onClick={() => handleAccept(challenge)}>
                        Start Challenge
                      </Button>
                    </div>
                  )}
                </div>);
              })}
            </div>)}
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
            <div className="space-y-4">
              <div>
                <UiLabel className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">1. Select Language</UiLabel>
                <Select value={selectedLanguageId} onValueChange={(val) => {
                  setSelectedLanguageId(val);
                  setSelectedUnitId("");
                  setSelectedLessonId("");
                }}>
                  <SelectTrigger className="w-full bg-card border-border rounded-xl">
                    <SelectValue placeholder="Select Language" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border rounded-xl max-h-[300px]">
                    {languages?.map(lang => (
                      <SelectItem key={lang.id} value={lang.id}>
                        <span className="flex items-center gap-2">
                          <span className="text-lg">{lang.icon || "💻"}</span>
                          <span>{lang.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedLanguageId && (
                <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                  <UiLabel className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">2. Select Unit</UiLabel>
                  <Select value={selectedUnitId} onValueChange={(val) => {
                    setSelectedUnitId(val);
                    setSelectedLessonId("");
                  }}>
                    <SelectTrigger className="w-full bg-card border-border rounded-xl">
                      <SelectValue placeholder="Select Unit" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border rounded-xl">
                      {units?.map(unit => (
                        <SelectItem key={unit.id} value={unit.id}>{unit.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedUnitId && (
                <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                  <UiLabel className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">3. Select Lesson</UiLabel>
                  <Select value={selectedLessonId} onValueChange={setSelectedLessonId}>
                    <SelectTrigger className="w-full bg-card border-border rounded-xl">
                      <SelectValue placeholder="Select Lesson" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border rounded-xl">
                      {lessons?.map(lesson => (
                        <SelectItem key={lesson.id} value={lesson.id}>{lesson.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            
            <div className="pt-2">
              {selectedLessonId && (
                <div className="mt-2">
                  <Button 
                    className="w-full h-12 rounded-xl text-lg font-bold shadow-lg shadow-primary/20"
                    disabled={createChallenge.isPending}
                    onClick={() => {
                      handleChallenge(selectedLessonId);
                      setChallengeDialogOpen(false);
                      setSelectedLanguageId("");
                      setSelectedUnitId("");
                      setSelectedLessonId("");
                    }}
                  >
                    {createChallenge.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : null}
                    Send Challenge
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>);
}
