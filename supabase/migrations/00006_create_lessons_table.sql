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
