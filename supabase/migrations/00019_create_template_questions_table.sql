-- ============================================
-- Migration: 00019_create_template_questions_table
-- Description: إنشاء جدول أسئلة قوالب الامتحانات
-- ============================================

CREATE TABLE IF NOT EXISTS template_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES exam_templates(id) ON DELETE CASCADE,
    text JSONB NOT NULL DEFAULT '{"ar": "", "en": ""}',
    type TEXT NOT NULL DEFAULT 'mcq' CHECK (type IN ('mcq', 'truefalse', 'essay', 'fill_blank', 'matching', 'ordering')),
    options JSONB NOT NULL DEFAULT '[]',
    correct_option_id TEXT,
    correct_answer JSONB,
    points INTEGER NOT NULL DEFAULT 1,
    order_index INTEGER NOT NULL DEFAULT 0,
    media JSONB DEFAULT '{}',
    hint JSONB DEFAULT '{"ar": "", "en": ""}',
    explanation JSONB DEFAULT '{"ar": "", "en": ""}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- الفهارس
CREATE INDEX IF NOT EXISTS idx_template_questions_template_id ON template_questions(template_id);
CREATE INDEX IF NOT EXISTS idx_template_questions_order ON template_questions(order_index);
CREATE INDEX IF NOT EXISTS idx_template_questions_type ON template_questions(type);
CREATE INDEX IF NOT EXISTS idx_template_questions_template_order ON template_questions(template_id, order_index);

-- Trigger لتحديث updated_at
CREATE TRIGGER update_template_questions_updated_at
    BEFORE UPDATE ON template_questions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger عند إضافة سؤال
CREATE OR REPLACE FUNCTION update_template_stats_on_insert()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE exam_templates SET 
        questions_count = questions_count + 1,
        total_points = total_points + NEW.points
    WHERE id = NEW.template_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_template_stats_insert
    AFTER INSERT ON template_questions FOR EACH ROW
    EXECUTE FUNCTION update_template_stats_on_insert();

-- Trigger عند حذف سؤال
CREATE OR REPLACE FUNCTION update_template_stats_on_delete()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE exam_templates SET 
        questions_count = GREATEST(0, questions_count - 1),
        total_points = GREATEST(0, total_points - OLD.points)
    WHERE id = OLD.template_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_template_stats_delete
    AFTER DELETE ON template_questions FOR EACH ROW
    EXECUTE FUNCTION update_template_stats_on_delete();

-- RLS
ALTER TABLE template_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Questions of published templates are viewable"
    ON template_questions FOR SELECT USING (
        EXISTS (SELECT 1 FROM exam_templates WHERE exam_templates.id = template_questions.template_id
            AND (exam_templates.is_published = true OR exam_templates.created_by = auth.uid()
                OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')))
    );

CREATE POLICY "Template creators can insert questions"
    ON template_questions FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM exam_templates WHERE exam_templates.id = template_questions.template_id
            AND (exam_templates.created_by = auth.uid()
                OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')))
    );

CREATE POLICY "Template creators can update questions"
    ON template_questions FOR UPDATE USING (
        EXISTS (SELECT 1 FROM exam_templates WHERE exam_templates.id = template_questions.template_id
            AND (exam_templates.created_by = auth.uid()
                OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')))
    );

CREATE POLICY "Template creators can delete questions"
    ON template_questions FOR DELETE USING (
        EXISTS (SELECT 1 FROM exam_templates WHERE exam_templates.id = template_questions.template_id
            AND (exam_templates.created_by = auth.uid()
                OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')))
    );
