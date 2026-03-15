-- Add target_value to allow dynamic daily quest goals (like user's selected XP target)
ALTER TABLE public.user_quest_progress 
ADD COLUMN target_value INTEGER;
