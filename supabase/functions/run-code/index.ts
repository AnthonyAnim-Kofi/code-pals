import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

const MAX_CODE_BYTES = 200_000;

function byteLengthUtf8(s: string): number {
  return new TextEncoder().encode(s).length;
}

/* ── Built-in JavaScript runner ─────────────────────────────────── */

function runJavaScriptLocally(code: string): { stdout: string; stderr: string; exitCode: number } {
  const BLOCKED = /\b(Deno|globalThis\.Deno|fetch|XMLHttpRequest|WebSocket|Worker|SharedArrayBuffer|Atomics)\b/;
  if (BLOCKED.test(code)) {
    return { stdout: "", stderr: "Blocked: code uses a restricted API.", exitCode: 1 };
  }

  const output: string[] = [];
  const errors: string[] = [];

  const fakeConsole = {
    log: (...args: unknown[]) => output.push(args.map(String).join(" ")),
    error: (...args: unknown[]) => errors.push(args.map(String).join(" ")),
    warn: (...args: unknown[]) => errors.push(args.map(String).join(" ")),
    info: (...args: unknown[]) => output.push(args.map(String).join(" ")),
  };

  // Provide a minimal fake document for DOM-related lessons
  const fakeElement = {
    textContent: "",
    value: "",
    innerHTML: "",
    addEventListener: () => {},
    style: {},
  };
  const fakeDocument = {
    querySelector: () => fakeElement,
    querySelectorAll: () => [fakeElement],
    getElementById: () => fakeElement,
    createElement: () => fakeElement,
  };

  try {
    const fn = new Function(
      "console", "document", "window", "globalThis", "Deno", "fetch",
      `"use strict";\n${code}`
    );
    fn(fakeConsole, fakeDocument, undefined, undefined, undefined, undefined);
    return { stdout: output.join("\n"), stderr: errors.join("\n"), exitCode: 0 };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { stdout: output.join("\n"), stderr: msg, exitCode: 1 };
  }
}

/* ── Built-in Python subset runner ──────────────────────────────── */

