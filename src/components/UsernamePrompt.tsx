import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUpdateProfile, useUserProfile } from "@/hooks/useUserProgress";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, User } from "lucide-react";
import { toast } from "sonner";
import mascot from "@/assets/mascot.png";

export function UsernamePrompt() {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const updateProfile = useUpdateProfile();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  // Show prompt only if user exists, profile loaded, and username is not set
  const shouldShow = user && !profileLoading && profile && !profile.username;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      toast.error("Please enter a username");
      return;
    }

    if (username.length < 3) {
      toast.error("Username must be at least 3 characters");
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      toast.error("Username can only contain letters, numbers, and underscores");
      return;
    }

    setLoading(true);
    
    try {
      await updateProfile.mutateAsync({ 
        username: username.toLowerCase(),
        display_name: username 
      });
      toast.success("Username set successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to set username");
    } finally {
      setLoading(false);
    }
  };

  if (!shouldShow) return null;

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <img src={mascot} alt="CodeBear" className="w-20 h-20 animate-bounce-gentle" />
          </div>
          <DialogTitle className="text-center text-xl">Welcome to CodeBear!</DialogTitle>
          <DialogDescription className="text-center">
            Set your username to personalize your learning experience and appear on leaderboards.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="username"
                type="text"
                placeholder="coolcoder123"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-10 h-12"
                required
                minLength={3}
                maxLength={20}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              3-20 characters, letters, numbers, and underscores only
            </p>
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Set Username"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
