-- Add advanced_start_unit_id to profiles to persist expert jump points
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS advanced_start_unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.profiles.advanced_start_unit_id IS 'Persists the unit that an intermediate/advanced user has explicitly jumped to.';
