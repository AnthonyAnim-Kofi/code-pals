/**
 * useQuests – Hooks for managing daily and weekly quest progress.
 * Handles quest initialization, progress tracking, and reward claiming.
 *
 * Quest types include:
 * - complete_lessons: Track lesson completions
 * - earn_xp: Track XP earned
 * - correct_answers: Track correct answers in lessons
 * - maintain_streak: Track streak maintenance (synced from profile)
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Calendar date in the user's local timezone (YYYY-MM-DD).
 * Use for all `quest_date` reads/writes so daily/weekly rows match the UI and lesson updates.
 * (UTC dates from `toISOString()` often disagree with local "today" for many timezones.)
 */
export function localDateISO(d = new Date()) {
    const x = new Date(d);
    const y = x.getFullYear();
    const m = String(x.getMonth() + 1).padStart(2, "0");
    const day = String(x.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

/**
 * Calendar date in UTC (YYYY-MM-DD).
 * Kept for backwards-compatibility with quest rows previously written using UTC
 * (`toISOString().split('T')[0]`).
 */
export function utcDateISO(d = new Date()) {
    return new Date(d).toISOString().split("T")[0];
}

/** Normalize DATE / timestamp strings from PostgREST for comparisons */
export function questDateKey(v) {
    if (v == null || v === "") return "";
    const s = typeof v === "string" ? v : String(v);
    return s.length >= 10 ? s.slice(0, 10) : s;
}

/**
 * Display/completion target for a quest (daily XP goal uses `profiles.daily_goal_minutes`).
 * Not persisted on `user_quest_progress` so the app works when that optional column is missing.
 */
export function resolveQuestTargetValue(quest, profile) {
    const raw =
        quest.quest_type === "earn_xp" && !quest.is_weekly
            ? (profile?.daily_goal_minutes ?? quest.target_value)
            : quest.target_value;
    const n = Number(raw);
    const fallback = Math.max(1, Math.floor(Number(quest.target_value) || 1));
    if (!Number.isFinite(n) || n < 1) return fallback;
    return Math.floor(n);
}

/**
 * Returns the local calendar date of the most recent Sunday (week start).
 * Used as the quest_date for weekly quests.
 */
export function getWeekStartSundayISO(now = new Date()) {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay(); // 0 = Sunday
    d.setDate(d.getDate() - day);
    return localDateISO(d);
}

/**
 * Returns the week start Sunday date in UTC (YYYY-MM-DD) for backwards-compatibility.
 */
export function getWeekStartSundayUTCISO(now = new Date()) {
    const d = new Date(now);
    d.setUTCHours(0, 0, 0, 0);
    const day = d.getUTCDay(); // 0 = Sunday
    d.setUTCDate(d.getUTCDate() - day);
    return utcDateISO(d);
}
/** Fetches all available quests (both daily and weekly) */
export function useQuests() {
    return useQuery({
        queryKey: ["quests"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("daily_quests")
                .select("*")
                .order("is_weekly", { ascending: true });
            if (error)
                throw error;
            return data;
        },
    });
}
/** Fetches user's quest progress for today (daily) and this week (weekly) */
export function useQuestProgress() {
    const { user } = useAuth();
    return useQuery({
        queryKey: ["quest-progress", user?.id],
        queryFn: async () => {
            if (!user)
                return [];
            const localToday = localDateISO(new Date());
            const localWeekStart = getWeekStartSundayISO();
            const utcToday = utcDateISO(new Date());
            const utcWeekStart = getWeekStartSundayUTCISO();
            const questDates = Array.from(new Set([
                localToday,
                localWeekStart,
                utcToday,
                utcWeekStart,
            ]));
            const { data, error } = await supabase
                .from("user_quest_progress")
                .select(`*, quest:daily_quests(*)`)
                .eq("user_id", user.id)
                .in("quest_date", questDates);
            if (error)
                throw error;
            return data;
        },
        enabled: !!user,
    });
}
/**
 * Initializes quest progress entries for new quests.
 * Also syncs streak-based quests with the user's current streak count.
 */
export function useInitializeQuestProgress() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (quests) => {
            if (!user)
                throw new Error("Not authenticated");
            const today = localDateISO(new Date());
            const weekStart = getWeekStartSundayISO();
            // Check existing progress
            const { data: existing } = await supabase
                .from("user_quest_progress")
                .select("quest_id, id, current_value, quest_date")
                .eq("user_id", user.id)
                .in("quest_date", [today, weekStart]);
            const existingByQuestAndDate = new Set(
                existing?.map((p) => `${p.quest_id}:${questDateKey(p.quest_date)}`) || [],
            );
            // Fetch user profile data to sync streak-based quests and determine dynamic XP target.
            const { data: profile } = await supabase
                .from("profiles")
                .select("streak_count, daily_goal_minutes")
                .eq("user_id", user.id)
                .maybeSingle();
            // Create progress entries for quests that don't have one yet
            const newEntries = quests
                .filter((q) => {
                    const d = q.is_weekly ? weekStart : today;
                    return !existingByQuestAndDate.has(`${q.id}:${d}`);
                })
                .map((quest) => ({
                    user_id: user.id,
                    quest_id: quest.id,
                    current_value: 0,
                    completed: false,
                    claimed: false,
                    quest_date: quest.is_weekly ? weekStart : today,
                }));
            if (newEntries.length > 0) {
                const { error } = await supabase
                    .from("user_quest_progress")
                    .upsert(newEntries, {
                        onConflict: "user_id,quest_id,quest_date",
                        ignoreDuplicates: true,
                    });
                if (error)
                    throw error;
            }
            if (profile) {
                const streakQuests = quests.filter(
                    (q) => q.quest_type === "maintain_streak" || q.quest_type === "streak",
                );
                for (const quest of streakQuests) {
                    const questDate = quest.is_weekly ? weekStart : today;
                    const existingProgress = existing?.find(
                        (p) => p.quest_id === quest.id && questDateKey(p.quest_date) === questDate,
                    );
                    if (existingProgress) {
                        // Update streak quest progress to match actual streak
                        const newValue = Math.min(profile.streak_count, quest.target_value);
                        if (newValue !== existingProgress.current_value) {
                            await supabase
                                .from("user_quest_progress")
                                .update({
                                current_value: newValue,
                                completed: newValue >= quest.target_value,
                                completed_at: newValue >= quest.target_value ? new Date().toISOString() : null,
                            })
                                .eq("id", existingProgress.id);
                        }
                    }
                }
            }
            return true;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["quest-progress"] });
        },
    });
}
/**
 * Updates quest progress when a user performs an action (e.g., completes a lesson, earns XP).
 * Creates progress rows if they don't exist yet.
 */
