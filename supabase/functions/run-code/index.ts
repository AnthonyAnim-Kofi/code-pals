// Edge Function: run-code
// Used by lesson code-runner challenges (src/lib/runCode.js → executeUserCode).
// Mirrors the playground's behavior:
//   - JS/TS  → local sandboxed `new Function` evaluator
//   - Python → small subset interpreter
//   - HTML/CSS → passthrough
//   - Everything else → forwarded to Piston (PISTON_API_BASE secret, defaults to emkc.org demo)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  buildExecutePayload,
  friendlyPistonUpstreamError,
  getLatestVersion,
  getPistonApiBase,
  MAX_CODE_BYTES,
  resolvePistonLanguage,
  type PistonExecuteResult,
} from "../_shared/run-code-piston.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const NATIVE_LANGS = new Set([
  "javascript", "js", "typescript", "ts",
  "python", "py", "python3",
  "html", "css", "html/css",
]);

function runJavaScriptLocally(code: string) {
  const logs: string[] = [];
  const errors: string[] = [];
  const fakeConsole = {
    log: (...a: unknown[]) => logs.push(a.map(String).join(" ")),
    error: (...a: unknown[]) => errors.push(a.map(String).join(" ")),
    warn: (...a: unknown[]) => logs.push(a.map(String).join(" ")),
    info: (...a: unknown[]) => logs.push(a.map(String).join(" ")),
  };
  try {
    const fn = new Function("console", "document", "window", "Deno", "fetch", code);
    fn(fakeConsole, undefined, undefined, undefined, undefined);
    return { stdout: logs.join("\n"), stderr: errors.join("\n"), exitCode: 0 };
  } catch (e) {
    return { stdout: logs.join("\n"), stderr: (e as Error).message, exitCode: 1 };
  }
}

// Tiny Python subset — enough for most intro lessons (print, vars, if/for/while, lists, basic math).
// Falls back to Piston if PISTON_API_BASE is set and the code uses unsupported features.
function runPythonSubset(code: string) {
  const out: string[] = [];
  const errs: string[] = [];
  const vars: Record<string, unknown> = {};

  const repr = (v: unknown): string => {
    if (v === null || v === undefined) return "None";
    if (v === true) return "True";
    if (v === false) return "False";
    if (Array.isArray(v)) return "[" + v.map(x => typeof x === "string" ? `'${x}'` : repr(x)).join(", ") + "]";
    return String(v);
  };

  const evalExpr = (e: string): unknown => {
    e = e.trim();
    if (/^f?".*"$/.test(e) || /^f?'.*'$/.test(e)) {
      const isF = e.startsWith("f");
      let s = (isF ? e.slice(1) : e).slice(1, -1);
      if (isF) s = s.replace(/\{([^}]+)\}/g, (_, x) => repr(evalExpr(x)));
      return s;
    }
    if (e === "True") return true;
    if (e === "False") return false;
    if (e === "None") return null;
    if (/^-?\d+(\.\d+)?$/.test(e)) return Number(e);
    if (/^[a-zA-Z_]\w*$/.test(e)) return e in vars ? vars[e] : undefined;
    // arithmetic / comparison via JS (safe-ish: only after var substitution)
    try {
      const safe = e.replace(/\b([a-zA-Z_]\w*)\b/g, (_, n) =>
        n in vars ? JSON.stringify(vars[n]) : n
      );
      // eslint-disable-next-line no-new-func
      return new Function(`return (${safe})`)();
    } catch {
      return e;
    }
  };

  for (const raw of code.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    if (/^(import|from)\s/.test(line)) {
      // Hand off to Piston if available; otherwise error
      return { stdout: out.join("\n"), stderr: "", exitCode: 0, _needsPiston: true } as const;
    }
    const printM = line.match(/^print\((.*)\)$/);
    if (printM) {
      const args = printM[1].split(",").map(a => repr(evalExpr(a)));
      out.push(args.join(" "));
      continue;
    }
    const assignM = line.match(/^([a-zA-Z_]\w*)\s*=\s*(.+)$/);
    if (assignM && !line.includes("==")) {
      vars[assignM[1]] = evalExpr(assignM[2]);
      continue;
    }
    // Anything more complex → defer to Piston
    return { stdout: out.join("\n"), stderr: "", exitCode: 0, _needsPiston: true } as const;
  }
  return { stdout: out.join("\n"), stderr: errs.join("\n"), exitCode: 0, _needsPiston: false } as const;
}

async function runOnPiston(language: string, code: string) {
  const pistonLang = resolvePistonLanguage(language);
  const version = await getLatestVersion(pistonLang);
  const base = getPistonApiBase();
  const payload = buildExecutePayload(pistonLang, version, code);

  let res: Response;
  try {
    res = await fetch(`${base}/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    return json({
      error:
        "Could not reach the code execution service. " +
        "Set the PISTON_API_BASE secret to a working Piston instance. " +
        `(${(e as Error).message})`,
    }, 503);
  }

  if (!res.ok) {
    const text = await res.text();
    return json({ error: friendlyPistonUpstreamError(`Piston ${res.status}: ${text.slice(0, 400)}`) }, 502);
  }

  const result = (await res.json()) as PistonExecuteResult & { message?: string };
  if (result?.message && !result?.run) {
    return json({ error: friendlyPistonUpstreamError(`Piston: ${result.message}`) }, 400);
  }
  return json({
    stdout: result.run?.stdout ?? "",
    stderr: result.run?.stderr ?? result.compile?.stderr ?? "",
    exitCode: result.run?.code ?? null,
    language: result.language ?? pistonLang,
    version: result.version ?? version,
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: { language?: string; code?: string };
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON body" }, 400); }

  const language = (body.language || "").toLowerCase().trim();
  const code = body.code ?? "";
  if (!language) return json({ error: "language is required" }, 400);
  if (typeof code !== "string") return json({ error: "code must be a string" }, 400);
  if (new TextEncoder().encode(code).length > MAX_CODE_BYTES) {
    return json({ error: `Code exceeds ${MAX_CODE_BYTES} byte limit` }, 400);
  }

  // Native fast paths
  if (["javascript", "js", "typescript", "ts"].includes(language)) {
    const r = runJavaScriptLocally(code);
    return json({ ...r, language, version: "sandbox" });
  }
  if (["html", "css", "html/css"].includes(language)) {
    return json({ stdout: code, stderr: "", exitCode: 0, language, version: "passthrough" });
  }
  if (["python", "py", "python3"].includes(language)) {
    const r = runPythonSubset(code);
    if (!r._needsPiston) {
      return json({ stdout: r.stdout, stderr: r.stderr, exitCode: r.exitCode, language: "python", version: "sandbox" });
    }
    // Python code uses imports / advanced features → try Piston
  }

  // Everything else → Piston
  return await runOnPiston(language, code);
});
