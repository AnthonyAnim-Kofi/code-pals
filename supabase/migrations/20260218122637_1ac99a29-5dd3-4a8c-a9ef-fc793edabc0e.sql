-- Fix league values for all users based on their XP
-- Sync the league column with actual XP values

UPDATE profiles SET league = CASE
  WHEN xp >= 3000 THEN 'diamond'
  WHEN xp >= 1500 THEN 'gold'
  WHEN xp >= 500 THEN 'silver'
  ELSE 'bronze'
END;

-- Also add a trigger to keep league in sync when XP changes
CREATE OR REPLACE FUNCTION public.sync_user_league()
RETURNS TRIGGER AS $$
BEGIN
  NEW.league := CASE
    WHEN NEW.xp >= 3000 THEN 'diamond'
    WHEN NEW.xp >= 1500 THEN 'gold'
    WHEN NEW.xp >= 500 THEN 'silver'
    ELSE 'bronze'
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS sync_league_on_xp_change ON public.profiles;
CREATE TRIGGER sync_league_on_xp_change
  BEFORE UPDATE OF xp ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_league();