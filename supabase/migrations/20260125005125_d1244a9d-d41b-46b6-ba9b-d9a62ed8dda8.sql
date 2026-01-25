-- Fix the update_user_streak function with correct logic
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
  -- Get current streak info
  SELECT last_practice_date, streak_count, streak_freeze_count INTO last_practice, current_streak, freeze_count
  FROM public.profiles
  WHERE user_id = NEW.user_id;

  -- If already practiced today, do nothing
  IF last_practice = CURRENT_DATE THEN
    RETURN NEW;
  END IF;

  -- If practiced yesterday, increment streak
  IF last_practice = CURRENT_DATE - INTERVAL '1 day' THEN
    UPDATE public.profiles
    SET streak_count = streak_count + 1, 
        last_practice_date = CURRENT_DATE, 
        updated_at = now()
    WHERE user_id = NEW.user_id;
  -- If missed exactly one day and has streak freeze, use it
  ELSIF last_practice = CURRENT_DATE - INTERVAL '2 days' AND freeze_count > 0 THEN
    UPDATE public.profiles
    SET streak_freeze_count = streak_freeze_count - 1,
        last_practice_date = CURRENT_DATE,
        updated_at = now()
    WHERE user_id = NEW.user_id;
  -- If never practiced or missed more than allowed, reset streak to 1
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

-- Create the trigger on lesson_progress table if it doesn't exist
DROP TRIGGER IF EXISTS update_streak_on_lesson_complete ON public.lesson_progress;

CREATE TRIGGER update_streak_on_lesson_complete
  AFTER INSERT ON public.lesson_progress
  FOR EACH ROW
  WHEN (NEW.completed = true)
  EXECUTE FUNCTION public.update_user_streak();

-- Create a daily streak check function to reset streaks for inactive users
CREATE OR REPLACE FUNCTION public.check_and_reset_streaks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Reset streaks for users who haven't practiced in more than 1 day
  -- But preserve streak if they have a streak freeze
  UPDATE public.profiles
  SET streak_count = 0,
      updated_at = now()
  WHERE last_practice_date < CURRENT_DATE - INTERVAL '1 day'
    AND streak_freeze_count = 0
    AND streak_count > 0;
  
  -- Use streak freeze for users who missed exactly one day
  UPDATE public.profiles
  SET streak_freeze_count = streak_freeze_count - 1,
      last_practice_date = last_practice_date + INTERVAL '1 day',
      updated_at = now()
  WHERE last_practice_date = CURRENT_DATE - INTERVAL '2 days'
    AND streak_freeze_count > 0
    AND streak_count > 0;
END;
$function$;

-- Update process_weekly_leagues to also record notifications
CREATE OR REPLACE FUNCTION public.process_weekly_leagues()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  league_name text;
  user_record record;
  user_count integer;
  promote_count integer;
  demote_count integer;
  current_rank integer;
BEGIN
  FOR league_name IN SELECT DISTINCT league FROM profiles ORDER BY 
    CASE league 
      WHEN 'bronze' THEN 1 
      WHEN 'silver' THEN 2 
      WHEN 'gold' THEN 3 
      WHEN 'diamond' THEN 4 
    END
  LOOP
    -- Get users in this league ordered by weekly_xp
    SELECT COUNT(*) INTO user_count FROM profiles WHERE league = league_name;
    
    -- Skip if no users in league
    IF user_count = 0 THEN
      CONTINUE;
    END IF;
    
    -- Top 20% get promoted (except diamond), bottom 20% get demoted (except bronze)
    promote_count := GREATEST(1, user_count / 5);
    demote_count := GREATEST(1, user_count / 5);
    
    -- Process promotions (skip diamond league)
    IF league_name != 'diamond' THEN
      current_rank := 0;
      FOR user_record IN 
        SELECT user_id, weekly_xp
        FROM profiles 
        WHERE league = league_name AND weekly_xp > 0
        ORDER BY weekly_xp DESC
        LIMIT promote_count
      LOOP
        current_rank := current_rank + 1;
        -- Record history and promote
        INSERT INTO league_history (user_id, from_league, to_league, week_ending, weekly_xp, rank_in_league, action)
        VALUES (user_record.user_id, league_name, 
                CASE league_name 
                  WHEN 'bronze' THEN 'silver'
                  WHEN 'silver' THEN 'gold'
                  WHEN 'gold' THEN 'diamond'
                END,
                CURRENT_DATE, user_record.weekly_xp, current_rank, 'promoted');
        
        UPDATE profiles SET league = 
          CASE league_name 
            WHEN 'bronze' THEN 'silver'
            WHEN 'silver' THEN 'gold'
            WHEN 'gold' THEN 'diamond'
          END
        WHERE user_id = user_record.user_id;
      END LOOP;
    END IF;
    
    -- Process demotions (skip bronze league)
    IF league_name != 'bronze' THEN
      current_rank := 0;
      FOR user_record IN 
        SELECT user_id, weekly_xp
        FROM profiles 
        WHERE league = league_name
        ORDER BY weekly_xp ASC
        LIMIT demote_count
      LOOP
        current_rank := current_rank + 1;
        INSERT INTO league_history (user_id, from_league, to_league, week_ending, weekly_xp, rank_in_league, action)
        VALUES (user_record.user_id, league_name,
                CASE league_name 
                  WHEN 'silver' THEN 'bronze'
                  WHEN 'gold' THEN 'silver'
                  WHEN 'diamond' THEN 'gold'
                END,
                CURRENT_DATE, user_record.weekly_xp, user_count - demote_count + current_rank, 'demoted');
        
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
  
  -- Reset weekly XP for all users
  UPDATE profiles SET weekly_xp = 0;
END;
$function$;