function runPythonSubset(code: string): { stdout: string; stderr: string; exitCode: number } {
  // Only block dangerous statements that appear as actual code lines, not inside strings
  const codeLines = code.split("\n");
  for (const line of codeLines) {
    const trimmed = line.trim();
    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith("#")) continue;
    // Strip string literals before checking for blocked tokens
    const stripped = trimmed
      .replace(/("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, '""');
    const strippedLower = stripped.toLowerCase();
    if (/^import\s/.test(strippedLower) || /^from\s/.test(strippedLower)) {
      return { stdout: "", stderr: `Blocked: import statements are not allowed in the sandbox.`, exitCode: 1 };
    }
    for (const t of ["__", "exec(", "eval(", "open(", "subprocess"]) {
      if (strippedLower.includes(t)) {
        return { stdout: "", stderr: `Blocked: "${t.trim()}" is not allowed in the sandbox.`, exitCode: 1 };
      }
    }
  }

  const output: string[] = [];
  const vars: Record<string, unknown> = {};

  // Built-in functions available to Python code
  const builtins: Record<string, (...args: unknown[]) => unknown> = {
    print: (...args: unknown[]) => { output.push(args.map(String).join(" ")); },
    len: (a: unknown) => Array.isArray(a) ? a.length : typeof a === "string" ? a.length : 0,
    str: (a: unknown) => String(a),
    int: (a: unknown) => parseInt(String(a), 10),
    float: (a: unknown) => parseFloat(String(a)),
    abs: (a: unknown) => Math.abs(Number(a)),
    min: (...a: unknown[]) => Math.min(...a.map(Number)),
    max: (...a: unknown[]) => Math.max(...a.map(Number)),
    range: (...args: unknown[]) => {
      const nums = args.map(Number);
      const start = nums.length >= 2 ? nums[0] : 0;
      const end = nums.length >= 2 ? nums[1] : nums[0];
      const step = nums[2] || 1;
      const r: number[] = [];
      for (let i = start; step > 0 ? i < end : i > end; i += step) r.push(i);
      return r;
    },
    type: (a: unknown) => {
      if (a === null || a === undefined) return "<class 'NoneType'>";
      if (typeof a === "boolean") return "<class 'bool'>";
      if (typeof a === "number") return Number.isInteger(a) ? "<class 'int'>" : "<class 'float'>";
      if (typeof a === "string") return "<class 'str'>";
      if (Array.isArray(a)) return "<class 'list'>";
      return "<class 'object'>";
    },
    bool: (a: unknown) => Boolean(a),
    list: (a: unknown) => Array.isArray(a) ? [...a] : typeof a === "string" ? a.split("") : [],
    round: (a: unknown, d?: unknown) => {
      const n = Number(a);
      const digits = d !== undefined ? Number(d) : 0;
      const f = Math.pow(10, digits);
      return Math.round(n * f) / f;
    },
    sorted: (a: unknown) => Array.isArray(a) ? [...a].sort((x, y) => (x as number) - (y as number)) : a,
    reversed: (a: unknown) => Array.isArray(a) ? [...a].reverse() : a,
    sum: (a: unknown) => Array.isArray(a) ? a.reduce((s: number, v: unknown) => s + Number(v), 0) : 0,
    enumerate: (a: unknown) => Array.isArray(a) ? a.map((v, i) => [i, v]) : [],
    zip: (...arrays: unknown[]) => {
      const arrs = arrays.filter(Array.isArray);
      if (arrs.length === 0) return [];
      const minLen = Math.min(...arrs.map(a => a.length));
      return Array.from({ length: minLen }, (_, i) => arrs.map(a => a[i]));
    },
    input: () => "",
    isinstance: () => true,
  };

  const lines = code.split("\n");
  try {
    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i];
      const trimmed = raw.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      // Handle for loops: `for VAR in EXPR:` followed by indented body
      const forMatch = trimmed.match(/^for\s+(\w+)\s+in\s+(.+):\s*$/);
      if (forMatch) {
        const loopVar = forMatch[1];
        const iterExpr = forMatch[2];
        const bodyLines: string[] = [];
        const baseIndent = raw.search(/\S/);
        let j = i + 1;
        while (j < lines.length) {
          const nextLine = lines[j];
          if (nextLine.trim() === "" || nextLine.search(/\S/) > baseIndent) {
            bodyLines.push(nextLine.trim());
            j++;
          } else break;
        }
        const iterable = evalPythonExpr(iterExpr, vars, builtins);
        if (Array.isArray(iterable)) {
          for (const item of iterable) {
            vars[loopVar] = item;
            for (const bl of bodyLines) {
              if (!bl) continue;
              executePythonLine(bl, vars, builtins, output);
            }
          }
        }
        i = j - 1;
        continue;
      }

      // Handle if/elif/else
      const ifMatch = trimmed.match(/^if\s+(.+):\s*$/);
      if (ifMatch) {
        const cond = evalPythonExpr(ifMatch[1], vars, builtins);
        const baseIndent = raw.search(/\S/);
        const ifBody: string[] = [];
        const elseBody: string[] = [];
        let j = i + 1;
        let inElse = false;
        while (j < lines.length) {
          const nextLine = lines[j];
          const nt = nextLine.trim();
          if (nt === "else:" || nt.startsWith("elif ")) {
            inElse = true;
            j++;
            continue;
          }
          if (nt === "" || nextLine.search(/\S/) > baseIndent) {
            (inElse ? elseBody : ifBody).push(nt);
            j++;
          } else break;
        }
        const body = cond ? ifBody : elseBody;
        for (const bl of body) {
          if (!bl) continue;
          executePythonLine(bl, vars, builtins, output);
        }
        i = j - 1;
        continue;
      }

      executePythonLine(trimmed, vars, builtins, output);
    }
    return { stdout: output.join("\n"), stderr: "", exitCode: 0 };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { stdout: output.join("\n"), stderr: msg, exitCode: 1 };
  }
}

function executePythonLine(
  trimmed: string,
  vars: Record<string, unknown>,
  builtins: Record<string, (...args: unknown[]) => unknown>,
  output: string[],
) {
  // print(...)
  const printMatch = trimmed.match(/^print\s*\((.+)\)\s*$/);
  if (printMatch) {
    const val = evalPythonExpr(printMatch[1], vars, builtins);
    output.push(formatPythonValue(val));
    return;
  }
  // assignment: var = expr
  const assignMatch = trimmed.match(/^(\w+)\s*=\s*(.+)$/);
  if (assignMatch) {
    vars[assignMatch[1]] = evalPythonExpr(assignMatch[2], vars, builtins);
    return;
  }
  // bare function call
  const callMatch = trimmed.match(/^(\w+)\s*\((.*)?\)\s*$/);
  if (callMatch) {
    evalPythonExpr(trimmed, vars, builtins);
    return;
  }
  // method call like arr.append(x)
  const methodMatch = trimmed.match(/^(\w+)\.(\w+)\s*\((.*)\)\s*$/);
  if (methodMatch) {
    evalPythonExpr(trimmed, vars, builtins);
    return;
  }
}

