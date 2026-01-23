import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Type definitions
export interface Language {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Unit {
  id: string;
  language_id: string;
  title: string;
  description: string | null;
  color: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  id: string;
  unit_id: string;
  title: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  lesson_id: string;
  type: "fill-blank" | "multiple-choice" | "drag-order" | "code-runner";
  instruction: string;
  code?: string | null;
  answer?: string | null;
  options?: unknown;
  blocks?: unknown;
  correct_order?: unknown;
  initial_code?: string | null;
  expected_output?: string | null;
  hint?: string | null;
  order_index: number;
  xp_reward: number;
}

export interface UnitNote {
  id: string;
  unit_id: string;
  title: string;
  content: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  id: string;
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  xp: number;
  hearts: number;
  gems: number;
  streak_count: number;
  league: string;
  created_at: string;
}

// Check if user is admin
export function useIsAdmin() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (error) return false;
      return !!data;
    },
    enabled: !!user,
  });
}

// Admin - Get all users
export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as AdminUser[];
    },
  });
}

// Admin - Get all languages
export function useLanguages() {
  return useQuery({
    queryKey: ["languages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("languages")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as Language[];
    },
  });
}

// Admin - Create language
export function useCreateLanguage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (language: Omit<Language, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("languages")
        .insert(language)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["languages"] });
    },
  });
}

// Admin - Get units by language
export function useUnits(languageId?: string) {
  return useQuery({
    queryKey: ["units", languageId],
    queryFn: async () => {
      let query = supabase.from("units").select("*").order("order_index", { ascending: true });
      
      if (languageId) {
        query = query.eq("language_id", languageId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Unit[];
    },
  });
}

// Admin - Create unit
export function useCreateUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (unit: Omit<Unit, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("units")
        .insert(unit)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
    },
  });
}

// Admin - Get lessons by unit
export function useLessons(unitId?: string) {
  return useQuery({
    queryKey: ["lessons", unitId],
    queryFn: async () => {
      let query = supabase.from("lessons").select("*").order("order_index", { ascending: true });
      
      if (unitId) {
        query = query.eq("unit_id", unitId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Lesson[];
    },
    enabled: !!unitId,
  });
}

// Admin - Create lesson
export function useCreateLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lesson: Omit<Lesson, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("lessons")
        .insert(lesson)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
    },
  });
}

// Admin - Get questions by lesson
export function useQuestions(lessonId?: string) {
  return useQuery({
    queryKey: ["questions", lessonId],
    queryFn: async () => {
      if (!lessonId) return [];
      
      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .eq("lesson_id", lessonId)
        .order("order_index", { ascending: true });

      if (error) throw error;
      return data as Question[];
    },
    enabled: !!lessonId,
  });
}

// Admin - Create question
export function useCreateQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (question: Omit<Question, "id">) => {
      const insertData = {
        lesson_id: question.lesson_id,
        type: question.type,
        instruction: question.instruction,
        code: question.code,
        answer: question.answer,
        options: question.options as unknown as undefined,
        blocks: question.blocks as unknown as undefined,
        correct_order: question.correct_order as unknown as undefined,
        initial_code: question.initial_code,
        expected_output: question.expected_output,
        hint: question.hint,
        order_index: question.order_index,
        xp_reward: question.xp_reward,
      };
      const { data, error } = await supabase
        .from("questions")
        .insert(insertData as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["questions", variables.lesson_id] });
    },
  });
}

// Admin - Delete question
export function useDeleteQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ questionId, lessonId }: { questionId: string; lessonId: string }) => {
      const { error } = await supabase
        .from("questions")
        .delete()
        .eq("id", questionId);

      if (error) throw error;
      return lessonId;
    },
    onSuccess: (lessonId) => {
      queryClient.invalidateQueries({ queryKey: ["questions", lessonId] });
    },
  });
}

// Admin - Get unit notes
export function useUnitNotes(unitId?: string) {
  return useQuery({
    queryKey: ["unit-notes", unitId],
    queryFn: async () => {
      if (!unitId) return [];
      
      const { data, error } = await supabase
        .from("unit_notes")
        .select("*")
        .eq("unit_id", unitId)
        .order("order_index", { ascending: true });

      if (error) throw error;
      return data as UnitNote[];
    },
    enabled: !!unitId,
  });
}

// Admin - Create unit note
export function useCreateUnitNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (note: Omit<UnitNote, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("unit_notes")
        .insert(note)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["unit-notes", variables.unit_id] });
    },
  });
}

// Admin - Update unit note
export function useUpdateUnitNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, unitId, ...updates }: Partial<UnitNote> & { id: string; unitId: string }) => {
      const { data, error } = await supabase
        .from("unit_notes")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return { data, unitId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["unit-notes", result.unitId] });
    },
  });
}

// Admin - Delete unit note
export function useDeleteUnitNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ noteId, unitId }: { noteId: string; unitId: string }) => {
      const { error } = await supabase
        .from("unit_notes")
        .delete()
        .eq("id", noteId);

      if (error) throw error;
      return unitId;
    },
    onSuccess: (unitId) => {
      queryClient.invalidateQueries({ queryKey: ["unit-notes", unitId] });
    },
  });
}

// Admin - Update user
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: Partial<AdminUser> }) => {
      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
}
