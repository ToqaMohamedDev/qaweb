-- ============================================
-- Migration: 00008_create_exams_table
-- Description: إنشاء جدول الاختبارات
-- ============================================

CREATE TABLE IF NOT EXISTS exams (
    -- المعرف الأساسي
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- العلاقات
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
    
    -- بيانات الاختبار
    title TEXT NOT NULL,
    description TEXT,
    
    -- نوع الاختبار
    exam_type exam_type NOT NULL DEFAULT 'quiz',
    
    -- إعدادات الاختبار
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    passing_score INTEGER NOT NULL DEFAULT 60,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    shuffle_questions BOOLEAN NOT NULL DEFAULT false,
    show_answers_after BOOLEAN NOT NULL DEFAULT true,
    
    -- حالة الاختبار
    is_published BOOLEAN NOT NULL DEFAULT false,
    
    -- مواعيد بدء وانتهاء الاختبار
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    
    -- الطوابع الزمنية
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- الفهارس
-- ============================================

-- فهرس للعلاقة مع المادة
CREATE INDEX IF NOT EXISTS idx_exams_subject_id ON exams(subject_id);

-- فهرس للعلاقة مع الدرس
CREATE INDEX IF NOT EXISTS idx_exams_lesson_id ON exams(lesson_id);

-- فهرس لنوع الاختبار
CREATE INDEX IF NOT EXISTS idx_exams_type ON exams(exam_type);

-- فهرس للاختبارات المنشورة
CREATE INDEX IF NOT EXISTS idx_exams_published ON exams(is_published) WHERE is_published = true;

-- فهرس لمواعيد الاختبار
CREATE INDEX IF NOT EXISTS idx_exams_dates ON exams(starts_at, ends_at);

-- فهرس للبحث في العنوان
CREATE INDEX IF NOT EXISTS idx_exams_title_trgm ON exams USING gin(title gin_trgm_ops);

-- ============================================
-- Trigger لتحديث updated_at تلقائياً
-- ============================================

CREATE TRIGGER update_exams_updated_at
    BEFORE UPDATE ON exams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE exams ENABLE ROW LEVEL SECURITY;

-- سياسة: قراءة الاختبارات المنشورة
CREATE POLICY "Published exams are viewable by everyone"
    ON exams FOR SELECT
    USING (is_published = true OR EXISTS (
        SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('teacher', 'admin')
    ));

-- سياسة: المعلمون والمدراء يمكنهم إضافة اختبارات
CREATE POLICY "Teachers and admins can insert exams"
    ON exams FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('teacher', 'admin')
        )
    );

-- سياسة: المعلمون والمدراء يمكنهم تعديل الاختبارات
CREATE POLICY "Teachers and admins can update exams"
    ON exams FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('teacher', 'admin')
        )
    );

-- سياسة: المدراء فقط يمكنهم حذف الاختبارات
CREATE POLICY "Admins can delete exams"
    ON exams FOR DELETE
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

COMMENT ON TABLE exams IS 'جدول الاختبارات';
COMMENT ON COLUMN exams.subject_id IS 'معرف المادة';
COMMENT ON COLUMN exams.lesson_id IS 'معرف الدرس (اختياري)';
COMMENT ON COLUMN exams.exam_type IS 'نوع الاختبار: quiz, midterm, final, practice';
COMMENT ON COLUMN exams.duration_minutes IS 'مدة الاختبار بالدقائق';
COMMENT ON COLUMN exams.passing_score IS 'درجة النجاح';
COMMENT ON COLUMN exams.max_attempts IS 'أقصى عدد محاولات';
COMMENT ON COLUMN exams.shuffle_questions IS 'هل يتم خلط الأسئلة';
COMMENT ON COLUMN exams.show_answers_after IS 'هل تظهر الإجابات بعد الانتهاء';
