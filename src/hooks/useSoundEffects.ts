import { useCallback, useRef } from "react";

// Sound URLs - using free sound effects (louder and clearer sounds)
const SOUNDS = {
  correct: "https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3",
  incorrect: "https://assets.mixkit.co/active_storage/sfx/2955/2955-preview.mp3", // Buzzer sound - louder and clearer
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
      }

      const audio = audioRefs.current[type]!;
      // Set volume based on sound type - incorrect sound is louder
      audio.volume = type === "incorrect" ? 0.8 : 0.5;
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
