/**
 * useSoundSettings – Hooks for fetching and managing admin-configurable sound settings.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SoundSetting {
  id: string;
  sound_key: string;
  label: string;
  sound_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useSoundSettings() {
  return useQuery({
    queryKey: ["sound-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sound_settings")
        .select("*")
        .order("sound_key", { ascending: true });
      if (error) throw error;
      return data as SoundSetting[];
    },
  });
}

export function useUpdateSoundSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SoundSetting> & { id: string }) => {
      const { error } = await supabase
        .from("sound_settings")
        .update({ ...updates, updated_at: new Date().toISOString() } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sound-settings"] });
    },
  });
}

export function useCreateSoundSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (setting: { sound_key: string; label: string; sound_url: string | null }) => {
      const { error } = await supabase.from("sound_settings").insert(setting as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sound-settings"] });
    },
  });
}
