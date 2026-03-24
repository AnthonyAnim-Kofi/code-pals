import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  try {
    const { code, language = "python", version = "*" } = await req.json();

    if (!code || typeof code !== "string") {
      return new Response(
        JSON.stringify({ error: "Code is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Map frontend language names to Piston API language identifiers
    const pistonLanguageMap: Record<string, string> = {
      python: "python",
      javascript: "javascript",
      typescript: "typescript",
      java: "java",
      c: "c",
      cpp: "c++",
      csharp: "csharp",
      ruby: "ruby",
      go: "go",
      rust: "rust",
      php: "php",
      swift: "swift",
      kotlin: "kotlin",
    };

    const pistonLang = pistonLanguageMap[language.toLowerCase()] || language.toLowerCase();
    let resolvedVersion = version;

    // --- NEW: DYNAMIC VERSION RESOLUTION ---
    // If version is "*", fetch the latest available version from Piston
    if (resolvedVersion === "*") {
      const runtimesRes = await fetch("https://emkc.org/api/v2/piston/runtimes");
      if (!runtimesRes.ok) throw new Error("Failed to fetch Piston runtimes");

      const runtimes = await runtimesRes.json();

      // Find the specific language or alias in the runtimes list
      const runtime = runtimes.find((r: any) =>
        r.language === pistonLang || r.aliases.includes(pistonLang)
      );

      if (!runtime) {
        throw new Error(`Language '${language}' is not currently supported by the execution engine.`);
      }

      resolvedVersion = runtime.version;
    }

    // Forward the user's code to the free Piston Code Execution API
    // Note: Piston v2 does not require a filename if there is only one file, it infers it.
    const pistonResponse = await fetch("https://emkc.org/api/v2/piston/execute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        language: pistonLang,
        version: resolvedVersion,
        files: [
          {
            content: code,
          },
        ],
      }),
    });

    const pistonResult = await pistonResponse.json();

    if (!pistonResponse.ok) {
      throw new Error(`Piston API Error: ${pistonResult.message || pistonResponse.statusText}`);
    }

    // --- NEW: COMPILE & RUN SEPARATION ---
    // Handle outputs safely. Compiled languages use 'compile', interpreted use 'run'
    const compileOutput = pistonResult.compile?.output || "";
    const runStdout = pistonResult.run?.stdout || "";
    const runStderr = pistonResult.run?.stderr || "";
    const exitCode = pistonResult.run?.code ?? (pistonResult.compile?.code || 0);

    // Combine compile errors and run output so the user sees everything
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
        status: 200, // Returning 200 so the frontend can parse the JSON error gracefully
      },
    );
  }
});
