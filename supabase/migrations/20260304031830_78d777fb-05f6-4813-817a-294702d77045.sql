
-- Shop items table for admin-managed shop
CREATE TABLE public.shop_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL DEFAULT '🎁',
  price integer NOT NULL DEFAULT 100,
  currency text NOT NULL DEFAULT 'gems',
  color text NOT NULL DEFAULT 'bg-primary',
  action_type text NOT NULL DEFAULT 'custom',
  is_active boolean NOT NULL DEFAULT true,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active shop items"
ON public.shop_items FOR SELECT
USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage shop items"
ON public.shop_items FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Sound settings table for admin-managed sounds
CREATE TABLE public.sound_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sound_key text NOT NULL UNIQUE,
  label text NOT NULL,
  sound_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sound_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view sound settings"
ON public.sound_settings FOR SELECT
USING (true);

CREATE POLICY "Admins can manage sound settings"
ON public.sound_settings FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed default sound settings
INSERT INTO public.sound_settings (sound_key, label, sound_url) VALUES
('correct', 'Correct Answer', 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3'),
('incorrect', 'Wrong Answer', 'https://assets.mixkit.co/active_storage/sfx/2955/2955-preview.mp3'),
('complete', 'Lesson Complete', 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3'),
('click', 'Button Click', 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'),
('background_music', 'Lesson Background Music', NULL);

-- Seed default shop items (matching current hardcoded items)
INSERT INTO public.shop_items (title, description, icon, price, currency, color, action_type, order_index) VALUES
('Heart Refill', 'Get all your hearts back', '❤️', 450, 'gems', 'bg-destructive', 'heart_refill', 0),
('Streak Freeze', 'Protect your streak if you miss a day', '🧊', 200, 'gems', 'bg-secondary', 'streak_freeze', 1),
('Double XP', 'Earn 2x XP for 15 minutes', '⚡', 100, 'gems', 'bg-golden', 'double_xp', 2);

-- Create storage bucket for sound files
INSERT INTO storage.buckets (id, name, public) VALUES ('sounds', 'sounds', true);

CREATE POLICY "Anyone can view sounds"
ON storage.objects FOR SELECT
USING (bucket_id = 'sounds');

CREATE POLICY "Admins can upload sounds"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'sounds' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update sounds"
ON storage.objects FOR UPDATE
USING (bucket_id = 'sounds' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete sounds"
ON storage.objects FOR DELETE
USING (bucket_id = 'sounds' AND has_role(auth.uid(), 'admin'::app_role));
