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
