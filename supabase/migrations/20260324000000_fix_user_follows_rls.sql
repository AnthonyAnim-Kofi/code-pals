-- Fix user_follows schema by correcting any stray medical_following_id column
-- and ensuring RLS policies exist (idempotent setup).

DO $$
BEGIN
  -- If the typo column exists, rename it
  IF EXISTS(
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_follows' AND column_name = 'medical_following_id'
  ) THEN
    ALTER TABLE public.user_follows RENAME COLUMN medical_following_id TO following_id;
  END IF;
END $$;

-- Enforce RLS
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

-- Re-create policies idempotently
DROP POLICY IF EXISTS "Users can view all follows" ON public.user_follows;
CREATE POLICY "Users can view all follows" ON public.user_follows FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can follow others" ON public.user_follows;
CREATE POLICY "Users can follow others" ON public.user_follows FOR INSERT WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Users can unfollow" ON public.user_follows;
CREATE POLICY "Users can unfollow" ON public.user_follows FOR DELETE USING (auth.uid() = follower_id);
