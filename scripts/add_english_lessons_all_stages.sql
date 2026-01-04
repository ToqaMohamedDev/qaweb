-- إضافة دروس الإنجليزي لكل المراحل التعليمية
-- Add English Lessons for All Educational Stages

-- الدروس المطلوبة:
-- 1. Reading Comprehension
-- 2. Vocabulary
-- 3. Grammar
-- 4. Translation
-- 5. Literature (Great Expectations)
-- 6. Paragraph & Essay Writing
-- 7. Story

-- ملاحظة: يجب تنفيذ هذا Script من Supabase Dashboard → SQL Editor

DO $$
DECLARE
    english_subject_id uuid;
    stage_record RECORD;
    lesson_order int;
BEGIN
    -- جلب معرف مادة الإنجليزية (بالبحث بـ slug أو name)
    SELECT id INTO english_subject_id 
    FROM subjects 
    WHERE slug = 'english' OR name ILIKE '%english%'
    LIMIT 1;

    -- إذا لم توجد المادة، أنشئها
    IF english_subject_id IS NULL THEN
        INSERT INTO subjects (id, name, slug, description, icon, color, is_active, created_at)
        VALUES (
            gen_random_uuid(),
            'English',
            'english-lang',
            'English language lessons and exercises',
            '🇬🇧',
            '#3B82F6',
            true,
            NOW()
        )
        RETURNING id INTO english_subject_id;
        RAISE NOTICE 'Created English subject with ID: %', english_subject_id;
    ELSE
        RAISE NOTICE 'Found existing English subject with ID: %', english_subject_id;
    END IF;

    RAISE NOTICE 'Using English subject ID: %', english_subject_id;

    -- لكل مرحلة تعليمية
    FOR stage_record IN SELECT id, name FROM educational_stages ORDER BY id LOOP
        RAISE NOTICE 'Processing stage: %', stage_record.name;
        
        lesson_order := 1;

        -- 1. Reading Comprehension
        INSERT INTO lessons (
            id,
            stage_id,
            subject_id,
            title,
            title_ar,
            description,
            content,
            lesson_order,
            difficulty_level,
            estimated_duration,
            created_at
        ) VALUES (
            gen_random_uuid(),
            stage_record.id,
            english_subject_id,
            'Reading Comprehension',
            'الفهم القرائي',
            'Develop reading comprehension skills through various texts and exercises',
            'Learn how to read, understand, and analyze English texts effectively. This lesson covers strategies for better comprehension and critical thinking.',
            lesson_order,
            'intermediate',
            30,
            NOW()
        );
        lesson_order := lesson_order + 1;

        -- 2. Vocabulary
        INSERT INTO lessons (
            id, stage_id, subject_id, title, title_ar, description, content,
            lesson_order, difficulty_level, estimated_duration, created_at
        ) VALUES (
            gen_random_uuid(), stage_record.id, english_subject_id,
            'Vocabulary', 'المفردات',
            'Expand your English vocabulary with essential words and phrases',
            'Build a strong vocabulary foundation with commonly used English words, idioms, and expressions. Learn effective memorization techniques.',
            lesson_order, 'beginner', 25, NOW()
        );
        lesson_order := lesson_order + 1;

        -- 3. Grammar
        INSERT INTO lessons (
            id, stage_id, subject_id, title, title_ar, description, content,
            lesson_order, difficulty_level, estimated_duration, created_at
        ) VALUES (
            gen_random_uuid(), stage_record.id, english_subject_id,
            'Grammar', 'القواعد',
            'Master English grammar rules and structures',
            'Comprehensive grammar lessons covering tenses, sentence structure, parts of speech, and more. Practice with real examples.',
            lesson_order, 'intermediate', 35, NOW()
        );
        lesson_order := lesson_order + 1;

        -- 4. Translation
        INSERT INTO lessons (
            id, stage_id, subject_id, title, title_ar, description, content,
            lesson_order, difficulty_level, estimated_duration, created_at
        ) VALUES (
            gen_random_uuid(), stage_record.id, english_subject_id,
            'Translation', 'الترجمة',
            'Learn translation techniques between English and Arabic',
            'Develop translation skills with practical exercises. Learn to translate accurately while maintaining the original meaning and context.',
            lesson_order, 'advanced', 30, NOW()
        );
        lesson_order := lesson_order + 1;

        -- 5. Literature (Great Expectations)
        INSERT INTO lessons (
            id, stage_id, subject_id, title, title_ar, description, content,
            lesson_order, difficulty_level, estimated_duration, created_at
        ) VALUES (
            gen_random_uuid(), stage_record.id, english_subject_id,
            'Literature: Great Expectations', 'الأدب: آمال عظيمة',
            'Study Charles Dickens'' classic novel Great Expectations',
            'Explore the themes, characters, and literary techniques in Great Expectations. Analyze the plot and understand Victorian literature.',
            lesson_order, 'advanced', 45, NOW()
        );
        lesson_order := lesson_order + 1;

        -- 6. Paragraph & Essay Writing
        INSERT INTO lessons (
            id, stage_id, subject_id, title, title_ar, description, content,
            lesson_order, difficulty_level, estimated_duration, created_at
        ) VALUES (
            gen_random_uuid(), stage_record.id, english_subject_id,
            'Paragraph & Essay Writing', 'كتابة الفقرات والمقالات',
            'Learn to write well-structured paragraphs and essays in English',
            'Master the art of English writing. Learn paragraph structure, essay organization, topic sentences, and effective conclusions.',
            lesson_order, 'intermediate', 40, NOW()
        );
        lesson_order := lesson_order + 1;

        -- 7. Story
        INSERT INTO lessons (
            id, stage_id, subject_id, title, title_ar, description, content,
            lesson_order, difficulty_level, estimated_duration, created_at
        ) VALUES (
            gen_random_uuid(), stage_record.id, english_subject_id,
            'Story Writing & Analysis', 'كتابة وتحليل القصص',
            'Learn creative writing and story analysis techniques',
            'Develop creative writing skills by learning story elements, plot development, character creation, and narrative techniques.',
            lesson_order, 'intermediate', 35, NOW()
        );

        RAISE NOTICE 'Added 7 lessons for stage: %', stage_record.name;
    END LOOP;

    RAISE NOTICE 'Successfully added all English lessons!';
END $$;

-- التحقق من النتائج
SELECT 
    es.name as stage,
    COUNT(l.id) as lesson_count,
    string_agg(l.title_ar, ', ' ORDER BY l.lesson_order) as lessons
FROM educational_stages es
LEFT JOIN lessons l ON l.stage_id = es.id 
    AND l.subject_id = (SELECT id FROM subjects WHERE name = 'English' LIMIT 1)
GROUP BY es.id, es.name
ORDER BY es.name;
