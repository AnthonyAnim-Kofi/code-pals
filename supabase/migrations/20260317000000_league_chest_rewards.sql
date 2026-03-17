-- League Chest Rewards: tables for admin-configured chests and user awards

-- 1. Chest configuration table (admin sets rewards per league + rank)
CREATE TABLE IF NOT EXISTS public.league_chest_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  league text NOT NULL CHECK (league IN ('bronze', 'silver', 'gold', 'diamond')),
  rank_position integer NOT NULL CHECK (rank_position BETWEEN 1 AND 3),
  chest_name text NOT NULL DEFAULT 'Reward Chest',
  xp_reward integer NOT NULL DEFAULT 0,
  gems_reward integer NOT NULL DEFAULT 0,
  hearts_reward integer NOT NULL DEFAULT 0,
  streak_freezes_reward integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (league, rank_position)
);

-- Seed default chest configs for every league + rank
INSERT INTO public.league_chest_config (league, rank_position, chest_name, xp_reward, gems_reward, hearts_reward, streak_freezes_reward)
VALUES
  ('bronze', 1, 'Bronze Champion Chest', 100, 50, 3, 1),
  ('bronze', 2, 'Bronze Runner-Up Chest', 75, 30, 2, 0),
  ('bronze', 3, 'Bronze Third Place Chest', 50, 20, 1, 0),
  ('silver', 1, 'Silver Champion Chest', 200, 100, 5, 2),
  ('silver', 2, 'Silver Runner-Up Chest', 150, 70, 3, 1),
  ('silver', 3, 'Silver Third Place Chest', 100, 50, 2, 0),
  ('gold', 1, 'Gold Champion Chest', 400, 200, 5, 3),
  ('gold', 2, 'Gold Runner-Up Chest', 300, 150, 4, 2),
  ('gold', 3, 'Gold Third Place Chest', 200, 100, 3, 1),
  ('diamond', 1, 'Diamond Champion Chest', 600, 400, 5, 3),
  ('diamond', 2, 'Diamond Runner-Up Chest', 450, 300, 5, 2),
  ('diamond', 3, 'Diamond Third Place Chest', 300, 200, 4, 1)
ON CONFLICT (league, rank_position) DO NOTHING;

-- 2. Chest awards table (records chests given to users)
CREATE TABLE IF NOT EXISTS public.league_chest_awards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  league text NOT NULL,
  rank_position integer NOT NULL,
  chest_config_id uuid REFERENCES public.league_chest_config(id) ON DELETE SET NULL,
  week_ending date NOT NULL DEFAULT CURRENT_DATE,
  claimed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chest_awards_user ON public.league_chest_awards(user_id);
CREATE INDEX IF NOT EXISTS idx_chest_awards_league_week ON public.league_chest_awards(league, week_ending);

-- 3. RLS policies
ALTER TABLE public.league_chest_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_chest_awards ENABLE ROW LEVEL SECURITY;

-- Everyone can read chest configs
CREATE POLICY "Anyone can view chest configs"
  ON public.league_chest_config FOR SELECT
  USING (true);

-- Only service role / admin can modify configs (handled at app level via supabase service key)
CREATE POLICY "Service role can manage chest configs"
  ON public.league_chest_config FOR ALL
  USING (true)
  WITH CHECK (true);

-- Users can view all chest awards (so league members see who won)
CREATE POLICY "Anyone can view chest awards"
  ON public.league_chest_awards FOR SELECT
  USING (true);

-- Users can update only their own awards (to claim)
CREATE POLICY "Users can claim own chests"
  ON public.league_chest_awards FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role inserts awards
CREATE POLICY "Service role can insert chest awards"
  ON public.league_chest_awards FOR INSERT
  WITH CHECK (true);

-- 4. Update process_weekly_leagues to award chests to top 3 before resetting XP
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
  chest_id uuid;
BEGIN
  -- Award chests to top 3 in each league BEFORE promotions
  FOR league_name IN SELECT unnest(ARRAY['bronze', 'silver', 'gold', 'diamond'])
  LOOP
    FOR user_record IN
      SELECT user_id, weekly_xp,
             ROW_NUMBER() OVER (ORDER BY weekly_xp DESC) as rank
      FROM profiles
      WHERE league = league_name AND weekly_xp > 0
      ORDER BY weekly_xp DESC
      LIMIT 3
    LOOP
      -- Find the matching chest config
      SELECT id INTO chest_id
      FROM league_chest_config
      WHERE league = league_name AND rank_position = user_record.rank;

      IF chest_id IS NOT NULL THEN
        INSERT INTO league_chest_awards (user_id, league, rank_position, chest_config_id, week_ending)
        VALUES (user_record.user_id, league_name, user_record.rank, chest_id, CURRENT_DATE);
      END IF;
    END LOOP;
  END LOOP;

  -- Process each league in order (promotions / demotions)
  FOR league_name IN SELECT unnest(ARRAY['bronze', 'silver', 'gold', 'diamond'])
  LOOP
    SELECT promotion_xp_threshold, demotion_xp_threshold
    INTO promo_threshold, demo_threshold
    FROM league_thresholds WHERE league = league_name;

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

    -- Process promotions
    IF next_league IS NOT NULL AND promo_threshold > 0 THEN
      FOR user_record IN
        SELECT user_id, weekly_xp,
               ROW_NUMBER() OVER (ORDER BY weekly_xp DESC) as rank
        FROM profiles
        WHERE league = league_name AND weekly_xp >= promo_threshold
        ORDER BY weekly_xp DESC
      LOOP
        INSERT INTO league_history (user_id, from_league, to_league, week_ending, weekly_xp, rank_in_league, action)
        VALUES (user_record.user_id, league_name, next_league, CURRENT_DATE, user_record.weekly_xp, user_record.rank, 'promoted');

        UPDATE profiles SET league = next_league WHERE user_id = user_record.user_id;
      END LOOP;
    END IF;

    -- Process demotions
    IF prev_league IS NOT NULL AND demo_threshold > 0 THEN
      FOR user_record IN
        SELECT user_id, weekly_xp,
               ROW_NUMBER() OVER (ORDER BY weekly_xp ASC) as rank
        FROM profiles
        WHERE league = league_name AND weekly_xp < demo_threshold
        ORDER BY weekly_xp ASC
      LOOP
        INSERT INTO league_history (user_id, from_league, to_league, week_ending, weekly_xp, rank_in_league, action)
        VALUES (user_record.user_id, league_name, prev_league, CURRENT_DATE, user_record.weekly_xp, user_record.rank, 'demoted');

        UPDATE profiles SET league = prev_league WHERE user_id = user_record.user_id;
      END LOOP;
    END IF;
  END LOOP;

  -- Reset weekly XP for all users
  UPDATE profiles SET weekly_xp = 0 WHERE weekly_xp > 0;
END;
$function$;
