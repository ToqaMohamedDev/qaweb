-- ============================================
-- Migration: 00009_create_questions_table
-- Description: إنشاء جدول الأسئلة (للاختبارات)
-- ============================================

CREATE TABLE IF NOT EXISTS questions (
    -- المعرف الأساسي
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- العلاقات (إما درس أو اختبار)
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
    
    -- بيانات السؤال
    question_text TEXT NOT NULL,
    question_type question_type NOT NULL DEFAULT 'multiple_choice',
    
    -- خيارات الإجابة
    options JSONB,
    correct_answer TEXT NOT NULL,
    
    -- تفاصيل إضافية
    explanation TEXT,
    points INTEGER NOT NULL DEFAULT 1,
    difficulty difficulty_level NOT NULL DEFAULT 'medium',
    
    -- الترتيب والحالة
    order_index INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- الطوابع الزمنية
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- قيد: يجب أن يكون السؤال مرتبطاً بدرس أو اختبار
    CONSTRAINT questions_lesson_or_exam_check CHECK (
        (lesson_id IS NOT NULL AND exam_id IS NULL) OR 
        (lesson_id IS NULL AND exam_id IS NOT NULL)
    )
);

-- ============================================
-- الفهارس
-- ============================================

-- فهرس للعلاقة مع الدرس
CREATE INDEX IF NOT EXISTS idx_questions_lesson_id ON questions(lesson_id) WHERE lesson_id IS NOT NULL;

-- فهرس للعلاقة مع الاختبار
CREATE INDEX IF NOT EXISTS idx_questions_exam_id ON questions(exam_id) WHERE exam_id IS NOT NULL;

-- فهرس لنوع السؤال
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(question_type);

-- فهرس للصعوبة
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);

-- فهرس للأسئلة النشطة
CREATE INDEX IF NOT EXISTS idx_questions_active ON questions(is_active) WHERE is_active = true;

-- فهرس للترتيب
CREATE INDEX IF NOT EXISTS idx_questions_order ON questions(order_index);

-- ============================================
-- Trigger لتحديث updated_at تلقائياً
-- ============================================

CREATE TRIGGER update_questions_updated_at
    BEFORE UPDATE ON questions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- سياسة: قراءة الأسئلة للاختبارات والدروس المنشورة
CREATE POLICY "Questions are viewable for published content"
    ON questions FOR SELECT
    USING (
        (exam_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM exams WHERE exams.id = questions.exam_id AND exams.is_published = true
        ))
        OR (lesson_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM lessons WHERE lessons.id = questions.lesson_id AND lessons.is_published = true
        ))
        OR EXISTS (
            SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('teacher', 'admin')
        )
    );

-- سياسة: المعلمون والمدراء يمكنهم إضافة أسئلة
CREATE POLICY "Teachers and admins can insert questions"
    ON questions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('teacher', 'admin')
        )
    );

-- سياسة: المعلمون والمدراء يمكنهم تعديل الأسئلة
CREATE POLICY "Teachers and admins can update questions"
    ON questions FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('teacher', 'admin')
        )
    );

-- سياسة: المدراء فقط يمكنهم حذف الأسئلة
CREATE POLICY "Admins can delete questions"
    ON questions FOR DELETE
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

COMMENT ON TABLE questions IS 'جدول الأسئلة للاختبارات والدروس';
COMMENT ON COLUMN questions.lesson_id IS 'معرف الدرس (إذا كان السؤال تابعاً لدرس)';
COMMENT ON COLUMN questions.exam_id IS 'معرف الاختبار (إذا كان السؤال تابعاً لاختبار)';
COMMENT ON COLUMN questions.question_type IS 'نوع السؤال: multiple_choice, true_false, fill_blank';
COMMENT ON COLUMN questions.options IS 'خيارات الإجابة بصيغة JSON';
COMMENT ON COLUMN questions.correct_answer IS 'الإجابة الصحيحة';
COMMENT ON COLUMN questions.difficulty IS 'مستوى الصعوبة';
