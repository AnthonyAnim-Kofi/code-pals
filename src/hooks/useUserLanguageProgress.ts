import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface LanguageProgress {
  language_id: string;
  completed_lessons: number;
  total_lessons: number;
  total_xp: number;
}

export function useUserLanguageProgress() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["language-progress", user?.id],
    queryFn: async (): Promise<LanguageProgress[]> => {
      if (!user) return [];

      // Get all languages with their units and lessons
      const { data: languages, error: langError } = await supabase
        .from("languages")
        .select(`
          id,
          units (
            id,
            lessons (
              id
            )
          )
        `)
        .eq("is_active", true);

      if (langError) throw langError;

      // Get user's completed lessons
      const { data: lessonProgress, error: progressError } = await supabase
        .from("lesson_progress")
        .select("lesson_id, xp_earned, completed")
        .eq("user_id", user.id)
        .eq("completed", true);

      if (progressError) throw progressError;

      const completedLessonIds = new Set(
        lessonProgress?.map((p) => p.lesson_id?.toString()) || []
      );

      // Calculate progress for each language
      const progressByLanguage: LanguageProgress[] = (languages || []).map((lang) => {
        const allLessons: string[] = [];
        let completedCount = 0;
        let totalXp = 0;

        (lang.units || []).forEach((unit: any) => {
          (unit.lessons || []).forEach((lesson: any) => {
            allLessons.push(lesson.id);
            if (completedLessonIds.has(lesson.id)) {
              completedCount++;
              const progress = lessonProgress?.find(
                (p) => p.lesson_id?.toString() === lesson.id
              );
              totalXp += progress?.xp_earned || 0;
            }
          });
        });

        return {
          language_id: lang.id,
          completed_lessons: completedCount,
          total_lessons: allLessons.length,
          total_xp: totalXp,
        };
      });

      return progressByLanguage;
    },
    enabled: !!user,
  });
}

export function useActiveLanguage() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["active-language", user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Get profile's active language
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("active_language_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      const activeLanguageId = (profile as any)?.active_language_id;

      if (activeLanguageId) {
        const { data: language, error: langError } = await supabase
          .from("languages")
          .select("*")
          .eq("id", activeLanguageId)
          .maybeSingle();

        if (langError) throw langError;
        return language;
      }

      // Default to first active language if none set
      const { data: defaultLang, error: defaultError } = await supabase
        .from("languages")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (defaultError) throw defaultError;
      return defaultLang;
    },
    enabled: !!user,
  });
}
