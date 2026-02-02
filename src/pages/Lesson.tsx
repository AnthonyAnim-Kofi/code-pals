import { useState, useCallback, useMemo, useEffect } from "react";
import { Link, useParams, useNavigate, useSearchParams } from "react-router-dom";
import { X, Heart, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { LessonComplete } from "@/components/LessonComplete";
import { DragOrderChallenge } from "@/components/challenges/DragOrderChallenge";
import { CodeRunnerChallenge } from "@/components/challenges/CodeRunnerChallenge";
import { MascotReaction } from "@/components/MascotReaction";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { useUserProfile, useAddXP, useDeductHeart, useSaveLessonProgress, useLessonProgress } from "@/hooks/useUserProgress";
import { useUpdateQuestProgress } from "@/hooks/useQuests";
import { 
  useLessonData, 
  useLessonLanguageInfo, 
  usePartialLessonProgress, 
  useSavePartialProgress,
  useClearPartialProgress 
} from "@/hooks/useLessonData";
import { cn } from "@/lib/utils";

// Fallback lesson data for demo
const fallbackLessonData = {
  title: "Print Statements",
  questions: [
    {
      id: "1",
      type: "fill-blank",
      instruction: "Complete the code to print 'Hello, World!'",
      code: `# Print a greeting message\nprint(___)`,
      answer: '"Hello, World!"',
      options: ['"Hello, World!"', "'Hello World'", "Hello World", '"hello"'],
      xp_reward: 10,
      order_index: 0,
    },
    {
      id: "2",
      type: "multiple-choice",
      instruction: "What does the print() function do?",
      options: [
        "Displays output to the console",
        "Takes user input",
        "Creates a variable",
        "Imports a module",
      ],
      answer: "0",
      xp_reward: 10,
      order_index: 1,
    },
    {
      id: "3",
      type: "drag-order",
      instruction: "Arrange the code blocks to print numbers 1 to 3",
      blocks: [
        { id: "1", code: "print(1)" },
        { id: "2", code: "print(2)" },
        { id: "3", code: "print(3)" },
      ],
      correct_order: ["1", "2", "3"],
      xp_reward: 15,
      order_index: 2,
    },
    {
      id: "4",
      type: "code-runner",
      instruction: "Write code to print 'Hello, Python!'",
      initial_code: "# Type your code below\n",
      expected_output: "Hello, Python!",
      hint: "Use the print() function",
      xp_reward: 20,
      order_index: 3,
    },
  ],
};

export default function Lesson() {
  const { lessonId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { playCorrect, playIncorrect, playComplete } = useSoundEffects();
  
  // Check if we're in practice mode
  const isPracticeMode = searchParams.get('mode') === 'practice';

  const { data: profile } = useUserProfile();
  const { data: lessonFromDb, isLoading: loadingLesson } = useLessonData(lessonId);
  const { data: languageInfo } = useLessonLanguageInfo(lessonId);
  const { data: savedProgress } = usePartialLessonProgress(lessonId);
  const { data: lessonProgressList } = useLessonProgress();
  const savePartialProgress = useSavePartialProgress();
  const clearPartialProgress = useClearPartialProgress();
  const addXP = useAddXP();
  const deductHeartMutation = useDeductHeart();
  // In practice mode never deduct hearts (no-op wrapper)
  const deductHeart = isPracticeMode ? { mutate: () => {}, mutateAsync: async () => {} } : deductHeartMutation;
  const saveLessonProgress = useSaveLessonProgress();
  const updateQuestProgress = useUpdateQuestProgress();

  // Use database questions when lesson exists; only use fallback when lesson is not in DB (demo)
  const lessonData = useMemo(() => {
    if (lessonFromDb) {
      // Use admin-set questions; if none, show empty list (no hardcoded Python)
      return {
        title: lessonFromDb.title,
        questions: lessonFromDb.questions.length > 0 ? lessonFromDb.questions : [],
      };
    }
    // Only use fallback when lesson not found at all (demo/testing)
    return fallbackLessonData;
  }, [lessonFromDb]);

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
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());
  const [initialized, setInitialized] = useState(false);

  // Restore saved progress on mount
  useEffect(() => {
    if (savedProgress && !initialized) {
      setCurrentQuestion(savedProgress.current_question_index);
      setXpEarned(savedProgress.xp_earned);
      setCorrectAnswers(savedProgress.correct_answers);
      setAnsweredQuestions(new Set(savedProgress.answered_questions));
      setInitialized(true);
    } else if (!savedProgress && !initialized) {
      setInitialized(true);
    }
  }, [savedProgress, initialized]);

  // Save partial progress when leaving (logout, close tab, navigate away) so user can continue later
  useEffect(() => {
    const saveOnUnload = () => {
      if (lessonId && !isComplete) {
        savePartialProgress.mutate({
          lesson_id: lessonId,
          current_question_index: currentQuestion,
          answered_questions: Array.from(answeredQuestions),
          xp_earned: xpEarned,
          correct_answers: correctAnswers,
        });
      }
    };
    const handleBeforeUnload = () => {
      saveOnUnload();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      saveOnUnload();
    };
  }, [lessonId, isComplete, currentQuestion, answeredQuestions, xpEarned, correctAnswers, savePartialProgress]);

  const hearts = profile?.hearts ?? 5;
  const question = lessonData.questions[currentQuestion];
  const totalQuestions = lessonData.questions.length;
  const progress = totalQuestions > 0 ? ((currentQuestion) / totalQuestions) * 100 : 0;
  const isLastQuestion = totalQuestions > 0 && currentQuestion === totalQuestions - 1;
  const isFirstQuestion = currentQuestion === 0;

  // Save partial progress when state changes
  const saveProgress = useCallback(() => {
    if (lessonId) {
      savePartialProgress.mutate({
        lesson_id: lessonId,
        current_question_index: currentQuestion,
        answered_questions: Array.from(answeredQuestions),
        xp_earned: xpEarned,
        correct_answers: correctAnswers,
      });
    }
  }, [lessonId, currentQuestion, answeredQuestions, xpEarned, correctAnswers, savePartialProgress]);

  // Handle exit - save progress and navigate to current lesson's language
  const handleExit = () => {
    saveProgress();
    const langParam = languageInfo?.id ? `?language=${languageInfo.id}` : "";
    navigate(`/learn${langParam}`);
  };

  const handleCheck = async () => {
    if (selectedAnswer === null) return;

    let correct = false;
    if (question.type === "fill-blank") {
      correct = selectedAnswer === question.answer;
    } else if (question.type === "multiple-choice") {
      // Handle both string index and number index
      const correctIdx = parseInt(question.answer || "0");
      correct = selectedAnswer === correctIdx || selectedAnswer === question.answer;
    }

    setIsCorrect(correct);
    setIsChecked(true);
    setMascotReaction(correct ? "correct" : "incorrect");

    if (correct) {
      const xpReward = question.xp_reward || 10;
      setXpEarned((prev) => prev + xpReward);
      setCorrectAnswers((prev) => prev + 1);
      playCorrect();
      if (!isPracticeMode) {
        updateQuestProgress.mutate({ questType: "correct_answers", incrementBy: 1 });
      }
    } else {
      // Don't deduct hearts in practice mode
      if (!isPracticeMode) {
        deductHeart.mutate();
      }
      playIncorrect();
    }
  };

  const handleDragOrderAnswer = useCallback((isCorrect: boolean) => {
    setDragOrderChecked(true);
    setIsChecked(true);
    setIsCorrect(isCorrect);
    setMascotReaction(isCorrect ? "correct" : "incorrect");

    if (isCorrect) {
      const xpReward = question.xp_reward || 15;
      setXpEarned((prev) => prev + xpReward);
      setCorrectAnswers((prev) => prev + 1);
      playCorrect();
      if (!isPracticeMode) {
        updateQuestProgress.mutate({ questType: "correct_answers", incrementBy: 1 });
      }
    } else {
      // Don't deduct hearts in practice mode
      if (!isPracticeMode) {
        deductHeart.mutate();
      }
      playIncorrect();
    }
  }, [question, playCorrect, playIncorrect, deductHeart, updateQuestProgress, isPracticeMode]);

  const handleCodeRunnerAnswer = useCallback((isCorrect: boolean) => {
    setCodeRunnerChecked(true);
    setIsChecked(true);
    setIsCorrect(isCorrect);
    setMascotReaction(isCorrect ? "correct" : "incorrect");

    if (isCorrect) {
      const xpReward = question.xp_reward || 20;
      setXpEarned((prev) => prev + xpReward);
      setCorrectAnswers((prev) => prev + 1);
      playCorrect();
      if (!isPracticeMode) {
        updateQuestProgress.mutate({ questType: "correct_answers", incrementBy: 1 });
      }
    } else {
      // Don't deduct hearts in practice mode
      if (!isPracticeMode) {
        deductHeart.mutate();
      }
      playIncorrect();
    }
  }, [question, playCorrect, playIncorrect, deductHeart, updateQuestProgress, isPracticeMode]);

  const handleContinue = async () => {
    // Mark current question as answered
    const newAnswered = new Set(answeredQuestions).add(currentQuestion);
    setAnsweredQuestions(newAnswered);

    if (isLastQuestion) {
      playComplete();
      setMascotReaction("celebrate");

      const accuracy = Math.round((correctAnswers / lessonData.questions.length) * 100);
      
      // Use the database lesson ID (UUID string)
      const dbLessonId = lessonFromDb?.id || (typeof lessonId === "string" ? lessonId : String(lessonId));
      const alreadyCompleted = lessonProgressList?.some((p) => String(p.lesson_id) === dbLessonId && p.completed);

      // In practice mode or if lesson already completed (retake), don't affect XP/hearts/quests
      if (!isPracticeMode && !alreadyCompleted) {
        await saveLessonProgress.mutateAsync({
          lessonId: dbLessonId,
          xpEarned,
          accuracy,
        });

        await addXP.mutateAsync(xpEarned);

        updateQuestProgress.mutate({ questType: "earn_xp", incrementBy: xpEarned });
        updateQuestProgress.mutate({ questType: "complete_lessons", incrementBy: 1 });
      }

      // Clear partial progress since lesson is complete
      if (lessonId) {
        clearPartialProgress.mutate(lessonId);
      }

      setIsComplete(true);
      return;
    }

    goToNextQuestion();
    saveProgress();
  };

  const goToNextQuestion = () => {
    setCurrentQuestion((prev) => prev + 1);
    setSelectedAnswer(null);
    setIsChecked(false);
    setIsCorrect(false);
    setDragOrderChecked(false);
    setCodeRunnerChecked(false);
    setMascotReaction("idle");
  };

  const goToPreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
      setSelectedAnswer(null);
      setIsChecked(answeredQuestions.has(currentQuestion - 1));
      setIsCorrect(false);
      setDragOrderChecked(answeredQuestions.has(currentQuestion - 1));
      setCodeRunnerChecked(answeredQuestions.has(currentQuestion - 1));
      setMascotReaction("idle");
    }
  };

  const handleLessonComplete = () => {
    const langParam = languageInfo?.id ? `?language=${languageInfo.id}` : "";
    navigate(`/learn${langParam}`);
  };

  if (loadingLesson) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Handle empty questions or invalid question index
  if (lessonData.questions.length === 0 || !question) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <p className="text-muted-foreground text-center">No questions in this lesson yet.</p>
        <Button variant="outline" className="mt-4" onClick={handleExit}>
          Back to Learn
        </Button>
      </div>
    );
  }

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
            <button 
              onClick={handleExit}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="w-6 h-6 text-muted-foreground" />
            </button>

            <div className="flex-1">
              <Progress value={progress} size="default" indicatorColor="gradient" />
            </div>
            
            {/* Practice Mode Indicator */}
            {isPracticeMode && (
              <div className="flex items-center gap-1 px-2 py-1 bg-secondary/20 rounded-lg text-secondary text-sm font-semibold">
                <RotateCcw className="w-4 h-4" />
                Practice
              </div>
            )}

            <div className="flex items-center gap-1 text-destructive">
              <Heart className="w-5 h-5 fill-current" />
              <span className="font-bold">{isPracticeMode ? "∞" : hearts}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        {/* Mascot Reaction */}
        {mascotReaction !== "idle" && (
          <div className="mb-6 animate-fade-in">
            <MascotReaction reaction={mascotReaction} />
          </div>
        )}

        {/* Question */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-foreground mb-6">
            {question.instruction}
          </h2>

          {/* Drag Order Challenge */}
          {question.type === "drag-order" && question.blocks && question.correct_order && (
            <DragOrderChallenge
              blocks={question.blocks}
              correctOrder={question.correct_order}
              onAnswer={handleDragOrderAnswer}
              disabled={dragOrderChecked}
            />
          )}

          {/* Code Runner Challenge */}
          {question.type === "code-runner" && question.initial_code && question.expected_output && (
            <CodeRunnerChallenge
              initialCode={question.initial_code}
              expectedOutput={question.expected_output}
              hint={question.hint}
              onAnswer={handleCodeRunnerAnswer}
              disabled={codeRunnerChecked}
            />
          )}

          {/* Code Block for Fill-in-the-blank */}
          {question.type === "fill-blank" && question.code && (
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
          {(question.type === "fill-blank" || question.type === "multiple-choice") && question.options && (
            <div className="grid gap-3 sm:grid-cols-2">
              {question.options.map((option, index) => {
                const isSelected =
                  question.type === "fill-blank"
                    ? selectedAnswer === option
                    : selectedAnswer === index;
                const correctIdx = parseInt(question.answer || "0");

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
                      isChecked && !isSelected && question.type === "multiple-choice" && index === correctIdx && "border-primary bg-primary/10"
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
            {/* Back button - always visible except on first question */}
            {!isFirstQuestion && (
              <Button
                variant="ghost"
                size="lg"
                onClick={goToPreviousQuestion}
                className="px-4"
              >
                ←
              </Button>
            )}

            {!isChecked && question.type !== "drag-order" && question.type !== "code-runner" ? (
              <Button
                size="lg"
                className="flex-1"
                disabled={selectedAnswer === null}
                onClick={handleCheck}
              >
                Check
              </Button>
            ) : isChecked ? (
              <Button
                size="lg"
                className="flex-1"
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
