import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, RotateCcw, CheckCircle, Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLessonProgress } from "@/hooks/useUserProgress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguages } from "@/hooks/useLanguages";

interface DatabaseLesson {
  id: string;
  title: string;
  unit_id: string;
  order_index: number;
  units: {
    title: string;
    language_id: string;
  };
}

export default function Practice() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: lessonProgress, isLoading: progressLoading } = useLessonProgress();
  const { data: languages = [] } = useLanguages();
  
  // Fetch completed lessons from database with unit info
  const { data: dbLessons, isLoading: lessonsLoading } = useQuery({
    queryKey: ["all-lessons-for-practice"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lessons")
        .select(`
          id,
          title,
          unit_id,
          order_index,
          units!inner (
            title,
            language_id
          )
        `)
        .eq("is_active", true)
        .order("order_index", { ascending: true });
      
      if (error) throw error;
      return data as DatabaseLesson[];
    },
    enabled: !!user,
  });
  
  const handlePractice = (lessonId: string) => {
    // Navigate to lesson in practice mode (no heart deduction)
    navigate(`/lesson/${lessonId}?mode=practice`);
  };

  const completedLessons = lessonProgress?.filter(p => p.completed) || [];
  const completedIds = new Set(completedLessons.map(p => String(p.lesson_id)));
  
  // Filter to only show completed lessons (compare UUIDs only)
  const practiceableLessons = useMemo(
    () => (dbLessons?.filter((lesson) => completedIds.has(lesson.id)) || []),
    [dbLessons, completedIds]
  );

  // Group practiceable lessons by language
  const lessonsByLanguage = useMemo(() => {
    const map = new Map<
      string,
      { languageId: string; languageName: string; icon?: string; lessons: DatabaseLesson[] }
    >();

    practiceableLessons.forEach((lesson) => {
      const langId = lesson.units.language_id;
      const lang = languages.find((l) => l.id === langId);
      const key = lang?.id || langId || "other";
      if (!map.has(key)) {
        map.set(key, {
          languageId: key,
          languageName: lang?.name || "Other",
          icon: lang?.icon,
          lessons: [],
        });
      }
      map.get(key)!.lessons.push(lesson);
    });

    // Sort groups by language name for stable ordering
    return Array.from(map.values()).sort((a, b) =>
      a.languageName.localeCompare(b.languageName)
    );
  }, [practiceableLessons, languages]);

  const isLoading = progressLoading || lessonsLoading;

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
              {practiceableLessons.length} lessons ready to practice
            </p>
          </div>
        </div>
      </div>

      {/* Lesson Grid grouped by language */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Select a Lesson to Practice
        </h2>

        {lessonsByLanguage.map((group) => (
          <div key={group.languageId} className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">{group.icon}</span>
              <h3 className="text-base font-semibold text-foreground">
                {group.languageName}
              </h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {group.lessons.map((lesson) => {
                const progress = completedLessons.find(
                  (p) => String(p.lesson_id) === lesson.id
                );

                return (
                  <div
                    key={lesson.id}
                    className="p-4 rounded-2xl border transition-all bg-card border-border hover:border-primary/50 cursor-pointer"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                        {lesson.order_index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-foreground">
                          {lesson.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {lesson.units.title}
                        </p>
                        {progress && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Best: {progress.accuracy}% accuracy •{" "}
                            {progress.xp_earned} XP
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handlePractice(lesson.id)}
                        className="rounded-lg shrink-0"
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Practice
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {practiceableLessons.length === 0 && (
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
