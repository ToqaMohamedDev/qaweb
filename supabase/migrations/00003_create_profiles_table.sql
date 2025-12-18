-- ============================================
-- Migration: 00003_create_profiles_table
-- Description: إنشاء جدول الملفات الشخصية للمستخدمين
-- ============================================

-- إنشاء الجدول إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    avatar_url TEXT,
    bio TEXT,
    specialization TEXT,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    subscriber_count INTEGER NOT NULL DEFAULT 0,
    is_teacher_profile_public BOOLEAN NOT NULL DEFAULT false,
    teacher_title TEXT,
    years_of_experience INTEGER NOT NULL DEFAULT 0,
    education TEXT,
    phone TEXT,
    website TEXT,
    social_links JSONB DEFAULT '{}',
    subjects TEXT[],
    stages TEXT[],
    teaching_style TEXT,
    cover_image_url TEXT,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    featured_until TIMESTAMPTZ,
    total_views INTEGER NOT NULL DEFAULT 0,
    rating_average NUMERIC(3, 2) NOT NULL DEFAULT 0.00,
    rating_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- إضافة الأعمدة الناقصة إذا لم تكن موجودة
DO $$ 
BEGIN
    -- is_featured
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_featured') THEN
        ALTER TABLE profiles ADD COLUMN is_featured BOOLEAN NOT NULL DEFAULT false;
    END IF;
    
    -- featured_until
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'featured_until') THEN
        ALTER TABLE profiles ADD COLUMN featured_until TIMESTAMPTZ;
    END IF;
    
    -- is_teacher_profile_public
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_teacher_profile_public') THEN
        ALTER TABLE profiles ADD COLUMN is_teacher_profile_public BOOLEAN NOT NULL DEFAULT false;
    END IF;
    
    -- teacher_title
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'teacher_title') THEN
        ALTER TABLE profiles ADD COLUMN teacher_title TEXT;
    END IF;
    
    -- years_of_experience
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'years_of_experience') THEN
        ALTER TABLE profiles ADD COLUMN years_of_experience INTEGER NOT NULL DEFAULT 0;
    END IF;
    
    -- education
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'education') THEN
        ALTER TABLE profiles ADD COLUMN education TEXT;
    END IF;
    
    -- phone
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone') THEN
        ALTER TABLE profiles ADD COLUMN phone TEXT;
    END IF;
    
    -- website
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'website') THEN
        ALTER TABLE profiles ADD COLUMN website TEXT;
    END IF;
    
    -- social_links
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'social_links') THEN
        ALTER TABLE profiles ADD COLUMN social_links JSONB DEFAULT '{}';
    END IF;
    
    -- subjects
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'subjects') THEN
        ALTER TABLE profiles ADD COLUMN subjects TEXT[];
    END IF;
    
    -- stages
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'stages') THEN
        ALTER TABLE profiles ADD COLUMN stages TEXT[];
    END IF;
    
    -- teaching_style
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'teaching_style') THEN
        ALTER TABLE profiles ADD COLUMN teaching_style TEXT;
    END IF;
    
    -- cover_image_url
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'cover_image_url') THEN
        ALTER TABLE profiles ADD COLUMN cover_image_url TEXT;
    END IF;
    
    -- total_views
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'total_views') THEN
        ALTER TABLE profiles ADD COLUMN total_views INTEGER NOT NULL DEFAULT 0;
    END IF;
    
    -- rating_average
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'rating_average') THEN
        ALTER TABLE profiles ADD COLUMN rating_average NUMERIC(3, 2) NOT NULL DEFAULT 0.00;
    END IF;
    
    -- rating_count
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'rating_count') THEN
        ALTER TABLE profiles ADD COLUMN rating_count INTEGER NOT NULL DEFAULT 0;
    END IF;
    
    -- subscriber_count
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'subscriber_count') THEN
        ALTER TABLE profiles ADD COLUMN subscriber_count INTEGER NOT NULL DEFAULT 0;
    END IF;
END $$;

-- الفهارس
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_featured ON profiles(is_featured, featured_until) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_profiles_public_teachers ON profiles(is_teacher_profile_public) WHERE role = 'teacher' AND is_teacher_profile_public = true;

-- Trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone"
    ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
