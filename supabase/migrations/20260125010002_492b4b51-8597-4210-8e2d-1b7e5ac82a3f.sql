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