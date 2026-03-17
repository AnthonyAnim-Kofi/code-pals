/**
 * useSoundEffects – Plays sound effects using admin-configured URLs from the database.
 * Falls back to hardcoded URLs if settings haven't loaded yet.
 */
import { useCallback, useRef } from "react";
import { useSoundSettings } from "@/hooks/useSoundSettings";
// Fallback sound URLs
const FALLBACK_SOUNDS = {
    correct: "https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3",
    incorrect: "https://assets.mixkit.co/active_storage/sfx/2955/2955-preview.mp3",
    complete: "https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3",
    click: "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3",
};
export function useSoundEffects() {
    const { data: soundSettings } = useSoundSettings();
    const audioRefs = useRef({});
    const getSoundUrl = useCallback((type) => {
        if (soundSettings) {
            const setting = soundSettings.find((s) => s.sound_key === type);
            if (setting) {
                if (!setting.is_active)
                    return null;
                return setting.sound_url || FALLBACK_SOUNDS[type] || null;
            }
        }
        return FALLBACK_SOUNDS[type] || null;
    }, [soundSettings]);
    const playSound = useCallback((type) => {
        try {
            const url = getSoundUrl(type);
            if (!url)
                return;
            if (!audioRefs.current[type] || audioRefs.current[type].src !== url) {
                audioRefs.current[type] = new Audio(url);
            }
            const audio = audioRefs.current[type];
            audio.volume = type === "incorrect" ? 0.8 : 0.5;
            audio.currentTime = 0;
            audio.play().catch(() => { });
        }
        catch {
            // Silently fail
        }
    }, [getSoundUrl]);
    const playBackgroundMusic = useCallback(() => {
        try {
            const url = getSoundUrl("background_music");
            if (!url)
                return null;
            const audio = new Audio(url);
            audio.loop = true;
            audio.volume = 0.15;
            audio.play().catch(() => { });
            return audio;
        }
        catch {
            return null;
        }
    }, [getSoundUrl]);
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
        playBackgroundMusic,
    };
}
