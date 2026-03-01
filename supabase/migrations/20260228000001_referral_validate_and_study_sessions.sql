-- Allow anonymous validation of referral codes (for signup form)
CREATE OR REPLACE FUNCTION public.validate_referral_code(code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF code IS NULL OR TRIM(code) = '' THEN
    RETURN false;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE referral_code = UPPER(TRIM(code))
  );
END;
$$;

-- Study sessions: per-user, per-language, per-day minutes for heatmap and bar chart
CREATE TABLE IF NOT EXISTS public.study_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  language_id uuid NOT NULL REFERENCES public.languages(id) ON DELETE CASCADE,
  study_date date NOT NULL,
  minutes integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, language_id, study_date)
);

CREATE INDEX IF NOT EXISTS idx_study_sessions_user_date ON public.study_sessions(user_id, study_date);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_language ON public.study_sessions(user_id, language_id);

ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own study_sessions"
ON public.study_sessions
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- When a lesson is completed, record study time (lesson -> unit -> language)
CREATE OR REPLACE FUNCTION public.record_study_session_on_lesson_complete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_language_id uuid;
  v_study_date date;
  v_minutes integer;
BEGIN
  IF NEW.completed IS NOT TRUE OR NEW.completed_at IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT u.language_id INTO v_language_id
  FROM public.lessons l
  JOIN public.units u ON u.id = l.unit_id
  WHERE l.id = NEW.lesson_id;

  IF v_language_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_study_date := (NEW.completed_at AT TIME ZONE 'UTC')::date;
  v_minutes := GREATEST(1, LEAST(120,
    ROUND(EXTRACT(EPOCH FROM (NEW.completed_at::timestamptz - NEW.created_at::timestamptz)) / 60.0)::integer
  ));

  INSERT INTO public.study_sessions (user_id, language_id, study_date, minutes)
  VALUES (NEW.user_id, v_language_id, v_study_date, v_minutes)
  ON CONFLICT (user_id, language_id, study_date)
  DO UPDATE SET minutes = public.study_sessions.minutes + EXCLUDED.minutes;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_record_study_session ON public.lesson_progress;
CREATE TRIGGER trigger_record_study_session
  AFTER INSERT OR UPDATE OF completed, completed_at ON public.lesson_progress
  FOR EACH ROW
  WHEN (NEW.completed IS TRUE AND NEW.completed_at IS NOT NULL)
  EXECUTE FUNCTION public.record_study_session_on_lesson_complete();

-- Securely apply referral rewards (referrer + new user) in a single transaction
CREATE OR REPLACE FUNCTION public.apply_referral_reward(
  p_referral_code text,
  p_new_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id uuid;
  v_gems integer := 50;
  v_existing_referral_id uuid;
BEGIN
  IF p_referral_code IS NULL OR TRIM(p_referral_code) = '' THEN
    RETURN false;
  END IF;

  -- Look up referrer by referral code
  SELECT user_id INTO v_referrer_id
  FROM public.profiles
  WHERE referral_code = UPPER(TRIM(p_referral_code));

  -- Invalid code or self-referral
  IF v_referrer_id IS NULL OR v_referrer_id = p_new_user_id THEN
    RETURN false;
  END IF;

  -- Avoid double credit if this pair already has a referral record
  SELECT id INTO v_existing_referral_id
  FROM public.referrals
  WHERE referrer_id = v_referrer_id
    AND referred_user_id = p_new_user_id;

  IF v_existing_referral_id IS NOT NULL THEN
    RETURN false;
  END IF;

  -- Record referral
  INSERT INTO public.referrals (referrer_id, referred_user_id, referral_code, gems_awarded)
  VALUES (v_referrer_id, p_new_user_id, UPPER(TRIM(p_referral_code)), v_gems);

  -- Credit referrer
  UPDATE public.profiles
  SET gems = COALESCE(gems, 0) + v_gems
  WHERE user_id = v_referrer_id;

  -- Credit new user and mark who referred them
  UPDATE public.profiles
  SET gems = COALESCE(gems, 0) + v_gems,
      referred_by = v_referrer_id
  WHERE user_id = p_new_user_id;

  RETURN true;
END;
$$;

