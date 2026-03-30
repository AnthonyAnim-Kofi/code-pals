-- Optional per-row target snapshot; safe if 20260312184417 was never applied remotely.
ALTER TABLE public.user_quest_progress
ADD COLUMN IF NOT EXISTS target_value INTEGER;
