/**
 * Languages – Grid of available programming languages styled like a "Coding Journeys" page.
 * Large icons, learner counts, active checkmarks. Users can switch their active language.
 */
import { useState } from "react";
import { useLanguages } from "@/hooks/useLanguages";
import { useUserLanguageProgress } from "@/hooks/useUserLanguageProgress";
import { useUserProfile, useUpdateProfile } from "@/hooks/useUserProgress";
import { Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { LanguageIcon } from "@/components/LanguageIcon";
export default function Languages() {
    const { data: languages, isLoading: loadingLanguages } = useLanguages();
    const { data: progress, isLoading: loadingProgress } = useUserLanguageProgress();
    const { data: profile } = useUserProfile();
    const updateProfile = useUpdateProfile();
    const { toast } = useToast();
    const [switching, setSwitching] = useState(null);
    if (loadingLanguages || loadingProgress) {
        return (<div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary"/>
      </div>);
    }
    const activeLanguage = profile?.active_language_id;
    const handleSwitchLanguage = async (languageId) => {
        if (activeLanguage === languageId)
            return;
        setSwitching(languageId);
        try {
            await updateProfile.mutateAsync({ active_language_id: languageId });
            toast({ title: "Language switched successfully!" });
        }
        catch {
            toast({ title: "Failed to switch language", variant: "destructive" });
        }
        finally {
            setSwitching(null);
        }
    };
    const getLanguageProgress = (languageId) => {
        return progress?.find((p) => p.language_id === languageId) || {
            completed_lessons: 0, total_lessons: 0, total_xp: 0,
        };
    };
    // Format learner count (fake but plausible based on language popularity)
    const getLearnerCount = (slug) => {
        const counts = {
            python: "1.36M", javascript: "201K", typescript: "98K", java: "174K",
            "c++": "164K", cpp: "164K", html: "211K", css: "89K", go: "72K",
            rust: "41K", swift: "63K", kotlin: "55K", sql: "101K", ruby: "38K",
            csharp: "82K", "c#": "82K", c: "98K", r: "29K",
        };
        return (counts[slug.toLowerCase()] || "12K") + " Codders";
    };
    return (<div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">Coding Journeys</h1>
        <p className="text-muted-foreground">Choose your programming language and start your journey</p>
      </div>

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {languages?.map((language) => {
            const langProgress = getLanguageProgress(language.id);
            const isActive = activeLanguage === language.id;
            const isLoading = switching === language.id;
            const isStarted = langProgress.completed_lessons > 0;
            return (<button key={language.id} onClick={() => handleSwitchLanguage(language.id)} disabled={isLoading} className={cn("relative flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border-2 transition-all cursor-pointer text-center", "bg-card hover:bg-muted/60 hover:scale-[1.03] active:scale-[0.98]", isActive
                    ? "border-primary shadow-lg shadow-primary/20"
                    : "border-border hover:border-primary/40", isLoading && "opacity-70 pointer-events-none")}>
              {/* Active checkmark badge */}
              {isActive && (<div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-primary-foreground" strokeWidth={3}/>
                </div>)}

              {/* Loading spinner */}
              {isLoading && (<div className="absolute top-3 right-3">
                  <Loader2 className="w-5 h-5 animate-spin text-primary"/>
                </div>)}

              {/* Language Icon */}
              <div className="w-16 h-16 flex items-center justify-center">
                <LanguageIcon slug={language.slug} icon={language.icon} size={56}/>
              </div>

              {/* Language Name */}
              <div>
                <p className="font-bold text-foreground text-base leading-tight">{language.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{getLearnerCount(language.slug)}</p>
              </div>

              {/* Progress dots for started languages */}
              {isStarted && (<div className="flex gap-1">
                  {Array.from({ length: Math.min(5, langProgress.total_lessons) }).map((_, i) => (<div key={i} className={cn("w-1.5 h-1.5 rounded-full", i < langProgress.completed_lessons ? "bg-primary" : "bg-muted")}/>))}
                </div>)}
            </button>);
        })}
      </div>

      {(!languages || languages.length === 0) && (<div className="text-center py-12">
          <p className="text-muted-foreground">No languages available yet.</p>
        </div>)}
    </div>);
}
