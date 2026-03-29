import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getPistonApiBase(): string {
  const raw = Deno.env.get("PISTON_API_BASE")?.trim() || "https://emkc.org/api/v2";
  return raw.replace(/\/$/, "");
}

const SANDBOX_TIMEOUT_MS = { run: 10_000, compile: 15_000 } as const;

function buildPistonExecuteBody(
  pistonLang: string,
  resolvedVersion: string,
  code: string,
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    language: pistonLang,
    version: resolvedVersion,
    files: [{ content: code }],
    run_timeout: SANDBOX_TIMEOUT_MS.run,
    compile_timeout: SANDBOX_TIMEOUT_MS.compile,
  };
  const memRaw = Deno.env.get("PISTON_RUN_MEMORY_BYTES")?.trim();
  if (memRaw) {
    const n = parseInt(memRaw, 10);
    if (!Number.isNaN(n) && n > 0) {
      body.run_memory_limit = n;
    }
  }
  return body;
}

function pistonUnavailableMessage(message: string): string {
  if (/whitelist|hosting your own|engineerman/i.test(message)) {
    return (
      "Code sandbox is not reachable: the public Piston demo requires allowlisting. " +
      "Host your own Piston (Docker) and set PISTON_API_BASE on this function to your instance URL (e.g. https://piston.yourdomain.com/api/v2)."
    );
  }
  return message;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { code, language = "python", version = "*" } = await req.json();

    if (!code || typeof code !== "string") {
      return new Response(
        JSON.stringify({ error: "Code is required" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    const pistonLanguageMap: Record<string, string> = {
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

    const pistonLang = pistonLanguageMap[language.toLowerCase()] || language.toLowerCase();
    let resolvedVersion = version;
    const apiBase = getPistonApiBase();

    if (resolvedVersion === "*") {
      const runtimesRes = await fetch(`${apiBase}/piston/runtimes`);
      if (!runtimesRes.ok) {
        const errText = await runtimesRes.text();
        let msg = "Failed to fetch Piston runtimes";
        try {
          const j = JSON.parse(errText);
          if (typeof j?.message === "string") msg = pistonUnavailableMessage(j.message);
        } catch { /* use default */ }
        throw new Error(msg);
      }

      const runtimes = await runtimesRes.json();

      const runtime = runtimes.find((r: { language: string; aliases?: string[] }) =>
        r.language === pistonLang || r.aliases?.includes(pistonLang)
      );

      if (!runtime) {
        throw new Error(`Language '${language}' is not currently supported by the execution engine.`);
      }

      resolvedVersion = runtime.version;
    }

    const pistonResponse = await fetch(`${apiBase}/piston/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildPistonExecuteBody(pistonLang, resolvedVersion, code)),
    });

    const pistonResult = await pistonResponse.json();

    if (!pistonResponse.ok) {
      const raw = typeof pistonResult?.message === "string"
        ? pistonResult.message
        : pistonResponse.statusText;
      throw new Error(`Piston API Error: ${pistonUnavailableMessage(raw)}`);
    }

    const compileOutput = pistonResult.compile?.output || "";
    const runStdout = pistonResult.run?.stdout || "";
    const runStderr = pistonResult.run?.stderr || "";
    const exitCode = pistonResult.run?.code ?? (pistonResult.compile?.code || 0);

    const combinedOutput = (compileOutput + "\n" + runStdout).trim();

    return new Response(
      JSON.stringify({
        output: combinedOutput,
        error: runStderr.trim() || null,
        exitCode: exitCode
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ output: "", error: errorMessage, exitCode: 1 }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  }
});
