-- ============================================
-- Migration: 00001_create_extensions
-- Description: تفعيل الإضافات المطلوبة
-- ============================================

-- تفعيل إضافة UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- تفعيل إضافة pgcrypto للتشفير
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

-- تفعيل إضافة النصوص البحثية في public schema
CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA public;
-- ============================================
-- Migration: 00002_create_enums
-- Description: إنشاء أنواع البيانات المخصصة (ENUMS)
-- ============================================

-- نوع دور المستخدم
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'student');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- نوع الإشعارات حسب الدور المستهدف
DO $$ BEGIN
    CREATE TYPE notification_target_role AS ENUM ('all', 'students', 'teachers', 'admins');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- حالة الإشعار
DO $$ BEGIN
    CREATE TYPE notification_status AS ENUM ('draft', 'sent', 'scheduled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- نوع الاختبار
DO $$ BEGIN
    CREATE TYPE exam_type AS ENUM ('quiz', 'midterm', 'final', 'practice');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- نوع السؤال
DO $$ BEGIN
    CREATE TYPE question_type AS ENUM ('multiple_choice', 'true_false', 'fill_blank');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- مستوى صعوبة السؤال
DO $$ BEGIN
    CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- حالة محادثة الدعم
DO $$ BEGIN
    CREATE TYPE support_chat_status AS ENUM ('open', 'resolved', 'pending');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- نوع المرسل في الرسائل
DO $$ BEGIN
    CREATE TYPE sender_type AS ENUM ('user', 'ai', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- نوع الامتحان الشامل
DO $$ BEGIN
    CREATE TYPE comprehensive_exam_type AS ENUM ('arabic_comprehensive_exam', 'english_comprehensive_exam');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- نطاق استخدام الامتحان الشامل
DO $$ BEGIN
    CREATE TYPE exam_usage_scope AS ENUM ('exam', 'lesson');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- نوع التصحيح
DO $$ BEGIN
    CREATE TYPE grading_mode AS ENUM ('manual', 'hybrid', 'auto');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- حالة محاولة الامتحان الشامل
DO $$ BEGIN
    CREATE TYPE exam_attempt_status AS ENUM ('in_progress', 'completed', 'graded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- نوع سؤال الدرس
DO $$ BEGIN
    CREATE TYPE lesson_question_type AS ENUM ('mcq', 'truefalse', 'essay', 'fill_blank', 'matching');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
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
-- ============================================
-- Migration: 00004_create_educational_stages_table
-- Description: إنشاء جدول المراحل التعليمية
-- ============================================

CREATE TABLE IF NOT EXISTS educational_stages (
    -- المعرف الأساسي
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- بيانات المرحلة
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    slug TEXT NOT NULL UNIQUE,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- الطوابع الزمنية
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- الفهارس
-- ============================================

-- فهرس للبحث بالـ slug
CREATE INDEX IF NOT EXISTS idx_educational_stages_slug ON educational_stages(slug);

-- فهرس للترتيب
CREATE INDEX IF NOT EXISTS idx_educational_stages_order ON educational_stages(order_index);

-- فهرس للمراحل النشطة
CREATE INDEX IF NOT EXISTS idx_educational_stages_active ON educational_stages(is_active) WHERE is_active = true;

-- ============================================
-- Trigger لتحديث updated_at تلقائياً
-- ============================================

CREATE TRIGGER update_educational_stages_updated_at
    BEFORE UPDATE ON educational_stages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE educational_stages ENABLE ROW LEVEL SECURITY;

-- سياسة: الجميع يمكنهم قراءة المراحل
CREATE POLICY "Educational stages are viewable by everyone"
    ON educational_stages FOR SELECT
    USING (true);

-- سياسة: المدراء فقط يمكنهم إضافة مراحل
CREATE POLICY "Admins can insert educational stages"
    ON educational_stages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- سياسة: المدراء فقط يمكنهم تعديل المراحل
CREATE POLICY "Admins can update educational stages"
    ON educational_stages FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- سياسة: المدراء فقط يمكنهم حذف المراحل
CREATE POLICY "Admins can delete educational stages"
    ON educational_stages FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- ============================================
-- تعليقات الجدول
-- ============================================

COMMENT ON TABLE educational_stages IS 'جدول المراحل التعليمية (ابتدائي، إعدادي، ثانوي، إلخ)';
COMMENT ON COLUMN educational_stages.name IS 'اسم المرحلة';
COMMENT ON COLUMN educational_stages.slug IS 'الرابط المختصر للمرحلة';
COMMENT ON COLUMN educational_stages.order_index IS 'ترتيب العرض';
COMMENT ON COLUMN educational_stages.is_active IS 'هل المرحلة نشطة';
-- ============================================
-- Migration: 00005_create_subjects_table
-- Description: إنشاء جدول المواد الدراسية
-- ============================================

CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stage_id UUID NOT NULL REFERENCES educational_stages(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    slug TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT subjects_stage_slug_unique UNIQUE (stage_id, slug)
);

-- الفهارس
CREATE INDEX IF NOT EXISTS idx_subjects_stage_id ON subjects(stage_id);
CREATE INDEX IF NOT EXISTS idx_subjects_slug ON subjects(slug);
CREATE INDEX IF NOT EXISTS idx_subjects_order ON subjects(order_index);
CREATE INDEX IF NOT EXISTS idx_subjects_active ON subjects(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_subjects_stage_order ON subjects(stage_id, order_index);

-- Trigger (بشكل آمن)
DROP TRIGGER IF EXISTS update_subjects_updated_at ON subjects;
CREATE TRIGGER update_subjects_updated_at
    BEFORE UPDATE ON subjects FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Subjects are viewable by everyone" ON subjects;
CREATE POLICY "Subjects are viewable by everyone" ON subjects FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can insert subjects" ON subjects;
CREATE POLICY "Admins can insert subjects" ON subjects FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "Admins can update subjects" ON subjects;
CREATE POLICY "Admins can update subjects" ON subjects FOR UPDATE
    USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "Admins can delete subjects" ON subjects;
CREATE POLICY "Admins can delete subjects" ON subjects FOR DELETE
    USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
-- ============================================
-- Migration: 00006_create_lessons_table
-- Description: إنشاء جدول الدروس
-- ============================================

CREATE TABLE IF NOT EXISTS lessons (
    -- المعرف الأساسي
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- العلاقة مع المادة
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    
    -- بيانات الدرس
    title TEXT NOT NULL,
    description TEXT,
    content TEXT,
    image_url TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    
    -- حالة الدرس
    is_published BOOLEAN NOT NULL DEFAULT false,
    is_free BOOLEAN NOT NULL DEFAULT false,
    
    -- الإحصائيات
    views_count INTEGER NOT NULL DEFAULT 0,
    likes_count INTEGER NOT NULL DEFAULT 0,
    
    -- منشئ الدرس
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- الطوابع الزمنية
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- الفهارس
-- ============================================

-- فهرس للعلاقة مع المادة
CREATE INDEX IF NOT EXISTS idx_lessons_subject_id ON lessons(subject_id);

-- فهرس للترتيب
CREATE INDEX IF NOT EXISTS idx_lessons_order ON lessons(order_index);

-- فهرس للدروس المنشورة
CREATE INDEX IF NOT EXISTS idx_lessons_published ON lessons(is_published) WHERE is_published = true;

-- فهرس للدروس المجانية
CREATE INDEX IF NOT EXISTS idx_lessons_free ON lessons(is_free) WHERE is_free = true;

-- فهرس مركب للمادة والترتيب
CREATE INDEX IF NOT EXISTS idx_lessons_subject_order ON lessons(subject_id, order_index);

-- فهرس لمنشئ الدرس
CREATE INDEX IF NOT EXISTS idx_lessons_created_by ON lessons(created_by);

-- فهرس للبحث في العنوان
CREATE INDEX IF NOT EXISTS idx_lessons_title_trgm ON lessons USING gin(title gin_trgm_ops);

-- ============================================
-- Trigger لتحديث updated_at تلقائياً
-- ============================================

CREATE TRIGGER update_lessons_updated_at
    BEFORE UPDATE ON lessons
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- سياسة: قراءة الدروس المنشورة للجميع
CREATE POLICY "Published lessons are viewable by everyone"
    ON lessons FOR SELECT
    USING (is_published = true OR created_by = auth.uid() OR EXISTS (
        SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    ));

-- سياسة: المعلمون والمدراء يمكنهم إضافة دروس
CREATE POLICY "Teachers and admins can insert lessons"
    ON lessons FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('teacher', 'admin')
        )
    );

-- سياسة: المنشئ والمدراء يمكنهم تعديل الدروس
CREATE POLICY "Creators and admins can update lessons"
    ON lessons FOR UPDATE
    USING (
        created_by = auth.uid() OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- سياسة: المنشئ والمدراء يمكنهم حذف الدروس
CREATE POLICY "Creators and admins can delete lessons"
    ON lessons FOR DELETE
    USING (
        created_by = auth.uid() OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- ============================================
-- Function لزيادة عدد المشاهدات
-- ============================================

CREATE OR REPLACE FUNCTION increment_lesson_views(lesson_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE lessons
    SET views_count = views_count + 1
    WHERE id = lesson_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Function لزيادة/إنقاص الإعجابات
-- ============================================

CREATE OR REPLACE FUNCTION toggle_lesson_like(lesson_id UUID, increment BOOLEAN)
RETURNS void AS $$
BEGIN
    IF increment THEN
        UPDATE lessons
        SET likes_count = likes_count + 1
        WHERE id = lesson_id;
    ELSE
        UPDATE lessons
        SET likes_count = GREATEST(0, likes_count - 1)
        WHERE id = lesson_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- تعليقات الجدول
-- ============================================

COMMENT ON TABLE lessons IS 'جدول الدروس';
COMMENT ON COLUMN lessons.subject_id IS 'معرف المادة';
COMMENT ON COLUMN lessons.title IS 'عنوان الدرس';
COMMENT ON COLUMN lessons.content IS 'محتوى الدرس';
COMMENT ON COLUMN lessons.order_index IS 'ترتيب الدرس';
COMMENT ON COLUMN lessons.is_published IS 'هل الدرس منشور';
COMMENT ON COLUMN lessons.is_free IS 'هل الدرس مجاني';
COMMENT ON COLUMN lessons.views_count IS 'عدد المشاهدات';
COMMENT ON COLUMN lessons.likes_count IS 'عدد الإعجابات';
COMMENT ON COLUMN lessons.created_by IS 'معرف منشئ الدرس';
