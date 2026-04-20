/**
 * Lesson – Interactive lesson engine for question-by-question learning.
 * Supports fill-blank, multiple-choice, drag-order, and code-runner question types.
 * Auto-saves progress via debounced writes so users can resume where they left off.
 * Uses useRef for progress tracking to prevent infinite re-render loops.
 */
import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { X, Heart, Loader2, RotateCcw, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { LessonComplete } from "@/components/LessonComplete";
import { DragOrderChallenge } from "@/components/challenges/DragOrderChallenge";
import { CodeRunnerChallenge } from "@/components/challenges/CodeRunnerChallenge";
import { MascotReaction } from "@/components/MascotReaction";
import { LanguageIcon } from "@/components/LanguageIcon";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { useUserProfile, useAddXP, useDeductHeart, useSaveLessonProgress, useLessonProgress } from "@/hooks/useUserProgress";
import { useUpdateQuestProgress } from "@/hooks/useQuests";
import { useUpdateChallengeScore } from "@/hooks/useSocial";
import { useLessonData, useLessonLanguageInfo, usePartialLessonProgress, useSavePartialProgress, useClearPartialProgress } from "@/hooks/useLessonData";
import { cn } from "@/lib/utils";

/** Code-runner uses full-screen IDE layout only when the runner can actually mount. */
function codeRunnerChallengeCanRender(q) {
    return (
        q?.type === "code-runner" &&
        typeof q.expected_output === "string" &&
        q.expected_output.trim() !== ""
    );
}

/** Detect questions missing required fields so we show a message instead of a blank shell. */
function lessonQuestionHasInteractiveUI(q) {
    if (!q?.type) return false;
    switch (q.type) {
        case "fill-blank":
            return !!(q.code != null && String(q.code).length > 0 && Array.isArray(q.options) && q.options.length > 0);
        case "multiple-choice":
            return Array.isArray(q.options) && q.options.length > 0;
        case "drag-order":
            return (
                Array.isArray(q.blocks) &&
                q.blocks.length > 0 &&
                Array.isArray(q.correct_order) &&
                q.correct_order.length > 0
            );
        case "code-runner":
            return codeRunnerChallengeCanRender(q);
        default:
            return false;
    }
}

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
    const { playCorrect, playIncorrect, playComplete, playBackgroundMusic } = useSoundEffects();
    // Check if we're in practice mode
    const isPracticeMode = searchParams.get('mode') === 'practice';
    const isChallengeMode = searchParams.get('mode') === 'challenge';
    const challengeId = searchParams.get('challengeId');
    const { data: profile } = useUserProfile();
    const { data: lessonFromDb, isLoading: loadingLesson } = useLessonData(lessonId);
    const { data: languageInfo } = useLessonLanguageInfo(lessonId);
    const { data: savedProgress } = usePartialLessonProgress(lessonId);
    const { data: lessonProgressList } = useLessonProgress();
    const savePartialProgress = useSavePartialProgress();
    const clearPartialProgress = useClearPartialProgress();
    const addXP = useAddXP();
    const deductHeartMutation = useDeductHeart();
    // In practice or challenge mode never deduct hearts (no-op wrapper)
    const deductHeart = (isPracticeMode || isChallengeMode) ? { mutate: () => { }, mutateAsync: async () => { } } : deductHeartMutation;
    const saveLessonProgress = useSaveLessonProgress();
    const updateQuestProgress = useUpdateQuestProgress();
    const updateChallengeScore = useUpdateChallengeScore();
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
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [isChecked, setIsChecked] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [xpEarned, setXpEarned] = useState(0);
    const [correctAnswers, setCorrectAnswers] = useState(0);
    const [isComplete, setIsComplete] = useState(false);
    const [dragOrderChecked, setDragOrderChecked] = useState(false);
    const [codeRunnerChecked, setCodeRunnerChecked] = useState(false);
    const [mascotReaction, setMascotReaction] = useState("idle");
    const [answeredQuestions, setAnsweredQuestions] = useState(new Set());
    const [initialized, setInitialized] = useState(false);
    // Restore saved progress on mount
    useEffect(() => {
        if (savedProgress && !initialized) {
            setCurrentQuestion(savedProgress.current_question_index);
            setXpEarned(savedProgress.xp_earned);
            setCorrectAnswers(savedProgress.correct_answers);
            setAnsweredQuestions(new Set(savedProgress.answered_questions));
            setInitialized(true);
        }
        else if (!savedProgress && !initialized) {
            setInitialized(true);
        }
    }, [savedProgress, initialized]);
    // After questions change in the DB (e.g. admin removed rows), saved index / answered set can be out of range — clamp to avoid undefined `question` and bad saves.
    useEffect(() => {
        const n = lessonData.questions.length;
        if (n === 0) return;
        setCurrentQuestion((prev) => Math.min(Math.max(0, prev), n - 1));
        setAnsweredQuestions((prev) => {
            const kept = [...prev].filter((i) => Number.isFinite(i) && i >= 0 && i < n);
            return kept.length === prev.size ? prev : new Set(kept);
        });
    }, [lessonId, lessonData.questions.length]);
    // Use refs to track current values for the unload handler (avoids re-running effect on every state change)
    const progressRef = useRef({
        currentQuestion,
        answeredQuestions,
        xpEarned,
        correctAnswers,
        isComplete,
    });
    // Keep ref updated with latest values
    useEffect(() => {
        progressRef.current = {
            currentQuestion,
            answeredQuestions,
            xpEarned,
            correctAnswers,
            isComplete,
        };
    }, [currentQuestion, answeredQuestions, xpEarned, correctAnswers, isComplete]);
    // Save partial progress on beforeunload and when navigating away
    useEffect(() => {
        const handleBeforeUnload = () => {
            const { currentQuestion, answeredQuestions, xpEarned, correctAnswers, isComplete } = progressRef.current;
            if (lessonId && !isComplete && currentQuestion > 0) {
                // Use sendBeacon with a minimal REST call for reliable unload saving
                const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/partial_lesson_progress`;
                const payload = JSON.stringify({
                    lesson_id: lessonId,
                    current_question_index: currentQuestion,
                    answered_questions: Array.from(answeredQuestions),
                    xp_earned: xpEarned,
                    correct_answers: correctAnswers,
                });
                // Note: sendBeacon can't include auth headers, so we rely on periodic saves below
            }
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [lessonId]);
    // Auto-save progress after answering a question (debounced)
    // IMPORTANT: We save with answeredQuestions so we know which questions are done
    // The user should resume from the first unanswered question
    useEffect(() => {
        if (lessonId && answeredQuestions.size > 0 && !isComplete) {
            const timer = setTimeout(() => {
                // Find the first unanswered question index for resume
                const firstUnansweredIndex = lessonData.questions.findIndex((_, idx) => !answeredQuestions.has(idx));
                // If all answered, point to the last question
                const resumeIndex =
                    firstUnansweredIndex === -1
                        ? Math.max(0, lessonData.questions.length - 1)
                        : firstUnansweredIndex;
                savePartialProgress.mutate({
                    lesson_id: lessonId,
                    current_question_index: resumeIndex,
                    answered_questions: Array.from(answeredQuestions),
                    xp_earned: xpEarned,
                    correct_answers: correctAnswers,
                });
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [lessonId, answeredQuestions.size, xpEarned, correctAnswers, isComplete, lessonData.questions]);
    const hearts = profile?.hearts ?? 5;
    const question = lessonData.questions[currentQuestion];
    const totalQuestions = lessonData.questions.length;
    const progress = totalQuestions > 0 ? ((currentQuestion) / totalQuestions) * 100 : 0;
    const isLastQuestion = totalQuestions > 0 && currentQuestion === totalQuestions - 1;
    const isFirstQuestion = currentQuestion === 0;
    // Save partial progress - save with NEXT question index after current is answered
    const saveProgress = useCallback(() => {
        if (lessonId) {
            // Find the first unanswered question for proper resume
            const firstUnansweredIndex = lessonData.questions.findIndex((_, idx) => !answeredQuestions.has(idx));
            const resumeIndex =
                firstUnansweredIndex === -1
                    ? Math.max(0, lessonData.questions.length - 1)
                    : firstUnansweredIndex;
            savePartialProgress.mutate({
                lesson_id: lessonId,
                current_question_index: resumeIndex,
                answered_questions: Array.from(answeredQuestions),
                xp_earned: xpEarned,
                correct_answers: correctAnswers,
            });
        }
    }, [lessonId, answeredQuestions, xpEarned, correctAnswers, savePartialProgress, lessonData.questions]);
    const markCurrentQuestionAnswered = useCallback(() => {
        setAnsweredQuestions((prev) => {
            if (prev.has(currentQuestion)) return prev;
            const next = new Set(prev);
            next.add(currentQuestion);
            return next;
        });
    }, [currentQuestion]);
    // Handle exit - save progress and navigate to current lesson's language
    const handleExit = () => {
        saveProgress();
        const langParam = languageInfo?.id ? `?language=${languageInfo.id}` : "";
        navigate(`/learn${langParam}`);
    };
    const handleCheck = async () => {
        if (selectedAnswer === null)
            return;
        // Persist attempts immediately so users cannot retry by exiting before Continue/Finish.
        markCurrentQuestionAnswered();
        let correct = false;
        if (question.type === "fill-blank") {
            correct = selectedAnswer === question.answer;
        }
        else if (question.type === "multiple-choice") {
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
            if (!isPracticeMode && !isChallengeMode) {
                updateQuestProgress.mutate({ questType: "correct_answers", incrementBy: 1 });
            }
        }
        else {
            // Don't deduct hearts in practice or challenge mode
            if (!isPracticeMode && !isChallengeMode) {
                deductHeart.mutate();
            }
            playIncorrect();
        }
    };
    const handleDragOrderAnswer = useCallback((isCorrect) => {
        markCurrentQuestionAnswered();
        setDragOrderChecked(true);
        setIsChecked(true);
        setIsCorrect(isCorrect);
        setMascotReaction(isCorrect ? "correct" : "incorrect");
        if (isCorrect) {
            const xpReward = question.xp_reward || 15;
            setXpEarned((prev) => prev + xpReward);
            setCorrectAnswers((prev) => prev + 1);
            playCorrect();
            if (!isPracticeMode && !isChallengeMode) {
                updateQuestProgress.mutate({ questType: "correct_answers", incrementBy: 1 });
            }
        }
        else {
            // Don't deduct hearts in practice or challenge mode
            if (!isPracticeMode && !isChallengeMode) {
                deductHeart.mutate();
            }
            playIncorrect();
        }
    }, [question, playCorrect, playIncorrect, deductHeart, updateQuestProgress, isPracticeMode, isChallengeMode, markCurrentQuestionAnswered]);
    const handleCodeRunnerAnswer = useCallback((isCorrect) => {
        markCurrentQuestionAnswered();
        setCodeRunnerChecked(true);
        setIsChecked(true);
        setIsCorrect(isCorrect);
        setMascotReaction(isCorrect ? "correct" : "incorrect");
        if (isCorrect) {
            const xpReward = question.xp_reward || 20;
            setXpEarned((prev) => prev + xpReward);
            setCorrectAnswers((prev) => prev + 1);
            playCorrect();
            if (!isPracticeMode && !isChallengeMode) {
                updateQuestProgress.mutate({ questType: "correct_answers", incrementBy: 1 });
            }
        }
        else {
            // Don't deduct hearts in practice or challenge mode
            if (!isPracticeMode && !isChallengeMode) {
                deductHeart.mutate();
            }
            playIncorrect();
        }
    }, [question, playCorrect, playIncorrect, deductHeart, updateQuestProgress, isPracticeMode, isChallengeMode, markCurrentQuestionAnswered]);
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
            
            // In practice mode, challenge mode, or if lesson already completed (retake), don't affect regular XP/hearts/quests
            if (!isPracticeMode && !isChallengeMode && !alreadyCompleted) {
                await saveLessonProgress.mutateAsync({
                    lessonId: dbLessonId,
                    xpEarned,
                    accuracy,
                });
                await addXP.mutateAsync(xpEarned);
                updateQuestProgress.mutate({ questType: "earn_xp", incrementBy: xpEarned });
                updateQuestProgress.mutate({ questType: "complete_lessons", incrementBy: 1 });
            }

            // If in challenge mode, update the challenge score
            if (isChallengeMode && challengeId) {
                // Fetch the challenge first to see if current user is challenger or challenged
                const { data: challengeData } = await supabase.from('challenges').select('challenger_id').eq('id', challengeId).single();
                const isChallenger = challengeData?.challenger_id === profile?.user_id;

                await updateChallengeScore.mutateAsync({
                    challengeId,
                    score: xpEarned,
                    isChallenger
                });
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
        return (<div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary"/>
      </div>);
    }
    // Handle empty lesson or stale index (e.g. questions removed server-side)
    if (lessonData.questions.length === 0) {
        return (<div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <p className="text-muted-foreground text-center">No questions in this lesson yet.</p>
        <Button variant="outline" className="mt-4" onClick={handleExit}>
          Back to Learn
        </Button>
      </div>);
    }
    if (!question) {
        return (<div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary"/>
      </div>);
    }
    if (isComplete) {
        return (<LessonComplete xpEarned={xpEarned} totalQuestions={lessonData.questions.length} correctAnswers={correctAnswers} onContinue={handleLessonComplete}/>);
    }
    const isCodeRunner = codeRunnerChallengeCanRender(question);
    return (<div className="min-h-screen bg-background flex flex-col">
      {/* Header — hidden on desktop for code-runner */}
      <header className={cn("sticky top-0 z-50 bg-background border-b border-border", isCodeRunner && "lg:hidden")}>
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 h-16 lg:h-20">
            <button onClick={handleExit} className="p-2 lg:p-2.5 rounded-lg hover:bg-muted transition-colors">
              <X className="w-6 h-6 lg:w-7 lg:h-7 text-muted-foreground"/>
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 lg:gap-3 min-w-0">
                <LanguageIcon
                  slug={languageInfo?.slug || "lesson"}
                  icon={languageInfo?.icon}
                  size={28}
                  className="shrink-0"
                />
                <p className="text-base lg:text-xl font-extrabold text-foreground truncate">
                  {lessonData.title}
                </p>
              </div>
              <p className="text-sm lg:text-base font-semibold text-muted-foreground">
                Question {Math.min(currentQuestion + 1, totalQuestions)} of {totalQuestions}
              </p>
            </div>
            
            {/* Practice Mode Indicator */}
            {isPracticeMode && (<div className="flex items-center gap-1 px-2 py-1 bg-secondary/20 rounded-lg text-secondary text-xs font-bold">
                <RotateCcw className="w-3 h-3"/>
                Practice
              </div>)}

            {/* Challenge Mode Indicator */}
            {isChallengeMode && (<div className="flex items-center gap-1 px-2 py-1 bg-primary/20 rounded-lg text-primary text-xs font-bold">
                <Swords className="w-3 h-3"/>
                Challenge
              </div>)}

            <div className="flex items-center gap-1.5 text-destructive">
              <Heart className="w-5 h-5 lg:w-6 lg:h-6 fill-current"/>
              <span className="font-extrabold text-base lg:text-lg">{(isPracticeMode || isChallengeMode) ? "∞" : hearts}</span>
            </div>

            <div className="flex items-center gap-1.5 text-primary">
              <span className="text-base lg:text-lg">💎</span>
              <span className="font-extrabold text-base lg:text-lg">{profile?.gems ?? 0}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Progress bar — hidden on desktop for code-runner */}
      <div className={cn("px-4 pt-3", isCodeRunner && "lg:hidden")}>
        <Progress value={progress} size="default" indicatorColor="gradient"/>
      </div>

      {/* Main Content */}
      <main className={cn("flex-1 container mx-auto px-4 py-6 max-w-2xl", isCodeRunner && "lg:max-w-none lg:px-0 lg:py-0 lg:flex lg:flex-col")}>
        {/* Mascot Reaction */}
        {mascotReaction !== "idle" && (<div className="mb-4 animate-fade-in">
            <MascotReaction reaction={mascotReaction}/>
          </div>)}

        {/* Question */}
        <div className={cn("mb-8", isCodeRunner && "lg:mb-0")}>
          <h2 className={cn("text-lg font-extrabold text-foreground mb-5", isCodeRunner && "lg:hidden")}>
            {question.instruction}
          </h2>

          {/* Drag Order Challenge */}
          {question.type === "drag-order" && question.blocks && question.correct_order && (<DragOrderChallenge blocks={question.blocks} correctOrder={question.correct_order} onAnswer={handleDragOrderAnswer} disabled={dragOrderChecked}/>)}

          {/* Code Runner Challenge — expected_output required; initial_code may be empty */}
          {codeRunnerChallengeCanRender(question) && (<CodeRunnerChallenge initialCode={question.initial_code ?? ""} expectedOutput={question.expected_output} hint={question.hint} instruction={question.instruction} language={languageInfo?.name?.toLowerCase() || "python"} languageSlug={languageInfo?.slug ?? null} onAnswer={handleCodeRunnerAnswer} disabled={codeRunnerChecked} lessonTitle={lessonData.title} lessonSubtitle={languageInfo?.name} questionIndex={currentQuestion} totalQuestions={totalQuestions} onExit={handleExit} onContinue={handleContinue} isLastQuestion={isLastQuestion} hearts={(isPracticeMode || isChallengeMode) ? "∞" : hearts} gems={profile?.gems ?? 0} isPracticeMode={isPracticeMode} isChallengeMode={isChallengeMode} progress={progress}/>)}

          {/* Misconfigured or unsupported question — avoids blank screen (esp. code-runner + lg:hidden chrome) */}
          {!lessonQuestionHasInteractiveUI(question) && (<div className="rounded-2xl border-2 border-amber-500/40 bg-amber-500/5 p-6 space-y-4">
              <p className="font-bold text-foreground">This question can&apos;t be shown</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {question.type === "code-runner"
                  ? "Add an expected output for this coding task in the lesson editor, or contact support if this keeps happening."
                  : "This question is missing required fields or uses an unsupported type. You can move on with the button below."}
              </p>
              {!isChecked && (<Button variant="secondary" size="lg" className="rounded-xl" onClick={() => {
                      setIsChecked(true);
                      setIsCorrect(false);
                      setMascotReaction("idle");
                  }}>
                  Got it
                </Button>)}
            </div>)}

          {/* Code Block for Fill-in-the-blank */}
          {question.type === "fill-blank" && question.code && (<div className="bg-sidebar rounded-2xl p-6 mb-6 font-mono text-sm">
              <pre className="text-sidebar-foreground whitespace-pre-wrap">
                {question.code?.split("___").map((part, i, arr) => (<span key={i}>
                    {part}
                    {i < arr.length - 1 && (<span className="px-3 py-1 bg-sidebar-accent rounded-lg text-primary border-2 border-dashed border-primary/50">
                        {selectedAnswer || "____"}
                      </span>)}
                  </span>))}
              </pre>
            </div>)}

          {/* Options for fill-blank and multiple-choice */}
          {(question.type === "fill-blank" || question.type === "multiple-choice") && question.options && (<div className="grid gap-3 sm:grid-cols-2">
              {question.options.map((option, index) => {
                const isSelected = question.type === "fill-blank"
                    ? selectedAnswer === option
                    : selectedAnswer === index;
                const correctIdx = parseInt(question.answer || "0");
                return (<button key={index} onClick={() => {
                        if (isChecked)
                            return;
                        setSelectedAnswer(question.type === "fill-blank" ? option : index);
                    }} disabled={isChecked} className={cn("p-4 rounded-xl border-2 text-left font-semibold transition-all", isSelected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card hover:border-primary/50", isChecked && isSelected && isCorrect && "border-primary bg-primary/20", isChecked && isSelected && !isCorrect && "border-destructive bg-destructive/20 text-destructive", isChecked && !isSelected && question.type === "fill-blank" && option === question.answer && "border-primary bg-primary/10", isChecked && !isSelected && question.type === "multiple-choice" && index === correctIdx && "border-primary bg-primary/10")}>
                    {option}
                  </button>);
            })}
            </div>)}
        </div>
      </main>

      {/* Footer — hidden on desktop for code-runner */}
      <footer className={cn("sticky bottom-0 border-t transition-colors", isChecked && isCorrect && "bg-primary/10 border-primary/30", isChecked && !isCorrect && "bg-destructive/10 border-destructive/30", !isChecked && "bg-background border-border", isCodeRunner && "lg:hidden")}>
        <div className="container mx-auto px-4 py-4 max-w-2xl">
          <div className="flex gap-3">
            {/* Back button - always visible except on first question */}
            {!isFirstQuestion && (<Button variant="ghost" size="lg" onClick={goToPreviousQuestion} className="px-4">
                ←
              </Button>)}

            {!isChecked && question.type !== "drag-order" && question.type !== "code-runner" ? (<Button size="lg" className="flex-1" disabled={selectedAnswer === null} onClick={handleCheck}>
                Check
              </Button>) : isChecked ? (<Button size="lg" className="flex-1" variant={isCorrect ? "default" : "destructive"} onClick={handleContinue}>
                {isLastQuestion ? "Finish" : "Continue"}
              </Button>) : null}
          </div>
        </div>
      </footer>
    </div>);
}
