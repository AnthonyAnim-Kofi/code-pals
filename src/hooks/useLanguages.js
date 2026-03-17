/**
 * useLanguages – Hooks for fetching active languages, units, lessons, and questions.
 * Used by the Learn page and other components to display available content.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
export function useLanguages() {
    return useQuery({
        queryKey: ["languages"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("languages")
                .select("*")
                .eq("is_active", true)
                .order("created_at", { ascending: true });
            if (error)
                throw error;
            return data;
        },
    });
}
export function useUnitsForLanguage(languageId) {
    return useQuery({
        queryKey: ["units", languageId],
        queryFn: async () => {
            if (!languageId)
                return [];
            const { data, error } = await supabase
                .from("units")
                .select("*")
                .eq("language_id", languageId)
                .eq("is_active", true)
                .order("order_index", { ascending: true });
            if (error)
                throw error;
            return data;
        },
        enabled: !!languageId,
    });
}
export function useLessonsForUnit(unitId) {
    return useQuery({
        queryKey: ["lessons", unitId],
        queryFn: async () => {
            if (!unitId)
                return [];
            const { data, error } = await supabase
                .from("lessons")
                .select("*")
                .eq("unit_id", unitId)
                .eq("is_active", true)
                .order("order_index", { ascending: true });
            if (error)
                throw error;
            return data;
        },
        enabled: !!unitId,
    });
}
export function useQuestionsForLesson(lessonId) {
    return useQuery({
        queryKey: ["questions", lessonId],
        queryFn: async () => {
            if (!lessonId)
                return [];
            const { data, error } = await supabase
                .from("questions")
                .select("*")
                .eq("lesson_id", lessonId)
                .order("order_index", { ascending: true });
            if (error)
                throw error;
            return data;
        },
        enabled: !!lessonId,
    });
}
