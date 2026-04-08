import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const PISTON_API = "https://emkc.org/api/v2/piston";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  let body: { language?: string; version?: string; code?: string; stdin?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const { language, version = "*", code, stdin = "" } = body;

  if (!language || typeof language !== "string") {
    return jsonResponse({ error: "language is required" }, 400);
  }
  if (!code || typeof code !== "string") {
    return jsonResponse({ error: "code is required" }, 400);
  }
  if (code.length > 500_000) {
    return jsonResponse({ error: "Code exceeds 500KB limit" }, 400);
  }

  const pistonPayload = {
    language,
    version,
    files: [{ content: code }],
    stdin,
    run_timeout: 10000,
    compile_timeout: 15000,
    compile_memory_limit: -1,
    run_memory_limit: -1,
  };

  let pistonResponse: Response;
  try {
    pistonResponse = await fetch(`${PISTON_API}/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pistonPayload),
    });
  } catch (err) {
    return jsonResponse({
      error: `Failed to reach code execution service: ${(err as Error).message}`,
    }, 503);
  }

  if (!pistonResponse.ok) {
    const errText = await pistonResponse.text().catch(() => "");
    let errMsg = `Execution service returned ${pistonResponse.status}`;
    try {
      const parsed = JSON.parse(errText);
      if (parsed?.message) errMsg = parsed.message;
    } catch { /* ignore */ }
    return jsonResponse({ error: errMsg }, pistonResponse.status >= 500 ? 502 : 400);
  }

  let result: {
    language?: string;
    version?: string;
    run?: { stdout?: string; stderr?: string; code?: number; signal?: string };
    compile?: { stdout?: string; stderr?: string; code?: number };
  };

  try {
    result = await pistonResponse.json();
  } catch {
    return jsonResponse({ error: "Invalid response from execution service" }, 502);
  }

  return jsonResponse({
    stdout: result.run?.stdout ?? "",
    stderr: result.run?.stderr ?? "",
    exitCode: result.run?.code ?? null,
    signal: result.run?.signal ?? null,
    compileOutput: result.compile?.stdout ?? "",
    compileError: result.compile?.stderr ?? "",
    language: result.language ?? language,
    version: result.version ?? version,
  });
});
