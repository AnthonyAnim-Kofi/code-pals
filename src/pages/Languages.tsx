import { useState } from "react";
import { useLanguages } from "@/hooks/useLanguages";
import { useUserLanguageProgress } from "@/hooks/useUserLanguageProgress";
import { useUserProfile, useUpdateProfile } from "@/hooks/useUserProgress";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Check, Star, Trophy, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function Languages() {
  const { data: languages, isLoading: loadingLanguages } = useLanguages();
  const { data: progress, isLoading: loadingProgress } = useUserLanguageProgress();
  const { data: profile } = useUserProfile();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();
  const [switching, setSwitching] = useState<string | null>(null);

  if (loadingLanguages || loadingProgress) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeLanguage = (profile as any)?.active_language_id;

  const handleSwitchLanguage = async (languageId: string) => {
    setSwitching(languageId);
    try {
      await updateProfile.mutateAsync({ active_language_id: languageId } as any);
      toast({ title: "Language switched successfully!" });
    } catch (error) {
      toast({ title: "Failed to switch language", variant: "destructive" });
    } finally {
      setSwitching(null);
    }
  };

  const getLanguageProgress = (languageId: string) => {
    const langProgress = progress?.find((p) => p.language_id === languageId);
    return langProgress || { completed_lessons: 0, total_lessons: 0, total_xp: 0 };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Languages</h1>
          <p className="text-muted-foreground">Track your progress across all programming languages</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {languages?.map((language) => {
          const langProgress = getLanguageProgress(language.id);
          const progressPercent = langProgress.total_lessons > 0 
            ? Math.round((langProgress.completed_lessons / langProgress.total_lessons) * 100)
            : 0;
          const isActive = activeLanguage === language.id;
          const isStarted = langProgress.completed_lessons > 0;

          return (
            <Card
              key={language.id}
              className={cn(
                "relative overflow-hidden transition-all hover:shadow-lg",
                isActive && "ring-2 ring-primary"
              )}
            >
              {isActive && (
                <Badge className="absolute top-3 right-3 bg-primary">
                  <Check className="w-3 h-3 mr-1" />
                  Active
                </Badge>
              )}
              
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{language.icon}</span>
                  <div>
                    <CardTitle className="text-lg">{language.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{language.description}</p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-bold">{progressPercent}%</span>
                  </div>
                  <Progress value={progressPercent} indicatorColor="gradient" />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-muted rounded-lg">
                    <BookOpen className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Lessons</p>
                    <p className="font-bold text-sm">
                      {langProgress.completed_lessons}/{langProgress.total_lessons}
                    </p>
                  </div>
                  <div className="p-2 bg-muted rounded-lg">
                    <Star className="w-4 h-4 mx-auto mb-1 text-golden" />
                    <p className="text-xs text-muted-foreground">XP</p>
                    <p className="font-bold text-sm text-golden">
                      {langProgress.total_xp.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-2 bg-muted rounded-lg">
                    <Trophy className="w-4 h-4 mx-auto mb-1 text-accent" />
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="font-bold text-sm">
                      {progressPercent === 100 ? "🏆" : isStarted ? "📖" : "🔒"}
                    </p>
                  </div>
                </div>

                {/* Action Button */}
                <Button
                  onClick={() => handleSwitchLanguage(language.id)}
                  disabled={isActive || switching === language.id}
                  className="w-full"
                  variant={isActive ? "secondary" : "default"}
                >
                  {switching === language.id ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : isActive ? (
                    "Currently Learning"
                  ) : isStarted ? (
                    "Continue Learning"
                  ) : (
                    "Start Learning"
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {(!languages || languages.length === 0) && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No languages available yet.</p>
        </div>
      )}
    </div>
  );
}
