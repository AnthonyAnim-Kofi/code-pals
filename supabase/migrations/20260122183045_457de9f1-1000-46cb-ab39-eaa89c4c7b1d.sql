-- Create daily quests table
CREATE TABLE public.daily_quests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  quest_type TEXT NOT NULL, -- 'earn_xp', 'complete_lessons', 'correct_answers', 'streak'
  target_value INTEGER NOT NULL,
  gem_reward INTEGER NOT NULL DEFAULT 10,
  is_weekly BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user quest progress table
CREATE TABLE public.user_quest_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  quest_id UUID REFERENCES public.daily_quests(id) ON DELETE CASCADE NOT NULL,
  current_value INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  claimed BOOLEAN NOT NULL DEFAULT false,
  quest_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  claimed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, quest_id, quest_date)
);

-- Enable RLS
ALTER TABLE public.daily_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quest_progress ENABLE ROW LEVEL SECURITY;

-- Daily quests are viewable by everyone (they're global quests)
CREATE POLICY "Anyone can view daily quests"
ON public.daily_quests
FOR SELECT
USING (true);

-- User quest progress policies
CREATE POLICY "Users can view their own quest progress"
ON public.user_quest_progress
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quest progress"
ON public.user_quest_progress
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quest progress"
ON public.user_quest_progress
FOR UPDATE
USING (auth.uid() = user_id);

-- Insert default daily quests
INSERT INTO public.daily_quests (title, description, quest_type, target_value, gem_reward, is_weekly) VALUES
('Earn 50 XP', 'Complete lessons to earn XP', 'earn_xp', 50, 10, false),
('Complete 3 lessons', 'Finish any 3 lessons today', 'complete_lessons', 3, 15, false),
('Get 5 answers correct', 'Answer correctly without hints', 'correct_answers', 5, 20, false),
('7-day streak', 'Practice every day for a week', 'streak', 7, 100, true),
('Earn 500 XP', 'Total XP earned this week', 'earn_xp', 500, 50, true);

-- Add function to update streak
CREATE OR REPLACE FUNCTION public.update_user_streak()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  last_practice DATE;
  current_streak INTEGER;
BEGIN
  -- Get current streak info
  SELECT last_practice_date, streak_count INTO last_practice, current_streak
  FROM public.profiles
  WHERE user_id = NEW.user_id;

  -- Update streak based on practice date
  IF last_practice IS NULL OR last_practice < CURRENT_DATE - INTERVAL '1 day' THEN
    -- Start new streak
    UPDATE public.profiles
    SET streak_count = 1, last_practice_date = CURRENT_DATE, updated_at = now()
    WHERE user_id = NEW.user_id;
  ELSIF last_practice = CURRENT_DATE - INTERVAL '1 day' THEN
    -- Continue streak
    UPDATE public.profiles
    SET streak_count = streak_count + 1, last_practice_date = CURRENT_DATE, updated_at = now()
    WHERE user_id = NEW.user_id;
  ELSIF last_practice < CURRENT_DATE THEN
    -- Same day, just update last practice date
    UPDATE public.profiles
    SET last_practice_date = CURRENT_DATE, updated_at = now()
    WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger to update streak on lesson completion
CREATE TRIGGER on_lesson_complete_update_streak
AFTER INSERT OR UPDATE ON public.lesson_progress
FOR EACH ROW
WHEN (NEW.completed = true)
EXECUTE FUNCTION public.update_user_streak();