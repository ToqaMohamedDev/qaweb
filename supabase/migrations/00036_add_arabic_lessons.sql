-- ============================================
-- Migration: 00036_add_arabic_lessons
-- Description: إضافة دروس اللغة العربية لجميع المراحل
-- ============================================

-- إضافة الدروس لكل مرحلة
DO $$
DECLARE
    arabic_subject_id UUID;
    stage_record RECORD;
    lesson_order INT;
BEGIN
    -- جلب ID مادة اللغة العربية
    SELECT id INTO arabic_subject_id FROM subjects WHERE slug = 'arabic' LIMIT 1;
    
    IF arabic_subject_id IS NULL THEN
        RAISE EXCEPTION 'مادة اللغة العربية غير موجودة';
    END IF;
    
    -- المرور على كل مرحلة وإضافة الدروس
    FOR stage_record IN SELECT id, name FROM educational_stages ORDER BY order_index LOOP
        lesson_order := 1;
        
        -- النحو
        INSERT INTO lessons (title, description, subject_id, stage_id, order_index, is_published)
        VALUES ('النحو', 'دروس النحو والقواعد النحوية - ' || stage_record.name, arabic_subject_id, stage_record.id, lesson_order, true);
        lesson_order := lesson_order + 1;
        
        -- القراءة
        INSERT INTO lessons (title, description, subject_id, stage_id, order_index, is_published)
        VALUES ('القراءة', 'دروس القراءة والفهم - ' || stage_record.name, arabic_subject_id, stage_record.id, lesson_order, true);
        lesson_order := lesson_order + 1;
        
        -- النصوص
        INSERT INTO lessons (title, description, subject_id, stage_id, order_index, is_published)
        VALUES ('النصوص', 'النصوص الأدبية والشعرية - ' || stage_record.name, arabic_subject_id, stage_record.id, lesson_order, true);
        lesson_order := lesson_order + 1;
        
        -- القصة
        INSERT INTO lessons (title, description, subject_id, stage_id, order_index, is_published)
        VALUES ('القصة', 'دروس القصة والرواية - ' || stage_record.name, arabic_subject_id, stage_record.id, lesson_order, true);
        lesson_order := lesson_order + 1;
        
        -- الأدب
        INSERT INTO lessons (title, description, subject_id, stage_id, order_index, is_published)
        VALUES ('الأدب', 'تاريخ الأدب العربي - ' || stage_record.name, arabic_subject_id, stage_record.id, lesson_order, true);
        lesson_order := lesson_order + 1;
        
        -- البلاغة
        INSERT INTO lessons (title, description, subject_id, stage_id, order_index, is_published)
        VALUES ('البلاغة', 'دروس البلاغة والبيان - ' || stage_record.name, arabic_subject_id, stage_record.id, lesson_order, true);
        lesson_order := lesson_order + 1;
        
        -- التعبير
        INSERT INTO lessons (title, description, subject_id, stage_id, order_index, is_published)
        VALUES ('التعبير', 'دروس التعبير الإبداعي والوظيفي - ' || stage_record.name, arabic_subject_id, stage_record.id, lesson_order, true);
        
    END LOOP;
END $$;
