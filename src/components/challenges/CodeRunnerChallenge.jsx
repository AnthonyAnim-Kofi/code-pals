/**
 * CodeRunnerChallenge - Interactive code editor with a full-screen 3-column desktop IDE layout
 * and a mobile-first tabbed interface.
 *
 * Desktop (>=1024px): Full viewport - Left (lesson info) | Center (editor) | Right (live console)
 * Mobile: Learn / Code / Preview tabs (unchanged)
 */
import { useState, useMemo, useEffect } from "react";
import { Loader2, CheckCircle, XCircle, RotateCcw, Lightbulb, Play, Terminal, X, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { CodeEditor } from "@/components/CodeEditor";
import { resolveCodeRunnerLanguage, getRunnerFileLabel } from "@/lib/codeRunnerLanguage";
import mascotImage from "@/assets/mascot.png";

const SHORTCUTS = {
  html: ["<", ">", "/", "=", "body", "h1", "p", "div", "img", "a"],
  css: ["{", "}", ":", ";", "color", "font", "bg", "px", "margin", "flex"],
  python: ["print", "(", ")", "=", "def", "if", "for", "in", "True", "False"],
  javascript: ["const", "let", "(", ")", "=>", "{", "}", "console", "log", "return"],
  typescript: ["const", ":", "interface", "type", "=>", "{", "}", "return", "string", "number"],
  java: ["public", "class", "void", "static", "String", "main", "System", "out"],
  c: ["#include", "int", "main", "printf", "return", "{", "}", ";"],
  cpp: ["#include", "int", "std", "cout", "return", "namespace"],
  csharp: ["using", "namespace", "class", "static", "void", "Console", "WriteLine"],
  go: ["package", "func", "fmt", "Println", "import"],
  rust: ["fn", "let", "mut", "println!", "use"],
  php: ["<?php", "echo", "$", "function"],
  ruby: ["def", "puts", "end", "class"],
  swift: ["import", "func", "print", "var", "let"],
  kotlin: ["fun", "println", "val", "var", "main"],
};

export function CodeRunnerChallenge({
  initialCode,
  expectedOutput,
  hint,
  instruction,
  language = "python",
  languageSlug = null,
  onAnswer,
  disabled = false,
  lessonTitle,
  lessonSubtitle,
  questionIndex,
  totalQuestions,
  onExit,
  onContinue,
  hearts,
  gems,
  isPracticeMode,
  isChallengeMode,
  progress,
}) {
  const resolved = useMemo(
    () => resolveCodeRunnerLanguage({ slug: languageSlug, nameFallback: language }),
    [languageSlug, language],
  );

  const [activeTab, setActiveTab] = useState("learn");
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState(null);
  const [htmlPreview, setHtmlPreview] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [consoleLines, setConsoleLines] = useState([]);

  useEffect(() => {
    setConsoleLines([]);
  }, [resolved.resolutionKey]);

  const shortcuts = SHORTCUTS[resolved.editorLanguage] || SHORTCUTS.python;
  const fileTabLabel = getRunnerFileLabel(resolved.editorLanguage);

  const handleReset = () => {
    if (hasChecked) return;
    setCode(initialCode);
    setOutput(null);
    setHtmlPreview(null);
    setConsoleLines([]);
  };

  const insertShortcut = (text) => {
    if (disabled || hasChecked) return;
    setCode((prev) => prev + text);
  };

  const runCode = async () => {
    setIsRunning(true);
    setOutput(null);
    setHtmlPreview(null);
    setConsoleLines([]);

    try {
      if (resolved.isMarkup) {
        const fullHtml = resolved.editorLanguage === "css"
          ? "<style>" + code + "</style><div class='preview'>Preview</div>"
          : code;
        setHtmlPreview(fullHtml);
        const result = code.trim();
        const correct = result.includes(expectedOutput.trim()) || result === expectedOutput.trim();
        setOutput(correct ? "Output matches expected!" : "Output rendered below");
        setIsCorrect(correct);
        setHasChecked(true);
        onAnswer(correct);
        setActiveTab("preview");
        setConsoleLines([]);
        setIsRunning(false);
        return;
      }
      if (!resolved.canRunInSandbox) {
        const msg =
          "This language track does not use the server sandbox yet. Use a compiled/interpreted language lesson, or contact your admin.";
        setOutput(msg);
        setConsoleLines([]);
        setIsRunning(false);
        return;
      }
      const { data, error } = await supabase.functions.invoke("run-code", {
        body: { code, language: resolved.apiLanguage },
      });
      if (error) {
        const errMsg = "Error: " + error.message;
        setOutput(errMsg);
        setConsoleLines([{ type: "error", text: errMsg }]);
        setIsRunning(false);
        return;
      }
      const out = typeof data?.output === "string" ? data.output.trim() : "";
      const errOut = typeof data?.error === "string" ? data.error.trim() : "";
      const lines = [];
      if (out) lines.push({ type: "output", text: out });
      if (errOut) lines.push({ type: "error", text: errOut });
      setConsoleLines(lines);

      const result = out || errOut || "No output";
      setOutput(result);
      const correct = result === expectedOutput.trim();
      setIsCorrect(correct);
      setHasChecked(true);
      onAnswer(correct);
    } catch (err) {
      const errMsg = "Error: " + (err instanceof Error ? err.message : "Unknown error");
      setOutput(errMsg);
      setConsoleLines([{ type: "error", text: errMsg }]);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div>
      {/* ============ DESKTOP LAYOUT ============ */}
      <div className="hidden lg:flex lg:flex-col lg:flex-1 lg:min-h-screen">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-6 py-3 bg-card border-b border-border shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={onExit} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
            <div>
              <p className="text-sm font-bold text-foreground">
                {lessonSubtitle || resolved.displayLabel.charAt(0).toUpperCase() + resolved.displayLabel.slice(1)}
              </p>
              {questionIndex !== undefined && totalQuestions > 0 && (
                <p className="text-xs text-muted-foreground font-semibold">
                  {"Lesson " + (questionIndex + 1) + " of " + totalQuestions}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-destructive">
              <Heart className="w-4 h-4 fill-current" />
              <span className="font-extrabold text-sm">{hearts}</span>
            </div>
            <div className="flex items-center gap-1 text-primary">
              <span className="text-sm">{"💎"}</span>
              <span className="font-extrabold text-sm">{gems}</span>
            </div>
            <Button
              onClick={runCode}
              disabled={disabled || isRunning || hasChecked}
              className="rounded-xl font-bold gap-2"
            >
              {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {"Run Code"}
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        {progress !== undefined && (
          <div className="px-6 py-1.5 bg-card border-b border-border shrink-0">
            <Progress value={progress} size="default" indicatorColor="gradient" />
          </div>
        )}

        {/* 3-Column Grid */}
        <div className="flex-1 grid grid-cols-[1fr_1.4fr_1fr] min-h-0">
          {/* LEFT: Lesson Info */}
          <div className="p-6 border-r border-border overflow-y-auto overflow-x-hidden bg-card break-words">
            <h2 className="text-3xl font-extrabold text-foreground mb-2">
              {lessonTitle || "Coding Challenge"}
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed mb-6">
              {instruction || "Complete the code challenge below!"}
            </p>

            {/* Exercise Task Card */}
            <div className="bg-muted/50 rounded-xl p-5 border border-border">
              <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-3">
                Exercise Task
              </h3>
              <p className="text-base text-foreground/80 leading-relaxed mb-4">
                {instruction || "Write the code to produce the expected output."}
              </p>
              {expectedOutput && (
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <p className="text-base text-foreground/70">
                    {"Output: "}
                    <code className="px-2 py-1 bg-primary/15 text-primary rounded font-mono text-sm font-bold">{expectedOutput}</code>
                  </p>
                </div>
              )}

              {/* Hint inside card */}
              {hint && (
                <button
                  onClick={() => setShowHint(!showHint)}
                  className="flex items-center gap-2 text-base text-primary hover:underline font-semibold mt-4"
                >
                  <Lightbulb className="w-5 h-5" />
                  {showHint ? "Hide Hint" : "Show Hint"}
                </button>
              )}
              {showHint && hint && (
                <div className="mt-2 p-3 bg-primary/10 border border-primary/20 rounded-xl text-base text-foreground">
                  {"💡 "}{hint}
                </div>
              )}
            </div>
          </div>

          {/* CENTER: Code Editor */}
          <div className="flex flex-col overflow-hidden border-r border-border bg-background">
            {/* File tab bar */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-muted/50 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-1 bg-background rounded-lg font-bold text-foreground font-mono border border-border">
                  {"◇ " + fileTabLabel}
                </span>
              </div>
              <button
                onClick={handleReset}
                disabled={hasChecked}
                className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
              >
                <RotateCcw className="w-3 h-3" />
                {"Reset"}
              </button>
            </div>

            {/* Editor area */}
            <div className="flex-1 min-h-0 overflow-auto">
              <CodeEditor
                value={code}
                onChange={(val) => !disabled && !hasChecked && setCode(val)}
                language={resolved.editorLanguage}
                readOnly={disabled || hasChecked}
                minHeight="100%"
                className="rounded-none border-0 h-full"
              />
            </div>

            {/* Quick shortcuts bar */}
            <div className="px-4 py-2 border-t border-border bg-muted/30 shrink-0">
              <div className="flex flex-wrap gap-1.5">
                {shortcuts.map((shortcut) => (
                  <button
                    key={shortcut}
                    onClick={() => insertShortcut(shortcut)}
                    disabled={disabled || hasChecked}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-bold border transition-all",
                      "bg-background border-border text-foreground hover:border-primary/50 hover:bg-primary/5",
                      "active:scale-95 disabled:opacity-40",
                      shortcut.length > 2 && "bg-primary/10 border-primary/30 text-primary"
                    )}
                  >
                    {shortcut}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: Live Console */}
          <div className="flex flex-col overflow-hidden bg-card">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-muted/50 shrink-0">
              <Terminal className="w-4 h-4 text-primary shrink-0" />
              <span className="text-xs font-black uppercase tracking-widest text-foreground">Live Console</span>
            </div>

            <div className="flex-1 p-4 overflow-y-auto font-mono text-sm space-y-1 min-h-[120px]">
              {consoleLines.map((line, i) => (
                <div
                  key={i}
                  className={cn(
                    "whitespace-pre-wrap",
                    line.type === "output" && "text-foreground font-semibold",
                    line.type === "error" && "text-destructive",
                  )}
                >
                  {line.text}
                </div>
              ))}
            </div>

            {hasChecked && (
              <div className={cn(
                "mx-4 mb-4 rounded-xl p-3 border-2 flex items-center gap-2 shrink-0",
                isCorrect ? "bg-primary/10 border-primary/30" : "bg-destructive/10 border-destructive/30"
              )}>
                {isCorrect
                  ? <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                  : <XCircle className="w-5 h-5 text-destructive shrink-0" />
                }
                <span className="font-bold text-sm text-foreground">
                  {isCorrect ? "Correct! Great job!" : "Not quite. Expected: " + expectedOutput}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============ MOBILE LAYOUT ============ */}
      <div className="flex flex-col gap-0 -mx-4 sm:mx-0 lg:hidden">
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
            {"📖 Learn"}
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
            {"</> Code"}
          </button>
          {resolved.isMarkup && (
            <button
              onClick={() => setActiveTab("preview")}
              className={cn(
                "px-5 py-2 rounded-full text-sm font-bold transition-all",
                activeTab === "preview"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {"👁 Preview"}
            </button>
          )}
        </div>

        {/* Learn Tab */}
        {activeTab === "learn" && (
          <div className="px-4 sm:px-0 space-y-4 animate-fade-in">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20 flex-shrink-0">
                <img src={mascotImage} alt="CodeBear" className="w-full h-full object-cover" />
              </div>
              <div className="relative flex-1 bg-card border-2 border-border rounded-2xl rounded-tl-sm p-4">
                <p className="text-sm text-foreground leading-relaxed">
                  {"Hey there! 👋"}
                  <br /><br />
                  {instruction || "Complete the code challenge below!"}
                </p>
                <div className="absolute -left-2 top-4 w-3 h-3 rotate-45 bg-card border-l-2 border-b-2 border-border" />
              </div>
            </div>
            <div className="bg-secondary/10 border-2 border-secondary/30 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center">
                  <span className="text-secondary-foreground text-xs font-bold">{"!"}</span>
                </div>
                <h3 className="font-extrabold text-foreground text-sm">Your Mission</h3>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed">
                {instruction || "Write the code to produce the expected output."}
                {expectedOutput && (
                  <span>
                    {" Expected output: "}
                    <code className="px-1.5 py-0.5 bg-primary/20 text-primary rounded font-mono text-xs font-bold">{expectedOutput}</code>
                  </span>
                )}
              </p>
            </div>
            <Button onClick={() => setActiveTab("code")} className="w-full rounded-xl font-bold" size="lg">
              {"Start Coding →"}
            </Button>
          </div>
        )}

        {/* Code Tab */}
        {activeTab === "code" && (
          <div className="space-y-0 animate-fade-in">
            <div className="mx-4 sm:mx-0 flex items-center justify-between bg-muted/80 px-4 py-2 rounded-t-xl border border-b-0 border-border">
              <span className="text-xs font-bold text-muted-foreground font-mono">{fileTabLabel}</span>
              <button onClick={handleReset} disabled={hasChecked} className="flex items-center gap-1 text-xs font-semibold text-secondary hover:text-secondary/80 transition-colors disabled:opacity-40">
                <RotateCcw className="w-3 h-3" />
                {"Reset"}
              </button>
            </div>
            <div className="mx-4 sm:mx-0">
              <CodeEditor value={code} onChange={(val) => !disabled && !hasChecked && setCode(val)} language={resolved.editorLanguage} readOnly={disabled || hasChecked} minHeight="180px" className="rounded-t-none rounded-b-xl" />
            </div>
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
            {output !== null && (
              <div className={cn(
                "mx-4 sm:mx-0 mt-3 rounded-xl p-4 border-2",
                hasChecked && isCorrect && "bg-primary/10 border-primary/30",
                hasChecked && !isCorrect && "bg-destructive/10 border-destructive/30",
                !hasChecked && "bg-muted border-border"
              )}>
                <p className="text-xs font-bold text-muted-foreground mb-1.5">{"Output:"}</p>
                <pre className="font-mono text-sm whitespace-pre-wrap text-foreground">{output}</pre>
                {hasChecked && !isCorrect && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {"Expected: "}
                    <code className="text-primary font-bold">{expectedOutput}</code>
                  </p>
                )}
              </div>
            )}
            <div className="px-4 sm:px-0 pt-4 pb-2">
              <div className="flex gap-2">
                {hint && (
                  <Button variant="outline" size="lg" className="rounded-xl" onClick={() => setShowHint(!showHint)}>
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
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {"Running..."}
                    </span>
                  ) : hasChecked ? (
                    isCorrect ? (
                      <span className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        {"Correct!"}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <XCircle className="w-5 h-5" />
                        {"Try Again"}
                      </span>
                    )
                  ) : (
                    "Check Answer"
                  )}
                </Button>
              </div>
              {showHint && hint && (
                <div className="mt-3 p-3 bg-primary/10 border-2 border-primary/20 rounded-xl animate-fade-in">
                  <p className="text-sm text-foreground">
                    <span className="font-bold">{"💡 Hint: "}</span>
                    {hint}
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
                <iframe srcDoc={htmlPreview} className="w-full h-64 bg-white" sandbox="allow-scripts" title="HTML Preview" />
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-border p-12 text-center">
                <p className="text-muted-foreground text-sm font-semibold">Run your code to see the preview here</p>
                <Button variant="outline" className="mt-4 rounded-xl" onClick={() => setActiveTab("code")}>
                  {"Go to Code"}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
