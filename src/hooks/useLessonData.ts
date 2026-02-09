/**
 * useLessonData – Hooks for fetching lesson questions, tracking partial lesson progress,
 * and managing save/clear operations for lesson continuation.
 * Supports auto-save so users can resume lessons from the exact point they left off.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface QuestionData {
  id: string;
  type: string;
  instruction: string;
  code?: string;
  answer?: string;
  options?: string[];
  blocks?: { id: string; code: string }[];
  correct_order?: string[];
  hint?: string;
  initial_code?: string;
  expected_output?: string;
  xp_reward: number;
  order_index: number;
}

export interface LessonData {
  id: string;
  title: string;
  unit_id: string;
  questions: QuestionData[];
}

export function useLessonData(lessonId: string | undefined) {
  return useQuery({
    queryKey: ["lesson-data", lessonId],
    queryFn: async (): Promise<LessonData | null> => {
      if (!lessonId) return null;

      const { data: lesson, error: lessonError } = await supabase
        .from("lessons")
        .select("id, title, unit_id")
        .eq("id", lessonId)
        .maybeSingle();

      if (lessonError) throw lessonError;
      if (!lesson) return null;

      const { data: questions, error: questionsError } = await supabase
        .from("questions")
        .select("*")
        .eq("lesson_id", lessonId)
        .order("order_index", { ascending: true });

      if (questionsError) throw questionsError;

      return {
        ...lesson,
        questions: (questions || []).map((q) => ({
          id: q.id,
          type: q.type,
          instruction: q.instruction,
          code: q.code || undefined,
          answer: q.answer || undefined,
          options: q.options as string[] | undefined,
          blocks: q.blocks as { id: string; code: string }[] | undefined,
          correct_order: q.correct_order as string[] | undefined,
          hint: q.hint || undefined,
          initial_code: q.initial_code || undefined,
          expected_output: q.expected_output || undefined,
          xp_reward: q.xp_reward,
          order_index: q.order_index,
        })),
      };
    },
    enabled: !!lessonId,
  });
}

export function useLessonLanguageInfo(lessonId: string | undefined) {
  return useQuery({
    queryKey: ["lesson-language-info", lessonId],
    queryFn: async () => {
      if (!lessonId) return null;

      const { data: lesson, error: lessonError } = await supabase
        .from("lessons")
        .select("unit_id")
        .eq("id", lessonId)
        .maybeSingle();

      if (lessonError) throw lessonError;
      if (!lesson) return null;

      const { data: unit, error: unitError } = await supabase
        .from("units")
        .select("language_id")
        .eq("id", lesson.unit_id)
        .maybeSingle();

      if (unitError) throw unitError;
      if (!unit) return null;

      const { data: language, error: langError } = await supabase
        .from("languages")
        .select("id, name, slug")
        .eq("id", unit.language_id)
        .maybeSingle();

      if (langError) throw langError;

      return language;
    },
    enabled: !!lessonId,
  });
}

export interface PartialLessonProgress {
  lesson_id: string;
  current_question_index: number;
  answered_questions: number[];
  xp_earned: number;
  correct_answers: number;
}

export function usePartialLessonProgress(lessonId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["partial-lesson-progress", user?.id, lessonId],
    queryFn: async (): Promise<PartialLessonProgress | null> => {
      if (!user || !lessonId) return null;

      const { data, error } = await supabase
        .from("partial_lesson_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("lesson_id", lessonId)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;
      if (!data) return null;

      return {
        lesson_id: data.lesson_id,
        current_question_index: data.current_question_index,
        answered_questions: (data.answered_questions as number[]) || [],
        xp_earned: data.xp_earned,
        correct_answers: data.correct_answers,
      };
    },
    enabled: !!user && !!lessonId,
  });
}

export function useSavePartialProgress() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (progress: PartialLessonProgress) => {
      if (!user) throw new Error("Not authenticated");

      const { data: existing } = await supabase
        .from("partial_lesson_progress")
        .select("id")
        .eq("user_id", user.id)
        .eq("lesson_id", progress.lesson_id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("partial_lesson_progress")
          .update({
            current_question_index: progress.current_question_index,
            answered_questions: progress.answered_questions,
            xp_earned: progress.xp_earned,
            correct_answers: progress.correct_answers,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("partial_lesson_progress")
          .insert({
            user_id: user.id,
            lesson_id: progress.lesson_id,
            current_question_index: progress.current_question_index,
            answered_questions: progress.answered_questions,
            xp_earned: progress.xp_earned,
            correct_answers: progress.correct_answers,
          });

        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["partial-lesson-progress", user?.id, variables.lesson_id],
      });
    },
  });
}

export function useClearPartialProgress() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lessonId: string) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("partial_lesson_progress")
        .delete()
        .eq("user_id", user.id)
        .eq("lesson_id", lessonId);

      if (error) throw error;
    },
    onSuccess: (_, lessonId) => {
      queryClient.invalidateQueries({
        queryKey: ["partial-lesson-progress", user?.id, lessonId],
      });
    },
  });
}