export function useUpdateQuestProgress() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ questType, incrementBy, }) => {
            if (!user)
                throw new Error("Not authenticated");
            const today = localDateISO(new Date());
            const weekStart = getWeekStartSundayISO();
            // Find all quests of this type (both daily and weekly)
            const { data: quests } = await supabase
                .from("daily_quests")
                .select("id, target_value, is_weekly, quest_type")
                .eq("quest_type", questType);
            if (!quests || quests.length === 0)
                return;
            const { data: profile } = await supabase
                .from("profiles")
                .select("daily_goal_minutes")
                .eq("user_id", user.id)
                .maybeSingle();
            for (const quest of quests) {
                const questDate = quest.is_weekly ? weekStart : today;
                const { data: progress } = await supabase
                    .from("user_quest_progress")
                    .select("*")
                    .eq("user_id", user.id)
                    .eq("quest_id", quest.id)
                    .eq("quest_date", questDate)
                    .maybeSingle();
                // Calculate dynamic ceiling
                const targetValue = resolveQuestTargetValue(quest, profile);
                const currentValue = progress?.current_value ?? 0;
                const newValue = Math.min(currentValue + incrementBy, targetValue);
                const isCompleted = newValue >= targetValue;
                if (progress && !progress.claimed) {
                    await supabase
                        .from("user_quest_progress")
                        .update({
                        current_value: newValue,
                        completed: isCompleted,
                        completed_at: isCompleted && !progress.completed ? new Date().toISOString() : progress.completed_at,
                    })
                        .eq("id", progress.id);
                }
                else if (!progress) {
                    await supabase.from("user_quest_progress").insert({
                        user_id: user.id,
                        quest_id: quest.id,
                        quest_date: questDate,
                        current_value: newValue,
                        completed: isCompleted,
                        completed_at: isCompleted ? new Date().toISOString() : null,
                        claimed: false,
                    });
                }
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["quest-progress"] });
        },
    });
}
/** Claims a quest reward, adding gems to the user's profile */
export function useClaimQuestReward() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ progressId, gemReward }) => {
            if (!user)
                throw new Error("Not authenticated");
            // Mark quest as claimed
            const { error: updateError } = await supabase
                .from("user_quest_progress")
                .update({ claimed: true, claimed_at: new Date().toISOString() })
                .eq("id", progressId)
                .eq("user_id", user.id);
            if (updateError)
                throw updateError;
            // Add gems to user's profile
            const { data: profile } = await supabase
                .from("profiles")
                .select("gems")
                .eq("user_id", user.id)
                .single();
            const { error: gemsError } = await supabase
                .from("profiles")
                .update({ gems: (profile?.gems || 0) + gemReward })
                .eq("user_id", user.id);
            if (gemsError)
                throw gemsError;
            return { gemReward };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["quest-progress"] });
            queryClient.invalidateQueries({ queryKey: ["profile"] });
        },
    });
}
