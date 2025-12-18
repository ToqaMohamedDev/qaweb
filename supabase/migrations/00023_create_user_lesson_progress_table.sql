-- ============================================
-- Migration: 00023_create_user_lesson_progress_table
-- Description: إنشاء جدول تقدم المستخدم في الدروس
-- ============================================

CREATE TABLE IF NOT EXISTS user_lesson_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    progress_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0,
    last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- قيد فريد: تقدم واحد لكل مستخدم في كل درس
    CONSTRAINT user_lesson_progress_unique UNIQUE (user_id, lesson_id)
);

-- الفهارس
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_user_id ON user_lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_lesson_id ON user_lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_completed ON user_lesson_progress(is_completed) WHERE is_completed = true;
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_last_accessed ON user_lesson_progress(last_accessed_at DESC);

-- Trigger
CREATE TRIGGER update_user_lesson_progress_updated_at
    BEFORE UPDATE ON user_lesson_progress FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE user_lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress"
    ON user_lesson_progress FOR SELECT USING (
        user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('teacher', 'admin'))
    );

CREATE POLICY "Users can insert own progress"
    ON user_lesson_progress FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own progress"
    ON user_lesson_progress FOR UPDATE USING (user_id = auth.uid());

-- Function للحصول على تقدم المستخدم في مادة
CREATE OR REPLACE FUNCTION get_subject_progress(p_user_id UUID, p_subject_id UUID)
RETURNS TABLE (
    total_lessons INTEGER,
    completed_lessons INTEGER,
    progress_percentage NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(l.id)::INTEGER as total_lessons,
        COUNT(ulp.id) FILTER (WHERE ulp.is_completed = true)::INTEGER as completed_lessons,
        COALESCE(ROUND(COUNT(ulp.id) FILTER (WHERE ulp.is_completed = true)::NUMERIC / NULLIF(COUNT(l.id), 0) * 100, 2), 0) as progress_percentage
    FROM lessons l
    LEFT JOIN user_lesson_progress ulp ON ulp.lesson_id = l.id AND ulp.user_id = p_user_id
    WHERE l.subject_id = p_subject_id AND l.is_published = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
