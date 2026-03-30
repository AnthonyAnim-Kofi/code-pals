/**
 * CodeEditor – Monaco (VS Code engine) editor.
 * Keeps the same public props as the previous implementation.
 */
import Editor from "@monaco-editor/react";
import { cn } from "@/lib/utils";

function getMonacoLanguage(lang) {
  switch (lang) {
    case "python":
    case "javascript":
    case "typescript":
    case "html":
    case "css":
    case "java":
    case "c":
    case "cpp":
    case "csharp":
    case "php":
    case "go":
    case "ruby":
    case "swift":
    case "kotlin":
      return lang;
    case "rust":
      // Monaco does not include built-in Rust support in every bundle setup.
      return "plaintext";
    default:
      return "python";
  }
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
