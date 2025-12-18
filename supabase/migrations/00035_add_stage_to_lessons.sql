-- ============================================
-- Migration: 00035_add_stage_to_lessons
-- Description: إضافة علاقة المراحل للدروس
-- ============================================

-- إضافة عمود stage_id للدروس
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS stage_id UUID REFERENCES educational_stages(id) ON DELETE SET NULL;

-- إنشاء فهرس للبحث السريع
CREATE INDEX IF NOT EXISTS idx_lessons_stage_id ON lessons(stage_id);