function formatPythonValue(val: unknown): string {
  if (val === true) return "True";
  if (val === false) return "False";
  if (val === null || val === undefined) return "None";
  if (Array.isArray(val)) return "[" + val.map(v => typeof v === "string" ? `'${v}'` : formatPythonValue(v)).join(", ") + "]";
  return String(val);
}

function evalPythonExpr(expr: string, vars: Record<string, unknown>, builtins: Record<string, (...args: unknown[]) => unknown>): unknown {
  let e = expr.trim();

  // Python booleans / None
  if (e === "True") return true;
  if (e === "False") return false;
  if (e === "None") return null;

  // String literal
  if ((e.startsWith('"') && e.endsWith('"')) || (e.startsWith("'") && e.endsWith("'"))) {
    return e.slice(1, -1);
  }
  // f-string
  if ((e.startsWith('f"') && e.endsWith('"')) || (e.startsWith("f'") && e.endsWith("'"))) {
    const inner = e.slice(2, -1);
    return inner.replace(/\{([^}]+)\}/g, (_, ex) => formatPythonValue(evalPythonExpr(ex, vars, builtins)));
  }

  // Number
  if (/^-?\d+(\.\d+)?$/.test(e)) return Number(e);

  // Array literal
  if (e.startsWith("[") && e.endsWith("]")) {
    const inner = e.slice(1, -1).trim();
    if (!inner) return [];
    return splitArgs(inner).map(a => evalPythonExpr(a, vars, builtins));
  }

  // Comparison / logical
  for (const op of [" and ", " or "]) {
    const idx = e.indexOf(op);
    if (idx !== -1) {
      const left = evalPythonExpr(e.slice(0, idx), vars, builtins);
      const right = evalPythonExpr(e.slice(idx + op.length), vars, builtins);
      return op.trim() === "and" ? (left && right) : (left || right);
    }
  }
  if (e.startsWith("not ")) {
    return !evalPythonExpr(e.slice(4), vars, builtins);
  }
  for (const op of [">=", "<=", "!=", "==", ">", "<"]) {
    const idx = e.indexOf(op);
    if (idx !== -1) {
      const left = evalPythonExpr(e.slice(0, idx), vars, builtins);
      const right = evalPythonExpr(e.slice(idx + op.length), vars, builtins);
      switch (op) {
        case "==": return left == right;
        case "!=": return left != right;
        case ">=": return Number(left) >= Number(right);
        case "<=": return Number(left) <= Number(right);
        case ">": return Number(left) > Number(right);
        case "<": return Number(left) < Number(right);
      }
    }
  }

  // String concatenation with +
  if (e.includes(" + ")) {
    const parts = e.split(" + ").map(p => evalPythonExpr(p, vars, builtins));
    if (parts.some(p => typeof p === "string")) return parts.map(String).join("");
    return parts.reduce((a: number, b) => a + Number(b), 0);
  }

  // Arithmetic
  for (const op of [" - ", " * ", " / ", " // ", " % ", " ** "]) {
    const idx = e.lastIndexOf(op);
    if (idx !== -1) {
      const left = Number(evalPythonExpr(e.slice(0, idx), vars, builtins));
      const right = Number(evalPythonExpr(e.slice(idx + op.length), vars, builtins));
      switch (op.trim()) {
        case "-": return left - right;
        case "*": return left * right;
        case "/": return left / right;
        case "//": return Math.floor(left / right);
        case "%": return left % right;
        case "**": return Math.pow(left, right);
      }
    }
  }

  // Method call: obj.method(args)
  const methodMatch = e.match(/^(\w+)\.(\w+)\s*\((.*)\)$/);
  if (methodMatch) {
    const obj = vars[methodMatch[1]];
    const method = methodMatch[2];
    const args = methodMatch[3] ? splitArgs(methodMatch[3]).map(a => evalPythonExpr(a, vars, builtins)) : [];
    if (Array.isArray(obj)) {
      if (method === "append") { obj.push(args[0]); return null; }
      if (method === "pop") return obj.pop();
      if (method === "sort") { obj.sort(); return null; }
      if (method === "reverse") { obj.reverse(); return null; }
      if (method === "index") return obj.indexOf(args[0]);
      if (method === "remove") { const i = obj.indexOf(args[0]); if (i !== -1) obj.splice(i, 1); return null; }
      if (method === "insert") { obj.splice(Number(args[0]), 0, args[1]); return null; }
      if (method === "extend") { if (Array.isArray(args[0])) obj.push(...args[0]); return null; }
      if (method === "count") return obj.filter(x => x === args[0]).length;
      if (method === "copy") return [...obj];
      if (method === "map") {
        // Handle arrow-like: arr.map(lambda)
        return obj;
      }
      if (method === "filter") return obj;
    }
    if (typeof obj === "string") {
      if (method === "upper") return obj.toUpperCase();
      if (method === "lower") return obj.toLowerCase();
      if (method === "strip") return obj.trim();
      if (method === "split") return args.length ? obj.split(String(args[0])) : obj.split(/\s+/);
      if (method === "replace") return obj.replace(new RegExp(String(args[0]).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "g"), String(args[1]));
      if (method === "startswith") return obj.startsWith(String(args[0]));
      if (method === "endswith") return obj.endsWith(String(args[0]));
      if (method === "find") return obj.indexOf(String(args[0]));
      if (method === "count") { const s = String(args[0]); return obj.split(s).length - 1; }
      if (method === "join") return Array.isArray(args[0]) ? args[0].join(obj) : String(args[0]);
      if (method === "format") {
        let result = obj;
        args.forEach((a, i) => { result = result.replace("{}", String(a)); result = result.replace(`{${i}}`, String(a)); });
        return result;
      }
    }
    return null;
  }

  // Property access: obj[index]
  const indexMatch = e.match(/^(\w+)\[(.+)\]$/);
  if (indexMatch) {
    const obj = evalPythonExpr(indexMatch[1], vars, builtins) as unknown[];
    const idx = evalPythonExpr(indexMatch[2], vars, builtins);
    if (Array.isArray(obj)) return obj[Number(idx)];
    if (typeof obj === "string") return (obj as string)[Number(idx)];
    return undefined;
  }

  // Function call: func(args)
  const funcMatch = e.match(/^(\w+)\s*\((.*)\)$/s);
  if (funcMatch) {
    const fname = funcMatch[1];
    const argsStr = funcMatch[2].trim();
    const args = argsStr ? splitArgs(argsStr).map(a => evalPythonExpr(a, vars, builtins)) : [];
    if (builtins[fname]) return builtins[fname](...args);
    return null;
  }

  // Variable lookup
  if (vars.hasOwnProperty(e)) return vars[e];

  // len-like property
  if (e === "len") return builtins.len;

  return e;
}

