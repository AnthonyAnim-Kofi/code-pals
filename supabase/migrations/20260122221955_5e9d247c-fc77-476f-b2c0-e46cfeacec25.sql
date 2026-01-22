-- Add league column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS league text NOT NULL DEFAULT 'bronze';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS weekly_xp integer NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS streak_freeze_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS double_xp_until timestamp with time zone;

-- Create user_follows table for social features
CREATE TABLE public.user_follows (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id uuid NOT NULL,
  following_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- Create challenges table
CREATE TABLE public.challenges (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenger_id uuid NOT NULL,
  challenged_id uuid NOT NULL,
  lesson_id integer NOT NULL,
  challenger_score integer,
  challenged_score integer,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone
);

-- Create achievements table
CREATE TABLE public.achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  requirement_type text NOT NULL,
  requirement_value integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create user_achievements table
CREATE TABLE public.user_achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  achievement_id uuid NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Create league_history table for tracking promotions/demotions
CREATE TABLE public.league_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  from_league text NOT NULL,
  to_league text NOT NULL,
  week_ending date NOT NULL,
  weekly_xp integer NOT NULL,
  rank_in_league integer NOT NULL,
  action text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_history ENABLE ROW LEVEL SECURITY;

-- RLS for user_follows
CREATE POLICY "Users can view all follows" ON public.user_follows FOR SELECT USING (true);
CREATE POLICY "Users can follow others" ON public.user_follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON public.user_follows FOR DELETE USING (auth.uid() = follower_id);

-- RLS for challenges
CREATE POLICY "Users can view their challenges" ON public.challenges FOR SELECT USING (auth.uid() = challenger_id OR auth.uid() = challenged_id);
CREATE POLICY "Users can create challenges" ON public.challenges FOR INSERT WITH CHECK (auth.uid() = challenger_id);
CREATE POLICY "Users can update their challenges" ON public.challenges FOR UPDATE USING (auth.uid() = challenger_id OR auth.uid() = challenged_id);

-- RLS for achievements (everyone can view)
CREATE POLICY "Anyone can view achievements" ON public.achievements FOR SELECT USING (true);

-- RLS for user_achievements
CREATE POLICY "Users can view all earned achievements" ON public.user_achievements FOR SELECT USING (true);
CREATE POLICY "Users can earn achievements" ON public.user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS for league_history
CREATE POLICY "Users can view their league history" ON public.league_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert league history" ON public.league_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Update profiles RLS to allow viewing others for leaderboard
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view all profiles for leaderboard" ON public.profiles FOR SELECT USING (true);

-- Insert default achievements
INSERT INTO public.achievements (name, description, icon, requirement_type, requirement_value) VALUES
('First Steps', 'Complete your first lesson', 'trophy', 'lessons_completed', 1),
('Getting Started', 'Complete 5 lessons', 'book-open', 'lessons_completed', 5),
('Dedicated Learner', 'Complete 10 lessons', 'graduation-cap', 'lessons_completed', 10),
('On Fire', 'Maintain a 3-day streak', 'flame', 'streak', 3),
('Week Warrior', 'Maintain a 7-day streak', 'fire', 'streak', 7),
('Unstoppable', 'Maintain a 30-day streak', 'zap', 'streak', 30),
('XP Hunter', 'Earn 100 XP', 'star', 'xp', 100),
('XP Master', 'Earn 500 XP', 'stars', 'xp', 500),
('XP Legend', 'Earn 1000 XP', 'crown', 'xp', 1000),
('Social Butterfly', 'Follow 5 friends', 'users', 'following', 5),
('Challenger', 'Complete 3 challenges', 'swords', 'challenges', 3),
('Perfect Score', 'Get 100% accuracy on a lesson', 'target', 'perfect_lesson', 1),
('Silver League', 'Get promoted to Silver League', 'medal', 'league', 1),
('Gold League', 'Get promoted to Gold League', 'award', 'league', 2),
('Diamond League', 'Get promoted to Diamond League', 'gem', 'league', 3);

-- Function to process weekly league changes
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
    -- Get users in this league ordered by weekly_xp
    SELECT COUNT(*) INTO user_count FROM profiles WHERE league = league_name;
    
    -- Top 20% get promoted (except diamond), bottom 20% get demoted (except bronze)
    promote_count := GREATEST(1, user_count / 5);
    demote_count := GREATEST(1, user_count / 5);
    
    -- Process promotions
    IF league_name != 'diamond' THEN
      FOR user_record IN 
        SELECT user_id, weekly_xp, 
               ROW_NUMBER() OVER (ORDER BY weekly_xp DESC) as rank
        FROM profiles 
        WHERE league = league_name AND weekly_xp > 0
        ORDER BY weekly_xp DESC
        LIMIT promote_count
      LOOP
        -- Record history and promote
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
    
    -- Process demotions
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
  
  -- Reset weekly XP for all users
  UPDATE profiles SET weekly_xp = 0;
END;
$$;