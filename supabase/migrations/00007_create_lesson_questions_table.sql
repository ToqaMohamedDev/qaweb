-- ============================================
-- Migration: 00007_create_lesson_questions_table
-- Description: إنشاء جدول أسئلة الدروس
-- ============================================

CREATE TABLE IF NOT EXISTS lesson_questions (
    -- المعرف الأساسي
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- العلاقة مع الدرس
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    
    -- بيانات السؤال (متعدد اللغات)
    text JSONB NOT NULL DEFAULT '{"ar": "", "en": ""}',
    
    -- نوع السؤال
    type TEXT NOT NULL DEFAULT 'mcq' CHECK (type IN ('mcq', 'truefalse', 'essay', 'fill_blank', 'matching')),
    
    -- خيارات الإجابة (للأسئلة متعددة الخيارات)
    options JSONB NOT NULL DEFAULT '[]',
    
    -- الإجابة الصحيحة
    correct_option_id TEXT,
    correct_answer JSONB,
    
    -- النقاط والصعوبة
    points INTEGER NOT NULL DEFAULT 1,
    difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    
    -- الترتيب
    order_index INTEGER NOT NULL DEFAULT 0,
    
    -- الوسائط المرفقة
    media JSONB DEFAULT '{}',
    
    -- التلميح والشرح (متعدد اللغات)
    hint JSONB DEFAULT '{"ar": "", "en": ""}',
    explanation JSONB DEFAULT '{"ar": "", "en": ""}',
    
    -- الحالة
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- منشئ السؤال
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- الطوابع الزمنية
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- الفهارس
-- ============================================

-- فهرس للعلاقة مع الدرس
CREATE INDEX IF NOT EXISTS idx_lesson_questions_lesson_id ON lesson_questions(lesson_id);

-- فهرس للترتيب
CREATE INDEX IF NOT EXISTS idx_lesson_questions_order ON lesson_questions(order_index);

-- فهرس للأسئلة النشطة
CREATE INDEX IF NOT EXISTS idx_lesson_questions_active ON lesson_questions(is_active) WHERE is_active = true;

-- فهرس لنوع السؤال
CREATE INDEX IF NOT EXISTS idx_lesson_questions_type ON lesson_questions(type);

-- فهرس للصعوبة
CREATE INDEX IF NOT EXISTS idx_lesson_questions_difficulty ON lesson_questions(difficulty);

-- فهرس مركب للدرس والترتيب
CREATE INDEX IF NOT EXISTS idx_lesson_questions_lesson_order ON lesson_questions(lesson_id, order_index);

-- فهرس لمنشئ السؤال
CREATE INDEX IF NOT EXISTS idx_lesson_questions_created_by ON lesson_questions(created_by);

-- ============================================
-- Trigger لتحديث updated_at تلقائياً
-- ============================================

CREATE TRIGGER update_lesson_questions_updated_at
    BEFORE UPDATE ON lesson_questions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE lesson_questions ENABLE ROW LEVEL SECURITY;

-- سياسة: قراءة الأسئلة النشطة للدروس المنشورة
CREATE POLICY "Active lesson questions are viewable"
    ON lesson_questions FOR SELECT
    USING (
        is_active = true AND EXISTS (
            SELECT 1 FROM lessons
            WHERE lessons.id = lesson_questions.lesson_id
            AND (lessons.is_published = true OR lessons.created_by = auth.uid())
        )
        OR created_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- سياسة: المعلمون والمدراء يمكنهم إضافة أسئلة
CREATE POLICY "Teachers and admins can insert lesson questions"
    ON lesson_questions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('teacher', 'admin')
        )
    );

-- سياسة: المنشئ والمدراء يمكنهم تعديل الأسئلة
CREATE POLICY "Creators and admins can update lesson questions"
    ON lesson_questions FOR UPDATE
    USING (
        created_by = auth.uid() OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- سياسة: المنشئ والمدراء يمكنهم حذف الأسئلة
CREATE POLICY "Creators and admins can delete lesson questions"
    ON lesson_questions FOR DELETE
    USING (
        created_by = auth.uid() OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- ============================================
-- تعليقات الجدول
-- ============================================

COMMENT ON TABLE lesson_questions IS 'جدول أسئلة الدروس';
COMMENT ON COLUMN lesson_questions.lesson_id IS 'معرف الدرس';
COMMENT ON COLUMN lesson_questions.text IS 'نص السؤال (متعدد اللغات)';
COMMENT ON COLUMN lesson_questions.type IS 'نوع السؤال: mcq, truefalse, essay, fill_blank, matching';
COMMENT ON COLUMN lesson_questions.options IS 'خيارات الإجابة بصيغة JSON';
COMMENT ON COLUMN lesson_questions.correct_option_id IS 'معرف الخيار الصحيح';
COMMENT ON COLUMN lesson_questions.correct_answer IS 'الإجابة الصحيحة بصيغة JSON';
COMMENT ON COLUMN lesson_questions.points IS 'عدد النقاط';
COMMENT ON COLUMN lesson_questions.difficulty IS 'مستوى الصعوبة: easy, medium, hard';
COMMENT ON COLUMN lesson_questions.hint IS 'تلميح للسؤال (متعدد اللغات)';
COMMENT ON COLUMN lesson_questions.explanation IS 'شرح الإجابة (متعدد اللغات)';