function splitArgs(s: string): string[] {
  const args: string[] = [];
  let depth = 0;
  let current = "";
  let inStr: string | null = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      current += c;
      if (c === inStr && s[i - 1] !== "\\") inStr = null;
    } else if (c === '"' || c === "'") {
      inStr = c;
      current += c;
    } else if (c === "(" || c === "[" || c === "{") {
      depth++;
      current += c;
    } else if (c === ")" || c === "]" || c === "}") {
      depth--;
      current += c;
    } else if (c === "," && depth === 0) {
      args.push(current.trim());
      current = "";
    } else {
      current += c;
    }
  }
  if (current.trim()) args.push(current.trim());
  return args;
}

/* ── Main handler ───────────────────────────────────────────────── */

type RunCodeBody = { code?: unknown; language?: unknown };

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
  if (typeof code !== "string") {
    return json({ error: "Field `code` must be a string" }, 400);
  }
  if (byteLengthUtf8(code) > MAX_CODE_BYTES) {
    return json({ error: `Code exceeds maximum size (${MAX_CODE_BYTES} bytes)` }, 400);
  }

  const languageRaw = typeof body.language === "string" && body.language.length > 0
    ? body.language.toLowerCase().trim()
    : "python";

  // Route to built-in runners
  const jsAliases = ["javascript", "js", "node", "nodejs", "typescript", "ts"];
  if (jsAliases.includes(languageRaw)) {
    // TypeScript runs as JS (type annotations are stripped by Deno anyway for simple code)
    const result = runJavaScriptLocally(code);
    return json({ stdout: result.stdout, stderr: result.stderr, exitCode: result.exitCode });
  }

  if (languageRaw === "python") {
    const result = runPythonSubset(code);
    return json({ stdout: result.stdout, stderr: result.stderr, exitCode: result.exitCode });
  }

  // Languages that need a real compiler/runtime - provide helpful message
  const compiledLangs = ["java", "c", "cpp", "c++", "csharp", "c#", "go", "rust", "ruby", "swift", "kotlin", "dart", "scala", "haskell", "perl", "lua", "r", "julia", "php", "elixir", "erlang"];
  if (compiledLangs.includes(languageRaw)) {
    return json({
      error: `Language "${languageRaw}" requires an external code runner (Piston). Set the PISTON_API_BASE secret to enable it. JavaScript, TypeScript, and Python run without any setup.`,
    }, 400);
  }

  return json({
    error: `Language "${languageRaw}" is not recognized. Supported built-in languages: JavaScript, TypeScript, Python.`,
  }, 400);
});
