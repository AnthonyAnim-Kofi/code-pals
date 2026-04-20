import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/* ── JavaScript local sandbox ── */
function runJavaScriptLocally(code: string): { stdout: string; stderr: string; exitCode: number } {
  const logs: string[] = [];
  const errors: string[] = [];

  const fakeConsole = {
    log: (...args: unknown[]) => logs.push(args.map(String).join(" ")),
    error: (...args: unknown[]) => errors.push(args.map(String).join(" ")),
    warn: (...args: unknown[]) => logs.push(args.map(String).join(" ")),
    info: (...args: unknown[]) => logs.push(args.map(String).join(" ")),
    dir: (...args: unknown[]) => logs.push(args.map(a => JSON.stringify(a)).join(" ")),
    table: (...args: unknown[]) => logs.push(args.map(a => JSON.stringify(a)).join(" ")),
  };

  try {
    const fn = new Function("console", "document", "window", "Deno", "fetch", "eval", code);
    fn(fakeConsole, undefined, undefined, undefined, undefined, undefined);
    return { stdout: logs.join("\n"), stderr: errors.join("\n"), exitCode: 0 };
  } catch (e) {
    return { stdout: logs.join("\n"), stderr: (e as Error).message, exitCode: 1 };
  }
}

/* ── Python subset interpreter ── */
function runPythonSubset(code: string): { stdout: string; stderr: string; exitCode: number } {
  const output: string[] = [];
  const vars: Record<string, unknown> = {};

  const lines = code.split("\n");

  // Security: check for blocked keywords (strip strings first)
  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const stripped = trimmed.replace(/("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, '""');
    const strippedLower = stripped.toLowerCase();
    if (/^import\s/.test(strippedLower) || /^from\s+\S+\s+import/.test(strippedLower)) {
      return { stdout: "", stderr: "Blocked: import statements are not allowed in the sandbox.", exitCode: 1 };
    }
    if (/\b(exec|eval|compile|__import__|globals|locals|getattr|setattr|delattr|open)\s*\(/.test(stripped)) {
      return { stdout: "", stderr: `Blocked: unsafe function call detected.`, exitCode: 1 };
    }
  }

  function pythonRepr(val: unknown): string {
    if (val === null || val === undefined) return "None";
    if (val === true) return "True";
    if (val === false) return "False";
    if (typeof val === "string") return val;
    if (Array.isArray(val)) return "[" + val.map(v => typeof v === "string" ? `'${v}'` : pythonRepr(v)).join(", ") + "]";
    return String(val);
  }

  function evalExpr(expr: string): unknown {
    expr = expr.trim();

    // String literals
    if (/^(f?"""[\s\S]*"""|f?'''[\s\S]*'''|f?"[^"]*"|f?'[^']*')$/.test(expr)) {
      const isFString = expr.startsWith("f");
      let s = isFString ? expr.slice(1) : expr;
      const q = s.startsWith('"""') || s.startsWith("'''") ? s.slice(0, 3) : s[0];
      s = s.slice(q.length, s.length - q.length);
      if (isFString) {
        s = s.replace(/\{([^}]+)\}/g, (_, e) => pythonRepr(evalExpr(e)));
      }
      return s;
    }

    // Boolean / None
    if (expr === "True") return true;
    if (expr === "False") return false;
    if (expr === "None") return null;

    // Numbers
    if (/^-?\d+(\.\d+)?$/.test(expr)) return Number(expr);

    // List literal
    if (expr.startsWith("[") && expr.endsWith("]")) {
      const inner = expr.slice(1, -1).trim();
      if (!inner) return [];
      return splitArgs(inner).map(e => evalExpr(e));
    }

    // Dict literal
    if (expr.startsWith("{") && expr.endsWith("}")) {
      const inner = expr.slice(1, -1).trim();
      if (!inner) return {};
      const obj: Record<string, unknown> = {};
      for (const pair of splitArgs(inner)) {
        const colonIdx = pair.indexOf(":");
        if (colonIdx > -1) {
          const k = evalExpr(pair.slice(0, colonIdx));
          const v = evalExpr(pair.slice(colonIdx + 1));
          obj[String(k)] = v;
        }
      }
      return obj;
    }

    // len()
    const lenMatch = expr.match(/^len\((.+)\)$/);
    if (lenMatch) {
      const val = evalExpr(lenMatch[1]);
      if (typeof val === "string") return val.length;
      if (Array.isArray(val)) return val.length;
      return 0;
    }

    // type()
    const typeMatch = expr.match(/^type\((.+)\)$/);
    if (typeMatch) {
      const val = evalExpr(typeMatch[1]);
      if (typeof val === "number") return Number.isInteger(val) ? "<class 'int'>" : "<class 'float'>";
      if (typeof val === "string") return "<class 'str'>";
      if (typeof val === "boolean") return "<class 'bool'>";
      if (Array.isArray(val)) return "<class 'list'>";
      return "<class 'NoneType'>";
    }

    // str(), int(), float(), bool()
    const castMatch = expr.match(/^(str|int|float|bool)\((.+)\)$/);
    if (castMatch) {
      const val = evalExpr(castMatch[2]);
      switch (castMatch[1]) {
        case "str": return pythonRepr(val);
        case "int": return Math.floor(Number(val));
        case "float": return Number(val);
        case "bool": return Boolean(val);
      }
    }

    // range()
    const rangeMatch = expr.match(/^range\((.+)\)$/);
    if (rangeMatch) {
      const args = splitArgs(rangeMatch[1]).map(a => Number(evalExpr(a)));
      let start = 0, stop = 0, step = 1;
      if (args.length === 1) { stop = args[0]; }
      else if (args.length === 2) { start = args[0]; stop = args[1]; }
      else { start = args[0]; stop = args[1]; step = args[2]; }
      const result: number[] = [];
      if (step > 0) for (let i = start; i < stop; i += step) result.push(i);
      else if (step < 0) for (let i = start; i > stop; i += step) result.push(i);
      return result;
    }

    // input()
    if (/^input\(/.test(expr)) return "";

    // String/list methods
    const methodMatch = expr.match(/^(.+)\.(upper|lower|strip|split|join|replace|append|pop|reverse|sort|count|index|startswith|endswith|find|capitalize|title|isdigit|isalpha)\(([^)]*)\)$/);
    if (methodMatch) {
      const obj = evalExpr(methodMatch[1]);
      const method = methodMatch[2];
      const rawArgs = methodMatch[3].trim();
      const args = rawArgs ? splitArgs(rawArgs).map(a => evalExpr(a)) : [];
      if (typeof obj === "string") {
        switch (method) {
          case "upper": return obj.toUpperCase();
          case "lower": return obj.toLowerCase();
          case "strip": return obj.trim();
          case "split": return args.length ? obj.split(String(args[0])) : obj.split(/\s+/);
          case "replace": return obj.replace(new RegExp(escapeRegex(String(args[0])), "g"), String(args[1] ?? ""));
          case "count": return obj.split(String(args[0])).length - 1;
          case "find": return obj.indexOf(String(args[0]));
          case "startswith": return obj.startsWith(String(args[0]));
          case "endswith": return obj.endsWith(String(args[0]));
          case "capitalize": return obj.charAt(0).toUpperCase() + obj.slice(1).toLowerCase();
          case "title": return obj.replace(/\b\w/g, c => c.toUpperCase());
          case "isdigit": return /^\d+$/.test(obj);
          case "isalpha": return /^[a-zA-Z]+$/.test(obj);
          case "join": { const arr = evalExpr(rawArgs); return Array.isArray(arr) ? arr.map(String).join(obj) : ""; }
        }
      }
      if (Array.isArray(obj)) {
        switch (method) {
          case "append": obj.push(args[0]); return null;
          case "pop": return args.length ? obj.splice(Number(args[0]), 1)[0] : obj.pop();
          case "reverse": obj.reverse(); return null;
          case "sort": obj.sort((a: unknown, b: unknown) => (a as number) - (b as number)); return null;
          case "count": return obj.filter((v: unknown) => v === args[0]).length;
          case "index": return obj.indexOf(args[0]);
        }
      }
    }

    // Comparison and arithmetic  
    // Handle 'not', 'and', 'or'
    if (/\b(and|or)\b/.test(expr)) {
      const orParts = splitByKeyword(expr, " or ");
      if (orParts.length > 1) return orParts.reduce((a: unknown, b: string) => (a || evalExpr(b)), evalExpr(orParts[0]));
      const andParts = splitByKeyword(expr, " and ");
      if (andParts.length > 1) return andParts.reduce((a: unknown, b: string) => (a && evalExpr(b)), evalExpr(andParts[0]));
    }
    if (expr.startsWith("not ")) return !evalExpr(expr.slice(4));

    // 'in' operator
    const inMatch = expr.match(/^(.+)\s+in\s+(.+)$/);
    if (inMatch) {
      const needle = evalExpr(inMatch[1]);
      const haystack = evalExpr(inMatch[2]);
      if (typeof haystack === "string") return (haystack as string).includes(String(needle));
      if (Array.isArray(haystack)) return haystack.includes(needle);
      return false;
    }

    // Comparisons
    for (const op of ["==", "!=", ">=", "<=", ">", "<"]) {
      const idx = expr.indexOf(op);
      if (idx > -1) {
        const left = evalExpr(expr.slice(0, idx));
        const right = evalExpr(expr.slice(idx + op.length));
        switch (op) {
          case "==": return left === right;
          case "!=": return left !== right;
          case ">=": return (left as number) >= (right as number);
          case "<=": return (left as number) <= (right as number);
          case ">": return (left as number) > (right as number);
          case "<": return (left as number) < (right as number);
        }
      }
    }

    // Arithmetic (+ - * / // % **)
    // Handle + and - (lowest precedence)
    for (let i = expr.length - 1; i > 0; i--) {
      if ((expr[i] === "+" || expr[i] === "-") && !isInsideBrackets(expr, i)) {
        const left = expr.slice(0, i).trim();
        const right = expr.slice(i + 1).trim();
        if (left) {
          const l = evalExpr(left);
          const r = evalExpr(right);
          if (expr[i] === "+") {
            if (typeof l === "string" || typeof r === "string") return String(l) + String(r);
            return (l as number) + (r as number);
          }
          return (l as number) - (r as number);
        }
      }
    }

    // Handle * / // %
    for (let i = expr.length - 1; i > 0; i--) {
      if (!isInsideBrackets(expr, i)) {
        if (expr[i] === "*" && expr[i + 1] === "*") continue;
        if (expr.slice(i, i + 2) === "//") {
          const l = evalExpr(expr.slice(0, i));
          const r = evalExpr(expr.slice(i + 2));
          return Math.floor((l as number) / (r as number));
        }
        if (expr[i] === "*") {
          const l = evalExpr(expr.slice(0, i));
          const r = evalExpr(expr.slice(i + 1));
          if (typeof l === "string") return l.repeat(r as number);
          return (l as number) * (r as number);
        }
        if (expr[i] === "/" && expr[i - 1] !== "/") {
          return (evalExpr(expr.slice(0, i)) as number) / (evalExpr(expr.slice(i + 1)) as number);
        }
        if (expr[i] === "%") {
          return (evalExpr(expr.slice(0, i)) as number) % (evalExpr(expr.slice(i + 1)) as number);
        }
      }
    }

    // Handle **
    const powIdx = expr.lastIndexOf("**");
    if (powIdx > 0) {
      return Math.pow(evalExpr(expr.slice(0, powIdx)) as number, evalExpr(expr.slice(powIdx + 2)) as number);
    }

    // Parenthesized expression
    if (expr.startsWith("(") && expr.endsWith(")")) return evalExpr(expr.slice(1, -1));

    // Indexing: var[idx]
    const idxMatch = expr.match(/^(.+)\[(.+)\]$/);
    if (idxMatch) {
      const obj = evalExpr(idxMatch[1]);
      const idx = evalExpr(idxMatch[2]);
      if (Array.isArray(obj)) return obj[Number(idx) < 0 ? obj.length + Number(idx) : Number(idx)];
      if (typeof obj === "string") { const i = Number(idx); return obj[i < 0 ? obj.length + i : i]; }
      if (typeof obj === "object" && obj) return (obj as Record<string, unknown>)[String(idx)];
    }

    // Variable lookup
    if (/^[a-zA-Z_]\w*$/.test(expr)) {
      if (expr in vars) return vars[expr];
      return undefined;
    }

    return expr;
  }

  function splitArgs(str: string): string[] {
    const result: string[] = [];
    let depth = 0, current = "", inStr = "";
    for (const ch of str) {
      if (!inStr && (ch === '"' || ch === "'")) inStr = ch;
      else if (inStr && ch === inStr) inStr = "";
      if (!inStr) {
        if (ch === "(" || ch === "[" || ch === "{") depth++;
        if (ch === ")" || ch === "]" || ch === "}") depth--;
      }
      if (ch === "," && depth === 0 && !inStr) { result.push(current.trim()); current = ""; }
      else current += ch;
    }
    if (current.trim()) result.push(current.trim());
    return result;
  }

  function splitByKeyword(str: string, kw: string): string[] {
    const parts: string[] = [];
    let depth = 0, inStr = "", last = 0;
    for (let i = 0; i < str.length; i++) {
      const ch = str[i];
      if (!inStr && (ch === '"' || ch === "'")) inStr = ch;
      else if (inStr && ch === inStr) inStr = "";
      if (!inStr) {
        if (ch === "(" || ch === "[") depth++;
        if (ch === ")" || ch === "]") depth--;
      }
      if (depth === 0 && !inStr && str.slice(i, i + kw.length) === kw) {
        parts.push(str.slice(last, i));
        last = i + kw.length;
        i += kw.length - 1;
      }
    }
    parts.push(str.slice(last));
    return parts;
  }

  function isInsideBrackets(str: string, pos: number): boolean {
    let depth = 0;
    for (let i = 0; i < pos; i++) {
      if (str[i] === "(" || str[i] === "[") depth++;
      if (str[i] === ")" || str[i] === "]") depth--;
    }
    return depth > 0;
  }

  function escapeRegex(s: string): string { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

  function execBlock(blockLines: string[], depth = 0): void {
    let i = 0;
    const maxIter = 10000;
    let totalIter = 0;

    while (i < blockLines.length) {
      if (++totalIter > maxIter) { output.push("Error: maximum iteration limit reached"); return; }

      const rawLine = blockLines[i];
      const trimmed = rawLine.trim();
      if (!trimmed || trimmed.startsWith("#")) { i++; continue; }

      // print()
      const printMatch = trimmed.match(/^print\((.+)\)$/);
      if (printMatch) {
        const args = splitArgs(printMatch[1]);
        output.push(args.map(a => pythonRepr(evalExpr(a))).join(" "));
        i++; continue;
      }

      // Assignment (including +=, -=, *=, /=)
      const augAssign = trimmed.match(/^([a-zA-Z_]\w*)\s*(\+|-|\*|\/)?=\s*(.+)$/);
      if (augAssign && !trimmed.includes("==")) {
        const [, name, op, valExpr] = augAssign;
        const val = evalExpr(valExpr);
        if (op) {
          const cur = vars[name] as number;
          switch (op) {
            case "+": vars[name] = typeof cur === "string" ? cur + String(val) : cur + (val as number); break;
            case "-": vars[name] = cur - (val as number); break;
            case "*": vars[name] = cur * (val as number); break;
            case "/": vars[name] = cur / (val as number); break;
          }
        } else {
          vars[name] = val;
        }
        i++; continue;
      }

      // Method call on variable (e.g., my_list.append(5))
      const methodCall = trimmed.match(/^([a-zA-Z_]\w*)\.(append|pop|reverse|sort|extend|insert|remove|clear)\(([^)]*)\)$/);
      if (methodCall) {
        const [, varName, method, rawArgs] = methodCall;
        const arr = vars[varName];
        if (Array.isArray(arr)) {
          const args = rawArgs.trim() ? splitArgs(rawArgs).map(a => evalExpr(a)) : [];
          switch (method) {
            case "append": arr.push(args[0]); break;
            case "pop": args.length ? arr.splice(Number(args[0]), 1) : arr.pop(); break;
            case "reverse": arr.reverse(); break;
            case "sort": arr.sort((a: unknown, b: unknown) => (a as number) - (b as number)); break;
            case "extend": { const ext = args[0]; if (Array.isArray(ext)) arr.push(...ext); break; }
            case "insert": arr.splice(Number(args[0]), 0, args[1]); break;
            case "remove": { const idx = arr.indexOf(args[0]); if (idx > -1) arr.splice(idx, 1); break; }
            case "clear": arr.length = 0; break;
          }
        }
        i++; continue;
      }

      // for loop
      const forMatch = trimmed.match(/^for\s+(\w+)\s+in\s+(.+):$/);
      if (forMatch) {
        const [, varName, iterExpr] = forMatch;
        const iterable = evalExpr(iterExpr);
        const body = getBlock(blockLines, i + 1);
        if (Array.isArray(iterable)) {
          for (const item of iterable) {
            vars[varName] = item;
            execBlock(body, depth + 1);
          }
        } else if (typeof iterable === "string") {
          for (const ch of iterable) {
            vars[varName] = ch;
            execBlock(body, depth + 1);
          }
        }
        i += 1 + body.length;
        continue;
      }

      // while loop
      const whileMatch = trimmed.match(/^while\s+(.+):$/);
      if (whileMatch) {
        const body = getBlock(blockLines, i + 1);
        let whileIter = 0;
        while (evalExpr(whileMatch[1]) && ++whileIter < 1000) {
          execBlock(body, depth + 1);
        }
        i += 1 + body.length;
        continue;
      }

      // if/elif/else
      if (trimmed.startsWith("if ") && trimmed.endsWith(":")) {
        const result = handleIfBlock(blockLines, i, depth);
        i = result.nextIndex;
        continue;
      }

      // def (basic function definition)
      const defMatch = trimmed.match(/^def\s+(\w+)\(([^)]*)\):$/);
      if (defMatch) {
        const [, fnName, params] = defMatch;
        const body = getBlock(blockLines, i + 1);
        const paramNames = params.split(",").map(p => p.trim()).filter(Boolean);
        vars[fnName] = { __pyfn: true, params: paramNames, body };
        i += 1 + body.length;
        continue;
      }

      // Function call
      const fnCallMatch = trimmed.match(/^(\w+)\(([^)]*)\)$/);
      if (fnCallMatch) {
        const fn = vars[fnCallMatch[1]];
        if (fn && typeof fn === "object" && (fn as Record<string, unknown>).__pyfn) {
          const args = fnCallMatch[2].trim() ? splitArgs(fnCallMatch[2]).map(a => evalExpr(a)) : [];
          const fnDef = fn as { params: string[]; body: string[] };
          const saved: Record<string, unknown> = {};
          fnDef.params.forEach((p, idx) => { saved[p] = vars[p]; vars[p] = args[idx]; });
          execBlock(fnDef.body, depth + 1);
          fnDef.params.forEach(p => { if (saved[p] !== undefined) vars[p] = saved[p]; else delete vars[p]; });
        }
        i++; continue;
      }

      // Return (inside function, just eval)
      if (trimmed.startsWith("return ")) { i++; continue; }

      // pass, break, continue
      if (trimmed === "pass" || trimmed === "break" || trimmed === "continue") { i++; continue; }

      i++;
    }
  }

  function getBlock(allLines: string[], startIdx: number): string[] {
    const block: string[] = [];
    if (startIdx >= allLines.length) return block;
    const baseIndent = allLines[startIdx].match(/^(\s*)/)?.[1]?.length ?? 0;
    if (baseIndent === 0 && allLines[startIdx].trim() !== "") return [allLines[startIdx]];
    for (let j = startIdx; j < allLines.length; j++) {
      const line = allLines[j];
      if (line.trim() === "") { block.push(line); continue; }
      const indent = line.match(/^(\s*)/)?.[1]?.length ?? 0;
      if (indent < baseIndent) break;
      block.push(line);
    }
    return block;
  }

  function handleIfBlock(blockLines: string[], startIdx: number, depth: number): { nextIndex: number } {
    const branches: { condition: string | null; body: string[] }[] = [];
    let i = startIdx;

    // Collect if
    const ifCond = blockLines[i].trim().match(/^if\s+(.+):$/);
    if (!ifCond) return { nextIndex: i + 1 };
    const ifBody = getBlock(blockLines, i + 1);
    branches.push({ condition: ifCond[1], body: ifBody });
    i += 1 + ifBody.length;

    // Collect elif/else
    while (i < blockLines.length) {
      const trimmed = blockLines[i].trim();
      const elifMatch = trimmed.match(/^elif\s+(.+):$/);
      if (elifMatch) {
        const body = getBlock(blockLines, i + 1);
        branches.push({ condition: elifMatch[1], body });
        i += 1 + body.length;
        continue;
      }
      if (trimmed === "else:") {
        const body = getBlock(blockLines, i + 1);
        branches.push({ condition: null, body });
        i += 1 + body.length;
        break;
      }
      break;
    }

    for (const branch of branches) {
      if (branch.condition === null || evalExpr(branch.condition)) {
        execBlock(branch.body, depth + 1);
        break;
      }
    }

    return { nextIndex: i };
  }

  try {
    execBlock(lines);
    return { stdout: output.join("\n"), stderr: "", exitCode: 0 };
  } catch (e) {
    return { stdout: output.join("\n"), stderr: (e as Error).message, exitCode: 1 };
  }
}

