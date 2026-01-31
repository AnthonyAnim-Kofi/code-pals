-- Add daily XP tracking for daily goal (resets each day)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS daily_xp integer NOT NULL DEFAULT 0;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_daily_reset_at date;

-- Backfill: set last_daily_reset_at to today for existing rows so first XP add will reset daily_xp
UPDATE public.profiles
  SET last_daily_reset_at = CURRENT_DATE
  WHERE last_daily_reset_at IS NULL;
