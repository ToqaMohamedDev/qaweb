-- ============================================
-- Migration: 00038_add_english_lessons
-- Description: إضافة دروس اللغة الإنجليزية لجميع المراحل
-- ============================================

-- إضافة الدروس لكل مرحلة
DO $$
DECLARE
    english_subject_id UUID;
    stage_record RECORD;
    lesson_order INT;
BEGIN
    -- جلب ID مادة اللغة الإنجليزية
    SELECT id INTO english_subject_id FROM subjects WHERE slug = 'english' OR name ILIKE '%english%' OR name ILIKE '%انجليزي%' LIMIT 1;
    
    IF english_subject_id IS NULL THEN
        RAISE EXCEPTION 'مادة اللغة الإنجليزية غير موجودة';
    END IF;
    
    -- حذف الدروس القديمة للإنجليزي (لتجنب التكرار)
    DELETE FROM lessons WHERE subject_id = english_subject_id;
    
    -- المرور على كل مرحلة وإضافة الدروس
    FOR stage_record IN SELECT id, name FROM educational_stages ORDER BY order_index LOOP
        lesson_order := 1;
        
        -- Vocabulary and Structure
        INSERT INTO lessons (title, description, subject_id, stage_id, order_index, is_published)
        VALUES ('Vocabulary and Structure', 'Words, phrases, and grammar rules - ' || stage_record.name, english_subject_id, stage_record.id, lesson_order, true);
        lesson_order := lesson_order + 1;
        
        -- Reading Comprehension
        INSERT INTO lessons (title, description, subject_id, stage_id, order_index, is_published)
        VALUES ('Reading Comprehension', 'Understanding texts and answering questions - ' || stage_record.name, english_subject_id, stage_record.id, lesson_order, true);
        lesson_order := lesson_order + 1;
        
        -- Story (Literature)
        INSERT INTO lessons (title, description, subject_id, stage_id, order_index, is_published)
        VALUES ('Story (Literature)', 'Literary analysis and story comprehension - ' || stage_record.name, english_subject_id, stage_record.id, lesson_order, true);
        lesson_order := lesson_order + 1;
        
        -- Reading Passage
        INSERT INTO lessons (title, description, subject_id, stage_id, order_index, is_published)
        VALUES ('Reading Passage', 'Passage analysis and interpretation - ' || stage_record.name, english_subject_id, stage_record.id, lesson_order, true);
        lesson_order := lesson_order + 1;
        
        -- Translation
        INSERT INTO lessons (title, description, subject_id, stage_id, order_index, is_published)
        VALUES ('Translation', 'English to Arabic and Arabic to English translation - ' || stage_record.name, english_subject_id, stage_record.id, lesson_order, true);
        lesson_order := lesson_order + 1;
        
        -- Critical Thinking Questions
        INSERT INTO lessons (title, description, subject_id, stage_id, order_index, is_published)
        VALUES ('Critical Thinking Questions', 'Analytical and critical thinking exercises - ' || stage_record.name, english_subject_id, stage_record.id, lesson_order, true);
        lesson_order := lesson_order + 1;
        
        -- Writing
        INSERT INTO lessons (title, description, subject_id, stage_id, order_index, is_published)
        VALUES ('Writing', 'Essay writing and composition skills - ' || stage_record.name, english_subject_id, stage_record.id, lesson_order, true);
        
    END LOOP;
END $$;
