import { useEffect, useState } from "react";
import mascot from "@/assets/mascot.png";

const SPLASH_KEY = "codepals_splash_seen";

/**
 * Animated intro splash screen.
 * Shows once per browser session (survives refreshes via sessionStorage),
 * then fades out to reveal the app. Respects prefers-reduced-motion.
 */
export function SplashScreen() {
  const [phase, setPhase] = useState("hidden"); // hidden | visible | leaving

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(SPLASH_KEY) === "1";
    } catch {
      seen = false;
    }
    if (seen) return;

    setPhase("visible");
    document.body.style.overflow = "hidden";
    try {
      sessionStorage.setItem(SPLASH_KEY, "1");
    } catch {
      /* ignore storage errors */
    }

    const leaveTimer = setTimeout(() => setPhase("leaving"), 2200);
    const doneTimer = setTimeout(() => {
      setPhase("done");
      document.body.style.overflow = "";
    }, 2900);

    return () => {
      clearTimeout(leaveTimer);
      clearTimeout(doneTimer);
      document.body.style.overflow = "";
    };
  }, []);

  if (phase === "hidden" || phase === "done") return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background transition-opacity duration-700 ${
        phase === "leaving" ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      aria-hidden="true"
    >
      {/* Glow */}
      <div className="absolute h-72 w-72 rounded-full bg-primary/20 blur-3xl animate-pulse" />

      {/* Mascot */}
      <div className="relative animate-splash-pop">
        <img
          src={mascot}
          alt=""
          className="h-32 w-32 object-contain drop-shadow-xl animate-splash-bounce"
        />
      </div>

      {/* Wordmark */}
      <h1 className="relative mt-6 text-3xl font-extrabold tracking-tight text-foreground animate-splash-fade-up">
        Code<span className="text-primary">Pals</span>
      </h1>

      {/* Loading dots */}
      <div className="relative mt-6 flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-primary animate-splash-dot [animation-delay:0ms]" />
        <span className="h-2.5 w-2.5 rounded-full bg-primary animate-splash-dot [animation-delay:150ms]" />
        <span className="h-2.5 w-2.5 rounded-full bg-primary animate-splash-dot [animation-delay:300ms]" />
      </div>
    </div>
  );
}