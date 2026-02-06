/**
 * LanguageIcon – Renders a recognizable programming language icon.
 * Maps language slugs/names to CDN-hosted devicon SVGs for visual clarity.
 * Falls back to the stored emoji icon if no match is found.
 */

interface LanguageIconProps {
  slug: string;
  icon?: string;
  className?: string;
  size?: number;
}

/** Map of language slugs to devicon identifiers */
const LANGUAGE_ICON_MAP: Record<string, string> = {
  python: "python",
  javascript: "javascript",
  typescript: "typescript",
  java: "java",
  "c++": "cplusplus",
  cpp: "cplusplus",
  "c#": "csharp",
  csharp: "csharp",
  c: "c",
  ruby: "ruby",
  go: "go",
  golang: "go",
  rust: "rust",
  swift: "swift",
  kotlin: "kotlin",
  php: "php",
  html: "html5",
  css: "css3",
  react: "react",
  sql: "mysql",
  dart: "dart",
  flutter: "flutter",
  r: "r",
  scala: "scala",
  perl: "perl",
  lua: "lua",
  bash: "bash",
  shell: "bash",
};

export function LanguageIcon({ slug, icon, className = "", size = 32 }: LanguageIconProps) {
  const normalizedSlug = slug.toLowerCase().trim();
  const deviconId = LANGUAGE_ICON_MAP[normalizedSlug];

  if (deviconId) {
    return (
      <img
        src={`https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${deviconId}/${deviconId}-original.svg`}
        alt={slug}
        width={size}
        height={size}
        className={className}
        onError={(e) => {
          // If the original variant fails, try the plain variant
          const target = e.currentTarget;
          if (!target.dataset.fallbackTried) {
            target.dataset.fallbackTried = "true";
            target.src = `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${deviconId}/${deviconId}-plain.svg`;
          }
        }}
      />
    );
  }

  // Fallback: use the emoji icon stored in the database
  return <span className={className} style={{ fontSize: size * 0.8 }}>{icon || "💻"}</span>;
}
