import React, { useEffect, useState } from 'react';
import { useTheme } from './ThemeContext';

const MAX_PARTICLES = 100; // Increased for heavy snow effect

export function ThemeParticles() {
  const { currentTheme } = useTheme();
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    // Only certain themes have particle effects
    const effects = {
      'theme-christmas': { icon: '❄️', minSize: 12, maxSize: 32, dur: 8, anim: 'fall' },
      'theme-valentine': { icon: '💖', minSize: 12, maxSize: 24, dur: 12, anim: 'float-up' },
      'theme-stpatricks': { icon: '🍀', minSize: 12, maxSize: 24, dur: 15, anim: 'fall' },
      'theme-easter': { icon: '🌸', minSize: 10, maxSize: 20, dur: 14, anim: 'float-up' },
      'theme-autumn': { icon: '🍂', minSize: 12, maxSize: 24, dur: 12, anim: 'fall' },
      'theme-independence': { icon: '🎆', minSize: 16, maxSize: 30, dur: 6, anim: 'twinkle' },
      'theme-anniversary': { icon: '🎉', minSize: 14, maxSize: 28, dur: 10, anim: 'fall' },
      'theme-halloween': { icon: '蝙', minSize: 16, maxSize: 30, dur: 8, anim: 'float-up' },
      'theme-earth': { icon: '🍃', minSize: 12, maxSize: 20, dur: 14, anim: 'fall' },
      'theme-newyear': { icon: '✨', minSize: 10, maxSize: 24, dur: 5, anim: 'twinkle' },
      'theme-diwali': { icon: '🪔', minSize: 16, maxSize: 28, dur: 8, anim: 'twinkle' },
      'theme-lunar': { icon: '🏮', minSize: 16, maxSize: 32, dur: 15, anim: 'float-up' },
      'theme-ramadan': { icon: '🌙', minSize: 16, maxSize: 30, dur: 12, anim: 'twinkle' },
    };

    const config = effects[currentTheme];
    if (!config) {
      setParticles([]);
      return;
    }

    const newParticles = Array.from({ length: MAX_PARTICLES }).map((_, i) => ({
      id: i,
      left: Math.random() * 100, // %
      top: Math.random() * 100, // %
      delay: Math.random() * config.dur, // s
      size: config.minSize + Math.random() * (config.maxSize - config.minSize),
      ...config
    }));

    setParticles(newParticles);
  }, [currentTheme]);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      {particles.map((p) => {
        // Special positioning logic for certain animations to look natural
        let startLeft = `${p.left}%`;
        let startTop = `${p.top}%`;
        
        if (p.anim === 'float-up') startTop = '100%';
        if (p.anim === 'fall') startTop = '-10vh';

        if (currentTheme === 'theme-christmas') {
          return (
            <div
              key={p.id}
              className="snow-flake particle-snow-fall"
              style={{
                left: startLeft,
                top: startTop,
                width: `${p.size / 2}px`,
                height: `${p.size / 2}px`,
                animationDuration: `${p.dur}s`,
                animationDelay: `-${p.delay}s`,
                opacity: 0.8 - (p.size / 40)
              }}
            />
          );
        }

        return (
          <div
            key={p.id}
            className={`absolute particle-${p.anim} opacity-20 drop-shadow-md`}
            style={{
              left: startLeft,
              top: startTop,
              fontSize: `${p.size}px`,
              animationDuration: `${p.dur}s`,
              animationDelay: `-${p.delay}s`,
            }}
          >
            {p.icon}
          </div>
        );
      })}
    </div>
  );
}
