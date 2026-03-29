/**
 * Piston v2 integration — shared by `run-code` Edge Function.
 * @see https://piston.readthedocs.io/en/latest/api-v2/
 */

/** Max UTF-8 bytes accepted per request (protects the runner and upstream Piston). */
export const MAX_CODE_BYTES = 200_000;

const DEFAULT_PISTON_BASE = "https://emkc.org/api/v2";

export function getPistonApiBase(): string {
  const raw = Deno.env.get("PISTON_API_BASE")?.trim() || DEFAULT_PISTON_BASE;
  return raw.replace(/\/$/, "");
}

/** Client `language` / alias → Piston runtime language id (for execute + runtimes lookup). */
export const LANGUAGE_ALIASES: Record<string, string> = {
  python: "python",
  javascript: "javascript",
  js: "javascript",
  typescript: "typescript",
  ts: "typescript",
  java: "java",
  c: "c",
  cpp: "c++",
  "c++": "c++",
  csharp: "csharp",
  "c#": "csharp",
  ruby: "ruby",
  go: "go",
  rust: "rust",
  php: "php",
  swift: "swift",
  kotlin: "kotlin",
  bash: "bash",
  sh: "bash",
  lua: "lua",
  perl: "perl",
  raku: "raku",
  scala: "scala",
  dart: "dart",
  r: "r",
  julia: "julia",
  haskell: "haskell",
  zig: "zig",
  nim: "nim",
  crystal: "crystal",
  elixir: "elixir",
  erlang: "erlang",
  clojure: "clojure",
  fsharp: "fsharp",
  ocaml: "ocaml",
  vlang: "vlang",
  groovy: "groovy",
  fortran: "fortran",
  cobol: "cobol",
  lisp: "lisp",
  scheme: "scheme",
  prolog: "prolog",
  ada: "ada",
  d: "d",
  brainfuck: "brainfuck",
  deno: "deno",
  powershell: "powershell",
  pwsh: "powershell",
  node: "javascript",
  nodejs: "javascript",
};

export function resolvePistonLanguage(requested: string): string {
  const key = requested.trim().toLowerCase();
  return LANGUAGE_ALIASES[key] ?? key;
}

export function getSandboxTimeouts(): { run: number; compile: number } {
  const run = parseInt(Deno.env.get("PISTON_RUN_TIMEOUT_MS")?.trim() || "", 10);
  const compile = parseInt(Deno.env.get("PISTON_COMPILE_TIMEOUT_MS")?.trim() || "", 10);
  return {
    run: Number.isFinite(run) && run > 0 ? Math.min(run, 60_000) : 10_000,
    compile: Number.isFinite(compile) && compile > 0 ? Math.min(compile, 60_000) : 15_000,
  };
}

export function getOptionalRunMemoryLimit(): number | undefined {
  const raw = Deno.env.get("PISTON_RUN_MEMORY_BYTES")?.trim();
  if (!raw) return undefined;
  const n = parseInt(raw, 10);
  if (Number.isNaN(n) || n <= 0) return undefined;
  return n;
}

export function buildExecutePayload(
  pistonLang: string,
  version: string,
  code: string,
): Record<string, unknown> {
  const { run, compile } = getSandboxTimeouts();
  const body: Record<string, unknown> = {
    language: pistonLang,
    version,
    files: [{ content: code }],
    run_timeout: run,
    compile_timeout: compile,
  };
  const mem = getOptionalRunMemoryLimit();
  if (mem !== undefined) body.run_memory_limit = mem;
  return body;
}

export function friendlyPistonUpstreamError(message: string): string {
  if (/whitelist|hosting your own|engineerman/i.test(message)) {
    return (
      "Code runner is not available on the public demo host. Deploy your own Piston instance and set " +
      "the PISTON_API_BASE secret on this Edge Function (e.g. https://your-host/api/v2)."
    );
  }
  return message;
}

export type PistonExecuteResult = {
  compile?: { output?: string; stderr?: string; code?: number | null };
  run?: {
    stdout?: string;
    stderr?: string;
    code?: number | null;
    signal?: string | null;
  };
  language?: string;
  version?: string;
};
