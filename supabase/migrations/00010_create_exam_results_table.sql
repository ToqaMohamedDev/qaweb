-- ============================================
-- Migration: 00010_create_exam_results_table
-- Description: إنشاء جدول نتائج الاختبارات
-- ============================================

CREATE TABLE IF NOT EXISTS exam_results (
    -- المعرف الأساسي
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- العلاقات
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    
    -- النتائج
    score NUMERIC(5, 2) NOT NULL DEFAULT 0,
    total_questions INTEGER NOT NULL,
    correct_answers INTEGER NOT NULL DEFAULT 0,
    
    -- الوقت
    time_taken_seconds INTEGER,
    
    -- تفاصيل الإجابات
    answers JSONB,
    
    -- أوقات المحاولة
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    
    -- الطوابع الزمنية
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- الفهارس
-- ============================================

-- فهرس للعلاقة مع المستخدم
CREATE INDEX IF NOT EXISTS idx_exam_results_user_id ON exam_results(user_id);

-- فهرس للعلاقة مع الاختبار
CREATE INDEX IF NOT EXISTS idx_exam_results_exam_id ON exam_results(exam_id);

-- فهرس مركب للمستخدم والاختبار
CREATE INDEX IF NOT EXISTS idx_exam_results_user_exam ON exam_results(user_id, exam_id);

-- فهرس للنتائج (للترتيب حسب الدرجة)
CREATE INDEX IF NOT EXISTS idx_exam_results_score ON exam_results(score DESC);

-- فهرس لتاريخ الإنشاء
CREATE INDEX IF NOT EXISTS idx_exam_results_created_at ON exam_results(created_at DESC);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE exam_results ENABLE ROW LEVEL SECURITY;

-- سياسة: المستخدم يمكنه رؤية نتائجه فقط
CREATE POLICY "Users can view own exam results"
    ON exam_results FOR SELECT
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('teacher', 'admin')
        )
    );

-- سياسة: المستخدم يمكنه إضافة نتائجه
CREATE POLICY "Users can insert own exam results"
    ON exam_results FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- سياسة: المستخدم يمكنه تعديل نتائجه (للتحديث عند الانتهاء)
CREATE POLICY "Users can update own exam results"
    ON exam_results FOR UPDATE
    USING (user_id = auth.uid());

-- ============================================
-- Function لحساب متوسط النتائج
-- ============================================

CREATE OR REPLACE FUNCTION get_exam_statistics(p_exam_id UUID)
RETURNS TABLE (
    total_attempts INTEGER,
    average_score NUMERIC,
    highest_score NUMERIC,
    lowest_score NUMERIC,
    pass_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_attempts,
        ROUND(AVG(er.score), 2) as average_score,
        MAX(er.score) as highest_score,
        MIN(er.score) as lowest_score,
        ROUND(
            (COUNT(*) FILTER (WHERE er.score >= e.passing_score)::NUMERIC / NULLIF(COUNT(*), 0) * 100),
            2
        ) as pass_rate
    FROM exam_results er
    JOIN exams e ON e.id = er.exam_id
    WHERE er.exam_id = p_exam_id AND er.completed_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Function لحساب ترتيب الطالب
-- ============================================

CREATE OR REPLACE FUNCTION get_student_rank(p_exam_id UUID, p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    student_rank INTEGER;
BEGIN
    SELECT RANK() INTO student_rank
    FROM (
        SELECT user_id, score,
               RANK() OVER (ORDER BY score DESC) as rank
        FROM exam_results
        WHERE exam_id = p_exam_id AND completed_at IS NOT NULL
    ) ranked
    WHERE user_id = p_user_id;
    
    RETURN COALESCE(student_rank, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- تعليقات الجدول
-- ============================================

COMMENT ON TABLE exam_results IS 'جدول نتائج الاختبارات';
COMMENT ON COLUMN exam_results.user_id IS 'معرف المستخدم (الطالب)';
COMMENT ON COLUMN exam_results.exam_id IS 'معرف الاختبار';
COMMENT ON COLUMN exam_results.score IS 'الدرجة (نسبة مئوية)';
COMMENT ON COLUMN exam_results.total_questions IS 'إجمالي عدد الأسئلة';
COMMENT ON COLUMN exam_results.correct_answers IS 'عدد الإجابات الصحيحة';
COMMENT ON COLUMN exam_results.time_taken_seconds IS 'الوقت المستغرق بالثواني';
COMMENT ON COLUMN exam_results.answers IS 'تفاصيل الإجابات بصيغة JSON';
