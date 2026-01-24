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