/* ── TypeScript-to-JavaScript transpiler (naive but effective for tutorials) ── */
function stripTypeScriptSyntax(code: string): string {
  let js = code;

  // 1. Remove full-line or block `interface Foo { ... }` (multi-line aware)
  js = js.replace(/\binterface\s+\w+(?:<[^>]*>)?(?:\s+extends\s+[^{]+)?\s*\{[^}]*\}/gs, "");

  // 2. Remove `type Alias = ...;` lines
  js = js.replace(/^\s*type\s+\w+(?:<[^>]*>)?\s*=.*?;?\s*$/gm, "");

  // 3. Remove access modifiers (private, public, protected, readonly, abstract, override)
  js = js.replace(/\b(private|public|protected|readonly|abstract|override)\s+/g, "");

  // 4. Remove return type annotations: ): SomeType { / ): SomeType =>
  js = js.replace(/\)\s*:\s*[\w<>[\], |&?]+(?=\s*(?:\{|=>|\())/g, ")");

  // 5. Remove parameter type annotations: (name: string, age: number)
  //    Handles simple types, union types, generic types, optional params
  js = js.replace(/(\w+\??):\s*[\w<>[\], |&?]+/g, "$1");

  // 6. Remove `as Type` casts
  js = js.replace(/\s+as\s+[\w<>[\]|&]+/g, "");

  // 7. Remove non-null assertions: value!
  js = js.replace(/(\w)\!(?=[.\[;,)}\s])/g, "$1");

  // 8. Remove generic type arguments from function calls: fn<Type>(...)
  js = js.replace(/<[\w<>[\], |&?]+>(?=\s*\()/g, "");

  // 9. Remove `implements InterfaceName` from class declarations
  js = js.replace(/\bimplements\s+[\w,\s]+(?=\s*\{)/g, "");

  // 10. Remove `extends SomeType` from class declarations (keep the class, drop extension if needed)
  // Note: Only remove if the extends is a type, not a class — we skip this to avoid breaking real inheritance

  return js;
}

/* ── Main handler ── */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: { language?: string; version?: string; code?: string; stdin?: string };
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON body" }, 400); }

  const { language, version = "*", code, stdin = "" } = body;
  if (!language || typeof language !== "string") return json({ error: "language is required" }, 400);
  if (!code || typeof code !== "string") return json({ error: "code is required" }, 400);
  if (code.length > 500_000) return json({ error: "Code exceeds 500KB limit" }, 400);

  const lang = language.toLowerCase().trim();

  // JavaScript — local sandbox (runs as-is)
  if (["javascript", "js"].includes(lang)) {
    const result = runJavaScriptLocally(code);
    return json({ stdout: result.stdout, stderr: result.stderr, exitCode: result.exitCode, language: lang, version: "sandbox" });
  }

  // TypeScript — strip type annotations then run in JS sandbox
  if (["typescript", "ts"].includes(lang)) {
    const stripped = stripTypeScriptSyntax(code);
    const result = runJavaScriptLocally(stripped);
    return json({ stdout: result.stdout, stderr: result.stderr, exitCode: result.exitCode, language: "typescript", version: "sandbox (types stripped)" });
  }

  // Python — local subset interpreter
  if (lang === "python" || lang === "python3" || lang === "py") {
    const result = runPythonSubset(code);
    return json({ stdout: result.stdout, stderr: result.stderr, exitCode: result.exitCode, language: "python", version: "sandbox" });
  }

  // HTML/CSS — return as-is (rendered client-side)
  if (["html", "css", "html/css"].includes(lang)) {
    return json({ stdout: code, stderr: "", exitCode: 0, language: lang, version: "passthrough" });
  }

  // Other languages — proxy to Piston via shared helpers (auto-resolves latest version)
  const { buildExecutePayload, friendlyPistonUpstreamError, getLatestVersion, getPistonApiBase, resolvePistonLanguage } =
    await import("../_shared/run-code-piston.ts");

  const pistonLang = resolvePistonLanguage(lang);
  const base = getPistonApiBase();
  const resolvedVersion = version && version !== "*" ? version : await getLatestVersion(pistonLang);
  const payload = { ...buildExecutePayload(pistonLang, resolvedVersion, code), stdin };

  try {
    const pistonRes = await fetch(`${base}/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!pistonRes.ok) {
      const text = await pistonRes.text();
      return json({
        error: friendlyPistonUpstreamError(`Piston returned ${pistonRes.status}: ${text.slice(0, 400)}`),
        hint: !Deno.env.get("PISTON_API_BASE")
          ? "No PISTON_API_BASE secret set. The public emkc.org demo is allowlist-only — self-host Piston (https://github.com/engineer-man/piston) and set the secret."
          : undefined,
      }, 502);
    }

    const result = await pistonRes.json();
    if (result?.message && !result?.run) {
      return json({ error: friendlyPistonUpstreamError(`Piston: ${result.message}`) }, 400);
    }

    return json({
      stdout: result.run?.stdout ?? "",
      stderr: result.run?.stderr ?? result.compile?.stderr ?? "",
      exitCode: result.run?.code ?? null,
      language: result.language ?? pistonLang,
      version: result.version ?? resolvedVersion,
    });
  } catch (e) {
    return json({
      error: `Code execution service unavailable: ${(e as Error).message}`,
      hint: "Set the PISTON_API_BASE secret in Lovable Cloud to a reachable Piston instance.",
    }, 503);
  }
});
