-- ============================================
-- Migration: 00018_create_exam_templates_table
-- Description: إنشاء جدول قوالب الامتحانات
-- ============================================

CREATE TABLE IF NOT EXISTS exam_templates (
    -- المعرف الأساسي
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- العنوان والوصف (متعدد اللغات)
    title JSONB NOT NULL DEFAULT '{"ar": "", "en": ""}',
    description JSONB DEFAULT '{"ar": "", "en": ""}',
    
    -- اللغة الأساسية
    language TEXT NOT NULL DEFAULT 'ar',
    
    -- العلاقات
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    stage_id UUID REFERENCES educational_stages(id) ON DELETE SET NULL,
    
    -- بيانات إضافية
    subject_name TEXT,
    grade TEXT,
    
    -- إعدادات الامتحان
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    is_published BOOLEAN NOT NULL DEFAULT false,
    settings JSONB NOT NULL DEFAULT '{
        "shuffleQuestions": false,
        "shuffleOptions": false,
        "showResults": true,
        "allowReview": true,
        "passScore": 60,
        "maxAttempts": 3,
        "timeLimit": true
    }',
    
    -- الإحصائيات
    questions_count INTEGER NOT NULL DEFAULT 0,
    total_points INTEGER NOT NULL DEFAULT 0,
    attempts_count INTEGER NOT NULL DEFAULT 0,
    average_score NUMERIC(5, 2) NOT NULL DEFAULT 0,
    
    -- منشئ القالب
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    
    -- الطوابع الزمنية
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- الفهارس
-- ============================================

-- فهرس للمادة
CREATE INDEX IF NOT EXISTS idx_exam_templates_subject_id ON exam_templates(subject_id);

-- فهرس للمرحلة
CREATE INDEX IF NOT EXISTS idx_exam_templates_stage_id ON exam_templates(stage_id);

-- فهرس للمنشئ
CREATE INDEX IF NOT EXISTS idx_exam_templates_created_by ON exam_templates(created_by);

-- فهرس للقوالب المنشورة
CREATE INDEX IF NOT EXISTS idx_exam_templates_published ON exam_templates(is_published) WHERE is_published = true;

-- فهرس للبحث في العنوان
CREATE INDEX IF NOT EXISTS idx_exam_templates_title ON exam_templates USING gin(title jsonb_path_ops);

-- فهرس للغة
CREATE INDEX IF NOT EXISTS idx_exam_templates_language ON exam_templates(language);

-- فهرس لتاريخ الإنشاء
CREATE INDEX IF NOT EXISTS idx_exam_templates_created_at ON exam_templates(created_at DESC);

-- ============================================
-- Trigger لتحديث updated_at تلقائياً
-- ============================================

CREATE TRIGGER update_exam_templates_updated_at
    BEFORE UPDATE ON exam_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE exam_templates ENABLE ROW LEVEL SECURITY;

-- سياسة: القوالب المنشورة متاحة للجميع
CREATE POLICY "Published templates are viewable by everyone"
    ON exam_templates FOR SELECT
    USING (
        is_published = true
        OR created_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- سياسة: المعلمون والمدراء يمكنهم إضافة قوالب
CREATE POLICY "Teachers and admins can insert templates"
    ON exam_templates FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('teacher', 'admin')
        )
    );

-- سياسة: المنشئ والمدراء يمكنهم تعديل القوالب
CREATE POLICY "Creators and admins can update templates"
    ON exam_templates FOR UPDATE
    USING (
        created_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- سياسة: المنشئ والمدراء يمكنهم حذف القوالب
CREATE POLICY "Creators and admins can delete templates"
    ON exam_templates FOR DELETE
    USING (
        created_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- ============================================
-- تعليقات الجدول
-- ============================================

COMMENT ON TABLE exam_templates IS 'جدول قوالب الامتحانات';
COMMENT ON COLUMN exam_templates.title IS 'عنوان القالب (متعدد اللغات)';
COMMENT ON COLUMN exam_templates.description IS 'وصف القالب (متعدد اللغات)';
COMMENT ON COLUMN exam_templates.language IS 'اللغة الأساسية للقالب';
COMMENT ON COLUMN exam_templates.settings IS 'إعدادات الامتحان بصيغة JSON';
COMMENT ON COLUMN exam_templates.questions_count IS 'عدد الأسئلة في القالب';
COMMENT ON COLUMN exam_templates.total_points IS 'إجمالي النقاط';
COMMENT ON COLUMN exam_templates.attempts_count IS 'عدد المحاولات';
COMMENT ON COLUMN exam_templates.average_score IS 'متوسط الدرجات';
