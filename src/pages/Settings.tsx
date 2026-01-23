import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, User, Bell, Shield, Palette, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useUserProfile, useUpdateProfile } from "@/hooks/useUserProgress";
import { AVATARS, AVATAR_CATEGORIES } from "@/data/avatars";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: profile, isLoading } = useUserProfile();
  const updateProfile = useUpdateProfile();
  
  const [displayName, setDisplayName] = useState<string>("");
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [avatarCategory, setAvatarCategory] = useState("all");
  const [initialized, setInitialized] = useState(false);
  const [notifications, setNotifications] = useState({
    streakReminders: true,
    challengeAlerts: true,
    achievementAlerts: true,
    weeklyReport: false,
  });

  // Initialize form with profile data when it loads
  if (profile && !initialized) {
    setDisplayName(profile.display_name || "");
    setSelectedAvatar(profile.avatar_url);
    setInitialized(true);
  }

  const filteredAvatars = avatarCategory === "all" 
    ? AVATARS 
    : AVATARS.filter(a => a.category === avatarCategory);

  const handleSaveProfile = async () => {
    try {
      await updateProfile.mutateAsync({
        display_name: displayName || profile?.display_name,
        avatar_url: selectedAvatar || profile?.avatar_url,
      });
      toast({
        title: "Profile updated!",
        description: "Your changes have been saved.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

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
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="rounded-xl"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Customize your experience</p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-muted rounded-xl">
          <TabsTrigger value="profile" className="rounded-lg py-2 data-[state=active]:bg-background">
            <User className="w-4 h-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="avatar" className="rounded-lg py-2 data-[state=active]:bg-background">
            <Palette className="w-4 h-4 mr-2" />
            Avatar
          </TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-lg py-2 data-[state=active]:bg-background">
            <Bell className="w-4 h-4 mr-2" />
            Alerts
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <div className="p-6 bg-card rounded-2xl border border-border space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your display name"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={profile?.username || ""}
                disabled
                className="rounded-xl bg-muted"
              />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>
          </div>
        </TabsContent>

        {/* Avatar Tab */}
        <TabsContent value="avatar" className="space-y-6">
          <div className="p-6 bg-card rounded-2xl border border-border space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-border">
              <div className="w-20 h-20 rounded-full bg-muted overflow-hidden">
                <img 
                  src={selectedAvatar || profile?.avatar_url || AVATARS[0].url} 
                  alt="Selected avatar" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="font-bold text-foreground">Current Avatar</p>
                <p className="text-sm text-muted-foreground">
                  {AVATARS.find(a => a.url === (selectedAvatar || profile?.avatar_url))?.name || "Default"}
                </p>
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {AVATAR_CATEGORIES.map((category) => (
                <Button
                  key={category.id}
                  variant={avatarCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAvatarCategory(category.id)}
                  className="rounded-full"
                >
                  {category.name}
                </Button>
              ))}
            </div>

            {/* Avatar Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
              {filteredAvatars.map((avatar) => (
                <button
                  key={avatar.id}
                  onClick={() => setSelectedAvatar(avatar.url)}
                  className={cn(
                    "relative p-2 rounded-xl border-2 transition-all hover:scale-105",
                    (selectedAvatar || profile?.avatar_url) === avatar.url
                      ? "border-primary bg-primary/10"
                      : "border-transparent bg-muted hover:border-muted-foreground/20"
                  )}
                >
                  <img 
                    src={avatar.url} 
                    alt={avatar.name}
                    className="w-full aspect-square rounded-lg"
                  />
                  {(selectedAvatar || profile?.avatar_url) === avatar.url && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <div className="p-6 bg-card rounded-2xl border border-border space-y-4">
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-semibold text-foreground">Streak Reminders</p>
                <p className="text-sm text-muted-foreground">Get reminded to practice daily</p>
              </div>
              <Switch
                checked={notifications.streakReminders}
                onCheckedChange={(checked) => 
                  setNotifications(prev => ({ ...prev, streakReminders: checked }))
                }
              />
            </div>
            <div className="flex items-center justify-between py-3 border-t border-border">
              <div>
                <p className="font-semibold text-foreground">Challenge Alerts</p>
                <p className="text-sm text-muted-foreground">Notify when friends challenge you</p>
              </div>
              <Switch
                checked={notifications.challengeAlerts}
                onCheckedChange={(checked) => 
                  setNotifications(prev => ({ ...prev, challengeAlerts: checked }))
                }
              />
            </div>
            <div className="flex items-center justify-between py-3 border-t border-border">
              <div>
                <p className="font-semibold text-foreground">Achievement Alerts</p>
                <p className="text-sm text-muted-foreground">Celebrate when you earn badges</p>
              </div>
              <Switch
                checked={notifications.achievementAlerts}
                onCheckedChange={(checked) => 
                  setNotifications(prev => ({ ...prev, achievementAlerts: checked }))
                }
              />
            </div>
            <div className="flex items-center justify-between py-3 border-t border-border">
              <div>
                <p className="font-semibold text-foreground">Weekly Report</p>
                <p className="text-sm text-muted-foreground">Receive weekly progress summary</p>
              </div>
              <Switch
                checked={notifications.weeklyReport}
                onCheckedChange={(checked) => 
                  setNotifications(prev => ({ ...prev, weeklyReport: checked }))
                }
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex gap-3">
        <Button
          onClick={handleSaveProfile}
          disabled={updateProfile.isPending}
          className="flex-1 rounded-xl h-12 font-bold"
        >
          {updateProfile.isPending ? (
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
          ) : (
            <Check className="w-5 h-5 mr-2" />
          )}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
