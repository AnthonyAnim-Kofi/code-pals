-- Streak freeze + weekly quest reset support

-- Profiles: language selection + streak freeze tracking
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS active_language_id uuid REFERENCES public.languages(id);

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_streak_freeze_used date;

-- Weekly quest reset helper
CREATE OR REPLACE FUNCTION public.get_week_start_sunday(_date date DEFAULT CURRENT_DATE)
RETURNS date
LANGUAGE sql
STABLE
AS $$
  SELECT (_date - EXTRACT(DOW FROM _date)::int);
$$;

CREATE OR REPLACE FUNCTION public.reset_weekly_quests()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  week_start date := public.get_week_start_sunday(CURRENT_DATE);
BEGIN
  -- Delete old weekly progress entries (keep only current week)
  DELETE FROM public.user_quest_progress uqp
  USING public.daily_quests q
  WHERE uqp.quest_id = q.id
    AND q.is_weekly = true
    AND uqp.quest_date < week_start;
END;
$$;

-- Update streak function to consume a freeze when user missed exactly 1 day
CREATE OR REPLACE FUNCTION public.update_user_streak()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  last_practice DATE;
  freeze_count integer;
  last_freeze_used DATE;
BEGIN
  SELECT last_practice_date, streak_freeze_count, last_streak_freeze_used
  INTO last_practice, freeze_count, last_freeze_used
  FROM public.profiles
  WHERE user_id = NEW.user_id;

  -- If never practiced or missed 2+ days, reset streak
  IF last_practice IS NULL OR last_practice < CURRENT_DATE - INTERVAL '2 day' THEN
    UPDATE public.profiles
    SET streak_count = 1,
        last_practice_date = CURRENT_DATE,
        updated_at = now()
    WHERE user_id = NEW.user_id;
    RETURN NEW;
  END IF;

  -- If missed exactly 1 day (last practice was 2 days ago), try to use a freeze
  IF last_practice = CURRENT_DATE - INTERVAL '2 day' THEN
    IF (freeze_count > 0) AND (last_freeze_used IS NULL OR last_freeze_used < CURRENT_DATE) THEN
      UPDATE public.profiles
      SET streak_count = streak_count + 1,
          last_practice_date = CURRENT_DATE,
          streak_freeze_count = GREATEST(0, streak_freeze_count - 1),
          last_streak_freeze_used = CURRENT_DATE,
          updated_at = now()
      WHERE user_id = NEW.user_id;
      RETURN NEW;
    ELSE
      -- No freeze available → reset
      UPDATE public.profiles
      SET streak_count = 1,
          last_practice_date = CURRENT_DATE,
          updated_at = now()
      WHERE user_id = NEW.user_id;
      RETURN NEW;
    END IF;
  END IF;

  -- Normal streak continuation rules
  IF last_practice = CURRENT_DATE - INTERVAL '1 day' THEN
    UPDATE public.profiles
    SET streak_count = streak_count + 1,
        last_practice_date = CURRENT_DATE,
        updated_at = now()
    WHERE user_id = NEW.user_id;
  ELSIF last_practice < CURRENT_DATE THEN
    UPDATE public.profiles
    SET last_practice_date = CURRENT_DATE,
        updated_at = now()
    WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Ensure trigger exists (idempotent)
DROP TRIGGER IF EXISTS on_lesson_complete_update_streak ON public.lesson_progress;
CREATE TRIGGER on_lesson_complete_update_streak
AFTER INSERT OR UPDATE ON public.lesson_progress
FOR EACH ROW
WHEN (NEW.completed = true)
EXECUTE FUNCTION public.update_user_streak();

-- Extend weekly league processing to also clear old weekly quests
CREATE OR REPLACE FUNCTION public.process_weekly_leagues()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  league_name text;
  user_record record;
  user_count integer;
  promote_count integer;
  demote_count integer;
BEGIN
  FOR league_name IN SELECT DISTINCT league FROM profiles ORDER BY 
    CASE league 
      WHEN 'bronze' THEN 1 
      WHEN 'silver' THEN 2 
      WHEN 'gold' THEN 3 
      WHEN 'diamond' THEN 4 
    END
  LOOP
    SELECT COUNT(*) INTO user_count FROM profiles WHERE league = league_name;
    promote_count := GREATEST(1, user_count / 5);
    demote_count := GREATEST(1, user_count / 5);

    IF league_name != 'diamond' THEN
      FOR user_record IN 
        SELECT user_id, weekly_xp, 
               ROW_NUMBER() OVER (ORDER BY weekly_xp DESC) as rank
        FROM profiles 
        WHERE league = league_name AND weekly_xp > 0
        ORDER BY weekly_xp DESC
        LIMIT promote_count
      LOOP
        INSERT INTO league_history (user_id, from_league, to_league, week_ending, weekly_xp, rank_in_league, action)
        VALUES (user_record.user_id, league_name, 
                CASE league_name 
                  WHEN 'bronze' THEN 'silver'
                  WHEN 'silver' THEN 'gold'
                  WHEN 'gold' THEN 'diamond'
                END,
                CURRENT_DATE, user_record.weekly_xp, user_record.rank, 'promoted');
        
        UPDATE profiles SET league = 
          CASE league_name 
            WHEN 'bronze' THEN 'silver'
            WHEN 'silver' THEN 'gold'
            WHEN 'gold' THEN 'diamond'
          END
        WHERE user_id = user_record.user_id;
      END LOOP;
    END IF;

    IF league_name != 'bronze' THEN
      FOR user_record IN 
        SELECT user_id, weekly_xp,
               ROW_NUMBER() OVER (ORDER BY weekly_xp ASC) as rank
        FROM profiles 
        WHERE league = league_name
        ORDER BY weekly_xp ASC
        LIMIT demote_count
      LOOP
        INSERT INTO league_history (user_id, from_league, to_league, week_ending, weekly_xp, rank_in_league, action)
        VALUES (user_record.user_id, league_name,
                CASE league_name 
                  WHEN 'silver' THEN 'bronze'
                  WHEN 'gold' THEN 'silver'
                  WHEN 'diamond' THEN 'gold'
                END,
                CURRENT_DATE, user_record.weekly_xp, user_record.rank, 'demoted');
        
        UPDATE profiles SET league = 
          CASE league_name 
            WHEN 'silver' THEN 'bronze'
            WHEN 'gold' THEN 'silver'
            WHEN 'diamond' THEN 'gold'
          END
        WHERE user_id = user_record.user_id;
      END LOOP;
    END IF;
  END LOOP;
  
  UPDATE profiles SET weekly_xp = 0;

  -- Weekly quests cleanup (runs alongside league reset every Sunday)
  PERFORM public.reset_weekly_quests();
END;
$$;

