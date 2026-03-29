/**
 * Client for the `run-code` Supabase Edge Function (Piston sandbox).
 * Response shape: { stdout, stderr, exitCode } on success; { error } on failure (HTTP 4xx/5xx).
 */
import { supabase } from "@/integrations/supabase/client";

/** @param {unknown} error */
function messageFromFunctionsError(error) {
  if (!error || typeof error !== "object") return "Could not run code";
  const e = /** @type {{ message?: string; context?: { body?: string } }} */ (error);
  const body = e.context?.body;
  if (typeof body === "string") {
    try {
      const j = JSON.parse(body);
      if (typeof j?.error === "string") return j.error;
    } catch {
      /* ignore */
    }
  }
  return typeof e.message === "string" ? e.message : "Could not run code";
}

/**
 * @param {{ code: string, language: string }} params
 * @returns {Promise<
 *   | { ok: true, stdout: string, stderr: string, exitCode: number | null }
 *   | { ok: false, message: string }
 * >}
 */
export async function executeUserCode({ code, language }) {
  const payload = {
    code: typeof code === "string" ? code : String(code ?? ""),
    language: typeof language === "string" ? language : String(language ?? "python"),
  };
  const { data, error } = await supabase.functions.invoke("run-code", {
    body: payload,
  });

  if (error) {
    return { ok: false, message: messageFromFunctionsError(error) };
  }

  if (!data || typeof data !== "object") {
    return { ok: false, message: "Empty response from code runner" };
  }

  if ("error" in data && typeof data.error === "string") {
    return { ok: false, message: data.error };
  }

  if (!("stdout" in data) && !("stderr" in data)) {
    return { ok: false, message: "Invalid response from code runner" };
  }

  return {
    ok: true,
    stdout: typeof data.stdout === "string" ? data.stdout : "",
    stderr: typeof data.stderr === "string" ? data.stderr : "",
    exitCode: data.exitCode == null ? null : Number(data.exitCode),
  };
}

/**
 * Single string for comparing to `expectedOutput` in lessons (stdout first, else stderr).
 */
export function gradingOutput({ stdout, stderr }) {
  const o = (stdout || "").trim();
  const e = (stderr || "").trim();
  return o || e || "";
}

/**
 * @param {{ stdout: string, stderr: string }} run
 * @returns {Array<{ type: 'output' | 'error', text: string }>}
 */
export function consoleLinesFromRun(run) {
  const lines = [];
  const out = (run.stdout || "").trimEnd();
  const err = (run.stderr || "").trimEnd();
  if (out) lines.push({ type: "output", text: out });
  if (err) lines.push({ type: "error", text: err });
  return lines;
}
