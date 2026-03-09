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

