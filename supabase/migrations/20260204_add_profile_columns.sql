-- Add missing columns to profiles table for teacher profile
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS cover_image_url text,
ADD COLUMN IF NOT EXISTS specialization text,
ADD COLUMN IF NOT EXISTS teacher_title text,
ADD COLUMN IF NOT EXISTS years_of_experience integer,
ADD COLUMN IF NOT EXISTS education text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS teaching_style text,
ADD COLUMN IF NOT EXISTS subjects text[],
ADD COLUMN IF NOT EXISTS stages text[],
ADD COLUMN IF NOT EXISTS is_teacher_profile_public boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}'::jsonb;

-- Create index on is_teacher_profile_public for faster filtering
CREATE INDEX IF NOT EXISTS idx_profiles_public_teacher ON public.profiles(is_teacher_profile_public);
