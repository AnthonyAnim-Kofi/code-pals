-- Create streak_history table used by update_user_streak() and useStreakHistory hook.
-- Required before migration 20260302013435 which inserts into this table.

CREATE TABLE IF NOT EXISTS public.streak_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  activity_date date NOT NULL,
  activity_type text NOT NULL CHECK (activity_type IN ('practice', 'freeze')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, activity_date)
);

CREATE INDEX IF NOT EXISTS idx_streak_history_user_date ON public.streak_history(user_id, activity_date DESC);

ALTER TABLE public.streak_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own streak_history" ON public.streak_history;
CREATE POLICY "Users can view own streak_history"
  ON public.streak_history FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own streak_history" ON public.streak_history;
CREATE POLICY "Users can insert own streak_history"
  ON public.streak_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service role / triggers insert via SECURITY DEFINER, so no UPDATE/DELETE policy needed for app users.
