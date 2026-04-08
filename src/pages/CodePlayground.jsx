/**
 * CodePlayground – Full-featured online code editor and runner.
 * Supports 40+ languages via the Piston execution engine.
 * Built from scratch as a standalone full-screen protected page.
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
//  Language registry
// ─────────────────────────────────────────────────────────
const LANGUAGES = [
  {
    id: "javascript", label: "JavaScript", group: "Web",
    pistonLang: "javascript", monacoLang: "javascript", ext: "js",
    template: `// JavaScript\nconst greet = (name) => \`Hello, \${name}!\`;\nconsole.log(greet("World"));\n\nconst nums = [1, 2, 3, 4, 5];\nconst sum = nums.reduce((a, b) => a + b, 0);\nconsole.log("Sum:", sum);`,
  },
  {
    id: "typescript", label: "TypeScript", group: "Web",
    pistonLang: "typescript", monacoLang: "typescript", ext: "ts",
    template: `// TypeScript\ninterface Person {\n  name: string;\n  age: number;\n}\n\nconst greet = (person: Person): string =>\n  \`Hello, \${person.name}! You are \${person.age} years old.\`;\n\nconst user: Person = { name: "World", age: 25 };\nconsole.log(greet(user));`,
  },
  {
    id: "python", label: "Python", group: "General",
    pistonLang: "python", monacoLang: "python", ext: "py",
    template: `# Python\ndef greet(name: str) -> str:\n    return f"Hello, {name}!"\n\nprint(greet("World"))\n\nnums = [1, 2, 3, 4, 5]\nprint("Sum:", sum(nums))\nprint("List:", [x ** 2 for x in nums])`,
  },
  {
    id: "java", label: "Java", group: "General",
    pistonLang: "java", monacoLang: "java", ext: "java",
    template: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n        \n        int[] nums = {1, 2, 3, 4, 5};\n        int sum = 0;\n        for (int n : nums) sum += n;\n        System.out.println("Sum: " + sum);\n    }\n}`,
  },
  {
    id: "c", label: "C", group: "Systems",
    pistonLang: "c", monacoLang: "c", ext: "c",
    template: `#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    \n    int nums[] = {1, 2, 3, 4, 5};\n    int sum = 0;\n    for (int i = 0; i < 5; i++) sum += nums[i];\n    printf("Sum: %d\\n", sum);\n    \n    return 0;\n}`,
  },
  {
    id: "cpp", label: "C++", group: "Systems",
    pistonLang: "c++", monacoLang: "cpp", ext: "cpp",
    template: `#include <iostream>\n#include <vector>\n#include <numeric>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    \n    vector<int> nums = {1, 2, 3, 4, 5};\n    int sum = accumulate(nums.begin(), nums.end(), 0);\n    cout << "Sum: " << sum << endl;\n    \n    return 0;\n}`,
  },
  {
    id: "csharp", label: "C#", group: "Systems",
    pistonLang: "csharp", monacoLang: "csharp", ext: "cs",
    template: `using System;\nusing System.Linq;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello, World!");\n        \n        int[] nums = {1, 2, 3, 4, 5};\n        Console.WriteLine($"Sum: {nums.Sum()}");\n    }\n}`,
  },
  {
    id: "go", label: "Go", group: "Systems",
    pistonLang: "go", monacoLang: "go", ext: "go",
    template: `package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, World!")\n    \n    nums := []int{1, 2, 3, 4, 5}\n    sum := 0\n    for _, n := range nums {\n        sum += n\n    }\n    fmt.Printf("Sum: %d\\n", sum)\n}`,
  },
  {
    id: "rust", label: "Rust", group: "Systems",
    pistonLang: "rust", monacoLang: "rust", ext: "rs",
    template: `fn main() {\n    println!("Hello, World!");\n    \n    let nums = vec![1, 2, 3, 4, 5];\n    let sum: i32 = nums.iter().sum();\n    println!("Sum: {}", sum);\n    \n    let squares: Vec<i32> = nums.iter().map(|x| x * x).collect();\n    println!("Squares: {:?}", squares);\n}`,
  },
  {
    id: "ruby", label: "Ruby", group: "Scripting",
    pistonLang: "ruby", monacoLang: "ruby", ext: "rb",
    template: `# Ruby\ndef greet(name)\n  "Hello, #{name}!"\nend\n\nputs greet("World")\n\nnums = [1, 2, 3, 4, 5]\nputs "Sum: #{nums.sum}"\nputs "Squares: #{nums.map { |x| x ** 2 }}"`,
  },
  {
    id: "php", label: "PHP", group: "Web",
    pistonLang: "php", monacoLang: "php", ext: "php",
    template: `<?php\nfunction greet($name) {\n    return "Hello, $name!";\n}\n\necho greet("World") . "\\n";\n\n$nums = [1, 2, 3, 4, 5];\necho "Sum: " . array_sum($nums) . "\\n";\necho "Squares: " . implode(", ", array_map(fn($x) => $x ** 2, $nums)) . "\\n";`,
  },
  {
    id: "swift", label: "Swift", group: "Mobile",
    pistonLang: "swift", monacoLang: "swift", ext: "swift",
    template: `// Swift\nfunc greet(_ name: String) -> String {\n    return "Hello, \\(name)!"\n}\n\nprint(greet("World"))\n\nlet nums = [1, 2, 3, 4, 5]\nlet sum = nums.reduce(0, +)\nprint("Sum: \\(sum)")\nprint("Squares: \\(nums.map { $0 * $0 })")`,
  },
  {
    id: "kotlin", label: "Kotlin", group: "Mobile",
    pistonLang: "kotlin", monacoLang: "kotlin", ext: "kt",
    template: `fun main() {\n    println("Hello, World!")\n    \n    val nums = listOf(1, 2, 3, 4, 5)\n    println("Sum: \${nums.sum()}")\n    println("Squares: \${nums.map { it * it }}")\n}`,
  },
  {
    id: "scala", label: "Scala", group: "JVM",
    pistonLang: "scala", monacoLang: "scala", ext: "scala",
    template: `object Main extends App {\n  println("Hello, World!")\n  \n  val nums = List(1, 2, 3, 4, 5)\n  println(s"Sum: \${nums.sum}")\n  println(s"Squares: \${nums.map(x => x * x)}")\n}`,
  },
  {
    id: "r", label: "R", group: "Data Science",
    pistonLang: "r", monacoLang: "r", ext: "r",
    template: `# R\ngreet <- function(name) {\n  paste("Hello,", name, "!")\n}\n\ncat(greet("World"), "\\n")\n\nnums <- c(1, 2, 3, 4, 5)\ncat("Sum:", sum(nums), "\\n")\ncat("Squares:", nums^2, "\\n")`,
  },
  {
    id: "lua", label: "Lua", group: "Scripting",
    pistonLang: "lua", monacoLang: "lua", ext: "lua",
    template: `-- Lua\nlocal function greet(name)\n    return "Hello, " .. name .. "!"\nend\n\nprint(greet("World"))\n\nlocal nums = {1, 2, 3, 4, 5}\nlocal sum = 0\nfor _, v in ipairs(nums) do\n    sum = sum + v\nend\nprint("Sum:", sum)`,
  },
  {
    id: "perl", label: "Perl", group: "Scripting",
    pistonLang: "perl", monacoLang: "perl", ext: "pl",
    template: `#!/usr/bin/perl\nuse strict;\nuse warnings;\n\nsub greet {\n    my ($name) = @_;\n    return "Hello, $name!";\n}\n\nprint greet("World") . "\\n";\n\nmy @nums = (1, 2, 3, 4, 5);\nmy $sum = 0;\n$sum += $_ for @nums;\nprint "Sum: $sum\\n";`,
  },
  {
    id: "bash", label: "Bash", group: "Shell",
    pistonLang: "bash", monacoLang: "shell", ext: "sh",
    template: `#!/bin/bash\n\ngreet() {\n    echo "Hello, $1!"\n}\n\ngreet "World"\n\nnums=(1 2 3 4 5)\nsum=0\nfor n in "\${nums[@]}"; do\n    sum=$((sum + n))\ndone\necho "Sum: $sum"`,
  },
  {
    id: "powershell", label: "PowerShell", group: "Shell",
    pistonLang: "powershell", monacoLang: "powershell", ext: "ps1",
    template: `# PowerShell\nfunction Greet($name) {\n    "Hello, $name!"\n}\n\nGreet "World"\n\n$nums = 1..5\n$sum = ($nums | Measure-Object -Sum).Sum\nWrite-Output "Sum: $sum"`,
  },
  {
    id: "haskell", label: "Haskell", group: "Functional",
    pistonLang: "haskell", monacoLang: "haskell", ext: "hs",
    template: `-- Haskell\nmain :: IO ()\nmain = do\n    putStrLn (greet "World")\n    let nums = [1..5] :: [Int]\n    putStrLn $ "Sum: " ++ show (sum nums)\n    putStrLn $ "Squares: " ++ show (map (^2) nums)\n\ngreet :: String -> String\ngreet name = "Hello, " ++ name ++ "!"`,
  },
  {
    id: "erlang", label: "Erlang", group: "Functional",
    pistonLang: "erlang", monacoLang: "erlang", ext: "erl",
    template: `-module(main).\n-export([main/0]).\n\nmain() ->\n    io:format("Hello, World!~n"),\n    Nums = lists:seq(1, 5),\n    Sum = lists:sum(Nums),\n    io:format("Sum: ~p~n", [Sum]).`,
  },
  {
    id: "elixir", label: "Elixir", group: "Functional",
    pistonLang: "elixir", monacoLang: "elixir", ext: "ex",
    template: `# Elixir\ndefmodule Main do\n  def run do\n    IO.puts("Hello, World!")\n    \n    nums = 1..5 |> Enum.to_list()\n    sum = Enum.sum(nums)\n    IO.puts("Sum: \#{sum}")\n    squares = Enum.map(nums, &(&1 * &1))\n    IO.inspect(squares, label: "Squares")\n  end\nend\n\nMain.run()`,
  },
  {
    id: "clojure", label: "Clojure", group: "Functional",
    pistonLang: "clojure", monacoLang: "clojure", ext: "clj",
    template: `; Clojure\n(defn greet [name]\n  (str "Hello, " name "!"))\n\n(println (greet "World"))\n\n(def nums (range 1 6))\n(println "Sum:" (reduce + nums))\n(println "Squares:" (map #(* % %) nums))`,
  },
  {
    id: "julia", label: "Julia", group: "Data Science",
    pistonLang: "julia", monacoLang: "julia", ext: "jl",
    template: `# Julia\nfunction greet(name::String)::String\n    return "Hello, $name!"\nend\n\nprintln(greet("World"))\n\nnums = 1:5\nprintln("Sum: ", sum(nums))\nprintln("Squares: ", [x^2 for x in nums])`,
  },
  {
    id: "dart", label: "Dart", group: "Mobile",
    pistonLang: "dart", monacoLang: "dart", ext: "dart",
    template: `void main() {\n  print(greet('World'));\n  \n  var nums = [1, 2, 3, 4, 5];\n  var sum = nums.reduce((a, b) => a + b);\n  print('Sum: \$sum');\n  print('Squares: \${nums.map((x) => x * x).toList()}');\n}\n\nString greet(String name) => 'Hello, \$name!';`,
  },
  {
    id: "nim", label: "Nim", group: "Systems",
    pistonLang: "nim", monacoLang: "nim", ext: "nim",
    template: `# Nim\nproc greet(name: string): string =\n  "Hello, " & name & "!"\n\necho greet("World")\n\nvar nums = @[1, 2, 3, 4, 5]\nvar sum = 0\nfor n in nums: sum += n\necho "Sum: ", sum`,
  },
  {
    id: "crystal", label: "Crystal", group: "Systems",
    pistonLang: "crystal", monacoLang: "crystal", ext: "cr",
    template: `# Crystal\ndef greet(name : String) : String\n  "Hello, #{name}!"\nend\n\nputs greet("World")\n\nnums = [1, 2, 3, 4, 5]\nputs "Sum: #{nums.sum}"\nputs "Squares: #{nums.map { |x| x ** 2 }}"`,
  },
  {
    id: "d", label: "D", group: "Systems",
    pistonLang: "d", monacoLang: "d", ext: "d",
    template: `import std.stdio;\nimport std.algorithm;\nimport std.range;\n\nvoid main() {\n    writeln("Hello, World!");\n    \n    auto nums = iota(1, 6).array;\n    writeln("Sum: ", nums.sum);\n    writeln("Squares: ", nums.map!(x => x * x).array);\n}`,
  },
  {
    id: "ocaml", label: "OCaml", group: "Functional",
    pistonLang: "ocaml", monacoLang: "ocaml", ext: "ml",
    template: `(* OCaml *)\nlet greet name = "Hello, " ^ name ^ "!"\n\nlet () =\n  print_endline (greet "World");\n  let nums = [1; 2; 3; 4; 5] in\n  let sum = List.fold_left (+) 0 nums in\n  Printf.printf "Sum: %d\\n" sum`,
  },
  {
    id: "fsharp", label: "F#", group: "Functional",
    pistonLang: "fsharp", monacoLang: "fsharp", ext: "fs",
    template: `// F#\nlet greet name = sprintf "Hello, %s!" name\n\nprintfn "%s" (greet "World")\n\nlet nums = [1..5]\nlet sum = List.sum nums\nprintfn "Sum: %d" sum\nprintfn "Squares: %A" (List.map (fun x -> x * x) nums)`,
  },
  {
    id: "groovy", label: "Groovy", group: "JVM",
    pistonLang: "groovy", monacoLang: "groovy", ext: "groovy",
    template: `// Groovy\ndef greet = { name -> "Hello, \${name}!" }\n\nprintln greet("World")\n\ndef nums = [1, 2, 3, 4, 5]\nprintln "Sum: \${nums.sum()}"\nprintln "Squares: \${nums.collect { it ** 2 }}"`,
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
//  Execution logic
// ─────────────────────────────────────────────────────────
async function runCodeOnPiston({ language, code, stdin = "" }) {
  const { data, error } = await supabase.functions.invoke("code-playground", {
    body: { language: language.pistonLang, version: "*", code, stdin },
  });

  if (error) {
    const msg = error?.context?.body
      ? (() => { try { return JSON.parse(error.context.body)?.error; } catch { return null; } })()
      : null;
    throw new Error(msg || error.message || "Failed to run code");
  }
  return data;
}

// ─────────────────────────────────────────────────────────
//  Sub-components
// ─────────────────────────────────────────────────────────

function LanguagePicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = search.trim()
    ? LANGUAGES.filter((l) => l.label.toLowerCase().includes(search.toLowerCase()))
    : LANGUAGES;

  const grouped = LANGUAGE_GROUPS.reduce((acc, g) => {
    const items = filtered.filter((l) => l.group === g);
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
        <div className="absolute left-0 top-full mt-1.5 z-50 w-64 bg-[#1e1e2e] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
          <div className="p-2 border-b border-white/10">
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search languages…"
              className="w-full bg-white/10 text-white placeholder-white/40 text-sm px-3 py-1.5 rounded-lg outline-none"
            />
          </div>
          <div className="max-h-72 overflow-y-auto">
            {Object.entries(grouped).map(([group, langs]) => (
              <div key={group}>
                <p className="px-3 py-1 text-xs font-bold text-white/40 uppercase tracking-widest sticky top-0 bg-[#1e1e2e]">
                  {group}
                </p>
                {langs.map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => { onChange(lang); setOpen(false); setSearch(""); }}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm transition-colors",
                      lang.id === value.id
                        ? "bg-primary/20 text-primary font-semibold"
                        : "text-white/80 hover:bg-white/10"
                    )}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            ))}
            {Object.keys(grouped).length === 0 && (
              <p className="text-center py-6 text-sm text-white/40">No languages found</p>
            )}
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

  const [language, setLanguage] = useState(LANGUAGES[2]); // Python default
  const [code, setCode] = useState(LANGUAGES[2].template);
  const [stdin, setStdin] = useState("");
  const [consoleLines, setConsoleLines] = useState([]);
  const [running, setRunning] = useState(false);
  const [runCount, setRunCount] = useState(0);
  const [activeTab, setActiveTab] = useState("output"); // output | input
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
  }, []);

  const handleRun = useCallback(async () => {
    if (running) return;
    const currentCode = code.trim();
    if (!currentCode) {
      toast.error("Write some code first!");
      return;
    }
    setRunning(true);
    setOutputCollapsed(false);
    setActiveTab("output");
    const start = Date.now();
    setConsoleLines([{ type: "meta", text: `Running ${language.label}…` }]);

    try {
      const result = await runCodeOnPiston({ language, code: currentCode, stdin });
      const elapsed = ((Date.now() - start) / 1000).toFixed(2);
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

              {/* Console body */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-0.5">
                {activeTab === "output" ? (
                  <>
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
                  </>
                ) : (
                  <div className="h-full flex flex-col gap-2">
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
