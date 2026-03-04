/**
 * ProductTour – Guided walkthrough for first-time users using React Joyride.
 * Only shows once per user (flag saved in profiles.onboarding_completed).
 * Steps highlight key navigation and features: Learn, Leaderboard, Quests, Shop, Profile, Stats.
 */
import { useState, useEffect } from "react";
import Joyride, { CallBackProps, STATUS, Step, ACTIONS, EVENTS } from "react-joyride";
import { useUserProfile, useUpdateProfile } from "@/hooks/useUserProgress";
import { useIsMobile } from "@/hooks/use-mobile";

const DESKTOP_STEPS: Step[] = [
  {
    target: '[data-tour="learn"]',
    title: "📚 Your Learning Path",
    content: "This is your main dashboard! Start lessons, track your progress through units, and master new coding concepts here.",
    placement: "right",
    disableBeacon: true,
  },
  {
    target: '[data-tour="leaderboard"]',
    title: "🏆 Leaderboard",
    content: "Compete with other learners! Your weekly XP determines your league rank. Top 3 earn podium spots!",
    placement: "right",
  },
  {
    target: '[data-tour="quests"]',
    title: "🎯 Daily Quests",
    content: "Complete daily and weekly quests to earn bonus gems. New quests refresh every day!",
    placement: "right",
  },
  {
    target: '[data-tour="shop"]',
    title: "🛍️ Shop",
    content: "Spend your gems on power-ups like streak freezes, heart refills, and XP boosts.",
    placement: "right",
  },
  {
    target: '[data-tour="profile"]',
    title: "👤 Your Profile",
    content: "View your stats, customize your avatar, and track your achievements here.",
    placement: "right",
  },
  {
    target: '[data-tour="user-progress"]',
    title: "📊 Quick Stats",
    content: "Keep an eye on your streak 🔥, hearts ❤️, gems 💎, and XP ⚡ right here. Tap on streak to see your calendar!",
    placement: "left",
  },
];

const MOBILE_STEPS: Step[] = [
  {
    target: '[data-tour="mobile-stats"]',
    title: "📊 Your Stats",
    content: "Your streak, gems, and hearts are always visible up here. Tap them for more details!",
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: '[data-tour="mobile-learn"]',
    title: "📚 Learn",
    content: "Start your lessons here! This is your main learning dashboard.",
    placement: "top",
  },
  {
    target: '[data-tour="mobile-ranks"]',
    title: "🏆 Leaderboard",
    content: "See how you rank against other learners in weekly competitions!",
    placement: "top",
  },
  {
    target: '[data-tour="mobile-quests"]',
    title: "🎯 Quests",
    content: "Complete daily quests to earn bonus gems and rewards.",
    placement: "top",
  },
  {
    target: '[data-tour="mobile-more"]',
    title: "⚙️ More Options",
    content: "Find your profile, settings, achievements, and more here!",
    placement: "top",
  },
];

export function ProductTour() {
  const { data: profile, isLoading } = useUserProfile();
  const updateProfile = useUpdateProfile();
  const isMobile = useIsMobile();
  const [run, setRun] = useState(false);

  // Check if this is a brand-new user who just completed onboarding
  // but hasn't done the product tour yet
  useEffect(() => {
    if (isLoading || !profile) return;

    const tourDone = localStorage.getItem(`tour_done_${profile.user_id}`);
    if (!tourDone) {
      const timer = setTimeout(() => setRun(true), 800);
      return () => clearTimeout(timer);
    }
  }, [isLoading, profile]);

  const handleCallback = (data: CallBackProps) => {
    const { status, action } = data;
    const finished = [STATUS.FINISHED, STATUS.SKIPPED].includes(status as any);

    if (finished && profile) {
      localStorage.setItem(`tour_done_${profile.user_id}`, "true");
      setRun(false);
    }
  };

  if (isLoading || !profile || !run) return null;

  const steps = isMobile ? MOBILE_STEPS : DESKTOP_STEPS;

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showSkipButton
      showProgress
      scrollToFirstStep={false}
      disableScrolling
      disableOverlayClose
      callback={handleCallback}
      locale={{
        back: "Back",
        close: "Close",
        last: "Finish",
        next: "Next",
        skip: "Skip Tour",
      }}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: "hsl(var(--primary))",
          backgroundColor: "hsl(var(--card))",
          textColor: "hsl(var(--card-foreground))",
          arrowColor: "hsl(var(--card))",
          overlayColor: "rgba(0, 0, 0, 0.6)",
        },
        tooltip: {
          borderRadius: "16px",
          padding: "20px",
          fontSize: "14px",
          boxShadow: "0 20px 60px -15px rgba(0, 0, 0, 0.3)",
        },
        tooltipTitle: {
          fontSize: "18px",
          fontWeight: 800,
          marginBottom: "8px",
        },
        tooltipContent: {
          padding: "8px 0",
          lineHeight: "1.6",
        },
        buttonNext: {
          borderRadius: "12px",
          padding: "8px 20px",
          fontSize: "14px",
          fontWeight: 700,
          backgroundColor: "hsl(var(--primary))",
          color: "hsl(var(--primary-foreground))",
        },
        buttonBack: {
          borderRadius: "12px",
          padding: "8px 16px",
          fontSize: "14px",
          fontWeight: 600,
          color: "hsl(var(--muted-foreground))",
          marginRight: "8px",
        },
        buttonSkip: {
          borderRadius: "12px",
          padding: "8px 16px",
          fontSize: "13px",
          fontWeight: 600,
          color: "hsl(var(--muted-foreground))",
        },
        spotlight: {
          borderRadius: "16px",
        },
        beacon: {
          display: "none",
        },
      }}
      floaterProps={{
        disableAnimation: false,
      }}
    />
  );
}
