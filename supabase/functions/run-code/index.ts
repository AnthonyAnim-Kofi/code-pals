import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  MAX_CODE_BYTES,
  buildExecutePayload,
  friendlyPistonUpstreamError,
  getPistonApiBase,
  resolvePistonLanguage,
  type PistonExecuteResult,
} from "../_shared/run-code-piston.ts";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function byteLengthUtf8(s: string): number {
  return new TextEncoder().encode(s).length;
}

type RunCodeBody = {
  code?: unknown;
  language?: unknown;
  version?: unknown;
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  let body: RunCodeBody;
  try {
    body = (await req.json()) as RunCodeBody;
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const code = body.code;
  const languageIn = body.language;
  const versionIn = body.version;

  if (typeof code !== "string") {
    return json({ error: "Field `code` must be a string" }, 400);
  }
  if (byteLengthUtf8(code) > MAX_CODE_BYTES) {
    return json(
      { error: `Code exceeds maximum size (${MAX_CODE_BYTES} bytes)` },
      400,
    );
  }

  if (languageIn !== undefined && typeof languageIn !== "string") {
    return json({ error: "Field `language` must be a string" }, 400);
  }
  const languageRaw = typeof languageIn === "string" && languageIn.length > 0
    ? languageIn
    : "python";

  let version =
    typeof versionIn === "string" && versionIn.length > 0 ? versionIn : "*";

  const pistonLang = resolvePistonLanguage(languageRaw);
  const apiBase = getPistonApiBase();

  try {
    if (version === "*") {
      const rtRes = await fetch(`${apiBase}/piston/runtimes`);
      const rtText = await rtRes.text();
      if (!rtRes.ok) {
        let msg = "Failed to list runtimes from code runner";
        try {
          const j = JSON.parse(rtText) as { message?: string };
          if (typeof j?.message === "string") {
            msg = friendlyPistonUpstreamError(j.message);
          }
        } catch {
          /* ignore */
        }
        return json({ error: msg }, 502);
      }

      const runtimes = JSON.parse(rtText) as Array<{
        language: string;
        version: string;
        aliases?: string[];
      }>;

      const hit = runtimes.find(
        (r) => r.language === pistonLang || r.aliases?.includes(pistonLang),
      );
      if (!hit) {
        return json(
          {
            error: `Language "${languageRaw}" is not available on this code runner.`,
          },
          400,
        );
      }
      version = hit.version;
    }

    const execRes = await fetch(`${apiBase}/piston/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildExecutePayload(pistonLang, version, code)),
    });

    const execText = await execRes.text();
    let pistonResult: PistonExecuteResult;
    try {
      pistonResult = JSON.parse(execText) as PistonExecuteResult;
    } catch {
      return json(
        { error: "Code runner returned invalid response" },
        502,
      );
    }

    if (!execRes.ok) {
      const msg =
        typeof (pistonResult as { message?: string }).message === "string"
          ? (pistonResult as { message: string }).message
          : execRes.statusText;
      return json(
        { error: `Code runner error: ${friendlyPistonUpstreamError(msg)}` },
        502,
      );
    }

    const compileOut = (pistonResult.compile?.output ?? "").trimEnd();
    const runOut = (pistonResult.run?.stdout ?? "").trimEnd();
    const runErr = (pistonResult.run?.stderr ?? "").trimEnd();

    const stdout = [compileOut, runOut].filter(Boolean).join("\n").trim();
    const stderr = runErr;
    const exitCode =
      pistonResult.run?.code ?? pistonResult.compile?.code ?? null;

    return json({
      stdout,
      stderr,
      exitCode,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return json({ error: message }, 502);
  }
});
