-- ============================================
-- Migration: 00030_remove_stage_subject_relationship
-- Description: إزالة العلاقة بين المراحل والمواد
-- ============================================

-- 1. حذف المواد (لأنها مرتبطة بالمراحل القديمة)
DELETE FROM subjects;

-- 2. حذف المراحل القديمة
DELETE FROM educational_stages;

-- 3. إزالة القيد الخاص بـ stage_id من جدول subjects
ALTER TABLE subjects DROP CONSTRAINT IF EXISTS subjects_stage_id_fkey;

-- 4. جعل stage_id اختيارياً (nullable) بدلاً من إلزامي
ALTER TABLE subjects ALTER COLUMN stage_id DROP NOT NULL;

-- 5. إعادة إضافة المراحل التعليمية بـ UUIDs عشوائية
INSERT INTO educational_stages (name, description, slug, order_index, is_active) VALUES
    ('الصف الأول الإعدادي', 'الصف الأول من المرحلة الإعدادية', 'grade-7', 1, true),
    ('الصف الثاني الإعدادي', 'الصف الثاني من المرحلة الإعدادية', 'grade-8', 2, true),
    ('الصف الثالث الإعدادي', 'الصف الثالث من المرحلة الإعدادية', 'grade-9', 3, true),
    ('الصف الأول الثانوي', 'الصف الأول من المرحلة الثانوية', 'grade-10', 4, true),
    ('الصف الثاني الثانوي', 'الصف الثاني من المرحلة الثانوية', 'grade-11', 5, true),
    ('الصف الثالث الثانوي', 'الصف الثالث من المرحلة الثانوية', 'grade-12', 6, true);

-- 6. إعادة إضافة المواد (الآن بدون ربط بالمراحل)
INSERT INTO subjects (name, description, slug, order_index, is_active) VALUES
    ('اللغة العربية', 'مادة اللغة العربية', 'arabic', 1, true),
    ('الرياضيات', 'مادة الرياضيات', 'math', 2, true),
    ('اللغة الإنجليزية', 'مادة اللغة الإنجليزية', 'english', 3, true),
    ('العلوم', 'مادة العلوم', 'science', 4, true),
    ('الدراسات الاجتماعية', 'مادة الدراسات الاجتماعية', 'social-studies', 5, true),
    ('الفيزياء', 'مادة الفيزياء', 'physics', 6, true),
    ('الكيمياء', 'مادة الكيمياء', 'chemistry', 7, true),
    ('الأحياء', 'مادة الأحياء', 'biology', 8, true),
    ('الجغرافيا', 'مادة الجغرافيا', 'geography', 9, true),
    ('التاريخ', 'مادة التاريخ', 'history', 10, true),
    ('الفلسفة والمنطق', 'مادة الفلسفة والمنطق', 'philosophy', 11, true),
    ('علم النفس والاجتماع', 'مادة علم النفس والاجتماع', 'psychology', 12, true),
    ('الحاسب الآلي', 'مادة الحاسب الآلي', 'computer', 13, true);
