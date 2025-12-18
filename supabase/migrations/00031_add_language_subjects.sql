-- ============================================
-- Migration: 00031_add_language_subjects
-- Description: إضافة مواد اللغات الأجنبية
-- ============================================

INSERT INTO subjects (name, description, slug, order_index, is_active) VALUES
    ('اللغة الفرنسية', 'مادة اللغة الفرنسية', 'french', 14, true),
    ('اللغة الإيطالية', 'مادة اللغة الإيطالية', 'italian', 15, true),
    ('اللغة الألمانية', 'مادة اللغة الألمانية', 'german', 16, true);
