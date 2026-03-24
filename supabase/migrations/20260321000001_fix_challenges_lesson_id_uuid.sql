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
