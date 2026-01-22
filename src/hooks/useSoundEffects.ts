import { useCallback, useRef } from "react";

// Sound URLs - using free sound effects
const SOUNDS = {
  correct: "https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3",
  incorrect: "https://assets.mixkit.co/active_storage/sfx/2001/2001-preview.mp3",
  complete: "https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3",
  click: "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3",
};

type SoundType = keyof typeof SOUNDS;

export function useSoundEffects() {
  const audioRefs = useRef<{ [key in SoundType]?: HTMLAudioElement }>({});

  const playSound = useCallback((type: SoundType) => {
    try {
      // Create audio element if it doesn't exist
      if (!audioRefs.current[type]) {
        audioRefs.current[type] = new Audio(SOUNDS[type]);
        audioRefs.current[type]!.volume = 0.5;
      }

      const audio = audioRefs.current[type]!;
      audio.currentTime = 0;
      audio.play().catch(() => {
        // Silently fail if audio can't play (e.g., autoplay restrictions)
      });
    } catch {
      // Silently fail
    }
  }, []);

  const playCorrect = useCallback(() => playSound("correct"), [playSound]);
  const playIncorrect = useCallback(() => playSound("incorrect"), [playSound]);
  const playComplete = useCallback(() => playSound("complete"), [playSound]);
  const playClick = useCallback(() => playSound("click"), [playSound]);

  return {
    playCorrect,
    playIncorrect,
    playComplete,
    playClick,
    playSound,
  };
}
