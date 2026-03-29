/**
 * Maps curriculum language slug/name → CodeMirror editor id and Piston `run-code` language key.
 * Piston runs code in a server-side sandbox; HTML/CSS use iframe preview only.
 */

/** Slug → { editor, api } — api keys must match `supabase/functions/run-code` pistonLanguageMap */
const SLUG_MAP = {
  // Core languages
  python: { editor: "python", api: "python" },
  javascript: { editor: "javascript", api: "javascript" },
  js: { editor: "javascript", api: "javascript" },
  typescript: { editor: "typescript", api: "typescript" },
  ts: { editor: "typescript", api: "typescript" },
  java: { editor: "java", api: "java" },
  c: { editor: "c", api: "c" },
  cpp: { editor: "cpp", api: "cpp" },
  "c++": { editor: "cpp", api: "cpp" },
  csharp: { editor: "csharp", api: "csharp" },
  "c#": { editor: "csharp", api: "csharp" },
  ruby: { editor: "ruby", api: "ruby" },
  go: { editor: "go", api: "go" },
  golang: { editor: "go", api: "go" },
  rust: { editor: "rust", api: "rust" },
  php: { editor: "php", api: "php" },
  swift: { editor: "swift", api: "swift" },
  kotlin: { editor: "kotlin", api: "kotlin" },
  html: { editor: "html", api: "html" },
  css: { editor: "css", api: "css" },

  // JS/TS ecosystems
  angular: { editor: "typescript", api: "typescript" },
  react: { editor: "javascript", api: "javascript" },
  reactjs: { editor: "javascript", api: "javascript" },
  vue: { editor: "javascript", api: "javascript" },
  vuejs: { editor: "javascript", api: "javascript" },
  svelte: { editor: "javascript", api: "javascript" },
  sveltekit: { editor: "javascript", api: "javascript" },
  nextjs: { editor: "typescript", api: "typescript" },
  next: { editor: "typescript", api: "typescript" },
  nuxt: { editor: "javascript", api: "javascript" },
  nuxtjs: { editor: "javascript", api: "javascript" },
  remix: { editor: "typescript", api: "typescript" },
  astro: { editor: "typescript", api: "typescript" },
  solidjs: { editor: "javascript", api: "javascript" },
  qwik: { editor: "typescript", api: "typescript" },
  nestjs: { editor: "typescript", api: "typescript" },
  nest: { editor: "typescript", api: "typescript" },
  express: { editor: "javascript", api: "javascript" },
  expressjs: { editor: "javascript", api: "javascript" },
  fastify: { editor: "javascript", api: "javascript" },
  bun: { editor: "javascript", api: "javascript" },
  deno: { editor: "typescript", api: "deno" },
  node: { editor: "javascript", api: "javascript" },
  nodejs: { editor: "javascript", api: "javascript" },

  // Python stacks
  django: { editor: "python", api: "python" },
  flask: { editor: "python", api: "python" },
  fastapi: { editor: "python", api: "python" },
  tornado: { editor: "python", api: "python" },
  pytorch: { editor: "python", api: "python" },
  tensorflow: { editor: "python", api: "python" },

  // JVM / other backends
  spring: { editor: "java", api: "java" },
  springboot: { editor: "java", api: "java" },
  laravel: { editor: "php", api: "php" },
  lumen: { editor: "php", api: "php" },
  symfony: { editor: "php", api: "php" },
  rails: { editor: "ruby", api: "ruby" },
  "ruby-on-rails": { editor: "ruby", api: "ruby" },

  // Systems & shells
  bash: { editor: "javascript", api: "bash" },
  shell: { editor: "javascript", api: "bash" },
  zsh: { editor: "javascript", api: "bash" },
  powershell: { editor: "javascript", api: "powershell" },
  pwsh: { editor: "javascript", api: "powershell" },

  // Piston-supported extras (editor may fall back to JS for exotic syntax)
  lua: { editor: "javascript", api: "lua" },
  perl: { editor: "javascript", api: "perl" },
  raku: { editor: "javascript", api: "raku" },
  scala: { editor: "javascript", api: "scala" },
  dart: { editor: "javascript", api: "dart" },
  r: { editor: "javascript", api: "r" },
  julia: { editor: "javascript", api: "julia" },
  haskell: { editor: "javascript", api: "haskell" },
  zig: { editor: "javascript", api: "zig" },
  nim: { editor: "javascript", api: "nim" },
  crystal: { editor: "javascript", api: "crystal" },
  elixir: { editor: "javascript", api: "elixir" },
  erlang: { editor: "javascript", api: "erlang" },
  phoenix: { editor: "javascript", api: "elixir" },
  clojure: { editor: "javascript", api: "clojure" },
  fsharp: { editor: "javascript", api: "fsharp" },
  "f#": { editor: "javascript", api: "fsharp" },
  ocaml: { editor: "javascript", api: "ocaml" },
  vlang: { editor: "javascript", api: "vlang" },
  groovy: { editor: "javascript", api: "groovy" },
  fortran: { editor: "javascript", api: "fortran" },
  cobol: { editor: "javascript", api: "cobol" },
  lisp: { editor: "javascript", api: "lisp" },
  scheme: { editor: "javascript", api: "scheme" },
  prolog: { editor: "javascript", api: "prolog" },
  ada: { editor: "javascript", api: "ada" },
  d: { editor: "javascript", api: "d" },
  brainfuck: { editor: "javascript", api: "brainfuck" },
};

