-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  xp INTEGER NOT NULL DEFAULT 0,
  hearts INTEGER NOT NULL DEFAULT 5,
  gems INTEGER NOT NULL DEFAULT 0,
  streak_count INTEGER NOT NULL DEFAULT 0,
  last_practice_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, username)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Learner'), NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for auto profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create lesson_progress table
CREATE TABLE public.lesson_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id INTEGER NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  accuracy INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

-- Enable RLS
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own progress"
ON public.lesson_progress FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
ON public.lesson_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
ON public.lesson_progress FOR UPDATE
USING (auth.uid() = user_id);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for automatic timestamp updates on profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
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
-- Add foreign key constraints for user_follows
ALTER TABLE public.user_follows 
ADD CONSTRAINT user_follows_follower_id_fkey 
FOREIGN KEY (follower_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.user_follows 
ADD CONSTRAINT user_follows_following_id_fkey 
FOREIGN KEY (following_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Add foreign key for challenges
ALTER TABLE public.challenges 
ADD CONSTRAINT challenges_challenger_id_fkey 
FOREIGN KEY (challenger_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.challenges 
ADD CONSTRAINT challenges_challenged_id_fkey 
FOREIGN KEY (challenged_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Add foreign key for user_achievements
ALTER TABLE public.user_achievements 
ADD CONSTRAINT user_achievements_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Add foreign key for league_history
ALTER TABLE public.league_history 
ADD CONSTRAINT league_history_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
-- Create app_role enum for role-based access
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table for RBAC (separate from profiles as per security requirements)
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents infinite recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create languages table for different programming languages
CREATE TABLE public.languages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    icon TEXT NOT NULL DEFAULT 'ðŸ’»',
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on languages
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active languages"
ON public.languages
FOR SELECT
USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage languages"
ON public.languages
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create units table
CREATE TABLE public.units (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    language_id uuid REFERENCES public.languages(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    color TEXT NOT NULL DEFAULT 'green',
    order_index INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active units"
ON public.units
FOR SELECT
USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage units"
ON public.units
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create lessons table (admin-managed)
CREATE TABLE public.lessons (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id uuid REFERENCES public.units(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active lessons"
ON public.lessons
FOR SELECT
USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage lessons"
ON public.lessons
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create questions table
CREATE TABLE public.questions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id uuid REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('fill-blank', 'multiple-choice', 'drag-order', 'code-runner')),
    instruction TEXT NOT NULL,
    code TEXT,
    answer TEXT,
    options JSONB,
    blocks JSONB,
    correct_order JSONB,
    initial_code TEXT,
    expected_output TEXT,
    hint TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    xp_reward INTEGER NOT NULL DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view questions for active lessons"
ON public.questions
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.lessons l 
        WHERE l.id = lesson_id AND (l.is_active = true OR public.has_role(auth.uid(), 'admin'))
    )
);

CREATE POLICY "Admins can manage questions"
ON public.questions
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create unit_notes table for admin-uploaded notes
CREATE TABLE public.unit_notes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id uuid REFERENCES public.units(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.unit_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view notes for accessible units"
ON public.unit_notes
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.units u 
        WHERE u.id = unit_id AND (u.is_active = true OR public.has_role(auth.uid(), 'admin'))
    )
);

CREATE POLICY "Admins can manage notes"
ON public.unit_notes
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Add heart_regeneration_started_at to profiles for timer tracking
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS heart_regeneration_started_at TIMESTAMP WITH TIME ZONE;

-- Insert default Python language
INSERT INTO public.languages (name, slug, icon, description)
VALUES ('Python', 'python', 'ðŸ', 'Learn the most popular programming language');

-- Trigger for updated_at on new tables
CREATE TRIGGER update_languages_updated_at
BEFORE UPDATE ON public.languages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_units_updated_at
BEFORE UPDATE ON public.units
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at
BEFORE UPDATE ON public.lessons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_questions_updated_at
BEFORE UPDATE ON public.questions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_unit_notes_updated_at
BEFORE UPDATE ON public.unit_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Add advanced Python lessons: Classes, File I/O, Error Handling, and Decorators
-- This assumes Python language and units already exist
-- You may need to adjust the unit_id values based on your actual database

-- First, get the Python language ID and create/use appropriate units
DO $$
DECLARE
  python_lang_id uuid;
  unit_5_id uuid;
  unit_6_id uuid;
  unit_7_id uuid;
  unit_8_id uuid;
  lesson_1_id uuid;
  lesson_2_id uuid;
  lesson_3_id uuid;
  lesson_4_id uuid;
  lesson_5_id uuid;
  lesson_6_id uuid;
  lesson_7_id uuid;
  lesson_8_id uuid;
BEGIN
  -- Get Python language ID
  SELECT id INTO python_lang_id FROM public.languages WHERE slug = 'python' LIMIT 1;
  
  IF python_lang_id IS NULL THEN
    RAISE EXCEPTION 'Python language not found. Please ensure Python language exists.';
  END IF;

  -- Create Unit 5: Classes
  INSERT INTO public.units (language_id, title, description, color, order_index)
  VALUES (python_lang_id, 'Unit 5: Classes & Objects', 'Learn object-oriented programming with classes', 'indigo', 5)
  ON CONFLICT DO NOTHING
  RETURNING id INTO unit_5_id;
  
  SELECT id INTO unit_5_id FROM public.units WHERE language_id = python_lang_id AND order_index = 5 LIMIT 1;

  -- Create Unit 6: File I/O
  INSERT INTO public.units (language_id, title, description, color, order_index)
  VALUES (python_lang_id, 'Unit 6: File I/O', 'Read and write files in Python', 'teal', 6)
  ON CONFLICT DO NOTHING
  RETURNING id INTO unit_6_id;
  
  SELECT id INTO unit_6_id FROM public.units WHERE language_id = python_lang_id AND order_index = 6 LIMIT 1;

  -- Create Unit 7: Error Handling
  INSERT INTO public.units (language_id, title, description, color, order_index)
  VALUES (python_lang_id, 'Unit 7: Error Handling', 'Handle errors and exceptions gracefully', 'red', 7)
  ON CONFLICT DO NOTHING
  RETURNING id INTO unit_7_id;
  
  SELECT id INTO unit_7_id FROM public.units WHERE language_id = python_lang_id AND order_index = 7 LIMIT 1;

  -- Create Unit 8: Decorators
  INSERT INTO public.units (language_id, title, description, color, order_index)
  VALUES (python_lang_id, 'Unit 8: Decorators', 'Master Python decorators and advanced functions', 'pink', 8)
  ON CONFLICT DO NOTHING
  RETURNING id INTO unit_8_id;
  
  SELECT id INTO unit_8_id FROM public.units WHERE language_id = python_lang_id AND order_index = 8 LIMIT 1;

  -- Unit 5: Classes - Lesson 1: Introduction to Classes
  INSERT INTO public.lessons (unit_id, title, order_index)
  VALUES (unit_5_id, 'Introduction to Classes', 1)
  ON CONFLICT DO NOTHING;

  -- Add questions for Classes Lesson 1
  SELECT id INTO lesson_1_id FROM public.lessons WHERE unit_id = unit_5_id AND order_index = 1 LIMIT 1;
  
  INSERT INTO public.questions (lesson_id, type, instruction, code, answer, options, order_index, xp_reward) VALUES
  (lesson_1_id, 'multiple-choice', 'What is a class in Python?', NULL, NULL, 
   '["A blueprint for creating objects", "A function that returns values", "A variable that stores data", "A loop that repeats code"]'::jsonb, 1, 10),
  (lesson_1_id, 'fill-blank', 'Complete the class definition:', 'class ___:\n    def __init__(self, name):\n        self.name = name', 
   'Person', '["Person", "person", "Class", "class"]'::jsonb, 2, 15),
  (lesson_1_id, 'code-runner', 'Create a class called Car with an __init__ method that sets a brand attribute. Then create an instance and print the brand.', 
   '# Your code here\n', 'BMW', NULL, 3, 20);

  -- Unit 5: Classes - Lesson 2: Class Methods and Attributes
  INSERT INTO public.lessons (unit_id, title, order_index)
  VALUES (unit_5_id, 'Class Methods and Attributes', 2)
  ON CONFLICT DO NOTHING;

  SELECT id INTO lesson_2_id FROM public.lessons WHERE unit_id = unit_5_id AND order_index = 2 LIMIT 1;
  
  INSERT INTO public.questions (lesson_id, type, instruction, code, answer, options, order_index, xp_reward) VALUES
  (lesson_2_id, 'multiple-choice', 'What is the difference between instance methods and class methods?', NULL, NULL,
    '["Instance methods take self, class methods take cls", "There is no difference", "Class methods are faster", "Instance methods are static"]'::jsonb, 1, 10),
  (lesson_2_id, 'fill-blank', 'Complete the class method:', 'class Math:\n    @classmethod\n    def add(cls, a, b):\n        return ___', 
    'a + b', '["a + b", "a+b", "sum(a, b)", "cls.add(a, b)"]'::jsonb, 2, 15);

  -- Unit 6: File I/O - Lesson 1: Reading Files
  INSERT INTO public.lessons (unit_id, title, order_index)
  VALUES (unit_6_id, 'Reading Files', 1)
  ON CONFLICT DO NOTHING;

  SELECT id INTO lesson_3_id FROM public.lessons WHERE unit_id = unit_6_id AND order_index = 1 LIMIT 1;
  
  INSERT INTO public.questions (lesson_id, type, instruction, code, answer, options, order_index, xp_reward) VALUES
  (lesson_3_id, 'multiple-choice', 'What is the correct way to open and read a file?', NULL, NULL,
    '["with open(\"file.txt\") as f: content = f.read()", "read(\"file.txt\")", "open(\"file.txt\").read()", "file.read(\"file.txt\")"]'::jsonb, 1, 10),
  (lesson_3_id, 'code-runner', 'Write code to read a file called "data.txt" and print its contents.', 
    '# Your code here\n', 'Hello, World!', NULL, 2, 20);

  -- Unit 6: File I/O - Lesson 2: Writing Files
  INSERT INTO public.lessons (unit_id, title, order_index)
  VALUES (unit_6_id, 'Writing Files', 2)
  ON CONFLICT DO NOTHING;

  SELECT id INTO lesson_4_id FROM public.lessons WHERE unit_id = unit_6_id AND order_index = 2 LIMIT 1;
  
  INSERT INTO public.questions (lesson_id, type, instruction, code, answer, options, order_index, xp_reward) VALUES
  (lesson_4_id, 'fill-blank', 'Complete the file writing code:', 'with open("output.txt", "___") as f:\n    f.write("Hello")', 
    'w', '["w", "r", "a", "x"]'::jsonb, 1, 10),
  (lesson_4_id, 'code-runner', 'Write code to create a file "greeting.txt" and write "Hello, Python!" to it.', 
    '# Your code here\n', 'Success', NULL, 2, 20);

  -- Unit 7: Error Handling - Lesson 1: Try and Except
  INSERT INTO public.lessons (unit_id, title, order_index)
  VALUES (unit_7_id, 'Try and Except', 1)
  ON CONFLICT DO NOTHING;

  SELECT id INTO lesson_5_id FROM public.lessons WHERE unit_id = unit_7_id AND order_index = 1 LIMIT 1;
  
  INSERT INTO public.questions (lesson_id, type, instruction, code, answer, options, order_index, xp_reward) VALUES
  (lesson_5_id, 'multiple-choice', 'What happens if an exception occurs in a try block?', NULL, NULL,
    '["The except block is executed", "The program crashes", "Nothing happens", "The try block repeats"]'::jsonb, 1, 10),
  (lesson_5_id, 'fill-blank', 'Complete the error handling:', 'try:\n    result = 10 / 0\nexcept ___:\n    print("Division by zero!")', 
    'ZeroDivisionError', '["ZeroDivisionError", "Error", "Exception", "ValueError"]'::jsonb, 2, 15),
  (lesson_5_id, 'code-runner', 'Write code that tries to convert user input to an integer, and catches ValueError if it fails.', 
    '# Your code here\nuser_input = "abc"\n', 'ValueError', NULL, 3, 20);

  -- Unit 7: Error Handling - Lesson 2: Finally and Else
  INSERT INTO public.lessons (unit_id, title, order_index)
  VALUES (unit_7_id, 'Finally and Else Blocks', 2)
  ON CONFLICT DO NOTHING;

  SELECT id INTO lesson_6_id FROM public.lessons WHERE unit_id = unit_7_id AND order_index = 2 LIMIT 1;
  
  INSERT INTO public.questions (lesson_id, type, instruction, code, answer, options, order_index, xp_reward) VALUES
  (lesson_6_id, 'multiple-choice', 'When is the finally block executed?', NULL, NULL,
    '["Always, regardless of exceptions", "Only if an exception occurs", "Only if no exception occurs", "Never"]'::jsonb, 1, 10),
  (lesson_6_id, 'code-runner', 'Write a try-except-finally block that attempts to open a file and always prints "Done" in the finally block.', 
    '# Your code here\n', 'Done', NULL, 2, 20);

  -- Unit 8: Decorators - Lesson 1: Introduction to Decorators
  INSERT INTO public.lessons (unit_id, title, order_index)
  VALUES (unit_8_id, 'Introduction to Decorators', 1)
  ON CONFLICT DO NOTHING;

  SELECT id INTO lesson_7_id FROM public.lessons WHERE unit_id = unit_8_id AND order_index = 1 LIMIT 1;
  
  INSERT INTO public.questions (lesson_id, type, instruction, code, answer, options, order_index, xp_reward) VALUES
  (lesson_7_id, 'multiple-choice', 'What is a decorator in Python?', NULL, NULL,
    '["A function that modifies another function", "A type of variable", "A loop construct", "A data structure"]'::jsonb, 1, 10),
  (lesson_7_id, 'fill-blank', 'Complete the decorator syntax:', '@my_decorator\n___ def my_function():\n    pass', 
    'def', '["def", "class", "return", "lambda"]'::jsonb, 2, 15);

  -- Unit 8: Decorators - Lesson 2: Creating Custom Decorators
  INSERT INTO public.lessons (unit_id, title, order_index)
  VALUES (unit_8_id, 'Creating Custom Decorators', 2)
  ON CONFLICT DO NOTHING;

  SELECT id INTO lesson_8_id FROM public.lessons WHERE unit_id = unit_8_id AND order_index = 2 LIMIT 1;
  
  INSERT INTO public.questions (lesson_id, type, instruction, code, answer, options, order_index, xp_reward) VALUES
  (lesson_8_id, 'code-runner', 'Create a decorator called "timer" that prints "Function executed" before calling the function. Apply it to a function that prints "Hello".', 
    '# Your code here\n', 'Function executed\nHello', NULL, 1, 25);

END $$;
-- Add multiple programming languages with units and lessons
-- JavaScript, TypeScript, Rust, Go, HTML, CSS, Angular, Database, SQL

DO $$
DECLARE
  js_lang_id uuid;
  ts_lang_id uuid;
  rust_lang_id uuid;
  go_lang_id uuid;
  html_lang_id uuid;
  css_lang_id uuid;
  angular_lang_id uuid;
  db_lang_id uuid;
  sql_lang_id uuid;
  
  -- Unit IDs for each language
  js_unit_1_id uuid;
  js_unit_2_id uuid;
  ts_unit_1_id uuid;
  ts_unit_2_id uuid;
  rust_unit_1_id uuid;
  go_unit_1_id uuid;
  html_unit_1_id uuid;
  html_unit_2_id uuid;
  css_unit_1_id uuid;
  css_unit_2_id uuid;
  angular_unit_1_id uuid;
  db_unit_1_id uuid;
  sql_unit_1_id uuid;
  sql_unit_2_id uuid;
  
  lesson_id_var uuid;
BEGIN
  -- Insert JavaScript language
  INSERT INTO public.languages (name, slug, icon, description)
  VALUES ('JavaScript', 'javascript', 'ðŸŸ¨', 'Learn the language of the web')
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO js_lang_id;
  
  SELECT id INTO js_lang_id FROM public.languages WHERE slug = 'javascript' LIMIT 1;

  -- JavaScript Unit 1: Basics
  INSERT INTO public.units (language_id, title, description, color, order_index)
  VALUES (js_lang_id, 'Unit 1: JavaScript Basics', 'Variables, functions, and control flow', 'yellow', 1)
  RETURNING id INTO js_unit_1_id;

  -- JavaScript Unit 1 - Lesson 1
  INSERT INTO public.lessons (unit_id, title, order_index)
  VALUES (js_unit_1_id, 'Variables and Data Types', 1)
  RETURNING id INTO lesson_id_var;

  INSERT INTO public.questions (lesson_id, type, instruction, code, answer, options, order_index, xp_reward) VALUES
  (lesson_id_var, 'multiple-choice', 'Which keyword is used to declare a variable in modern JavaScript?', NULL, NULL,
   '["let", "var", "const", "All of the above"]'::jsonb, 1, 10),
  (lesson_id_var, 'fill-blank', 'Complete the variable declaration:', '___ name = "CodeOwl";', 
   'const', '["const", "let", "var", "string"]'::jsonb, 2, 15),
  (lesson_id_var, 'code-runner', 'Create a variable called age with value 25 and print it.', 
   '// Your code here\n', '25', NULL, 3, 20);

  -- JavaScript Unit 1 - Lesson 2
  INSERT INTO public.lessons (unit_id, title, order_index)
  VALUES (js_unit_1_id, 'Functions and Arrow Functions', 2)
  RETURNING id INTO lesson_id_var;

  INSERT INTO public.questions (lesson_id, type, instruction, code, answer, options, order_index, xp_reward) VALUES
  (lesson_id_var, 'multiple-choice', 'What is the correct arrow function syntax?', NULL, NULL,
   '["const add = (a, b) => a + b", "function add(a, b) => a + b", "add => (a, b) a + b", "const add => a + b"]'::jsonb, 1, 10),
  (lesson_id_var, 'code-runner', 'Write an arrow function that multiplies two numbers and returns the result.', 
   '// Your code here\n', '15', NULL, 2, 20);

  -- JavaScript Unit 2: Advanced
  INSERT INTO public.units (language_id, title, description, color, order_index)
  VALUES (js_lang_id, 'Unit 2: Advanced JavaScript', 'Objects, arrays, and async/await', 'orange', 2)
  RETURNING id INTO js_unit_2_id;

  INSERT INTO public.lessons (unit_id, title, order_index)
  VALUES (js_unit_2_id, 'Objects and Arrays', 1)
  RETURNING id INTO lesson_id_var;

  INSERT INTO public.questions (lesson_id, type, instruction, code, answer, options, order_index, xp_reward) VALUES
  (lesson_id_var, 'fill-blank', 'Complete the object property access:', 'const person = {name: "Alice"};\nconsole.log(person.___);', 
   'name', '["name", "person.name", "Alice", "person"]'::jsonb, 1, 15),
  (lesson_id_var, 'code-runner', 'Create an array with numbers 1, 2, 3 and use map to double each number.', 
   '// Your code here\n', '2,4,6', NULL, 2, 25);

  -- Insert TypeScript language
  INSERT INTO public.languages (name, slug, icon, description)
  VALUES ('TypeScript', 'typescript', 'ðŸ”·', 'Type-safe JavaScript')
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO ts_lang_id;
  
  SELECT id INTO ts_lang_id FROM public.languages WHERE slug = 'typescript' LIMIT 1;

  -- TypeScript Unit 1: Types
  INSERT INTO public.units (language_id, title, description, color, order_index)
  VALUES (ts_lang_id, 'Unit 1: TypeScript Types', 'Learn type annotations and interfaces', 'blue', 1)
  RETURNING id INTO ts_unit_1_id;

  INSERT INTO public.lessons (unit_id, title, order_index)
  VALUES (ts_unit_1_id, 'Basic Types', 1)
  RETURNING id INTO lesson_id_var;

  INSERT INTO public.questions (lesson_id, type, instruction, code, answer, options, order_index, xp_reward) VALUES
  (lesson_id_var, 'fill-blank', 'Complete the type annotation:', 'let age: ___ = 25;', 
   'number', '["number", "Number", "int", "Integer"]'::jsonb, 1, 15),
  (lesson_id_var, 'code-runner', 'Create a variable name of type string with value "TypeScript" and print it.', 
   '// Your code here\n', 'TypeScript', NULL, 2, 20);

  -- TypeScript Unit 2: Interfaces
  INSERT INTO public.units (language_id, title, description, color, order_index)
  VALUES (ts_lang_id, 'Unit 2: Interfaces and Classes', 'Define contracts and object shapes', 'indigo', 2)
  RETURNING id INTO ts_unit_2_id;

  INSERT INTO public.lessons (unit_id, title, order_index)
  VALUES (ts_unit_2_id, 'Interfaces', 1)
  RETURNING id INTO lesson_id_var;

  INSERT INTO public.questions (lesson_id, type, instruction, code, answer, options, order_index, xp_reward) VALUES
  (lesson_id_var, 'fill-blank', 'Complete the interface definition:', 'interface User {\n  name: string;\n  age: ___;\n}', 
   'number', '["number", "Number", "int", "string"]'::jsonb, 1, 15);

  -- Insert Rust language
  INSERT INTO public.languages (name, slug, icon, description)
  VALUES ('Rust', 'rust', 'ðŸ¦€', 'Memory-safe systems programming')
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO rust_lang_id;
  
  SELECT id INTO rust_lang_id FROM public.languages WHERE slug = 'rust' LIMIT 1;

  -- Rust Unit 1: Basics
  INSERT INTO public.units (language_id, title, description, color, order_index)
  VALUES (rust_lang_id, 'Unit 1: Rust Fundamentals', 'Ownership, borrowing, and basic syntax', 'orange', 1)
  RETURNING id INTO rust_unit_1_id;

  INSERT INTO public.lessons (unit_id, title, order_index)
  VALUES (rust_unit_1_id, 'Variables and Ownership', 1)
  RETURNING id INTO lesson_id_var;

  INSERT INTO public.questions (lesson_id, type, instruction, code, answer, options, order_index, xp_reward) VALUES
  (lesson_id_var, 'multiple-choice', 'What is Rust''s key feature for memory safety?', NULL, NULL,
   '["Ownership system", "Garbage collection", "Manual memory management", "Reference counting"]'::jsonb, 1, 10),
  (lesson_id_var, 'fill-blank', 'Complete the variable declaration:', 'let ___ x = 5;', 
   'mut', '["mut", "let", "var", "const"]'::jsonb, 2, 15);

  -- Insert Go language
  INSERT INTO public.languages (name, slug, icon, description)
  VALUES ('Go', 'go', 'ðŸ¹', 'Simple and efficient programming language')
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO go_lang_id;
  
  SELECT id INTO go_lang_id FROM public.languages WHERE slug = 'go' LIMIT 1;

  -- Go Unit 1: Basics
  INSERT INTO public.units (language_id, title, description, color, order_index)
  VALUES (go_lang_id, 'Unit 1: Go Basics', 'Packages, functions, and variables', 'cyan', 1)
  RETURNING id INTO go_unit_1_id;

  INSERT INTO public.lessons (unit_id, title, order_index)
  VALUES (go_unit_1_id, 'Hello World and Packages', 1)
  RETURNING id INTO lesson_id_var;

  INSERT INTO public.questions (lesson_id, type, instruction, code, answer, options, order_index, xp_reward) VALUES
  (lesson_id_var, 'fill-blank', 'Complete the package declaration:', 'package ___\n\nimport "fmt"', 
   'main', '["main", "package", "go", "program"]'::jsonb, 1, 15),
  (lesson_id_var, 'code-runner', 'Write a Go program that prints "Hello, Go!"', 
   'package main\n\nimport "fmt"\n\n// Your code here\n', 'Hello, Go!', NULL, 2, 20);

  -- Insert HTML language
  INSERT INTO public.languages (name, slug, icon, description)
  VALUES ('HTML', 'html', 'ðŸŒ', 'Structure web pages')
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO html_lang_id;
  
  SELECT id INTO html_lang_id FROM public.languages WHERE slug = 'html' LIMIT 1;

  -- HTML Unit 1: Structure
  INSERT INTO public.units (language_id, title, description, color, order_index)
  VALUES (html_lang_id, 'Unit 1: HTML Structure', 'Tags, elements, and document structure', 'red', 1)
  RETURNING id INTO html_unit_1_id;

  INSERT INTO public.lessons (unit_id, title, order_index)
  VALUES (html_unit_1_id, 'Basic HTML Tags', 1)
  RETURNING id INTO lesson_id_var;

  INSERT INTO public.questions (lesson_id, type, instruction, code, answer, options, order_index, xp_reward) VALUES
  (lesson_id_var, 'fill-blank', 'Complete the heading tag:', '<___>Welcome</___>', 
   'h1', '["h1", "heading", "title", "header"]'::jsonb, 1, 10),
  (lesson_id_var, 'multiple-choice', 'Which tag is used for the main content?', NULL, NULL,
   '["<main>", "<body>", "<content>", "<div>"]'::jsonb, 2, 10);

  -- HTML Unit 2: Forms
  INSERT INTO public.units (language_id, title, description, color, order_index)
  VALUES (html_lang_id, 'Unit 2: HTML Forms', 'Create interactive forms', 'pink', 2)
  RETURNING id INTO html_unit_2_id;

  INSERT INTO public.lessons (unit_id, title, order_index)
  VALUES (html_unit_2_id, 'Form Elements', 1)
  RETURNING id INTO lesson_id_var;

  INSERT INTO public.questions (lesson_id, type, instruction, code, answer, options, order_index, xp_reward) VALUES
  (lesson_id_var, 'fill-blank', 'Complete the input tag:', '<input type="___" name="email">', 
   'email', '["email", "text", "input", "mail"]'::jsonb, 1, 15);

  -- Insert CSS language
  INSERT INTO public.languages (name, slug, icon, description)
  VALUES ('CSS', 'css', 'ðŸŽ¨', 'Style and design web pages')
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO css_lang_id;
  
  SELECT id INTO css_lang_id FROM public.languages WHERE slug = 'css' LIMIT 1;

  -- CSS Unit 1: Selectors
  INSERT INTO public.units (language_id, title, description, color, order_index)
  VALUES (css_lang_id, 'Unit 1: CSS Selectors', 'Target elements with selectors', 'blue', 1)
  RETURNING id INTO css_unit_1_id;

  INSERT INTO public.lessons (unit_id, title, order_index)
  VALUES (css_unit_1_id, 'Basic Selectors', 1)
  RETURNING id INTO lesson_id_var;

  INSERT INTO public.questions (lesson_id, type, instruction, code, answer, options, order_index, xp_reward) VALUES
  (lesson_id_var, 'fill-blank', 'Complete the class selector:', '.___ { color: red; }', 
   'myClass', '["myClass", ".myClass", "#myClass", "my-class"]'::jsonb, 1, 15),
  (lesson_id_var, 'multiple-choice', 'Which selector targets an element by ID?', NULL, NULL,
   '["#id", ".id", "id", "[id]"]'::jsonb, 2, 10);

  -- CSS Unit 2: Layout
  INSERT INTO public.units (language_id, title, description, color, order_index)
  VALUES (css_lang_id, 'Unit 2: CSS Layout', 'Flexbox and Grid', 'purple', 2)
  RETURNING id INTO css_unit_2_id;

  INSERT INTO public.lessons (unit_id, title, order_index)
  VALUES (css_unit_2_id, 'Flexbox', 1)
  RETURNING id INTO lesson_id_var;

  INSERT INTO public.questions (lesson_id, type, instruction, code, answer, options, order_index, xp_reward) VALUES
  (lesson_id_var, 'fill-blank', 'Complete the flexbox property:', 'display: ___;', 
   'flex', '["flex", "grid", "block", "inline"]'::jsonb, 1, 15);

  -- Insert Angular language
  INSERT INTO public.languages (name, slug, icon, description)
  VALUES ('Angular', 'angular', 'ðŸ…°ï¸', 'Build dynamic web applications')
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO angular_lang_id;
  
  SELECT id INTO angular_lang_id FROM public.languages WHERE slug = 'angular' LIMIT 1;

  -- Angular Unit 1: Components
  INSERT INTO public.units (language_id, title, description, color, order_index)
  VALUES (angular_lang_id, 'Unit 1: Angular Components', 'Create reusable components', 'red', 1)
  RETURNING id INTO angular_unit_1_id;

  INSERT INTO public.lessons (unit_id, title, order_index)
  VALUES (angular_unit_1_id, 'Component Basics', 1)
  RETURNING id INTO lesson_id_var;

  INSERT INTO public.questions (lesson_id, type, instruction, code, answer, options, order_index, xp_reward) VALUES
  (lesson_id_var, 'multiple-choice', 'What decorator is used to define an Angular component?', NULL, NULL,
   '["@Component", "@Component()", "@NgComponent", "@AngularComponent"]'::jsonb, 1, 10),
  (lesson_id_var, 'fill-blank', 'Complete the component selector:', '@Component({\n  selector: "___-app"\n})', 
   'app', '["app", "my", "component", "angular"]'::jsonb, 2, 15);

  -- Insert Database language
  INSERT INTO public.languages (name, slug, icon, description)
  VALUES ('Database', 'database', 'ðŸ—„ï¸', 'Learn database concepts and design')
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO db_lang_id;
  
  SELECT id INTO db_lang_id FROM public.languages WHERE slug = 'database' LIMIT 1;

  -- Database Unit 1: Concepts
  INSERT INTO public.units (language_id, title, description, color, order_index)
  VALUES (db_lang_id, 'Unit 1: Database Fundamentals', 'Tables, relationships, and normalization', 'slate', 1)
  RETURNING id INTO db_unit_1_id;

  INSERT INTO public.lessons (unit_id, title, order_index)
  VALUES (db_unit_1_id, 'Database Concepts', 1)
  RETURNING id INTO lesson_id_var;

  INSERT INTO public.questions (lesson_id, type, instruction, code, answer, options, order_index, xp_reward) VALUES
  (lesson_id_var, 'multiple-choice', 'What is a primary key?', NULL, NULL,
   '["A unique identifier for a row", "A foreign key", "An index", "A constraint"]'::jsonb, 1, 10),
  (lesson_id_var, 'multiple-choice', 'What does ACID stand for in databases?', NULL, NULL,
   '["Atomicity, Consistency, Isolation, Durability", "Access, Control, Integrity, Data", "All, Create, Insert, Delete", "Application, Code, Interface, Database"]'::jsonb, 2, 15);

  -- Insert SQL language
  INSERT INTO public.languages (name, slug, icon, description)
  VALUES ('SQL', 'sql', 'ðŸ“Š', 'Query and manipulate databases')
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO sql_lang_id;
  
  SELECT id INTO sql_lang_id FROM public.languages WHERE slug = 'sql' LIMIT 1;

  -- SQL Unit 1: Queries
  INSERT INTO public.units (language_id, title, description, color, order_index)
  VALUES (sql_lang_id, 'Unit 1: SQL Queries', 'SELECT, WHERE, and JOIN', 'blue', 1)
  RETURNING id INTO sql_unit_1_id;

  INSERT INTO public.lessons (unit_id, title, order_index)
  VALUES (sql_unit_1_id, 'SELECT Statements', 1)
  RETURNING id INTO lesson_id_var;

  INSERT INTO public.questions (lesson_id, type, instruction, code, answer, options, order_index, xp_reward) VALUES
  (lesson_id_var, 'fill-blank', 'Complete the SELECT statement:', 'SELECT ___ FROM users;', 
   '*', '["*", "all", "everything", "data"]'::jsonb, 1, 15),
  (lesson_id_var, 'code-runner', 'Write a SQL query to select all users where age is greater than 18.', 
   '-- Your SQL query here\n', 'SELECT * FROM users WHERE age > 18;', NULL, 2, 20);

  -- SQL Unit 2: Advanced
  INSERT INTO public.units (language_id, title, description, color, order_index)
  VALUES (sql_lang_id, 'Unit 2: Advanced SQL', 'JOINs, GROUP BY, and subqueries', 'indigo', 2)
  RETURNING id INTO sql_unit_2_id;

  INSERT INTO public.lessons (unit_id, title, order_index)
  VALUES (sql_unit_2_id, 'JOIN Operations', 1)
  RETURNING id INTO lesson_id_var;

  INSERT INTO public.questions (lesson_id, type, instruction, code, answer, options, order_index, xp_reward) VALUES
  (lesson_id_var, 'multiple-choice', 'Which JOIN returns all rows from both tables?', NULL, NULL,
   '["FULL OUTER JOIN", "INNER JOIN", "LEFT JOIN", "RIGHT JOIN"]'::jsonb, 1, 15),
  (lesson_id_var, 'fill-blank', 'Complete the INNER JOIN:', 'SELECT * FROM users\nINNER JOIN orders ON users.id = orders.___;', 
   'user_id', '["user_id", "id", "users.id", "order_id"]'::jsonb, 2, 15);

END $$;
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
      -- No freeze available â†’ reset
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

-- Add active_language_id to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS active_language_id UUID REFERENCES public.languages(id);

-- Create partial lesson progress table to save progress mid-lesson
CREATE TABLE public.partial_lesson_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  current_question_index INTEGER NOT NULL DEFAULT 0,
  answered_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

-- Enable RLS
ALTER TABLE public.partial_lesson_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own partial progress"
ON public.partial_lesson_progress
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own partial progress"
ON public.partial_lesson_progress
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own partial progress"
ON public.partial_lesson_progress
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own partial progress"
ON public.partial_lesson_progress
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_partial_lesson_progress_updated_at
BEFORE UPDATE ON public.partial_lesson_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
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
-- Create league_thresholds table for admin configuration
CREATE TABLE public.league_thresholds (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  league text NOT NULL UNIQUE,
  promotion_xp_threshold integer NOT NULL DEFAULT 0,
  demotion_xp_threshold integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.league_thresholds ENABLE ROW LEVEL SECURITY;

-- Anyone can view thresholds
CREATE POLICY "Anyone can view league thresholds"
ON public.league_thresholds
FOR SELECT
USING (true);

-- Only admins can manage thresholds
CREATE POLICY "Admins can manage league thresholds"
ON public.league_thresholds
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default thresholds
INSERT INTO public.league_thresholds (league, promotion_xp_threshold, demotion_xp_threshold)
VALUES 
  ('bronze', 500, 0),
  ('silver', 1000, 200),
  ('gold', 2000, 500),
  ('diamond', 0, 1000);

-- Add trigger for updated_at
CREATE TRIGGER update_league_thresholds_updated_at
BEFORE UPDATE ON public.league_thresholds
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- RLS policies for daily_quests to allow admin management
CREATE POLICY "Admins can manage daily quests"
ON public.daily_quests
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add last_streak_freeze_used column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_streak_freeze_used timestamp with time zone;
-- Migrate lesson_progress.lesson_id from INTEGER to UUID to match lessons.id
-- Existing progress rows are removed since integer IDs cannot be mapped to lesson UUIDs.

-- Drop unique constraint so we can change the column
ALTER TABLE public.lesson_progress
  DROP CONSTRAINT IF EXISTS lesson_progress_user_id_lesson_id_key;

-- Add new UUID column
ALTER TABLE public.lesson_progress
  ADD COLUMN IF NOT EXISTS lesson_id_new uuid REFERENCES public.lessons(id) ON DELETE CASCADE;

-- Clear existing progress (integer lesson_id cannot be mapped to UUID)
DELETE FROM public.lesson_progress;

-- Replace old column with new
ALTER TABLE public.lesson_progress
  DROP COLUMN IF EXISTS lesson_id;

ALTER TABLE public.lesson_progress
  RENAME COLUMN lesson_id_new TO lesson_id;

ALTER TABLE public.lesson_progress
  ALTER COLUMN lesson_id SET NOT NULL;

ALTER TABLE public.lesson_progress
  ADD CONSTRAINT lesson_progress_user_id_lesson_id_key UNIQUE (user_id, lesson_id);
-- Add daily XP tracking for daily goal (resets each day)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS daily_xp integer NOT NULL DEFAULT 0;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_daily_reset_at date;

-- Backfill: set last_daily_reset_at to today for existing rows so first XP add will reset daily_xp
UPDATE public.profiles
  SET last_daily_reset_at = CURRENT_DATE
  WHERE last_daily_reset_at IS NULL;
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
-- Fix league values for all users based on their XP
-- Sync the league column with actual XP values

UPDATE profiles SET league = CASE
  WHEN xp >= 3000 THEN 'diamond'
  WHEN xp >= 1500 THEN 'gold'
  WHEN xp >= 500 THEN 'silver'
  ELSE 'bronze'
END;

-- Also add a trigger to keep league in sync when XP changes
CREATE OR REPLACE FUNCTION public.sync_user_league()
RETURNS TRIGGER AS $$
BEGIN
  NEW.league := CASE
    WHEN NEW.xp >= 3000 THEN 'diamond'
    WHEN NEW.xp >= 1500 THEN 'gold'
    WHEN NEW.xp >= 500 THEN 'silver'
    ELSE 'bronze'
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS sync_league_on_xp_change ON public.profiles;
CREATE TRIGGER sync_league_on_xp_change
  BEFORE UPDATE OF xp ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_league();
-- Add onboarding fields to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS daily_goal_minutes integer NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS referral_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by text;

-- Generate unique referral codes for existing users
UPDATE public.profiles 
SET referral_code = UPPER(SUBSTRING(MD5(user_id::text || RANDOM()::text), 1, 8))
WHERE referral_code IS NULL;

-- Referrals tracking table
CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id uuid NOT NULL REFERENCES public.profiles(user_id),
  referred_user_id uuid NOT NULL REFERENCES public.profiles(user_id),
  referral_code text NOT NULL,
  gems_awarded integer NOT NULL DEFAULT 50,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own referrals"
ON public.referrals FOR SELECT
USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);

-- Function to generate referral code for new users
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := UPPER(SUBSTRING(MD5(NEW.user_id::text || NOW()::text), 1, 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS set_referral_code ON public.profiles;
CREATE TRIGGER set_referral_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_referral_code();
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

-- Make policy creation idempotent so this migration can be re-run safely
DROP POLICY IF EXISTS "Users can manage own study_sessions" ON public.study_sessions;
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
-- Seed a richer set of default achievements for CodeBear.
-- Safe to run multiple times: uses INSERT .. ON CONFLICT DO NOTHING.

INSERT INTO public.achievements (id, name, description, icon, requirement_type, requirement_value)
VALUES
  -- Learning milestones
  ('00000000-0000-0000-0000-000000000101', 'First Lesson', 'Complete your very first lesson.', 'book-open', 'lessons_completed', 1),
  ('00000000-0000-0000-0000-000000000102', 'Getting Started', 'Complete 5 lessons.', 'book-open', 'lessons_completed', 5),
  ('00000000-0000-0000-0000-000000000103', 'Lesson Grinder', 'Complete 20 lessons.', 'graduation-cap', 'lessons_completed', 20),

  -- Streaks
  ('00000000-0000-0000-0000-000000000201', 'Tiny Flame', 'Keep a 3-day streak.', 'flame', 'streak', 3),
  ('00000000-0000-0000-0000-000000000202', 'Weekly Warrior', 'Keep a 7-day streak.', 'flame', 'streak', 7),
  ('00000000-0000-0000-0000-000000000203', 'Unstoppable', 'Reach a 30-day streak.', 'fire', 'streak', 30),

  -- XP Milestones
  ('00000000-0000-0000-0000-000000000301', 'Level Up', 'Earn 500 XP.', 'zap', 'xp', 500),
  ('00000000-0000-0000-0000-000000000302', 'XP Collector', 'Earn 2,000 XP.', 'star', 'xp', 2000),
  ('00000000-0000-0000-0000-000000000303', 'XP Legend', 'Earn 10,000 XP.', 'crown', 'xp', 10000),

  -- Perfect lessons
  ('00000000-0000-0000-0000-000000000401', 'Perfectionist', 'Finish 1 lesson with 100% accuracy.', 'award', 'perfect_lesson', 1),
  ('00000000-0000-0000-0000-000000000402', 'Sharp Mind', 'Finish 5 lessons with 100% accuracy.', 'medal', 'perfect_lesson', 5),

  -- League milestones
  ('00000000-0000-0000-0000-000000000501', 'Climb the Ranks', 'Reach Silver league or higher.', 'trophy', 'league', 1),
  ('00000000-0000-0000-0000-000000000502', 'Gold Champion', 'Reach Gold league or higher.', 'trophy', 'league', 2),
  ('00000000-0000-0000-0000-000000000503', 'Diamond Elite', 'Reach Diamond league.', 'trophy', 'league', 3),

  -- Social / challenges
  ('00000000-0000-0000-0000-000000000601', 'First Friend', 'Follow 1 learner.', 'users', 'following', 1),
  ('00000000-0000-0000-0000-000000000602', 'Study Squad', 'Follow 5 learners.', 'users', 'following', 5),
  ('00000000-0000-0000-0000-000000000603', 'Quest Starter', 'Complete 3 quests.', 'target', 'challenges', 3),
  ('00000000-0000-0000-0000-000000000604', 'Quest Master', 'Complete 15 quests.', 'target', 'challenges', 15)
ON CONFLICT (id) DO NOTHING;


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

-- Shop items table for admin-managed shop
CREATE TABLE public.shop_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL DEFAULT 'ðŸŽ',
  price integer NOT NULL DEFAULT 100,
  currency text NOT NULL DEFAULT 'gems',
  color text NOT NULL DEFAULT 'bg-primary',
  action_type text NOT NULL DEFAULT 'custom',
  is_active boolean NOT NULL DEFAULT true,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active shop items"
ON public.shop_items FOR SELECT
USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage shop items"
ON public.shop_items FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Sound settings table for admin-managed sounds
CREATE TABLE public.sound_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sound_key text NOT NULL UNIQUE,
  label text NOT NULL,
  sound_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sound_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view sound settings"
ON public.sound_settings FOR SELECT
USING (true);

CREATE POLICY "Admins can manage sound settings"
ON public.sound_settings FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed default sound settings
INSERT INTO public.sound_settings (sound_key, label, sound_url) VALUES
('correct', 'Correct Answer', 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3'),
('incorrect', 'Wrong Answer', 'https://assets.mixkit.co/active_storage/sfx/2955/2955-preview.mp3'),
('complete', 'Lesson Complete', 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3'),
('click', 'Button Click', 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'),
('background_music', 'Lesson Background Music', NULL);

-- Seed default shop items (matching current hardcoded items)
INSERT INTO public.shop_items (title, description, icon, price, currency, color, action_type, order_index) VALUES
('Heart Refill', 'Get all your hearts back', 'â¤ï¸', 450, 'gems', 'bg-destructive', 'heart_refill', 0),
('Streak Freeze', 'Protect your streak if you miss a day', 'ðŸ§Š', 200, 'gems', 'bg-secondary', 'streak_freeze', 1),
('Double XP', 'Earn 2x XP for 15 minutes', 'âš¡', 100, 'gems', 'bg-golden', 'double_xp', 2);

-- Create storage bucket for sound files
INSERT INTO storage.buckets (id, name, public) VALUES ('sounds', 'sounds', true);

CREATE POLICY "Anyone can view sounds"
ON storage.objects FOR SELECT
USING (bucket_id = 'sounds');

CREATE POLICY "Admins can upload sounds"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'sounds' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update sounds"
ON storage.objects FOR UPDATE
USING (bucket_id = 'sounds' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete sounds"
ON storage.objects FOR DELETE
USING (bucket_id = 'sounds' AND has_role(auth.uid(), 'admin'::app_role));
-- Seed 20 additional achievements for CodeBear.
-- Uses INSERT .. ON CONFLICT DO NOTHING to avoid duplicates.

INSERT INTO public.achievements (id, name, description, icon, requirement_type, requirement_value)
VALUES
  -- More Learning milestones (104-108)
  ('00000000-0000-0000-0000-000000000104', 'Bookworm', 'Complete 50 lessons.', 'book-open', 'lessons_completed', 50),
  ('00000000-0000-0000-0000-000000000105', 'Scholar', 'Complete 100 lessons.', 'graduation-cap', 'lessons_completed', 100),
  ('00000000-0000-0000-0000-000000000106', 'Professor', 'Complete 250 lessons.', 'graduation-cap', 'lessons_completed', 250),
  ('00000000-0000-0000-0000-000000000107', 'Grandmaster', 'Complete 500 lessons.', 'crown', 'lessons_completed', 500),

  -- More Streaks (204-208)
  ('00000000-0000-0000-0000-000000000204', 'Inferno', 'Reach a 50-day streak.', 'flame', 'streak', 50),
  ('00000000-0000-0000-0000-000000000205', 'Century Flame', 'Reach a 100-day streak.', 'fire', 'streak', 100),
  ('00000000-0000-0000-0000-000000000206', 'Half-year Hero', 'Reach a 180-day streak.', 'crown', 'streak', 180),
  ('00000000-0000-0000-0000-000000000207', 'An Entire Year', 'Reach a 365-day streak.', 'star', 'streak', 365),

  -- More XP Milestones (304-308)
  ('00000000-0000-0000-0000-000000000304', 'XP Hoarder', 'Earn 25,000 XP.', 'zap', 'xp', 25000),
  ('00000000-0000-0000-0000-000000000305', 'XP Millionaire', 'Earn 50,000 XP.', 'gem', 'xp', 50000),
  ('00000000-0000-0000-0000-000000000306', 'XP Deity', 'Earn 100,000 XP.', 'crown', 'xp', 100000),

  -- More Perfect Lessons (403-407)
  ('00000000-0000-0000-0000-000000000403', 'Flawless Mind', 'Finish 20 lessons with 100% accuracy.', 'award', 'perfect_lesson', 20),
  ('00000000-0000-0000-0000-000000000404', 'No Mistakes', 'Finish 50 lessons with 100% accuracy.', 'medal', 'perfect_lesson', 50),
  ('00000000-0000-0000-0000-000000000405', 'Absolute Perfection', 'Finish 100 lessons with 100% accuracy.', 'diamond', 'perfect_lesson', 100),

  -- More Social/Challenges (605-610)
  ('00000000-0000-0000-0000-000000000605', 'Friendly Face', 'Follow 15 learners.', 'users', 'following', 15),
  ('00000000-0000-0000-0000-000000000606', 'Social Butterfly', 'Follow 50 learners.', 'users', 'following', 50),
  ('00000000-0000-0000-0000-000000000607', 'Role Model', 'Follow 100 learners.', 'users', 'following', 100),
  
  ('00000000-0000-0000-0000-000000000608', 'Quest Hunter', 'Complete 30 quests.', 'target', 'challenges', 30),
  ('00000000-0000-0000-0000-000000000609', 'Quest Conqueror', 'Complete 50 quests.', 'swords', 'challenges', 50),
  ('00000000-0000-0000-0000-000000000610', 'Daily Grinder', 'Complete 100 quests.', 'swords', 'challenges', 100)
ON CONFLICT (id) DO NOTHING;
-- Fix syntax error in process_weekly_leagues (PostgreSQL Code 42P10)
-- Replaces "SELECT DISTINCT league FROM profiles ORDER BY CASE..." with a static ordered array.
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
  -- Process each league in order
  FOR league_name IN SELECT unnest(ARRAY['bronze', 'silver', 'gold', 'diamond'])
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
  UPDATE profiles SET weekly_xp = 0 WHERE weekly_xp > 0;
END;
$function$;
-- Add target_value to allow dynamic daily quest goals (like user's selected XP target)
ALTER TABLE public.user_quest_progress 
ADD COLUMN target_value INTEGER;
-- Add a tour_completed flag to profiles to track if a user has completed the onboarding product tour
ALTER TABLE public.profiles
ADD COLUMN tour_completed BOOLEAN NOT NULL DEFAULT false;

-- Add a comment to describe the new column
COMMENT ON COLUMN public.profiles.tour_completed IS 'Flag indicating whether the user has completed the product tour onboarding';
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
-- Migration to seed Swift language, unit, and notes dynamically
DO $$
DECLARE
    v_language_id uuid;
    v_unit_id uuid;
BEGIN
    -- 1. Get or create Swift language
    SELECT id INTO v_language_id FROM public.languages WHERE slug = 'swift';
    
    IF v_language_id IS NULL THEN
        INSERT INTO public.languages (name, slug, icon, description, is_active)
        VALUES ('Swift', 'swift', 'ðŸ“±', 'Learn iOS development', true)
        RETURNING id INTO v_language_id;
    END IF;

    -- 2. Get or create Swift Unit 1
    SELECT id INTO v_unit_id FROM public.units 
    WHERE language_id = v_language_id ORDER BY order_index ASC LIMIT 1;

    IF v_unit_id IS NULL THEN
        INSERT INTO public.units (language_id, title, description, color, order_index, is_active)
        VALUES (v_language_id, 'Unit 1: Swift Basics', 'Introduction to Swift programming', 'orange', 0, true)
        RETURNING id INTO v_unit_id;
    END IF;

    -- 3. Delete existing notes for this unit to prevent duplicates if migration is re-run
    DELETE FROM public.unit_notes WHERE unit_id = v_unit_id;

    -- 4. Insert notes
    INSERT INTO public.unit_notes (unit_id, title, content, order_index)
    VALUES
    (v_unit_id, 'Chapter 1: Introduction to Swift', 'Swift is a powerful, intuitive programming language developed by Apple for iOS, macOS, watchOS, and tvOS. It is designed to be safe, fast, and expressive.

## 1.1 Hello World
In Swift, a complete program can be as short as one line. You don''t need to import separate libraries for basic functionality like input/output.

print("Hello, World!")

## 1.2 Comments
Comments are ignored by the compiler and are used to explain code.

// This is a single-line comment

/* 
This is a 
multi-line comment 
*/', 0),
    (v_unit_id, 'Chapter 2: Variables, Constants, and Data Types', 'Swift is a type-safe language, meaning it encourages you to be clear about the types of values your code can work with.

## 2.1 Variables and Constants
Use let to make a constant (a value that cannot change) and var to make a variable (a value that can change).

var myVariable = 42
myVariable = 50 // Allowed

let myConstant = 42
// myConstant = 50 // Error: Cannot assign to value: ''myConstant'' is a ''let'' constant

## 2.2 Explicit Data Types
Swift usually infers the type of a variable based on its initial value (Type Inference). However, you can also explicitly declare the type.

let implicitInteger = 70
let implicitDouble = 70.0
let explicitDouble: Double = 70
let isLearningSwift: Bool = true
let greeting: String = "Welcome"', 1),
    (v_unit_id, 'Chapter 3: Basic Operators', 'Operators are special symbols or phrases that you use to check, change, or combine values.

## 3.1 Arithmetic and Assignment
Swift supports standard arithmetic operators and combines assignment with operation.

var score = 10
score += 5 // score is now 15
let total = score * 2 // total is 30
let remainder = 10 % 3 // remainder is 1

## 3.2 Comparison and Logical Operators
Used primarily in control flow to evaluate conditions.

let isEqual = (1 == 1) // true
let isNotEqual = (2 != 1) // true
let isGreater = (5 > 3) // true

let hasKey = true
let knowsPassword = false
let canEnter = hasKey && knowsPassword // false (AND operator)
let canTry = hasKey || knowsPassword // true (OR operator)', 2),
    (v_unit_id, 'Chapter 4: Strings and Characters', 'Strings in Swift are Unicode-compliant and offer powerful ways to manipulate text.

## 4.1 String Interpolation
You can easily inject variables directly into a string using \().

let apples = 3
let oranges = 5
let fruitSummary = "I have \(apples + oranges) pieces of fruit."
// "I have 8 pieces of fruit."

## 4.2 Multi-line Strings
Use three double quotation marks for strings that span multiple lines.

let quotation = """
Even though there''s whitespace to the left,
the actual lines aren''t indented.
"""', 3),
    (v_unit_id, 'Chapter 5: Control Flow', 'Control flow allows you to dictate the path your code takes based on conditions.

## 5.1 If Statements

let temperature = 25
if temperature > 30 {
    print("It''s hot outside.")
} else if temperature < 10 {
    print("It''s cold outside.")
} else {
    print("The weather is nice.")
}

## 5.2 Switch Statements
Switch statements in Swift are very powerful, must be exhaustive, and do not fall through by default (no break statement needed).

let vegetable = "red pepper"
switch vegetable {
case "celery":
    print("Add some raisins.")
case "cucumber", "watercress":
    print("That would make a good tea sandwich.")
case let x where x.hasSuffix("pepper"):
    print("Is it a spicy \(x)?") // This will execute
default:
    print("Everything tastes good in soup.")
}

## 5.3 Loops (For-In and While)

// For-In Loop
for index in 1...5 {
    print("This is loop number \(index)")
}

// While Loop
var n = 2
while n < 100 {
    n *= 2
}', 4),
    (v_unit_id, 'Chapter 6: Collections (Arrays, Sets, Dictionaries)', 'Collections are used to store multiple values in a single variable.

## 6.1 Arrays
Ordered collections of values.

var shoppingList: [String] = ["Eggs", "Milk"]
shoppingList.append("Flour")
let firstItem = shoppingList[0] // "Eggs"

## 6.2 Dictionaries
Unordered collections of key-value pairs.

var occupations = [
    "Malcolm": "Captain",
    "Kaylee": "Mechanic"
]
occupations["Jayne"] = "Public Relations"

## 6.3 Sets
Unordered collections of unique values.

var favoriteGenres: Set<String> = ["Rock", "Classical", "Hip hop"]
favoriteGenres.insert("Jazz")', 5),
    (v_unit_id, 'Chapter 7: Functions and Closures', 'Functions are self-contained chunks of code that perform a specific task. Closures are like unnamed functions you can pass around.

## 7.1 Defining and Calling Functions
Functions use the func keyword. You can define parameter names and return types ->.

func greet(person: String, day: String) -> String {
    return "Hello \(person), today is \(day)."
}
print(greet(person: "Bob", day: "Tuesday"))

## 7.2 Argument Labels
You can provide a label for the caller to use, and a separate name for use inside the function. Use _ to omit a label.

func greet(_ person: String, on day: String) -> String {
    return "Hello \(person), today is \(day)."
}
print(greet("John", on: "Wednesday"))

## 7.3 Closures
Closures are blocks of code that can be passed as variables.

let numbers = [1, 5, 3, 12, 2]
// Sorting using a closure
let sortedNumbers = numbers.sorted { (a, b) -> Bool in
    return a < b
}
// Shorthand syntax
let quickSorted = numbers.sorted { $0 < $1 }', 6),
    (v_unit_id, 'Chapter 8: Optionals and Error Handling', 'Swift uses Optionals to handle the absence of a value safely.

## 8.1 Optionals
An optional either contains a value or contains nil (no value).

var optionalString: String? = "Hello"
print(optionalString == nil) // false
optionalString = nil // Now it contains no value

## 8.2 Unwrapping Optionals (If Let / Guard Let)
You must unwrap an optional to use its value safely.

var optionalName: String? = "John Appleseed"

// Using if let
if let name = optionalName {
    print("Hello, \(name)") // Executes if optionalName is not nil
}

// Using guard let (early exit)
func greetUser(name: String?) {
    guard let unwrappedName = name else {
        print("No name provided")
        return
    }
    print("Welcome, \(unwrappedName)")
}

## 8.3 Error Handling
Use throw, try, do, and catch to handle errors.

enum PrinterError: Error {
    case outOfPaper
    case noToner
}

func sendToPrinter(jobs: Int) throws -> String {
    if jobs > 5 { throw PrinterError.outOfPaper }
    return "Job sent"
}

do {
    let response = try sendToPrinter(jobs: 6)
    print(response)
} catch PrinterError.outOfPaper {
    print("Please add paper.")
} catch {
    print(error)
}', 7),
    (v_unit_id, 'Chapter 9: Enumerations (Enums)', 'Enums define a common type for a group of related values.

## 9.1 Basic Enums

enum CompassPoint {
    case north, south, east, west
}
var direction = CompassPoint.north

## 9.2 Associated Values
Enums can store additional information alongside their cases.

enum Barcode {
    case upc(Int, Int, Int, Int)
    case qrCode(String)
}

var productBarcode = Barcode.upc(8, 85909, 51226, 3)', 8),
    (v_unit_id, 'Chapter 10: Structures and Classes', 'Structs and classes are the building blocks of flexible, custom data types.

## 10.1 Structs (Value Types)
Structs are copied when they are passed around in your code.

struct Resolution {
    var width = 0
    var height = 0
}
var hd = Resolution(width: 1920, height: 1080)
var cinema = hd
cinema.width = 2048 // hd.width is still 1920. They are separate copies.

## 10.2 Classes (Reference Types)
Classes are passed by reference. Multiple variables can point to the same class instance.

class VideoMode {
    var resolution = Resolution()
    var interlaced = false
    var frameRate = 0.0
}
let tenEighty = VideoMode()
let alsoTenEighty = tenEighty
alsoTenEighty.frameRate = 30.0 // tenEighty.frameRate is also 30.0', 9),
    (v_unit_id, 'Chapter 11: Properties and Methods', 'Properties associate values with a particular class, structure, or enumeration. Methods are functions associated with a type.

## 11.1 Computed Properties
Properties that don''t store a value directly but provide a getter and a setter to calculate values dynamically.

struct Square {
    var sideLength: Double
    var area: Double {
        get {
            return sideLength * sideLength
        }
        set {
            sideLength = newValue.squareRoot()
        }
    }
}

## 11.2 Methods

class Counter {
    var count = 0
    func increment() {
        count += 1
    }
}', 10),
    (v_unit_id, 'Chapter 12: Initialization', 'Initialization is the process of preparing an instance of a class, structure, or enum for use.

## 12.1 Init Methods
Classes and structs must have all their properties set to an initial value by the time initialization completes.

struct Fahrenheit {
    var temperature: Double
    init() {
        temperature = 32.0
    }
}
var f = Fahrenheit()

## 12.2 Custom Initializers

struct Celsius {
    var temperatureInCelsius: Double
    init(fromFahrenheit fahrenheit: Double) {
        temperatureInCelsius = (fahrenheit - 32.0) / 1.8
    }
}
let boilingPointOfWater = Celsius(fromFahrenheit: 212.0)', 11),
    (v_unit_id, 'Chapter 13: Protocols and Extensions', 'Protocols define a blueprint of methods, properties, and other requirements. Extensions add new functionality to an existing class, structure, enum, or protocol.

## 13.1 Protocols

protocol FullyNamed {
    var fullName: String { get }
}

struct Person: FullyNamed {
    var fullName: String
}
let john = Person(fullName: "John Doe")

## 13.2 Extensions

extension Double {
    var km: Double { return self * 1_000.0 }
    var m: Double { return self }
}
let distance = 25.4.km // 25400.0', 12),
    (v_unit_id, 'Chapter 14: Generics', 'Generics enable you to write flexible, reusable functions and types that can work with any type.

## 14.1 Generic Functions
The placeholder <T> tells Swift that T is a generic placeholder type name.

func swapTwoValues<T>(_ a: inout T, _ b: inout T) {
    let temporaryA = a
    a = b
    b = temporaryA
}

var firstInt = 3
var secondInt = 107
swapTwoValues(&firstInt, &secondInt) // Works with Ints

var firstString = "hello"
var secondString = "world"
swapTwoValues(&firstString, &secondString) // Works with Strings', 13),
    (v_unit_id, 'Chapter 15: Memory Management (ARC)', 'Swift uses Automatic Reference Counting (ARC) to track and manage your app''s memory usage. In most cases, memory management "just works," but you need to be aware of retain cycles.

## 15.1 Strong Reference Cycles
If two class instances hold a "strong" reference to each other, ARC can never free them.

class Person {
    var apartment: Apartment?
    // deinit is called when the object is destroyed
    deinit { print("Person deallocated") } 
}

class Apartment {
    var tenant: Person?
    deinit { print("Apartment deallocated") }
}

## 15.2 Weak and Unowned References
To resolve strong reference cycles, use weak or unowned before a property declaration. Weak references do not keep a strong hold on the instance they refer to and must be optional variables.

class SafeApartment {
    weak var tenant: Person? // Weak prevents the retain cycle
}', 14);
END $$;
-- Migrate challenges.lesson_id from INTEGER to UUID to match lessons.id
-- Existing challenges are removed since integer IDs cannot be mapped to lesson UUIDs.

-- Add new UUID column
ALTER TABLE public.challenges
  ADD COLUMN IF NOT EXISTS lesson_id_new uuid REFERENCES public.lessons(id) ON DELETE CASCADE;

-- Clear existing challenges (integer lesson_id cannot be mapped to UUID)
DELETE FROM public.challenges;

-- Replace old column with new
ALTER TABLE public.challenges
  DROP COLUMN IF EXISTS lesson_id;

ALTER TABLE public.challenges
  RENAME COLUMN lesson_id_new TO lesson_id;

ALTER TABLE public.challenges
  ALTER COLUMN lesson_id SET NOT NULL;
