/**
 * Piston v2 integration — shared by `run-code` Edge Function.
 * @see https://piston.readthedocs.io/en/latest/api-v2/
 */

/** Max UTF-8 bytes accepted per request (protects the runner and upstream Piston). */
export const MAX_CODE_BYTES = 200_000;

/** Default public demo; path segment matches vanilla Piston (`…/api/v2` + `/runtimes`). */
const DEFAULT_PISTON_BASE = "https://emkc.org/api/v2/piston";

export function getPistonApiBase(): string {
  let raw = Deno.env.get("PISTON_API_BASE")?.trim() || DEFAULT_PISTON_BASE;
  raw = raw.replace(/\/$/, "");
  // Older docs used `…/api/v2` for EMKC; the demo mounts Piston under `…/api/v2/piston`.
  if (raw === "https://emkc.org/api/v2") {
    raw = "https://emkc.org/api/v2/piston";
  }
  return raw;
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

// ── Runtime version cache ──────────────────────────────────────────────
// Piston `/runtimes` lists all installed languages + versions. We cache the
// latest version per language id so callers don't have to specify versions.
type RuntimeEntry = { language: string; version: string; aliases?: string[] };
let runtimesCache: { fetchedAt: number; map: Map<string, string> } | null = null;
const RUNTIMES_TTL_MS = 10 * 60 * 1000; // 10 minutes

export async function getLatestVersion(pistonLang: string): Promise<string> {
  const now = Date.now();
  if (!runtimesCache || now - runtimesCache.fetchedAt > RUNTIMES_TTL_MS) {
    const base = getPistonApiBase();
    try {
      const res = await fetch(`${base}/runtimes`);
      if (res.ok) {
        const list = (await res.json()) as RuntimeEntry[];
        const map = new Map<string, string>();
        for (const r of list) {
          // Keep the LAST occurrence (Piston returns versions ascending → last = latest)
          map.set(r.language, r.version);
          for (const alias of r.aliases ?? []) map.set(alias, r.version);
        }
        runtimesCache = { fetchedAt: now, map };
      }
    } catch {
      /* fall through — return "*" wildcard */
    }
  }
  return runtimesCache?.map.get(pistonLang) ?? "*";
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
