-- ============================================
-- Migration: 00020_create_exam_attempts_table
-- Description: إنشاء جدول محاولات الامتحانات
-- ============================================

CREATE TABLE IF NOT EXISTS exam_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES exam_templates(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'graded')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    graded_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    answers JSONB NOT NULL DEFAULT '{}',
    score NUMERIC(5, 2) NOT NULL DEFAULT 0,
    total_points INTEGER NOT NULL DEFAULT 0,
    percentage NUMERIC(5, 2) NOT NULL DEFAULT 0,
    passed BOOLEAN NOT NULL DEFAULT false,
    time_spent_seconds INTEGER NOT NULL DEFAULT 0,
    questions_answered INTEGER NOT NULL DEFAULT 0,
    question_results JSONB NOT NULL DEFAULT '[]'
);

-- الفهارس
CREATE INDEX IF NOT EXISTS idx_exam_attempts_template_id ON exam_attempts(template_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_student_id ON exam_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_status ON exam_attempts(status);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_student_template ON exam_attempts(student_id, template_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_started_at ON exam_attempts(started_at DESC);

-- RLS
ALTER TABLE exam_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own attempts"
    ON exam_attempts FOR SELECT USING (
        student_id = auth.uid() OR EXISTS (
            SELECT 1 FROM exam_templates WHERE exam_templates.id = exam_attempts.template_id
            AND exam_templates.created_by = auth.uid()
        ) OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    );

CREATE POLICY "Students can insert own attempts"
    ON exam_attempts FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update own attempts"
    ON exam_attempts FOR UPDATE USING (
        student_id = auth.uid() OR EXISTS (
            SELECT 1 FROM exam_templates WHERE exam_templates.id = exam_attempts.template_id
            AND exam_templates.created_by = auth.uid()
        ) OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    );

-- Trigger لتحديث إحصائيات القالب
CREATE OR REPLACE FUNCTION update_template_attempt_stats()
RETURNS TRIGGER AS $$
DECLARE
    avg_score NUMERIC(5, 2);
    total_attempts INTEGER;
BEGIN
    SELECT COUNT(*), COALESCE(AVG(percentage), 0)
    INTO total_attempts, avg_score
    FROM exam_attempts
    WHERE template_id = NEW.template_id AND status = 'graded';
    
    UPDATE exam_templates SET 
        attempts_count = total_attempts,
        average_score = avg_score
    WHERE id = NEW.template_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_template_attempt_stats
    AFTER INSERT OR UPDATE ON exam_attempts FOR EACH ROW
    WHEN (NEW.status = 'graded')
    EXECUTE FUNCTION update_template_attempt_stats();
