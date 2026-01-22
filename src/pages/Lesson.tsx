import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { X, Heart, Zap, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

// Sample lesson data
const lessonData = {
  title: "Print Statements",
  questions: [
    {
      id: 1,
      type: "fill-blank",
      instruction: "Complete the code to print 'Hello, World!'",
      code: `# Print a greeting message\nprint(___)`,
      answer: '"Hello, World!"',
      options: ['"Hello, World!"', "'Hello World'", "Hello World", '"hello"'],
    },
    {
      id: 2,
      type: "multiple-choice",
      instruction: "What does the print() function do?",
      options: [
        "Displays output to the console",
        "Takes user input",
        "Creates a variable",
        "Imports a module",
      ],
      correctIndex: 0,
    },
    {
      id: 3,
      type: "fill-blank",
      instruction: "Fix the syntax error:",
      code: `name = "Alice"\nprint("Hello, " + ___`,
      answer: "name)",
      options: ["name)", "name", '"name")', "Name)"],
    },
  ],
};

export default function Lesson() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | number | null>(null);
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [hearts, setHearts] = useState(5);
  const [xpEarned, setXpEarned] = useState(0);

  const question = lessonData.questions[currentQuestion];
  const progress = ((currentQuestion) / lessonData.questions.length) * 100;
  const isLastQuestion = currentQuestion === lessonData.questions.length - 1;

  const handleCheck = () => {
    if (selectedAnswer === null) return;

    let correct = false;
    if (question.type === "fill-blank") {
      correct = selectedAnswer === question.answer;
    } else {
      correct = selectedAnswer === question.correctIndex;
    }

    setIsCorrect(correct);
    setIsChecked(true);

    if (correct) {
      setXpEarned((prev) => prev + 10);
    } else {
      setHearts((prev) => Math.max(0, prev - 1));
    }
  };

  const handleContinue = () => {
    if (isLastQuestion && isCorrect) {
      navigate("/learn");
      return;
    }

    setCurrentQuestion((prev) => prev + 1);
    setSelectedAnswer(null);
    setIsChecked(false);
    setIsCorrect(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 h-16">
            <Link to="/learn" className="p-2 rounded-lg hover:bg-muted transition-colors">
              <X className="w-6 h-6 text-muted-foreground" />
            </Link>

            <div className="flex-1">
              <Progress value={progress} size="default" indicatorColor="gradient" />
            </div>

            <div className="flex items-center gap-1 text-destructive">
              <Heart className="w-5 h-5 fill-current" />
              <span className="font-bold">{hearts}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        {/* Question */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-foreground mb-6">
            {question.instruction}
          </h2>

          {/* Code Block */}
          {question.type === "fill-blank" && (
            <div className="bg-sidebar rounded-2xl p-6 mb-6 font-mono text-sm">
              <pre className="text-sidebar-foreground whitespace-pre-wrap">
                {question.code?.split("___").map((part, i, arr) => (
                  <span key={i}>
                    {part}
                    {i < arr.length - 1 && (
                      <span className="px-3 py-1 bg-sidebar-accent rounded-lg text-primary border-2 border-dashed border-primary/50">
                        {selectedAnswer || "____"}
                      </span>
                    )}
                  </span>
                ))}
              </pre>
            </div>
          )}

          {/* Options */}
          <div className="grid gap-3 sm:grid-cols-2">
            {question.options?.map((option, index) => {
              const isSelected =
                question.type === "fill-blank"
                  ? selectedAnswer === option
                  : selectedAnswer === index;

              return (
                <button
                  key={index}
                  onClick={() => {
                    if (isChecked) return;
                    setSelectedAnswer(question.type === "fill-blank" ? option : index);
                  }}
                  disabled={isChecked}
                  className={cn(
                    "p-4 rounded-xl border-2 text-left font-semibold transition-all",
                    isSelected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card hover:border-primary/50",
                    isChecked && isSelected && isCorrect && "border-primary bg-primary/20",
                    isChecked && isSelected && !isCorrect && "border-destructive bg-destructive/20 text-destructive",
                    isChecked && !isSelected && question.type === "fill-blank" && option === question.answer && "border-primary bg-primary/10",
                    isChecked && !isSelected && question.type === "multiple-choice" && index === question.correctIndex && "border-primary bg-primary/10"
                  )}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        className={cn(
          "sticky bottom-0 border-t transition-colors",
          isChecked && isCorrect && "bg-primary/10 border-primary/30",
          isChecked && !isCorrect && "bg-destructive/10 border-destructive/30",
          !isChecked && "bg-background border-border"
        )}
      >
        <div className="container mx-auto px-4 py-4 max-w-2xl">
          {isChecked && (
            <div className="flex items-center gap-3 mb-4">
              {isCorrect ? (
                <>
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-6 h-6 text-primary-foreground" strokeWidth={3} />
                  </div>
                  <div>
                    <p className="font-bold text-primary">Awesome!</p>
                    <p className="text-sm text-muted-foreground">+10 XP</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-destructive flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-destructive-foreground" />
                  </div>
                  <div>
                    <p className="font-bold text-destructive">Oops!</p>
                    <p className="text-sm text-muted-foreground">
                      The correct answer was: {question.type === "fill-blank" ? question.answer : question.options?.[question.correctIndex ?? 0]}
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="flex gap-3">
            {!isChecked ? (
              <>
                <Button variant="outline" size="lg" className="flex-1" asChild>
                  <Link to="/learn">Skip</Link>
                </Button>
                <Button
                  size="lg"
                  className="flex-1"
                  disabled={selectedAnswer === null}
                  onClick={handleCheck}
                >
                  Check
                </Button>
              </>
            ) : (
              <Button
                size="lg"
                className="w-full"
                variant={isCorrect ? "default" : "destructive"}
                onClick={handleContinue}
              >
                {isLastQuestion && isCorrect ? "Complete Lesson" : "Continue"}
              </Button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
