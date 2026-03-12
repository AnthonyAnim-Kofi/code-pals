-- Seed 20 additional achievements for CodeBear.
-- Uses INSERT .. ON CONFLICT DO NOTHING to avoid duplicates.

INSERT INTO public.achievements (id, name, description, icon, requirement_type, requirement_value)
VALUES
  -- More Learning milestones (104-108)
  ('00000000-0000-0000-0000-000000000104', 'Bookworm', 'Complete 50 lessons.', 'book-open', 'lessons_completed', 50),
  ('00000000-0000-0000-0000-000000000105', 'Scholar', 'Complete 100 lessons.', 'graduation-cap', 'lessons_completed', 100),
  ('00000000-0000-0000-0000-000000000106', 'Professor', 'Complete 250 lessons.', 'graduation-cap', 'lessons_completed', 250),
  ('00000000-0000-0000-0000-000000000107', 'Grandmaster', 'Complete 500 lessons.', 'crown', 'lessons_completed', 500),

  -- More Streaks (204-208)
  ('00000000-0000-0000-0000-000000000204', 'Inferno', 'Reach a 50-day streak.', 'flame', 'streak', 50),
  ('00000000-0000-0000-0000-000000000205', 'Century Flame', 'Reach a 100-day streak.', 'fire', 'streak', 100),
  ('00000000-0000-0000-0000-000000000206', 'Half-year Hero', 'Reach a 180-day streak.', 'crown', 'streak', 180),
  ('00000000-0000-0000-0000-000000000207', 'An Entire Year', 'Reach a 365-day streak.', 'star', 'streak', 365),

  -- More XP Milestones (304-308)
  ('00000000-0000-0000-0000-000000000304', 'XP Hoarder', 'Earn 25,000 XP.', 'zap', 'xp', 25000),
  ('00000000-0000-0000-0000-000000000305', 'XP Millionaire', 'Earn 50,000 XP.', 'gem', 'xp', 50000),
  ('00000000-0000-0000-0000-000000000306', 'XP Deity', 'Earn 100,000 XP.', 'crown', 'xp', 100000),

  -- More Perfect Lessons (403-407)
  ('00000000-0000-0000-0000-000000000403', 'Flawless Mind', 'Finish 20 lessons with 100% accuracy.', 'award', 'perfect_lesson', 20),
  ('00000000-0000-0000-0000-000000000404', 'No Mistakes', 'Finish 50 lessons with 100% accuracy.', 'medal', 'perfect_lesson', 50),
  ('00000000-0000-0000-0000-000000000405', 'Absolute Perfection', 'Finish 100 lessons with 100% accuracy.', 'diamond', 'perfect_lesson', 100),

  -- More Social/Challenges (605-610)
  ('00000000-0000-0000-0000-000000000605', 'Friendly Face', 'Follow 15 learners.', 'users', 'following', 15),
  ('00000000-0000-0000-0000-000000000606', 'Social Butterfly', 'Follow 50 learners.', 'users', 'following', 50),
  ('00000000-0000-0000-0000-000000000607', 'Role Model', 'Follow 100 learners.', 'users', 'following', 100),
  
  ('00000000-0000-0000-0000-000000000608', 'Quest Hunter', 'Complete 30 quests.', 'target', 'challenges', 30),
  ('00000000-0000-0000-0000-000000000609', 'Quest Conqueror', 'Complete 50 quests.', 'swords', 'challenges', 50),
  ('00000000-0000-0000-0000-000000000610', 'Daily Grinder', 'Complete 100 quests.', 'swords', 'challenges', 100)
ON CONFLICT (id) DO NOTHING;
