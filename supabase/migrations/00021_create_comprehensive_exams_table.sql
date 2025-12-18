-- ============================================
-- Migration: 00021_create_comprehensive_exams_table
-- Description: إنشاء جدول الامتحانات الشاملة
-- ============================================

CREATE TABLE IF NOT EXISTS comprehensive_exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('arabic_comprehensive_exam', 'english_comprehensive_exam')),
    language TEXT NOT NULL CHECK (language IN ('arabic', 'english')),
    usage_scope TEXT NOT NULL DEFAULT 'exam' CHECK (usage_scope IN ('exam', 'lesson')),
    lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
    exam_title TEXT NOT NULL,
    exam_description TEXT,
    total_marks INTEGER,
    duration_minutes INTEGER,
    passing_score INTEGER,
    grading_mode TEXT NOT NULL DEFAULT 'auto' CHECK (grading_mode IN ('manual', 'hybrid', 'auto')),
    branch_tags TEXT[] DEFAULT '{}',
    blocks JSONB NOT NULL DEFAULT '[]',
    sections JSONB NOT NULL DEFAULT '[]',
    is_published BOOLEAN NOT NULL DEFAULT false,
    stage_id UUID REFERENCES educational_stages(id) ON DELETE SET NULL,
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    subject_name TEXT,
    stage_name TEXT,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- الفهارس
CREATE INDEX IF NOT EXISTS idx_comprehensive_exams_type ON comprehensive_exams(type);
CREATE INDEX IF NOT EXISTS idx_comprehensive_exams_language ON comprehensive_exams(language);
CREATE INDEX IF NOT EXISTS idx_comprehensive_exams_stage_id ON comprehensive_exams(stage_id);
CREATE INDEX IF NOT EXISTS idx_comprehensive_exams_subject_id ON comprehensive_exams(subject_id);
CREATE INDEX IF NOT EXISTS idx_comprehensive_exams_lesson_id ON comprehensive_exams(lesson_id);
CREATE INDEX IF NOT EXISTS idx_comprehensive_exams_published ON comprehensive_exams(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_comprehensive_exams_created_by ON comprehensive_exams(created_by);
CREATE INDEX IF NOT EXISTS idx_comprehensive_exams_created_at ON comprehensive_exams(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comprehensive_exams_branch_tags ON comprehensive_exams USING gin(branch_tags);

-- Trigger
CREATE TRIGGER update_comprehensive_exams_updated_at
    BEFORE UPDATE ON comprehensive_exams FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE comprehensive_exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published comprehensive exams are viewable"
    ON comprehensive_exams FOR SELECT USING (
        is_published = true OR created_by = auth.uid()
        OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    );

CREATE POLICY "Teachers and admins can insert comprehensive exams"
    ON comprehensive_exams FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('teacher', 'admin'))
    );

CREATE POLICY "Creators and admins can update comprehensive exams"
    ON comprehensive_exams FOR UPDATE USING (
        created_by = auth.uid()
        OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    );

CREATE POLICY "Creators and admins can delete comprehensive exams"
    ON comprehensive_exams FOR DELETE USING (
        created_by = auth.uid()
        OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    );
