import { useState, useCallback, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { X, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { LessonComplete } from "@/components/LessonComplete";
import { DragOrderChallenge } from "@/components/challenges/DragOrderChallenge";
import { CodeRunnerChallenge } from "@/components/challenges/CodeRunnerChallenge";
import { MascotReaction } from "@/components/MascotReaction";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { useUserProfile, useAddXP, useDeductHeart, useSaveLessonProgress } from "@/hooks/useUserProgress";
import { useUpdateQuestProgress } from "@/hooks/useQuests";
import { cn } from "@/lib/utils";

// Extended lesson data with different question types including code runner
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
      type: "drag-order",
      instruction: "Arrange the code blocks to print numbers 1 to 3",
      blocks: [
        { id: "1", code: "print(1)" },
        { id: "2", code: "print(2)" },
        { id: "3", code: "print(3)" },
      ],
      correctOrder: ["1", "2", "3"],
    },
    {
      id: 4,
      type: "code-runner",
      instruction: "Write code to print 'Hello, Python!'",
      initialCode: "# Type your code below\n",
      expectedOutput: "Hello, Python!",
      hint: "Use the print() function",
    },
    {
      id: 5,
      type: "fill-blank",
      instruction: "Fix the syntax error:",
      code: `name = "Alice"\nprint("Hello, " + ___`,
      answer: "name)",
      options: ["name)", "name", '"name")', "Name)"],
    },
    {
      id: 6,
      type: "multiple-choice",
      instruction: "Which of these is a valid Python comment?",
      options: [
        "# This is a comment",
        "// This is a comment",
        "/* This is a comment */",
        "-- This is a comment",
      ],
      correctIndex: 0,
    },
    {
      id: 7,
      type: "code-runner",
      instruction: "Calculate and print the sum of 5 + 3",
      initialCode: "# Calculate the sum\nresult = 5 + 3\n",
      expectedOutput: "8",
      hint: "Don't forget to print the result!",
    },
  ],
};

