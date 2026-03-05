import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type RuntimeValue = string | number | boolean | null;

function splitByComma(input: string): string[] {
  const parts: string[] = [];
  let current = "";
  let inSingle = false;
  let inDouble = false;
  let depth = 0;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    const prev = input[i - 1];

    if (char === "'" && !inDouble && prev !== "\\") inSingle = !inSingle;
    if (char === '"' && !inSingle && prev !== "\\") inDouble = !inDouble;

    if (!inSingle && !inDouble) {
      if (char === "(") depth++;
      if (char === ")") depth = Math.max(0, depth - 1);
      if (char === "," && depth === 0) {
        parts.push(current.trim());
        current = "";
        continue;
      }
    }

    current += char;
  }

  if (current.trim().length > 0) parts.push(current.trim());
  return parts;
}

function toPythonFormattedString(value: RuntimeValue): string {
  if (value === null) return "None";
  if (typeof value === "boolean") return value ? "True" : "False";
  return String(value);
}

function sanitizeExpression(expression: string): string {
  const expr = expression.trim();

  if (!expr) throw new Error("Empty expression is not allowed");

  // block dangerous tokens and unsupported language features
  const blockedPatterns = [
    /\b(import|from|open|exec|eval|while|for|def|class|try|except|with|lambda|yield|global|nonlocal|del|assert|raise)\b/i,
    /__\w+__/,
    /\b(os|sys|subprocess|pathlib|socket|http|requests|Deno|globalThis|window|document|Function|constructor|prototype)\b/i,
    /[{}\[\];`]/,
  ];

  for (const pattern of blockedPatterns) {
    if (pattern.test(expr)) {
      throw new Error("Unsupported or unsafe Python syntax");
    }
  }

  // only allow a strict math/string expression subset
  if (!/^[\w\s+\-*/%().,'"=<>!&|]+$/.test(expr)) {
    throw new Error("Expression contains unsupported characters");
  }

  return expr
    .replace(/\bTrue\b/g, "true")
    .replace(/\bFalse\b/g, "false")
    .replace(/\bNone\b/g, "null")
    .replace(/\band\b/g, "&&")
    .replace(/\bor\b/g, "||")
    .replace(/\bnot\b/g, "!");
}

function evaluateExpression(expression: string, env: Record<string, RuntimeValue>): RuntimeValue {
  const jsExpr = sanitizeExpression(expression);

  const varNames = Object.keys(env);
  const varValues = Object.values(env);

  try {
    // Evaluate only sanitized expression with known variables injected as params.
    const fn = new Function(...varNames, `"use strict"; return (${jsExpr});`);
    const result = fn(...varValues);

    if (
      result === null ||
      typeof result === "string" ||
      typeof result === "number" ||
      typeof result === "boolean"
    ) {
      return result;
    }

    throw new Error("Only string/number/boolean outputs are supported");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown expression error";
    throw new Error(`Invalid expression: ${message}`);
  }
}

function runPythonSubset(code: string): string {
  const lines = code.split(/\r?\n/);
  const env: Record<string, RuntimeValue> = {};
  const output: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) continue;

    const printMatch = line.match(/^print\s*\((.*)\)\s*$/);
    if (printMatch) {
      const inside = printMatch[1].trim();
      if (!inside) {
        output.push("");
        continue;
      }

      const args = splitByComma(inside);
      const evaluatedArgs = args.map((arg) => toPythonFormattedString(evaluateExpression(arg, env)));
      output.push(evaluatedArgs.join(" "));
      continue;
    }

    const assignmentMatch = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+)$/);
    if (assignmentMatch) {
      const variableName = assignmentMatch[1];
      const expression = assignmentMatch[2];
      env[variableName] = evaluateExpression(expression, env);
      continue;
    }

    throw new Error(`Unsupported syntax on line ${i + 1}: ${rawLine.trim()}`);
  }

  return output.join("\n");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { code } = await req.json();

    if (!code || typeof code !== "string") {
      return new Response(
        JSON.stringify({ error: "Code is required" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    try {
      const output = runPythonSubset(code);
      return new Response(
        JSON.stringify({ output, error: null, exitCode: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    } catch (executionError) {
      const message = executionError instanceof Error ? executionError.message : "Execution failed";
      return new Response(
        JSON.stringify({ output: "", error: message, exitCode: 1 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
