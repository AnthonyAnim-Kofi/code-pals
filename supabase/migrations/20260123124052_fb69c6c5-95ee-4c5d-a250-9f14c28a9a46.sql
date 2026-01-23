-- Create app_role enum for role-based access
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table for RBAC (separate from profiles as per security requirements)
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents infinite recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create languages table for different programming languages
CREATE TABLE public.languages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    icon TEXT NOT NULL DEFAULT '💻',
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on languages
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active languages"
ON public.languages
FOR SELECT
USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage languages"
ON public.languages
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create units table
CREATE TABLE public.units (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    language_id uuid REFERENCES public.languages(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    color TEXT NOT NULL DEFAULT 'green',
    order_index INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active units"
ON public.units
FOR SELECT
USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage units"
ON public.units
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create lessons table (admin-managed)
CREATE TABLE public.lessons (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id uuid REFERENCES public.units(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active lessons"
ON public.lessons
FOR SELECT
USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage lessons"
ON public.lessons
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create questions table
CREATE TABLE public.questions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id uuid REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('fill-blank', 'multiple-choice', 'drag-order', 'code-runner')),
    instruction TEXT NOT NULL,
    code TEXT,
    answer TEXT,
    options JSONB,
    blocks JSONB,
    correct_order JSONB,
    initial_code TEXT,
    expected_output TEXT,
    hint TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    xp_reward INTEGER NOT NULL DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view questions for active lessons"
ON public.questions
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.lessons l 
        WHERE l.id = lesson_id AND (l.is_active = true OR public.has_role(auth.uid(), 'admin'))
    )
);

CREATE POLICY "Admins can manage questions"
ON public.questions
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create unit_notes table for admin-uploaded notes
CREATE TABLE public.unit_notes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id uuid REFERENCES public.units(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.unit_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view notes for accessible units"
ON public.unit_notes
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.units u 
        WHERE u.id = unit_id AND (u.is_active = true OR public.has_role(auth.uid(), 'admin'))
    )
);

CREATE POLICY "Admins can manage notes"
ON public.unit_notes
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Add heart_regeneration_started_at to profiles for timer tracking
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS heart_regeneration_started_at TIMESTAMP WITH TIME ZONE;

-- Insert default Python language
INSERT INTO public.languages (name, slug, icon, description)
VALUES ('Python', 'python', '🐍', 'Learn the most popular programming language');

-- Trigger for updated_at on new tables
CREATE TRIGGER update_languages_updated_at
BEFORE UPDATE ON public.languages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_units_updated_at
BEFORE UPDATE ON public.units
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at
BEFORE UPDATE ON public.lessons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_questions_updated_at
BEFORE UPDATE ON public.questions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_unit_notes_updated_at
BEFORE UPDATE ON public.unit_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();