export default function Lesson() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { playCorrect, playIncorrect, playComplete } = useSoundEffects();
  
  const { data: profile } = useUserProfile();
  const addXP = useAddXP();
  const deductHeart = useDeductHeart();
  const saveLessonProgress = useSaveLessonProgress();
  const updateQuestProgress = useUpdateQuestProgress();
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | number | null>(null);
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [dragOrderChecked, setDragOrderChecked] = useState(false);
  const [codeRunnerChecked, setCodeRunnerChecked] = useState(false);
  const [mascotReaction, setMascotReaction] = useState<"idle" | "correct" | "incorrect" | "celebrate">("idle");

  const hearts = profile?.hearts ?? 5;
  const question = lessonData.questions[currentQuestion];
  const progress = ((currentQuestion) / lessonData.questions.length) * 100;
  const isLastQuestion = currentQuestion === lessonData.questions.length - 1;

  // Generate a random encouragement message
  const mascotMessage = useMemo(() => {
    if (mascotReaction === "idle") return undefined;
    return undefined; // Let component pick random message
  }, [mascotReaction]);

  const handleCheck = async () => {
    if (selectedAnswer === null) return;

    let correct = false;
    if (question.type === "fill-blank") {
      correct = selectedAnswer === question.answer;
    } else if (question.type === "multiple-choice") {
      correct = selectedAnswer === question.correctIndex;
    }

    setIsCorrect(correct);
    setIsChecked(true);
    setMascotReaction(correct ? "correct" : "incorrect");

    if (correct) {
      setXpEarned((prev) => prev + 10);
      setCorrectAnswers((prev) => prev + 1);
      playCorrect();
      updateQuestProgress.mutate({ questType: "correct_answers", incrementBy: 1 });
    } else {
      deductHeart.mutate();
      playIncorrect();
    }
  };

  const handleDragOrderAnswer = useCallback((isCorrect: boolean) => {
    setDragOrderChecked(true);
    setIsChecked(true);
    setIsCorrect(isCorrect);
    setMascotReaction(isCorrect ? "correct" : "incorrect");

    if (isCorrect) {
      setXpEarned((prev) => prev + 15);
      setCorrectAnswers((prev) => prev + 1);
      playCorrect();
      updateQuestProgress.mutate({ questType: "correct_answers", incrementBy: 1 });
    } else {
      deductHeart.mutate();
      playIncorrect();
    }
  }, [playCorrect, playIncorrect, deductHeart, updateQuestProgress]);

  const handleCodeRunnerAnswer = useCallback((isCorrect: boolean) => {
    setCodeRunnerChecked(true);
    setIsChecked(true);
    setIsCorrect(isCorrect);
    setMascotReaction(isCorrect ? "correct" : "incorrect");

    if (isCorrect) {
      setXpEarned((prev) => prev + 20); // Code runner is worth more XP
      setCorrectAnswers((prev) => prev + 1);
      playCorrect();
      updateQuestProgress.mutate({ questType: "correct_answers", incrementBy: 1 });
    } else {
      deductHeart.mutate();
      playIncorrect();
    }
  }, [playCorrect, playIncorrect, deductHeart, updateQuestProgress]);

  const handleContinue = async () => {
    if (isLastQuestion) {
      playComplete();
      setMascotReaction("celebrate");
      
      const accuracy = Math.round((correctAnswers / lessonData.questions.length) * 100);
      await saveLessonProgress.mutateAsync({
        lessonId: parseInt(lessonId || "1"),
        xpEarned,
        accuracy,
      });
      
      await addXP.mutateAsync(xpEarned);
      
      updateQuestProgress.mutate({ questType: "earn_xp", incrementBy: xpEarned });
      updateQuestProgress.mutate({ questType: "complete_lessons", incrementBy: 1 });
      
      setIsComplete(true);
      return;
    }

    setCurrentQuestion((prev) => prev + 1);
    setSelectedAnswer(null);
    setIsChecked(false);
    setIsCorrect(false);
    setDragOrderChecked(false);
    setCodeRunnerChecked(false);
    setMascotReaction("idle");
  };

  const handleLessonComplete = () => {
    navigate("/learn");
  };

  if (isComplete) {
    return (
      <LessonComplete
        xpEarned={xpEarned}
        totalQuestions={lessonData.questions.length}
        correctAnswers={correctAnswers}
        onContinue={handleLessonComplete}
      />
    );
  }

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
        {/* Mascot Reaction */}
        {mascotReaction !== "idle" && (
          <div className="mb-6 animate-fade-in">
            <MascotReaction reaction={mascotReaction} message={mascotMessage} />
          </div>
        )}

        {/* Question */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-foreground mb-6">
            {question.instruction}
          </h2>

          {/* Drag Order Challenge */}
          {question.type === "drag-order" && question.blocks && question.correctOrder && (
            <DragOrderChallenge
              blocks={question.blocks}
              correctOrder={question.correctOrder}
              onAnswer={handleDragOrderAnswer}
              disabled={dragOrderChecked}
            />
          )}

          {/* Code Runner Challenge */}
          {question.type === "code-runner" && question.initialCode && question.expectedOutput && (
            <CodeRunnerChallenge
              initialCode={question.initialCode}
              expectedOutput={question.expectedOutput}
              hint={question.hint}
              onAnswer={handleCodeRunnerAnswer}
              disabled={codeRunnerChecked}
            />
          )}

          {/* Code Block for Fill-in-the-blank */}
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

          {/* Options for fill-blank and multiple-choice */}
          {(question.type === "fill-blank" || question.type === "multiple-choice") && (
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
          )}
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
          <div className="flex gap-3">
            {!isChecked && question.type !== "drag-order" && question.type !== "code-runner" ? (
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
            ) : isChecked ? (
              <Button
                size="lg"
                className="w-full"
                variant={isCorrect ? "default" : "destructive"}
                onClick={handleContinue}
              >
                {isLastQuestion ? "Finish" : "Continue"}
              </Button>
            ) : null}
          </div>
        </div>
      </footer>
    </div>
  );
}
