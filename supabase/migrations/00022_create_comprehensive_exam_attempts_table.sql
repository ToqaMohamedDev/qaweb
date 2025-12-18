-- ============================================
-- Migration: 00022_create_comprehensive_exam_attempts_table
-- Description: إنشاء جدول محاولات الامتحانات الشاملة
-- ============================================

CREATE TABLE IF NOT EXISTS comprehensive_exam_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES comprehensive_exams(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    answers JSONB NOT NULL DEFAULT '{}',
    total_score NUMERIC(5, 2),
    max_score NUMERIC(5, 2),
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'graded')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- الفهارس
CREATE INDEX IF NOT EXISTS idx_comp_exam_attempts_exam_id ON comprehensive_exam_attempts(exam_id);
CREATE INDEX IF NOT EXISTS idx_comp_exam_attempts_student_id ON comprehensive_exam_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_comp_exam_attempts_status ON comprehensive_exam_attempts(status);
CREATE INDEX IF NOT EXISTS idx_comp_exam_attempts_student_exam ON comprehensive_exam_attempts(student_id, exam_id);
CREATE INDEX IF NOT EXISTS idx_comp_exam_attempts_started_at ON comprehensive_exam_attempts(started_at DESC);

-- Trigger
CREATE TRIGGER update_comprehensive_exam_attempts_updated_at
    BEFORE UPDATE ON comprehensive_exam_attempts FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE comprehensive_exam_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own attempts"
    ON comprehensive_exam_attempts FOR SELECT USING (
        student_id = auth.uid() OR EXISTS (
            SELECT 1 FROM comprehensive_exams WHERE comprehensive_exams.id = comprehensive_exam_attempts.exam_id
            AND comprehensive_exams.created_by = auth.uid()
        ) OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    );

CREATE POLICY "Students can insert own attempts"
    ON comprehensive_exam_attempts FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students and creators can update attempts"
    ON comprehensive_exam_attempts FOR UPDATE USING (
        student_id = auth.uid() OR EXISTS (
            SELECT 1 FROM comprehensive_exams WHERE comprehensive_exams.id = comprehensive_exam_attempts.exam_id
            AND comprehensive_exams.created_by = auth.uid()
        ) OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    );
