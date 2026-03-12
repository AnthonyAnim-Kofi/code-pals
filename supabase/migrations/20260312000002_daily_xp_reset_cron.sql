-- Daily XP Reset Cron Job
-- Resets the daily_xp column for all users to 0 at exactly midnight UTC every day.

-- 1. Create the function that will be called by the cron job
CREATE OR REPLACE FUNCTION public.process_daily_xp_reset()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Reset daily_xp to 0. 
  -- We include the WHERE clause to satisfy pg_safeupdate requirements.
  UPDATE profiles SET daily_xp = 0 WHERE daily_xp > 0;
END;
$function$;

-- 2. Schedule the cron job using pg_cron
-- This runs at 00:00 (midnight) UTC every day: '0 0 * * *'
SELECT cron.schedule(
  'daily_xp_reset',
  '0 0 * * *',
  'SELECT public.process_daily_xp_reset();'
);
