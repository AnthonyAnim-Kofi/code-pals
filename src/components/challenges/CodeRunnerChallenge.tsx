/**
 * CodeRunnerChallenge – Interactive code editor with execution and validation.
 * Uses CodeMirror for syntax highlighting and Piston API for execution.
 * Supports Python, JavaScript, HTML, and CSS.
 */
import { useState } from "react";
import { Play, Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { CodeEditor } from "@/components/CodeEditor";

interface CodeRunnerChallengeProps {
  initialCode: string;
  expectedOutput: string;
  hint?: string;
  language?: "python" | "javascript" | "html" | "css";
  onAnswer: (isCorrect: boolean) => void;
  disabled?: boolean;
}

export function CodeRunnerChallenge({
  initialCode,
  expectedOutput,
  hint,
  language = "python",
  onAnswer,
  disabled = false,
}: CodeRunnerChallengeProps) {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState<string | null>(null);
  const [htmlPreview, setHtmlPreview] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const runCode = async () => {
    setIsRunning(true);
    setOutput(null);
    setHtmlPreview(null);

    try {
      // HTML/CSS: render in iframe, no server needed
      if (language === "html" || language === "css") {
        const fullHtml = language === "css"
          ? `<style>${code}</style><div class="preview">Preview</div>`
          : code;
        setHtmlPreview(fullHtml);
        // For HTML, compare normalized output
        const result = code.trim();
        const correct = result.includes(expectedOutput.trim()) || result === expectedOutput.trim();
        setOutput(correct ? "✅ Output matches expected!" : "Output rendered below");
        setIsCorrect(correct);
        setHasChecked(true);
        onAnswer(correct);
        setIsRunning(false);
        return;
      }

      // JavaScript: run locally in a sandboxed function
      if (language === "javascript") {
        try {
          const logs: string[] = [];
          const mockConsole = { log: (...args: any[]) => logs.push(args.map(String).join(" ")) };
          const fn = new Function("console", code);
          fn(mockConsole);
          const result = logs.join("\n").trim();
          setOutput(result || "No output");
          const correct = result === expectedOutput.trim();
          setIsCorrect(correct);
          setHasChecked(true);
          onAnswer(correct);
        } catch (err) {
          setOutput(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
          setIsCorrect(false);
          setHasChecked(true);
          onAnswer(false);
        }
        setIsRunning(false);
        return;
      }

      // Python: use edge function
      const { data, error } = await supabase.functions.invoke("run-python", {
        body: { code },
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
    <div className="space-y-4">
      {/* Code Editor */}
      <div className="rounded-2xl overflow-hidden border border-border">
        <div className="bg-sidebar px-4 py-2 border-b border-border flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground capitalize">{language}</span>
          {hint && (
            <span className="text-xs text-muted-foreground">💡 Hint: {hint}</span>
          )}
        </div>
        <CodeEditor
          value={code}
          onChange={(val) => !disabled && !hasChecked && setCode(val)}
          language={language}
          readOnly={disabled || hasChecked}
          minHeight="160px"
        />
      </div>

      {/* Run Button */}
      <Button
        onClick={runCode}
        disabled={disabled || isRunning || hasChecked}
        className="w-full"
        variant={hasChecked ? (isCorrect ? "default" : "destructive") : "secondary"}
      >
        {isRunning ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Running...
          </>
        ) : hasChecked ? (
          isCorrect ? (
            <>
              <CheckCircle className="w-4 h-4" />
              Correct!
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4" />
              Try Again
            </>
          )
        ) : (
          <>
            <Play className="w-4 h-4" />
            Run Code
          </>
        )}
      </Button>

      {/* Output */}
      {output !== null && (
        <div
          className={cn(
            "rounded-2xl p-4 border-2",
            hasChecked && isCorrect && "bg-primary/10 border-primary/30",
            hasChecked && !isCorrect && "bg-destructive/10 border-destructive/30",
            !hasChecked && "bg-muted border-border"
          )}
        >
          <p className="text-xs font-medium text-muted-foreground mb-2">Output:</p>
          <pre className="font-mono text-sm whitespace-pre-wrap">
            {output}
          </pre>
          {hasChecked && !isCorrect && (
            <p className="text-xs text-muted-foreground mt-2">
              Expected: <code className="text-primary">{expectedOutput}</code>
            </p>
          )}
        </div>
      )}

      {/* HTML Preview */}
      {htmlPreview && (
        <div className="rounded-2xl border-2 border-border overflow-hidden">
          <div className="bg-sidebar px-4 py-2 border-b border-border">
            <span className="text-xs font-medium text-muted-foreground">Preview</span>
          </div>
          <iframe
            srcDoc={htmlPreview}
            className="w-full h-48 bg-white"
            sandbox="allow-scripts"
            title="HTML Preview"
          />
        </div>
      )}
    </div>
  );
}
