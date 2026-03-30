-- Auto-claim completed daily quest rewards at the end of each day (UTC).
-- Prevents gems from getting stuck if a user never clicks "Claim".

-- 1) Function called by cron
CREATE OR REPLACE FUNCTION public.process_daily_quest_auto_claim()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Pick all completed, not-yet-claimed *daily* quest progress rows for today.
  WITH to_claim AS (
    SELECT
      uqp.id AS progress_id,
      uqp.user_id,
      dq.gem_reward
    FROM public.user_quest_progress uqp
    JOIN public.daily_quests dq
      ON dq.id = uqp.quest_id
    WHERE dq.is_weekly = false
      AND uqp.quest_date = CURRENT_DATE
      AND uqp.completed = true
      AND uqp.claimed = false
  ),
  sums AS (
    SELECT user_id, COALESCE(SUM(gem_reward), 0)::integer AS gems_to_add
    FROM to_claim
    GROUP BY user_id
  )
  -- Credit gems to users
  UPDATE public.profiles p
  SET gems = COALESCE(p.gems, 0) + s.gems_to_add
  FROM sums s
  WHERE p.user_id = s.user_id;

  -- Mark quest progress as claimed
  UPDATE public.user_quest_progress uqp
  SET claimed = true,
      claimed_at = now()
  WHERE uqp.id IN (SELECT progress_id FROM to_claim);
END;
$$;

-- 2) Schedule cron job (requires pg_cron)
CREATE EXTENSION IF NOT EXISTS pg_cron;
GRANT USAGE ON SCHEMA cron TO postgres;

-- Run every day at 23:59 UTC.
SELECT cron.schedule(
  'daily-quest-auto-claim',
  '59 23 * * *',
  'SELECT public.process_daily_quest_auto_claim();'
);

