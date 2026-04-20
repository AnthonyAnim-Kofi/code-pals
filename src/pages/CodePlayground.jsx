/**
 * CodePlayground – Full-featured online code editor and runner.
 * Supports the 10 languages taught in the CodeOwl curriculum.
 */
import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import {
  Play, ChevronLeft, Settings2, Terminal, Trash2, Copy,
  ChevronDown, Sun, Moon, Loader2, CheckCircle, XCircle,
  FileCode, Keyboard, ChevronUp, Download
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─────────────────────────────────────────────────────────
//  Language registry — the 10 languages taught in CodeOwl
// ─────────────────────────────────────────────────────────
const LANGUAGES = [
  // ── Web ──────────────────────────────────────────────
  {
    id: "html", label: "HTML", group: "Web",
    pistonLang: "html", monacoLang: "html", ext: "html",
    isPreview: true,
    template: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>My Page</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 2rem; background: #fafafa; }
    h1   { color: #6d28d9; }
    p    { color: #374151; line-height: 1.6; }
    button {
      background: #7c3aed; color: #fff; border: none;
      padding: 0.5rem 1.25rem; border-radius: 0.5rem; cursor: pointer; font-size: 1rem;
    }
    button:hover { background: #5b21b6; }
  </style>
</head>
<body>
  <h1>Hello, World! 🌐</h1>
  <p>Edit this HTML and click <strong>Run</strong> to see the live preview.</p>
  <button onclick="this.textContent = 'Clicked! 🎉'">Click me</button>
</body>
</html>`,
  },
  {
    id: "css", label: "CSS", group: "Web",
    pistonLang: "css", monacoLang: "css", ext: "css",
    isPreview: true,
    template: `/* ── Your CSS — a live preview renders below ── */
* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: system-ui, sans-serif;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  background: #0f172a;
  color: #e2e8f0;
  padding: 2rem;
}

h1   { font-size: 2rem; color: #a78bfa; }
p    { color: #94a3b8; line-height: 1.6; }

button {
  background: #7c3aed; color: #fff; border: none;
  padding: 0.6rem 1.4rem; border-radius: 0.5rem;
  cursor: pointer; font-size: 1rem; transition: background 0.2s;
}
button:hover { background: #5b21b6; }

.card {
  background: #1e293b; border: 1px solid #334155;
  border-radius: 0.75rem; padding: 1.5rem; max-width: 24rem; width: 100%;
}`,
  },
  {
    id: "javascript", label: "JavaScript", group: "Web",
    pistonLang: "javascript", monacoLang: "javascript", ext: "js",
    template: `// JavaScript — runs instantly in the browser sandbox
const greet = (name) => \`Hello, \${name}!\`;
console.log(greet("World"));

const nums = [1, 2, 3, 4, 5];
const sum  = nums.reduce((a, b) => a + b, 0);
console.log("Sum:", sum);
console.log("Squares:", nums.map((x) => x ** 2));`,
  },
  {
    id: "typescript", label: "TypeScript", group: "Web",
    pistonLang: "typescript", monacoLang: "typescript", ext: "ts",
    template: `// TypeScript — compiled & run via Deno
interface Person {
  name: string;
  age:  number;
}

function greet(person: Person): string {
  return \`Hello, \${person.name}! You are \${person.age} years old.\`;
}

const user: Person = { name: "World", age: 25 };
console.log(greet(user));

const nums: number[] = [1, 2, 3, 4, 5];
const sum: number = nums.reduce((a, b) => a + b, 0);
console.log("Sum:", sum);`,
  },
  {
    id: "angular", label: "Angular", group: "Web",
    pistonLang: "typescript", monacoLang: "typescript", ext: "ts",
    template: `// Angular — TypeScript fundamentals used in Angular apps
// (Full Angular apps require the CLI; here we run the TS logic directly)

interface User {
  name: string;
  role: string;
}

class UserService {
  private users: User[] = [
    { name: "Alice",   role: "admin"  },
    { name: "Bob",     role: "editor" },
    { name: "Charlie", role: "viewer" },
  ];

  getAdmins(): User[] {
    return this.users.filter((u) => u.role === "admin");
  }

  greet(user: User): string {
    return \`Welcome, \${user.name}! Role: \${user.role}\`;
  }
}

const svc = new UserService();
svc.getAdmins().forEach((u) => console.log(svc.greet(u)));
console.log("Total users:", 3);`,
  },

  // ── General ───────────────────────────────────────────
  {
    id: "python", label: "Python", group: "General",
    pistonLang: "python", monacoLang: "python", ext: "py",
    template: `# Python — runs via sandbox (imports fall back to Piston)
def greet(name: str) -> str:
    return f"Hello, {name}!"

print(greet("World"))

nums = [1, 2, 3, 4, 5]
print("Sum:", sum(nums))
print("Squares:", [x ** 2 for x in nums])

# Try a dict
scores = {"Alice": 95, "Bob": 82, "Charlie": 90}
for name, score in scores.items():
    print(f"  {name}: {score}")`,
  },

  // ── Systems ───────────────────────────────────────────
  {
    id: "go", label: "Go", group: "Systems",
    pistonLang: "go", monacoLang: "go", ext: "go",
    template: `package main

import (
	"fmt"
	"strings"
)

func greet(name string) string {
	return fmt.Sprintf("Hello, %s!", name)
}

func main() {
	fmt.Println(greet("World"))

	nums := []int{1, 2, 3, 4, 5}
	sum  := 0
	for _, n := range nums {
		sum += n
	}
	fmt.Println("Sum:", sum)

	words := []string{"Go", "is", "awesome"}
	fmt.Println(strings.Join(words, " "))
}`,
  },
  {
    id: "rust", label: "Rust", group: "Systems",
    pistonLang: "rust", monacoLang: "rust", ext: "rs",
    template: `fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}

fn main() {
    println!("{}", greet("World"));

    let nums = vec![1, 2, 3, 4, 5];
    let sum: i32  = nums.iter().sum();
    let squares: Vec<i32> = nums.iter().map(|x| x * x).collect();

    println!("Sum: {}", sum);
    println!("Squares: {:?}", squares);
}`,
  },
  {
    id: "swift", label: "Swift", group: "Mobile",
    pistonLang: "swift", monacoLang: "swift", ext: "swift",
    template: `// Swift
func greet(_ name: String) -> String {
    return "Hello, \\(name)!"
}

print(greet("World"))

let nums = [1, 2, 3, 4, 5]
let sum  = nums.reduce(0, +)
print("Sum: \\(sum)")
print("Squares: \\(nums.map { $0 * $0 })")`,
  },

  // ── Database ──────────────────────────────────────────
  {
    id: "sql", label: "SQL", group: "Database",
    pistonLang: "sql", monacoLang: "sql", ext: "sql",
    noRun: true,
    template: `-- SQL — write and study your queries here
-- Note: SQL requires a live database to execute.
-- Use this editor to write and review SQL syntax.

CREATE TABLE users (
  id    INTEGER PRIMARY KEY,
  name  TEXT    NOT NULL,
  email TEXT    UNIQUE
);

INSERT INTO users (id, name, email) VALUES
  (1, 'Alice',   'alice@example.com'),
  (2, 'Bob',     'bob@example.com'),
  (3, 'Charlie', 'charlie@example.com');

-- Retrieve all users
SELECT * FROM users;

-- Filter with WHERE
SELECT name, email
FROM   users
WHERE  name LIKE 'A%';

-- Aggregate
SELECT COUNT(*) AS total FROM users;`,
  },
];

const LANGUAGE_GROUPS = [...new Set(LANGUAGES.map((l) => l.group))];

// ─────────────────────────────────────────────────────────
//  Editor themes
// ─────────────────────────────────────────────────────────
const EDITOR_THEMES = [
  { id: "vs-dark", label: "Dark" },
  { id: "light", label: "Light" },
  { id: "hc-black", label: "High Contrast" },
];

const FONT_SIZES = [12, 13, 14, 15, 16, 18, 20];

// ─────────────────────────────────────────────────────────
//  Preview helpers (HTML / CSS)
// ─────────────────────────────────────────────────────────
function buildCssPreviewHtml(css) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>${css}</style>
</head>
<body>
  <h1>CSS Preview</h1>
  <p>This is a paragraph with <strong>bold</strong> and <em>italic</em> text.</p>
  <button type="button">Button</button>
  <ul>
    <li>List item one</li>
    <li>List item two</li>
    <li>List item three</li>
  </ul>
  <div class="card">
    <h2>Card Title</h2>
    <p>Card content goes here.</p>
  </div>
  <a href="#">A link element</a>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────
//  Execution logic
// ─────────────────────────────────────────────────────────
async function runCodeOnPiston({ language, code, stdin = "" }) {
  const { data, error } = await supabase.functions.invoke("code-playground", {
    body: { language: language.pistonLang, version: "*", code, stdin },
  });

  if (error) {
    // Try to extract a human-readable message from the response body
    let msg = null;
    try {
      const body = error?.context?.body;
      if (body) {
        const parsed = typeof body === "string" ? JSON.parse(body) : body;
        msg = parsed?.error || parsed?.message || null;
      }
    } catch { /* ignore */ }
    throw new Error(msg || error.message || "Failed to run code");
  }

  // The edge function may return { error, hint } even with HTTP 200 in some paths
  if (data?.error) {
    const detail = data.hint ? `${data.error}\n\n${data.hint}` : data.error;
    throw new Error(detail);
  }

  return data;
}

// ─────────────────────────────────────────────────────────
//  Sub-components
// ─────────────────────────────────────────────────────────

function LanguagePicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const grouped = LANGUAGE_GROUPS.reduce((acc, g) => {
    const items = LANGUAGES.filter((l) => l.group === g);
    if (items.length) acc[g] = items;
    return acc;
  }, {});

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white text-sm font-semibold min-w-[140px]"
      >
        <FileCode className="w-4 h-4 shrink-0" />
        <span className="flex-1 text-left truncate">{value.label}</span>
        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform shrink-0", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 z-50 w-52 bg-[#1e1e2e] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
          <div className="overflow-y-auto">
            {Object.entries(grouped).map(([group, langs]) => (
              <div key={group}>
                <p className="px-3 pt-2 pb-1 text-[10px] font-bold text-white/30 uppercase tracking-widest sticky top-0 bg-[#1e1e2e]">
                  {group}
                </p>
                {langs.map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => { onChange(lang); setOpen(false); }}
                    className={cn(
                      "w-full text-left px-4 py-2 text-sm transition-colors flex items-center gap-2",
                      lang.id === value.id
                        ? "bg-primary/20 text-primary font-semibold"
                        : "text-white/80 hover:bg-white/10"
                    )}
                  >
                    {lang.label}
                    {lang.noRun && (
                      <span className="ml-auto text-[10px] text-white/30 font-normal">editor only</span>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SettingsPanel({ fontSize, onFontSize, theme, onTheme, onClose }) {
  return (
    <div className="absolute right-0 top-full mt-1.5 z-50 w-56 bg-[#1e1e2e] border border-white/10 rounded-xl shadow-2xl p-3 space-y-3">
      <div>
        <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1.5">Font Size</p>
        <div className="flex flex-wrap gap-1.5">
          {FONT_SIZES.map((s) => (
            <button
              key={s}
              onClick={() => onFontSize(s)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-sm font-medium transition-colors",
                fontSize === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-white/10 text-white/70 hover:bg-white/20"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1.5">Theme</p>
        <div className="space-y-1">
          {EDITOR_THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => onTheme(t.id)}
              className={cn(
                "w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors",
                theme === t.id
                  ? "bg-primary/20 text-primary font-semibold"
                  : "text-white/70 hover:bg-white/10"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ConsoleLine({ line }) {
  if (line.type === "stdout") {
    return (
      <pre className="text-green-300 font-mono text-sm whitespace-pre-wrap break-all leading-relaxed">
        {line.text}
      </pre>
    );
  }
  if (line.type === "stderr" || line.type === "compile-error") {
    return (
      <pre className="text-red-400 font-mono text-sm whitespace-pre-wrap break-all leading-relaxed">
        {line.text}
      </pre>
    );
  }
  if (line.type === "compile-out") {
    return (
      <pre className="text-yellow-300 font-mono text-sm whitespace-pre-wrap break-all leading-relaxed">
        {line.text}
      </pre>
    );
  }
  if (line.type === "exit") {
    return (
      <div className={cn(
        "flex items-center gap-2 text-xs font-medium mt-1",
        line.ok ? "text-green-400" : "text-red-400"
      )}>
        {line.ok
          ? <CheckCircle className="w-3.5 h-3.5 shrink-0" />
          : <XCircle className="w-3.5 h-3.5 shrink-0" />}
        <span className="font-mono">{line.text}</span>
      </div>
    );
  }
  if (line.type === "meta") {
    return (
      <p className="text-white/40 text-xs font-mono">{line.text}</p>
    );
  }
  return null;
}

function buildConsoleLines(result) {
  const lines = [];
  if (result.compileOutput) {
    result.compileOutput.split("\n").forEach((t) =>
      lines.push({ type: "compile-out", text: t })
    );
  }
  if (result.compileError) {
    result.compileError.split("\n").forEach((t) =>
      lines.push({ type: "compile-error", text: t })
    );
  }
  if (result.stdout) {
    result.stdout.split("\n").forEach((t) =>
      lines.push({ type: "stdout", text: t })
    );
  }
  if (result.stderr) {
    result.stderr.split("\n").forEach((t) =>
      lines.push({ type: "stderr", text: t })
    );
  }
  const code = result.exitCode ?? null;
  if (code !== null) {
    lines.push({
      type: "exit",
      text: `Process exited with code ${code}${result.signal ? ` (signal: ${result.signal})` : ""}`,
      ok: code === 0,
    });
  }
  if (result.version) {
    lines.push({ type: "meta", text: `Runtime: ${result.language} ${result.version}` });
  }
  return lines;
}

// ─────────────────────────────────────────────────────────
//  Main page
// ─────────────────────────────────────────────────────────
export default function CodePlayground() {
  const navigate = useNavigate();

  const [language, setLanguage] = useState(LANGUAGES[5]); // Python default
  const [code, setCode] = useState(LANGUAGES[5].template);
  const [stdin, setStdin] = useState("");
  const [consoleLines, setConsoleLines] = useState([]);
  const [previewHtml, setPreviewHtml] = useState(null);
  const [running, setRunning] = useState(false);
  const [runCount, setRunCount] = useState(0);
  const [activeTab, setActiveTab] = useState("output"); // output | preview | input
  const [fontSize, setFontSize] = useState(14);
  const [editorTheme, setEditorTheme] = useState("vs-dark");
  const [showSettings, setShowSettings] = useState(false);
  const [outputCollapsed, setOutputCollapsed] = useState(false);
  const settingsRef = useRef(null);
  const consoleEndRef = useRef(null);

  // Close settings on outside click
  useEffect(() => {
    const handler = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setShowSettings(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Scroll console to bottom on new output
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [consoleLines]);

  // Ctrl+Enter to run
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleRun();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, language, stdin]);

  const handleLanguageChange = useCallback((lang) => {
    setLanguage(lang);
    setCode(lang.template);
    setConsoleLines([]);
    setPreviewHtml(null);
    setActiveTab(lang.isPreview ? "preview" : "output");
  }, []);

  const handleRun = useCallback(async () => {
    if (running) return;
    const currentCode = code.trim();
    if (!currentCode) {
      toast.error("Write some code first!");
      return;
    }

    // SQL and other non-runnable languages
    if (language.noRun) {
      setOutputCollapsed(false);
      setActiveTab("output");
      setConsoleLines([{
        type: "stderr",
        text: `${language.label} requires a live database connection and cannot run in the browser sandbox.\nUse this editor to write and review your ${language.label} syntax.`,
      }]);
      return;
    }

    setRunning(true);
    setOutputCollapsed(false);
    if (!language.isPreview) setActiveTab("output");
    const start = Date.now();
    setConsoleLines([{ type: "meta", text: `Running ${language.label}…` }]);

    try {
      const result = await runCodeOnPiston({ language, code: currentCode, stdin });
      const elapsed = ((Date.now() - start) / 1000).toFixed(2);

      // HTML / CSS → render in iframe preview
      if (language.isPreview) {
        let html = result.stdout || currentCode;
        if (language.id === "css") html = buildCssPreviewHtml(html);
        setPreviewHtml(html);
        setActiveTab("preview");
        setConsoleLines([{ type: "meta", text: `Rendered ${language.label} in ${elapsed}s` }]);
        setRunCount((c) => c + 1);
        return;
      }

      // All other languages → console output
      const lines = buildConsoleLines(result);
      if (lines.length === 0 || lines.every((l) => l.type === "meta")) {
        lines.unshift({ type: "meta", text: "(no output)" });
      }
      lines.push({ type: "meta", text: `Finished in ${elapsed}s` });
      setConsoleLines(lines);
      setRunCount((c) => c + 1);
    } catch (err) {
      setConsoleLines([
        { type: "stderr", text: err.message || "An error occurred" },
        { type: "exit", text: "Failed to execute", ok: false },
      ]);
    } finally {
      setRunning(false);
    }
  }, [running, code, language, stdin]);

  const handleClearConsole = () => setConsoleLines([]);

  const handleCopyOutput = () => {
    const text = consoleLines.map((l) => l.text).join("\n");
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success("Output copied!");
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `code.${language.ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const pageBackground = editorTheme === "light" ? "#f5f5f5" : "#0d0d14";
  const headerBg = editorTheme === "light" ? "#1e1e2e" : "#0a0a12";
  const panelBg = editorTheme === "light" ? "#1a1a2a" : "#0a0a12";

  return (
    <div
      className="flex flex-col h-screen w-screen overflow-hidden"
      style={{ background: pageBackground }}
    >
      {/* ── Top Toolbar ─────────────────────────────────── */}
      <header
        className="flex items-center gap-3 px-4 py-2 shrink-0 border-b border-white/10 z-40"
        style={{ background: headerBg, minHeight: 52 }}
      >
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors text-sm font-medium shrink-0"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back</span>
        </button>

        <div className="w-px h-5 bg-white/10 shrink-0" />

        {/* Title */}
        <div className="flex items-center gap-2 shrink-0">
          <Terminal className="w-4 h-4 text-primary" />
          <span className="text-white font-bold text-sm hidden sm:inline">Code Playground</span>
        </div>

        <div className="w-px h-5 bg-white/10 shrink-0 hidden sm:block" />

        {/* Language picker */}
        <LanguagePicker value={language} onChange={handleLanguageChange} />

        {/* Spacer */}
        <div className="flex-1" />

        {/* Shortcuts hint */}
        <div className="hidden md:flex items-center gap-1.5 text-white/30 text-xs">
          <Keyboard className="w-3.5 h-3.5" />
          <span>Ctrl+Enter to run</span>
        </div>

        {/* Download */}
        <button
          onClick={handleDownload}
          title="Download code"
          className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
        >
          <Download className="w-4 h-4" />
        </button>

        {/* Settings */}
        <div ref={settingsRef} className="relative">
          <button
            onClick={() => setShowSettings((s) => !s)}
            title="Editor settings"
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              showSettings
                ? "bg-white/20 text-white"
                : "text-white/50 hover:text-white hover:bg-white/10"
            )}
          >
            <Settings2 className="w-4 h-4" />
          </button>
          {showSettings && (
            <SettingsPanel
              fontSize={fontSize}
              onFontSize={setFontSize}
              theme={editorTheme}
              onTheme={setEditorTheme}
              onClose={() => setShowSettings(false)}
            />
          )}
        </div>

        {/* Run button */}
        <button
          onClick={handleRun}
          disabled={running}
          className={cn(
            "flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all",
            running
              ? "bg-white/10 text-white/40 cursor-not-allowed"
              : "bg-primary text-primary-foreground hover:brightness-110 active:scale-95 shadow-[0_2px_8px_hsl(45,100%,50%,0.4)]"
          )}
        >
          {running ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Running…</>
          ) : (
            <><Play className="w-4 h-4 fill-current" /> Run</>
          )}
        </button>
      </header>

      {/* ── Resizable Panels ────────────────────────────── */}
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="vertical" className="h-full">
          {/* Editor panel */}
          <Panel defaultSize={outputCollapsed ? 100 : 65} minSize={20}>
            <div className="h-full w-full">
              <Editor
                height="100%"
                language={language.monacoLang}
                value={code}
                onChange={(v) => setCode(v ?? "")}
                theme={editorTheme}
                options={{
                  fontSize,
                  fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
                  fontLigatures: true,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  lineNumbers: "on",
                  renderWhitespace: "selection",
                  bracketPairColorization: { enabled: true },
                  autoClosingBrackets: "always",
                  autoClosingQuotes: "always",
                  formatOnPaste: true,
                  suggestOnTriggerCharacters: true,
                  tabSize: 2,
                  padding: { top: 12, bottom: 12 },
                  smoothScrolling: true,
                  cursorBlinking: "smooth",
                  cursorSmoothCaretAnimation: "on",
                  scrollbar: {
                    verticalScrollbarSize: 6,
                    horizontalScrollbarSize: 6,
                  },
                }}
              />
            </div>
          </Panel>

          {/* Resize handle */}
          {!outputCollapsed && (
            <PanelResizeHandle className="h-1 bg-white/10 hover:bg-primary/50 transition-colors cursor-row-resize" />
          )}

          {/* Output / Input panel */}
          <Panel
            defaultSize={35}
            minSize={outputCollapsed ? 0 : 10}
            style={{ display: outputCollapsed ? "none" : undefined }}
          >
            <div
              className="flex flex-col h-full border-t border-white/10"
              style={{ background: panelBg }}
            >
              {/* Console header */}
              <div className="flex items-center gap-1 px-3 py-2 border-b border-white/10 shrink-0">
                {/* Output tab — hidden for preview-only languages */}
                {!language.isPreview && (
                  <button
                    onClick={() => setActiveTab("output")}
                    className={cn(
                      "px-3 py-1 rounded-md text-xs font-semibold transition-colors",
                      activeTab === "output"
                        ? "bg-white/15 text-white"
                        : "text-white/40 hover:text-white/70"
                    )}
                  >
                    <span className="flex items-center gap-1.5">
                      <Terminal className="w-3 h-3" />
                      Output
                      {consoleLines.length > 0 && (
                        <span className="bg-primary/30 text-primary text-[10px] px-1 rounded">
                          {consoleLines.filter((l) => l.type !== "meta").length}
                        </span>
                      )}
                    </span>
                  </button>
                )}

                {/* Preview tab — shown for HTML / CSS */}
                {language.isPreview && (
                  <button
                    onClick={() => setActiveTab("preview")}
                    className={cn(
                      "px-3 py-1 rounded-md text-xs font-semibold transition-colors",
                      activeTab === "preview"
                        ? "bg-white/15 text-white"
                        : "text-white/40 hover:text-white/70"
                    )}
                  >
                    <span className="flex items-center gap-1.5">
                      <FileCode className="w-3 h-3" />
                      Preview
                      {previewHtml && (
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                      )}
                    </span>
                  </button>
                )}

                <button
                  onClick={() => setActiveTab("input")}
                  className={cn(
                    "px-3 py-1 rounded-md text-xs font-semibold transition-colors",
                    activeTab === "input"
                      ? "bg-white/15 text-white"
                      : "text-white/40 hover:text-white/70"
                  )}
                >
                  Stdin
                  {stdin && (
                    <span className="ml-1 w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                  )}
                </button>

                <div className="flex-1" />

                {/* Console actions */}
                {activeTab === "output" && (
                  <>
                    <button
                      onClick={handleCopyOutput}
                      disabled={consoleLines.length === 0}
                      title="Copy output"
                      className="p-1 rounded text-white/30 hover:text-white/70 transition-colors disabled:opacity-20"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleClearConsole}
                      disabled={consoleLines.length === 0}
                      title="Clear console"
                      className="p-1 rounded text-white/30 hover:text-white/70 transition-colors disabled:opacity-20"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
                <button
                  onClick={() => setOutputCollapsed(true)}
                  title="Collapse"
                  className="p-1 rounded text-white/30 hover:text-white/70 transition-colors"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Console / Preview body */}
              <div className="flex-1 overflow-hidden relative">
                {/* Live preview iframe (HTML / CSS) */}
                {activeTab === "preview" && (
                  previewHtml ? (
                    <iframe
                      key={previewHtml}
                      srcDoc={previewHtml}
                      title="Preview"
                      sandbox="allow-scripts allow-forms allow-modals allow-pointer-lock allow-popups"
                      className="w-full h-full border-0 bg-white"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-2 select-none">
                      <FileCode className="w-8 h-8 text-white/10" />
                      <p className="text-white/25 text-sm">
                        Press <kbd className="bg-white/10 text-white/50 px-1.5 py-0.5 rounded text-xs font-mono">Ctrl+Enter</kbd> or click <strong className="text-white/40">Run</strong> to preview
                      </p>
                    </div>
                  )
                )}

                {/* Console output */}
                {activeTab === "output" && (
                  <div className="h-full overflow-y-auto px-4 py-3 space-y-0.5">
                    {consoleLines.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full gap-2 select-none">
                        <Terminal className="w-8 h-8 text-white/10" />
                        <p className="text-white/25 text-sm">
                          Press <kbd className="bg-white/10 text-white/50 px-1.5 py-0.5 rounded text-xs font-mono">Ctrl+Enter</kbd> or click <strong className="text-white/40">Run</strong> to execute
                        </p>
                      </div>
                    ) : (
                      consoleLines.map((line, i) => (
                        <ConsoleLine key={i} line={line} />
                      ))
                    )}
                    <div ref={consoleEndRef} />
                  </div>
                )}

                {/* Stdin input */}
                {activeTab === "input" && (
                  <div className="h-full flex flex-col gap-2 px-4 py-3">
                    <p className="text-white/40 text-xs">Provide standard input (stdin) for your program:</p>
                    <textarea
                      value={stdin}
                      onChange={(e) => setStdin(e.target.value)}
                      placeholder="Type input here…"
                      className="flex-1 bg-white/5 text-white/80 font-mono text-sm p-3 rounded-lg resize-none outline-none placeholder-white/20 border border-white/10 focus:border-primary/50 transition-colors"
                      spellCheck={false}
                    />
                  </div>
                )}
              </div>
            </div>
          </Panel>
        </PanelGroup>
      </div>

      {/* Collapsed output bar */}
      {outputCollapsed && (
        <div
          className="shrink-0 flex items-center gap-3 px-4 py-2 border-t border-white/10 cursor-pointer hover:bg-white/5 transition-colors"
          style={{ background: panelBg }}
          onClick={() => setOutputCollapsed(false)}
        >
          <Terminal className="w-4 h-4 text-white/40" />
          <span className="text-sm text-white/50 font-medium">Console</span>
          {consoleLines.length > 0 && (
            <span className="text-xs text-white/30">
              {consoleLines.filter((l) => l.type === "stdout").length} lines of output
            </span>
          )}
          <div className="flex-1" />
          <ChevronUp className="w-4 h-4 text-white/40" />
        </div>
      )}
    </div>
  );
}
