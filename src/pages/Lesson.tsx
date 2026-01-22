import { useState, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { X, Heart, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { LessonComplete } from "@/components/LessonComplete";
import { DragOrderChallenge } from "@/components/challenges/DragOrderChallenge";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { useUserProfile, useAddXP, useDeductHeart, useSaveLessonProgress } from "@/hooks/useUserProgress";
import { useUpdateQuestProgress } from "@/hooks/useQuests";
import { cn } from "@/lib/utils";

// Sample lesson data with different question types
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

  const hearts = profile?.hearts ?? 5;
  const question = lessonData.questions[currentQuestion];
  const progress = ((currentQuestion) / lessonData.questions.length) * 100;
  const isLastQuestion = currentQuestion === lessonData.questions.length - 1;

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

    if (correct) {
      setXpEarned((prev) => prev + 10);
      setCorrectAnswers((prev) => prev + 1);
      playCorrect();
      // Update quest progress for correct answers
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

    if (isCorrect) {
      setXpEarned((prev) => prev + 15); // Drag order is worth more XP
      setCorrectAnswers((prev) => prev + 1);
      playCorrect();
      updateQuestProgress.mutate({ questType: "correct_answers", incrementBy: 1 });
    } else {
      deductHeart.mutate();
      playIncorrect();
    }
  }, [playCorrect, playIncorrect, deductHeart, updateQuestProgress]);

  const handleContinue = async () => {
    // If it's the last question, show completion screen
    if (isLastQuestion) {
      playComplete();
      
      // Save lesson progress to database
      const accuracy = Math.round((correctAnswers / lessonData.questions.length) * 100);
      await saveLessonProgress.mutateAsync({
        lessonId: parseInt(lessonId || "1"),
        xpEarned,
        accuracy,
      });
      
      // Add XP to user profile
      await addXP.mutateAsync(xpEarned);
      
      // Update quest progress
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
  };

  const handleLessonComplete = () => {
    navigate("/learn");
  };

  // Show completion screen
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
          {isChecked && (
            <div className="flex items-center gap-3 mb-4">
              {isCorrect ? (
                <>
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center animate-scale-in">
                    <Check className="w-6 h-6 text-primary-foreground" strokeWidth={3} />
                  </div>
                  <div>
                    <p className="font-bold text-primary">Awesome!</p>
                    <p className="text-sm text-muted-foreground">
                      +{question.type === "drag-order" ? 15 : 10} XP
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-destructive flex items-center justify-center animate-scale-in">
                    <AlertCircle className="w-6 h-6 text-destructive-foreground" />
                  </div>
                  <div>
                    <p className="font-bold text-destructive">Oops!</p>
                    <p className="text-sm text-muted-foreground">
                      {question.type === "drag-order" 
                        ? "The blocks are in the wrong order" 
                        : `The correct answer was: ${question.type === "fill-blank" ? question.answer : question.options?.[question.correctIndex ?? 0]}`
                      }
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="flex gap-3">
            {!isChecked && question.type !== "drag-order" ? (
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
