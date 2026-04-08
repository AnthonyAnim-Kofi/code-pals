/**
 * CodeEditor – Monaco (VS Code engine) editor.
 * Keeps the same public props as the previous implementation.
 */
import Editor from "@monaco-editor/react";
import { cn } from "@/lib/utils";

const MONACO_LANGUAGE_MAP = {
  python: "python",
  javascript: "javascript",
  typescript: "typescript",
  html: "html",
  css: "css",
  java: "java",
  c: "c",
  cpp: "cpp",
  csharp: "csharp",
  php: "php",
  go: "go",
  ruby: "ruby",
  swift: "swift",
  kotlin: "kotlin",
  rust: "rust",
  lua: "lua",
  perl: "perl",
  r: "r",
  scala: "scala",
  elixir: "elixir",
  fsharp: "fsharp",
  clojure: "clojure",
  julia: "julia",
  scheme: "scheme",
  bash: "shell",
  shell: "shell",
  powershell: "powershell",
  sql: "sql",
  graphql: "graphql",
  yaml: "yaml",
  json: "json",
  xml: "xml",
  markdown: "markdown",
};

function getMonacoLanguage(lang) {
  return MONACO_LANGUAGE_MAP[lang] ?? "plaintext";
}

export function CodeEditor({
  value,
  onChange,
  language = "python",
  readOnly = false,
  className,
  minHeight = "160px",
}) {
  return (
    <div className={cn("rounded-xl overflow-hidden border border-border", readOnly && "opacity-70", className)}>
      <Editor
        height={minHeight}
        theme="vs-dark"
        language={getMonacoLanguage(language)}
        value={value}
        onChange={(nextValue) => onChange?.(nextValue ?? "")}
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
          fontLigatures: true,
          lineNumbersMinChars: 3,
          tabSize: 2,
          insertSpaces: true,
          wordWrap: "on",
          wrappingIndent: "same",
          smoothScrolling: true,
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: "on",
          renderLineHighlight: "all",
          matchBrackets: "always",
          guides: {
            bracketPairs: true,
            indentation: true,
          },
          bracketPairColorization: { enabled: true },
          autoClosingBrackets: "always",
          autoClosingQuotes: "always",
          autoIndent: "advanced",
          formatOnPaste: true,
          formatOnType: true,
          suggestOnTriggerCharacters: true,
          quickSuggestions: {
            other: true,
            comments: false,
            strings: true,
          },
          acceptSuggestionOnEnter: "on",
          tabCompletion: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
        }}
      />
    </div>
  );
}
