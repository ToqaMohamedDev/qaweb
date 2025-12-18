-- ============================================
-- Migration: 00034_drop_stage_id_column
-- Description: حذف عمود stage_id من جدول subjects نهائياً
-- ============================================

-- حذف العمود نهائياً
ALTER TABLE subjects DROP COLUMN IF EXISTS stage_id;
