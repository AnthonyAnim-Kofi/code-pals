import { useState } from "react";
import { Play, Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface CodeRunnerChallengeProps {
  initialCode: string;
  expectedOutput: string;
  hint?: string;
  onAnswer: (isCorrect: boolean) => void;
  disabled?: boolean;
}

export function CodeRunnerChallenge({
  initialCode,
  expectedOutput,
  hint,
  onAnswer,
  disabled = false,
}: CodeRunnerChallengeProps) {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const runCode = async () => {
    setIsRunning(true);
    setOutput(null);

    try {
      const { data, error } = await supabase.functions.invoke("run-python", {
        body: { code },
      });

      if (error) {
        setOutput(`Error: ${error.message}`);
        return;
      }

      const result = data.output?.trim() || data.error || "No output";
      setOutput(result);

      // Check if the output matches expected
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
          <span className="text-sm font-medium text-muted-foreground">Python</span>
          {hint && (
            <span className="text-xs text-muted-foreground">💡 Hint: {hint}</span>
          )}
        </div>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          disabled={disabled || hasChecked}
          className={cn(
            "w-full h-40 p-4 font-mono text-sm bg-sidebar text-sidebar-foreground resize-none focus:outline-none",
            (disabled || hasChecked) && "opacity-60 cursor-not-allowed"
          )}
          spellCheck={false}
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
    </div>
  );
}
