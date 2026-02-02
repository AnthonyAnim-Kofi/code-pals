-- Update the process_weekly_leagues function to use XP thresholds from league_thresholds table
CREATE OR REPLACE FUNCTION public.process_weekly_leagues()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  league_name text;
  user_record record;
  promo_threshold integer;
  demo_threshold integer;
  next_league text;
  prev_league text;
BEGIN
  -- Process each league
  FOR league_name IN SELECT DISTINCT league FROM profiles ORDER BY 
    CASE league 
      WHEN 'bronze' THEN 1 
      WHEN 'silver' THEN 2 
      WHEN 'gold' THEN 3 
      WHEN 'diamond' THEN 4 
    END
  LOOP
    -- Get thresholds for this league from league_thresholds table
    SELECT promotion_xp_threshold, demotion_xp_threshold 
    INTO promo_threshold, demo_threshold
    FROM league_thresholds WHERE league = league_name;
    
    -- Determine next and previous leagues
    next_league := CASE league_name 
      WHEN 'bronze' THEN 'silver'
      WHEN 'silver' THEN 'gold'
      WHEN 'gold' THEN 'diamond'
      ELSE NULL
    END;
    
    prev_league := CASE league_name 
      WHEN 'silver' THEN 'bronze'
      WHEN 'gold' THEN 'silver'
      WHEN 'diamond' THEN 'gold'
      ELSE NULL
    END;
    
    -- Process promotions (skip diamond league - can't promote higher)
    IF next_league IS NOT NULL AND promo_threshold > 0 THEN
      FOR user_record IN 
        SELECT user_id, weekly_xp,
               ROW_NUMBER() OVER (ORDER BY weekly_xp DESC) as rank
        FROM profiles 
        WHERE league = league_name AND weekly_xp >= promo_threshold
        ORDER BY weekly_xp DESC
      LOOP
        -- Record history and promote
        INSERT INTO league_history (user_id, from_league, to_league, week_ending, weekly_xp, rank_in_league, action)
        VALUES (user_record.user_id, league_name, next_league, CURRENT_DATE, user_record.weekly_xp, user_record.rank, 'promoted');
        
        UPDATE profiles SET league = next_league WHERE user_id = user_record.user_id;
      END LOOP;
    END IF;
    
    -- Process demotions (skip bronze league - can't demote lower)
    IF prev_league IS NOT NULL AND demo_threshold > 0 THEN
      FOR user_record IN 
        SELECT user_id, weekly_xp,
               ROW_NUMBER() OVER (ORDER BY weekly_xp ASC) as rank
        FROM profiles 
        WHERE league = league_name AND weekly_xp < demo_threshold
        ORDER BY weekly_xp ASC
      LOOP
        -- Record history and demote
        INSERT INTO league_history (user_id, from_league, to_league, week_ending, weekly_xp, rank_in_league, action)
        VALUES (user_record.user_id, league_name, prev_league, CURRENT_DATE, user_record.weekly_xp, user_record.rank, 'demoted');
        
        UPDATE profiles SET league = prev_league WHERE user_id = user_record.user_id;
      END LOOP;
    END IF;
  END LOOP;
  
  -- Reset weekly XP for all users
  UPDATE profiles SET weekly_xp = 0;
END;
$function$;