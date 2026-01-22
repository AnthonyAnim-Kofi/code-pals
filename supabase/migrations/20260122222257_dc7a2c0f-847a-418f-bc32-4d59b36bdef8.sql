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