const MARKUP = new Set(["html", "css"]);

/** Curricula that are not executed in Piston (no runtime or not configured yet) */
const NO_SANDBOX_SLUGS = new Set([
  "sql",
  "database",
  "mongodb",
  "redis",
  "graphql",
  "prisma",
  "kubernetes",
  "docker",
  "terraform",
  "ansible",
]);

function norm(s) {
  return (s || "").toLowerCase().trim();
}

/**
 * @param {{ slug?: string | null, nameFallback?: string }} opts
 * @returns {{
 *   editorLanguage: string,
 *   apiLanguage: string,
 *   displayLabel: string,
 *   isMarkup: boolean,
 *   useIframePreview: boolean,
 *   canRunInSandbox: boolean,
 *   resolutionKey: string,
 * }}
 */
export function resolveCodeRunnerLanguage({ slug, nameFallback = "python" }) {
  const s = norm(slug);
  const name = norm(nameFallback);

  if (s && SLUG_MAP[s]) {
    const m = SLUG_MAP[s];
    const markup = MARKUP.has(s);
    return finalize(m.editor, m.api, s, markup, !NO_SANDBOX_SLUGS.has(s) && !markup);
  }

  if (NO_SANDBOX_SLUGS.has(s)) {
    return finalize("javascript", "javascript", s || name, false, false);
  }

  if (name.includes("c++") || name === "cpp") {
    return finalize("cpp", "cpp", "cpp", false, true);
  }
  if (name.includes("c#") || name === "csharp") {
    return finalize("csharp", "csharp", "csharp", false, true);
  }
  if (name.includes("typescript")) {
    return finalize("typescript", "typescript", "typescript", false, true);
  }
  if (name.includes("javascript") || name === "js") {
    return finalize("javascript", "javascript", "javascript", false, true);
  }
  if (MARKUP.has(name)) {
    return finalize(name, name, name, true, false);
  }

  const guess = norm(name.replace(/\s+/g, ""));
  if (SLUG_MAP[guess]) {
    const m = SLUG_MAP[guess];
    const markup = MARKUP.has(guess);
    return finalize(m.editor, m.api, guess, markup, !NO_SANDBOX_SLUGS.has(guess) && !markup);
  }

  return finalize("python", "python", "python", false, true);
}

function finalize(editorLanguage, apiLanguage, displayLabel, isMarkup, canRunInSandbox) {
  const useIframePreview = isMarkup;
  const sandbox = canRunInSandbox && !isMarkup;
  return {
    editorLanguage,
    apiLanguage,
    displayLabel,
    isMarkup,
    useIframePreview,
    canRunInSandbox: sandbox,
    resolutionKey: `${displayLabel}:${editorLanguage}:${apiLanguage}`,
  };
}

/**
 * Filename shown in the fake tab bar
 * @param {string} editorLanguage
 */
export function getRunnerFileLabel(editorLanguage) {
  switch (editorLanguage) {
    case "html":
      return "index.html";
    case "css":
      return "style.css";
    case "python":
      return "main.py";
    case "javascript":
      return "script.js";
    case "typescript":
      return "main.ts";
    case "java":
      return "Main.java";
    case "c":
      return "main.c";
    case "cpp":
      return "main.cpp";
    case "csharp":
      return "Program.cs";
    case "ruby":
      return "main.rb";
    case "go":
      return "main.go";
    case "rust":
      return "main.rs";
    case "php":
      return "main.php";
    case "swift":
      return "main.swift";
    case "kotlin":
      return "Main.kt";
    default:
      return "main.txt";
  }
}
