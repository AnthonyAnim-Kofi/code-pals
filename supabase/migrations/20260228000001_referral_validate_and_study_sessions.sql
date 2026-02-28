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
