import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, RotateCcw, CheckCircle, Loader2, Lock, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLessonProgress } from "@/hooks/useUserProgress";

const lessonData = [
  { id: 1, title: "Hello, Python!", description: "Learn to write your first Python code" },
  { id: 2, title: "Variables & Data", description: "Store and manipulate data" },
  { id: 3, title: "Conditionals", description: "Make decisions with if/else" },
  { id: 4, title: "Loops", description: "Repeat actions with for and while" },
  { id: 5, title: "Functions", description: "Create reusable code blocks" },
  { id: 6, title: "Lists & Arrays", description: "Work with collections of data" },
];

export default function Practice() {
  const navigate = useNavigate();
  const { data: lessonProgress, isLoading } = useLessonProgress();
  
  const completedLessons = lessonProgress?.filter(p => p.completed) || [];
  const completedIds = new Set(completedLessons.map(p => p.lesson_id));

  const handlePractice = (lessonId: number) => {
    // Navigate to lesson in practice mode (no heart deduction)
    navigate(`/lesson/${lessonId}?mode=practice`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-foreground mb-2 flex items-center gap-2">
          <RotateCcw className="w-7 h-7 text-primary" />
          Practice Mode
        </h1>
        <p className="text-muted-foreground">
          Review completed lessons without affecting your hearts or XP
        </p>
      </div>

      {/* Info Banner */}
      <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20">
        <p className="text-sm text-foreground">
          <span className="font-bold">💡 Practice Mode:</span> Perfect for reviewing concepts! 
          Your hearts won't decrease and XP won't be affected.
        </p>
      </div>

      {/* Completed Lessons Count */}
      <div className="flex items-center justify-between p-4 bg-card rounded-2xl border border-border">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="font-bold text-foreground">Lessons Available</p>
            <p className="text-sm text-muted-foreground">
              {completedLessons.length} of {lessonData.length} completed
            </p>
          </div>
        </div>
      </div>

      {/* Lesson Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Select a Lesson to Practice
        </h2>
        
        <div className="grid gap-4 sm:grid-cols-2">
          {lessonData.map((lesson) => {
            const isCompleted = completedIds.has(lesson.id);
            const progress = completedLessons.find(p => p.lesson_id === lesson.id);
            
            return (
              <div
                key={lesson.id}
                className={cn(
                  "p-4 rounded-2xl border transition-all",
                  isCompleted
                    ? "bg-card border-border hover:border-primary/50 cursor-pointer"
                    : "bg-muted/50 border-border opacity-60"
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold",
                    isCompleted
                      ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}>
                    {isCompleted ? lesson.id : <Lock className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "font-bold",
                      isCompleted ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {lesson.title}
                    </p>
                    <p className="text-sm text-muted-foreground">{lesson.description}</p>
                    {progress && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Best: {progress.accuracy}% accuracy • {progress.xp_earned} XP
                      </p>
                    )}
                  </div>
                  {isCompleted && (
                    <Button
                      size="sm"
                      onClick={() => handlePractice(lesson.id)}
                      className="rounded-lg shrink-0"
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Practice
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Empty State */}
      {completedLessons.length === 0 && (
        <div className="p-8 bg-card rounded-2xl border border-border text-center">
          <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-2">No lessons completed yet</h3>
          <p className="text-muted-foreground mb-4">
            Complete lessons in Learn mode first, then come back here to practice!
          </p>
          <Button onClick={() => navigate("/learn")}>
            Start Learning
          </Button>
        </div>
      )}
    </div>
  );
}
