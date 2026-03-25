-- Add coding_experience to profiles
ALTER TABLE public.profiles ADD COLUMN coding_experience text;

-- Existing users automatically get grand-fathered in as 'advanced'
UPDATE public.profiles SET coding_experience = 'advanced';

-- Make it mandatory and default to beginner for anyone failing the signup form
ALTER TABLE public.profiles ALTER COLUMN coding_experience SET DEFAULT 'beginner';
ALTER TABLE public.profiles ALTER COLUMN coding_experience SET NOT NULL;

-- Update function to auto-create profile on signup to map the experience level payload
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, username, coding_experience)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Learner'), 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'coding_experience', 'beginner')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
