-- Add a tour_completed flag to profiles to track if a user has completed the onboarding product tour
ALTER TABLE public.profiles
ADD COLUMN tour_completed BOOLEAN NOT NULL DEFAULT false;

-- Add a comment to describe the new column
COMMENT ON COLUMN public.profiles.tour_completed IS 'Flag indicating whether the user has completed the product tour onboarding';
