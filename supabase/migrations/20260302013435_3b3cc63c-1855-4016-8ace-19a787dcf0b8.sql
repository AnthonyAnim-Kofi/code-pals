
-- Drop the trigger first, then the function
DROP TRIGGER IF EXISTS sync_league_on_xp_change ON public.profiles;
DROP FUNCTION IF EXISTS public.sync_user_league();

-- Update the update_user_streak function to also record streak history
CREATE OR REPLACE FUNCTION public.update_user_streak()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  last_practice DATE;
  current_streak INTEGER;
  freeze_count INTEGER;
BEGIN
  SELECT last_practice_date, streak_count, streak_freeze_count INTO last_practice, current_streak, freeze_count
  FROM public.profiles
  WHERE user_id = NEW.user_id;

  IF last_practice = CURRENT_DATE THEN
    RETURN NEW;
  END IF;

  -- Record today's practice in streak_history
  INSERT INTO public.streak_history (user_id, activity_date, activity_type)
  VALUES (NEW.user_id, CURRENT_DATE, 'practice')
  ON CONFLICT (user_id, activity_date) DO NOTHING;

  IF last_practice = CURRENT_DATE - INTERVAL '1 day' THEN
    UPDATE public.profiles
    SET streak_count = streak_count + 1, 
        last_practice_date = CURRENT_DATE, 
        updated_at = now()
    WHERE user_id = NEW.user_id;
  ELSIF last_practice = CURRENT_DATE - INTERVAL '2 days' AND freeze_count > 0 THEN
    INSERT INTO public.streak_history (user_id, activity_date, activity_type)
    VALUES (NEW.user_id, CURRENT_DATE - INTERVAL '1 day', 'freeze')
    ON CONFLICT (user_id, activity_date) DO NOTHING;
    
    UPDATE public.profiles
    SET streak_freeze_count = streak_freeze_count - 1,
        streak_count = streak_count + 1,
        last_practice_date = CURRENT_DATE,
        last_streak_freeze_used = now(),
        updated_at = now()
    WHERE user_id = NEW.user_id;
  ELSE
    UPDATE public.profiles
    SET streak_count = 1, 
        last_practice_date = CURRENT_DATE, 
        updated_at = now()
    WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$function$;
