/**
 * Onboarding – Multi-step new user onboarding flow.
 * Step 1: Select language to learn
 * Step 2: Set daily goal
 * Step 3: Welcome summary
 */
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLanguages } from "@/hooks/useLanguages";
import { useUpdateProfile, useUserProfile } from "@/hooks/useUserProgress";
import { LanguageIcon } from "@/components/LanguageIcon";
import { Button } from "@/components/ui/button";
import { Check, ChevronRight, Flame, Target, Clock, Loader2, Code2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import mascot from "@/assets/mascot.png";
import authBg from "@/assets/auth-bg.png";

const DAILY_GOALS = [
  { minutes: 5, label: "Casual", description: "5 min / day", icon: "🌱", emoji: Flame },
  { minutes: 10, label: "Regular", description: "10 min / day", icon: "⚡", emoji: Target },
  { minutes: 15, label: "Serious", description: "15 min / day", icon: "🔥", emoji: Clock },
  { minutes: 30, label: "Intense", description: "30 min / day", icon: "💎", emoji: Flame },
];

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<number>(10);
  const [saving, setSaving] = useState(false);

  const { data: languages, isLoading: loadingLanguages } = useLanguages();
  const { data: profile } = useUserProfile();
  const updateProfile = useUpdateProfile();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  // Handle referral code from URL
  const referralCode = searchParams.get("ref");

  const handleFinish = async () => {
    if (!selectedLanguage) return;
    setSaving(true);
    try {
      // Update profile with language, goal, and mark onboarding complete
      await updateProfile.mutateAsync({
        active_language_id: selectedLanguage,
        daily_goal_minutes: selectedGoal,
        onboarding_completed: true,
      } as any);

      // Process referral if valid code provided (from URL or signup form)
      const codeToUse = referralCode?.trim().toUpperCase();
      if (codeToUse && user) {
        await (supabase.rpc as any)("apply_referral_reward", {
          p_referral_code: codeToUse,
          p_new_user_id: user.id,
        });
      }

      const target = selectedLanguage
        ? `/learn?language=${encodeURIComponent(selectedLanguage)}`
        : "/learn";
      navigate(target);
    } catch (err) {
      toast({ title: "Something went wrong", variant: "destructive" });
      setSaving(false);
    }
  };

  const selectedLang = languages?.find((l) => l.id === selectedLanguage);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img src={authBg} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px]" />
      </div>

      {/* Header */}
      <header className="p-4 relative z-10 flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary shadow-lg shadow-primary/30">
          <Code2 className="w-6 h-6 text-primary-foreground" />
        </div>
        <span className="text-xl font-extrabold text-foreground">CodeBear</span>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 relative z-10">
        {/* Progress dots */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className={cn(
              "h-2 rounded-full transition-all duration-300",
              s === step ? "w-8 bg-primary" : s < step ? "w-2 bg-primary/60" : "w-2 bg-muted"
            )} />
          ))}
        </div>

        {/* ── STEP 1: Language Selection ── */}
        {step === 1 && (
          <div className="w-full max-w-2xl animate-fade-in">
            <div className="text-center mb-8">
              <img src={mascot} alt="CodeBear" className="w-20 h-20 mx-auto mb-4 animate-bounce-gentle" />
              <h1 className="text-3xl font-extrabold text-foreground mb-2">What do you want to learn?</h1>
              <p className="text-muted-foreground">Choose your first programming language to get started</p>
            </div>

            {loadingLanguages ? (
              <div className="flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
                {languages?.map((language) => (
                  <button
                    key={language.id}
                    onClick={() => setSelectedLanguage(language.id)}
                    className={cn(
                      "relative flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all",
                      "bg-card/80 backdrop-blur-sm hover:scale-[1.03] cursor-pointer",
                      selectedLanguage === language.id
                        ? "border-primary shadow-lg shadow-primary/30 bg-card"
                        : "border-border hover:border-primary/40"
                    )}
                  >
                    {selectedLanguage === language.id && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />
                      </div>
                    )}
                    <LanguageIcon slug={language.slug} icon={language.icon} size={48} />
                    <span className="font-bold text-foreground text-sm">{language.name}</span>
                  </button>
                ))}
              </div>
            )}

            <Button
              size="lg"
              className="w-full"
              disabled={!selectedLanguage}
              onClick={() => setStep(2)}
            >
              Continue
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        )}

        {/* ── STEP 2: Daily Goal ── */}
        {step === 2 && (
          <div className="w-full max-w-md animate-fade-in">
            <div className="text-center mb-8">
              <div className="text-5xl mb-4">🎯</div>
              <h1 className="text-3xl font-extrabold text-foreground mb-2">Set your daily goal</h1>
              <p className="text-muted-foreground">How much time do you want to spend learning each day?</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-8">
              {DAILY_GOALS.map((goal) => (
                <button
                  key={goal.minutes}
                  onClick={() => setSelectedGoal(goal.minutes)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all text-center",
                    "bg-card/80 backdrop-blur-sm hover:scale-[1.03] cursor-pointer",
                    selectedGoal === goal.minutes
                      ? "border-primary shadow-lg shadow-primary/30 bg-card"
                      : "border-border hover:border-primary/40"
                  )}
                >
                  <span className="text-3xl">{goal.icon}</span>
                  <p className="font-bold text-foreground">{goal.label}</p>
                  <p className="text-sm text-muted-foreground">{goal.description}</p>
                  {selectedGoal === goal.minutes && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" size="lg" className="flex-1" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button size="lg" className="flex-1" onClick={() => setStep(3)}>
                Continue
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Welcome ── */}
        {step === 3 && (
          <div className="w-full max-w-md animate-fade-in text-center">
            <img src={mascot} alt="CodeBear" className="w-24 h-24 mx-auto mb-6 animate-bounce-gentle" />
            <h1 className="text-3xl font-extrabold text-foreground mb-2">You're all set! 🎉</h1>
            <p className="text-muted-foreground mb-8">
              You'll learn <span className="font-bold text-foreground">{selectedLang?.name}</span> for{" "}
              <span className="font-bold text-foreground">{selectedGoal} minutes</span> each day.
            </p>

            <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border p-6 mb-8 space-y-4 text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  {selectedLang && <LanguageIcon slug={selectedLang.slug} icon={selectedLang.icon} size={24} />}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{selectedLang?.name} track</p>
                  <p className="text-sm text-muted-foreground">Interactive lessons & challenges</p>
                </div>
                <Check className="w-5 h-5 text-primary ml-auto" />
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Flame className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{selectedGoal} min daily goal</p>
                  <p className="text-sm text-muted-foreground">Build a consistent learning habit</p>
                </div>
                <Check className="w-5 h-5 text-primary ml-auto" />
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-golden/10 flex items-center justify-center">
                  <Target className="w-5 h-5 text-golden" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">League competitions</p>
                  <p className="text-sm text-muted-foreground">Compete with other learners weekly</p>
                </div>
                <Check className="w-5 h-5 text-primary ml-auto" />
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" size="lg" className="flex-1" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button size="lg" className="flex-1" disabled={saving} onClick={handleFinish}>
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Start Learning! 🚀"}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
