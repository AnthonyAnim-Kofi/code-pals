-- Add user control for automatic streak-freeze usage and one-time notice tracking.
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS auto_use_streak_freeze boolean NOT NULL DEFAULT true;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS streak_freeze_notice_seen_at timestamptz;

-- Auto-apply streak freezes daily for users who missed exactly one day.
CREATE OR REPLACE FUNCTION public.auto_apply_streak_freezes_daily()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.profiles
  SET
    streak_freeze_count = streak_freeze_count - 1,
    last_practice_date = last_practice_date + INTERVAL '1 day',
    last_streak_freeze_used = now(),
    streak_freeze_notice_seen_at = NULL,
    updated_at = now()
  WHERE streak_count > 0
    AND auto_use_streak_freeze = true
    AND streak_freeze_count > 0
    AND last_practice_date = CURRENT_DATE - INTERVAL '2 days';
END;
$function$;

-- Schedule daily auto-freeze application.
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'daily-auto-streak-freeze',
  '15 0 * * *',
  $$
  SELECT public.auto_apply_streak_freezes_daily();
  $$
)
WHERE NOT EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'daily-auto-streak-freeze'
);
