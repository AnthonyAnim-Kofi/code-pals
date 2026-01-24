-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage to postgres role (required for pg_cron)
GRANT USAGE ON SCHEMA cron TO postgres;

-- Schedule weekly league reset to run every Sunday at midnight (00:00 UTC)
-- This will call the process_weekly_leagues() function
SELECT cron.schedule(
  'weekly-league-reset',
  '0 0 * * 0', -- Every Sunday at 00:00 UTC (midnight)
  $$
  SELECT public.process_weekly_leagues();
  $$
);

-- Note: To manually trigger the reset, you can also call:
-- SELECT public.process_weekly_leagues();

-- To view scheduled jobs:
-- SELECT * FROM cron.job;

-- To unschedule the job:
-- SELECT cron.unschedule('weekly-league-reset');
