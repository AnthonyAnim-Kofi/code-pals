-- Ensure only one streak trigger exists on lesson completion.
-- Older migrations created two differently named triggers, which can cause duplicate executions.

DROP TRIGGER IF EXISTS on_lesson_complete_update_streak ON public.lesson_progress;
DROP TRIGGER IF EXISTS update_streak_on_lesson_complete ON public.lesson_progress;

CREATE TRIGGER on_lesson_complete_update_streak
AFTER INSERT OR UPDATE OF completed ON public.lesson_progress
FOR EACH ROW
WHEN (NEW.completed = true)
EXECUTE FUNCTION public.update_user_streak();
