/**
 * CodeRunnerChallenge – Redesigned interactive code editor matching the CodeBear mobile-first UI.
 * Features: Learn/Code/Preview tabs, mascot speech bubble, mission card, quick-insert shortcuts,
 * and a polished Check Answer button.
 */
import { useState, useCallback } from "react";
import { Play, Loader2, CheckCircle, XCircle, RotateCcw, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { CodeEditor } from "@/components/CodeEditor";
import mascotImage from "@/assets/mascot.png";

interface CodeRunnerChallengeProps {
  initialCode: string;
  expectedOutput: string;
  hint?: string;
  instruction?: string;
  language?: "python" | "javascript" | "html" | "css";
  onAnswer: (isCorrect: boolean) => void;
  disabled?: boolean;
}

// Quick-insert shortcut definitions per language
const SHORTCUTS: Record<string, string[]> = {
  html: ["<", ">", "/", "=", "body", "h1", "p", "div", "img", "a"],
  css: ["{", "}", ":", ";", "color", "font", "bg", "px", "margin", "flex"],
  python: ["print", "(", ")", "=", "def", "if", "for", "in", "True", "False"],
  javascript: ["const", "let", "(", ")", "=>", "{", "}", "console", "log", "return"],
};

function getFileExtension(lang: string) {
  switch (lang) {
    case "html": return "index.html";
    case "css": return "style.css";
    case "python": return "main.py";
    case "javascript": return "script.js";
    default: return "code";
  }
}

export function CodeRunnerChallenge({
  initialCode,
  expectedOutput,
  hint,
  instruction,
  language = "python",
  onAnswer,
  disabled = false,
}: CodeRunnerChallengeProps) {
  const [activeTab, setActiveTab] = useState<"learn" | "code" | "preview">("learn");
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState<string | null>(null);
  const [htmlPreview, setHtmlPreview] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const shortcuts = SHORTCUTS[language] || SHORTCUTS.python;

  const handleReset = () => {
    if (hasChecked) return;
    setCode(initialCode);
    setOutput(null);
    setHtmlPreview(null);
  };

  const insertShortcut = (text: string) => {
    if (disabled || hasChecked) return;
    setCode((prev) => prev + text);
  };

  const runCode = async () => {
    setIsRunning(true);
    setOutput(null);
    setHtmlPreview(null);

    try {
      // HTML/CSS: render in iframe
      if (language === "html" || language === "css") {
        const fullHtml = language === "css"
          ? `<style>${code}</style><div class="preview">Preview</div>`
          : code;
        setHtmlPreview(fullHtml);
        const result = code.trim();
        const correct = result.includes(expectedOutput.trim()) || result === expectedOutput.trim();
        setOutput(correct ? "✅ Output matches expected!" : "Output rendered below");
        setIsCorrect(correct);
        setHasChecked(true);
        onAnswer(correct);
        setActiveTab("preview");
        setIsRunning(false);
        return;
      }

      // Server-side evaluation (JavaScript, Python, etc.)
      const { data, error } = await supabase.functions.invoke("run-code", {
        body: { code, language },
      });

      if (error) {
        setOutput(`Error: ${error.message}`);
        setIsRunning(false);
        return;
      }

      const result = data.output?.trim() || data.error || "No output";
      setOutput(result);
      const correct = result === expectedOutput.trim();
      setIsCorrect(correct);
      setHasChecked(true);
      onAnswer(correct);
    } catch (err) {
      setOutput(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex flex-col gap-0 -mx-4 sm:mx-0">
      {/* Tabs */}
      <div className="flex items-center gap-1 px-4 sm:px-0 mb-4">
        <button
          onClick={() => setActiveTab("learn")}
          className={cn(
            "px-5 py-2 rounded-full text-sm font-bold transition-all",
            activeTab === "learn"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted"
          )}
        >
          📖 Learn
        </button>
        <button
          onClick={() => setActiveTab("code")}
          className={cn(
            "px-5 py-2 rounded-full text-sm font-bold transition-all",
            activeTab === "code"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted"
          )}
        >
          &lt;/&gt; Code
        </button>
        {(language === "html" || language === "css") && (
          <button
            onClick={() => setActiveTab("preview")}
            className={cn(
              "px-5 py-2 rounded-full text-sm font-bold transition-all",
              activeTab === "preview"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            👁 Preview
          </button>
        )}
      </div>

      {/* Learn Tab */}
      {activeTab === "learn" && (
        <div className="px-4 sm:px-0 space-y-4 animate-fade-in">
          {/* Mascot speech bubble */}
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20 flex-shrink-0">
              <img src={mascotImage} alt="CodeBear" className="w-full h-full object-cover" />
            </div>
            <div className="relative flex-1 bg-card border-2 border-border rounded-2xl rounded-tl-sm p-4">
              <p className="text-sm text-foreground leading-relaxed">
                Hey there! 👋
                <br /><br />
                {instruction || "Complete the code challenge below!"}
              </p>
              {/* Speech bubble tail */}
              <div className="absolute -left-2 top-4 w-3 h-3 rotate-45 bg-card border-l-2 border-b-2 border-border" />
            </div>
          </div>

          {/* Mission card */}
          <div className="bg-secondary/10 border-2 border-secondary/30 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center">
                <span className="text-secondary-foreground text-xs font-bold">!</span>
              </div>
              <h3 className="font-extrabold text-foreground text-sm">Your Mission</h3>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed">
              {instruction || "Write the code to produce the expected output."}
              {expectedOutput && (
                <>
                  {" "}Expected output: <code className="px-1.5 py-0.5 bg-primary/20 text-primary rounded font-mono text-xs font-bold">{expectedOutput}</code>
                </>
              )}
            </p>
          </div>

          {/* Go to code button */}
          <Button
            onClick={() => setActiveTab("code")}
            className="w-full rounded-xl font-bold"
            size="lg"
          >
            Start Coding →
          </Button>
        </div>
      )}

      {/* Code Tab */}
      {activeTab === "code" && (
        <div className="space-y-0 animate-fade-in">
          {/* Editor header */}
          <div className="mx-4 sm:mx-0 flex items-center justify-between bg-muted/80 px-4 py-2 rounded-t-xl border border-b-0 border-border">
            <span className="text-xs font-bold text-muted-foreground font-mono">
              {getFileExtension(language)}
            </span>
            <button
              onClick={handleReset}
              disabled={hasChecked}
              className="flex items-center gap-1 text-xs font-semibold text-secondary hover:text-secondary/80 transition-colors disabled:opacity-40"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>

          {/* Code Editor */}
          <div className="mx-4 sm:mx-0">
            <CodeEditor
              value={code}
              onChange={(val) => !disabled && !hasChecked && setCode(val)}
              language={language}
              readOnly={disabled || hasChecked}
              minHeight="180px"
              className="rounded-t-none rounded-b-xl"
            />
          </div>

          {/* Quick-insert shortcuts */}
          <div className="px-4 sm:px-0 pt-3">
            <div className="flex flex-wrap gap-1.5">
              {shortcuts.map((shortcut) => (
                <button
                  key={shortcut}
                  onClick={() => insertShortcut(shortcut)}
                  disabled={disabled || hasChecked}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all",
                    "bg-card border-border text-foreground hover:border-primary/50 hover:bg-primary/5",
                    "active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed",
                    shortcut.length > 2 && "bg-primary/10 border-primary/30 text-primary"
                  )}
                >
                  {shortcut}
                </button>
              ))}
            </div>
          </div>

          {/* Output */}
          {output !== null && (
            <div
              className={cn(
                "mx-4 sm:mx-0 mt-3 rounded-xl p-4 border-2",
                hasChecked && isCorrect && "bg-primary/10 border-primary/30",
                hasChecked && !isCorrect && "bg-destructive/10 border-destructive/30",
                !hasChecked && "bg-muted border-border"
              )}
            >
              <p className="text-xs font-bold text-muted-foreground mb-1.5">Output:</p>
              <pre className="font-mono text-sm whitespace-pre-wrap text-foreground">
                {output}
              </pre>
              {hasChecked && !isCorrect && (
                <p className="text-xs text-muted-foreground mt-2">
                  Expected: <code className="text-primary font-bold">{expectedOutput}</code>
                </p>
              )}
            </div>
          )}

          {/* Check Answer / Status button */}
          <div className="px-4 sm:px-0 pt-4 pb-2">
            <div className="flex gap-2">
              {hint && (
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-xl"
                  onClick={() => setShowHint(!showHint)}
                >
                  <Lightbulb className="w-5 h-5 text-primary" />
                </Button>
              )}
              <Button
                onClick={runCode}
                disabled={disabled || isRunning || hasChecked}
                className={cn(
                  "flex-1 rounded-xl font-extrabold text-base h-12",
                  hasChecked && isCorrect && "bg-primary",
                  hasChecked && !isCorrect && "bg-destructive"
                )}
                variant={hasChecked ? (isCorrect ? "default" : "destructive") : "default"}
                size="lg"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Running...
                  </>
                ) : hasChecked ? (
                  isCorrect ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Correct!
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5" />
                      Try Again
                    </>
                  )
                ) : (
                  "Check Answer"
                )}
              </Button>
            </div>

            {/* Hint display */}
            {showHint && hint && (
              <div className="mt-3 p-3 bg-primary/10 border-2 border-primary/20 rounded-xl animate-fade-in">
                <p className="text-sm text-foreground">
                  <span className="font-bold">💡 Hint:</span> {hint}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preview Tab */}
      {activeTab === "preview" && (
        <div className="px-4 sm:px-0 animate-fade-in">
          {htmlPreview ? (
            <div className="rounded-2xl border-2 border-border overflow-hidden">
              <div className="bg-muted/80 px-4 py-2 border-b border-border">
                <span className="text-xs font-bold text-muted-foreground">Live Preview</span>
              </div>
              <iframe
                srcDoc={htmlPreview}
                className="w-full h-64 bg-white"
                sandbox="allow-scripts"
                title="HTML Preview"
              />
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-border p-12 text-center">
              <p className="text-muted-foreground text-sm font-semibold">
                Run your code to see the preview here
              </p>
              <Button
                variant="outline"
                className="mt-4 rounded-xl"
                onClick={() => setActiveTab("code")}
              >
                Go to Code
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
