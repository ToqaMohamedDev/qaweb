-- Seeding data for Control Panel tables
-- This script adds detailed and extensive sample data for:
-- 1. supported_languages
-- 2. word_categories
-- 3. word_bank
-- 4. word_bank_translations
-- 5. page_words
-- 6. user_word_highlights (Linked to the first user found in profiles)
-- 7. translation_cache

-- -----------------------------------------------------------------------------
-- 1. Supported Languages
-- -----------------------------------------------------------------------------
INSERT INTO public.supported_languages (code, name_en, name_native, is_active, text_direction, sort_order)
VALUES 
  ('en', 'English', 'English', true, 'ltr', 1),
  ('ar', 'Arabic', 'العربية', true, 'rtl', 2),
  ('fr', 'French', 'Français', true, 'ltr', 3),
  ('es', 'Spanish', 'Español', true, 'ltr', 4),
  ('de', 'German', 'Deutsch', true, 'ltr', 5),
  ('it', 'Italian', 'Italiano', false, 'ltr', 6), -- Inactive example
  ('zh', 'Chinese', '中文', false, 'ltr', 7),      -- Inactive example
  ('ru', 'Russian', 'Русский', false, 'ltr', 8)     -- Inactive example
ON CONFLICT (code) DO UPDATE 
SET name_en = EXCLUDED.name_en, 
    name_native = EXCLUDED.name_native,
    text_direction = EXCLUDED.text_direction;

-- -----------------------------------------------------------------------------
-- 2. Word Categories
-- -----------------------------------------------------------------------------
INSERT INTO public.word_categories (slug, name_en, name_ar, icon_name, color_hex, sort_order, is_active)
VALUES
  ('general', 'General', 'عام', 'Globe', '#9ca3af', 1, true),
  ('education', 'Education', 'التعليم', 'BookOpen', '#3b82f6', 2, true),
  ('technology', 'Technology', 'التكنولوجيا', 'Cpu', '#8b5cf6', 3, true),
  ('business', 'Business', 'الأعمال', 'Briefcase', '#10b981', 4, true),
  ('science', 'Science', 'العلوم', 'Beaker', '#ef4444', 5, true),
  ('travel', 'Travel', 'السفر', 'Plane', '#f59e0b', 6, true),
  ('health', 'Health', 'الصحة', 'Heart', '#ec4899', 7, true),
  ('food', 'Food', 'الطعام', 'Utensils', '#f97316', 8, true),
  ('nature', 'Nature', 'الطبيعة', 'Leaf', '#22c55e', 9, true)
ON CONFLICT (slug) DO UPDATE
SET name_en = EXCLUDED.name_en,
    name_ar = EXCLUDED.name_ar,
    color_hex = EXCLUDED.color_hex;

-- -----------------------------------------------------------------------------
-- 3. Word Bank (Vocabulary)
-- -----------------------------------------------------------------------------
-- Using generated UUIDs for inserted rows to reference them in translations
-- We use a CTE here to insert and capture IDs for the next step is tricky in pure SQL script without plpgsql variables usually,
-- but for a seed script, we can just insert and rely on simple lookups or just insert common words.
-- Since this is for the user to run, I will simple insert data. Relationship integrity relies on value matching or I'll do it in blocks.

INSERT INTO public.word_bank (word_text, language_code, category_slug)
VALUES
  -- General
  ('Hello', 'en', 'general'),
  ('Welcome', 'en', 'general'),
  ('Thank you', 'en', 'general'),
  ('Please', 'en', 'general'),
  ('Goodbye', 'en', 'general'),
  
  -- Education
  ('School', 'en', 'education'),
  ('Teacher', 'en', 'education'),
  ('Student', 'en', 'education'),
  ('Library', 'en', 'education'),
  ('Lesson', 'en', 'education'),
  ('Homework', 'en', 'education'),
  ('Exam', 'en', 'education'),

  -- Technology
  ('Computer', 'en', 'technology'),
  ('Software', 'en', 'technology'),
  ('Internet', 'en', 'technology'),
  ('Database', 'en', 'technology'),
  ('Algorithm', 'en', 'technology'),
  ('Developer', 'en', 'technology'),
  ('Code', 'en', 'technology'),

  -- Business
  ('Meeting', 'en', 'business'),
  ('Manager', 'en', 'business'),
  ('Project', 'en', 'business'),
  ('Strategy', 'en', 'business'),
  ('Marketing', 'en', 'business'),

  -- Science
  ('Biology', 'en', 'science'),
  ('Chemistry', 'en', 'science'),
  ('Physics', 'en', 'science'),
  ('Experiment', 'en', 'science'),
  ('Theory', 'en', 'science');

-- -----------------------------------------------------------------------------
-- 4. Word Bank Translations
-- -----------------------------------------------------------------------------
-- We will link translations to the words we just added. 
-- Assuming 'en' is the source for the above.

-- Helper: We can't easily get the specific IDs in a block like this without logic.
-- So we will use a subquery approach for insertion.

INSERT INTO public.word_bank_translations (word_bank_id, target_language, translated_text)
SELECT id, 'ar', 'مرحباً' FROM public.word_bank WHERE word_text = 'Hello' AND language_code = 'en'
UNION ALL SELECT id, 'fr', 'Bonjour' FROM public.word_bank WHERE word_text = 'Hello' AND language_code = 'en'
UNION ALL SELECT id, 'es', 'Hola' FROM public.word_bank WHERE word_text = 'Hello' AND language_code = 'en'
UNION ALL SELECT id, 'de', 'Hallo' FROM public.word_bank WHERE word_text = 'Hello' AND language_code = 'en';

INSERT INTO public.word_bank_translations (word_bank_id, target_language, translated_text)
SELECT id, 'ar', 'أهلاً بك' FROM public.word_bank WHERE word_text = 'Welcome' AND language_code = 'en'
UNION ALL SELECT id, 'fr', 'Bienvenue' FROM public.word_bank WHERE word_text = 'Welcome' AND language_code = 'en';

INSERT INTO public.word_bank_translations (word_bank_id, target_language, translated_text)
SELECT id, 'ar', 'شكراً لك' FROM public.word_bank WHERE word_text = 'Thank you' AND language_code = 'en';

INSERT INTO public.word_bank_translations (word_bank_id, target_language, translated_text)
SELECT id, 'ar', 'مدرسة' FROM public.word_bank WHERE word_text = 'School' AND language_code = 'en'
UNION ALL SELECT id, 'fr', 'École' FROM public.word_bank WHERE word_text = 'School' AND language_code = 'en';

INSERT INTO public.word_bank_translations (word_bank_id, target_language, translated_text)
SELECT id, 'ar', 'معلم' FROM public.word_bank WHERE word_text = 'Teacher' AND language_code = 'en';

INSERT INTO public.word_bank_translations (word_bank_id, target_language, translated_text)
SELECT id, 'ar', 'طالب' FROM public.word_bank WHERE word_text = 'Student' AND language_code = 'en';

INSERT INTO public.word_bank_translations (word_bank_id, target_language, translated_text)
SELECT id, 'ar', 'حاسوب' FROM public.word_bank WHERE word_text = 'Computer' AND language_code = 'en'
UNION ALL SELECT id, 'fr', 'Ordinateur' FROM public.word_bank WHERE word_text = 'Computer' AND language_code = 'en';

INSERT INTO public.word_bank_translations (word_bank_id, target_language, translated_text)
SELECT id, 'ar', 'إنترنت' FROM public.word_bank WHERE word_text = 'Internet' AND language_code = 'en';

INSERT INTO public.word_bank_translations (word_bank_id, target_language, translated_text)
SELECT id, 'ar', 'مشروع' FROM public.word_bank WHERE word_text = 'Project' AND language_code = 'en';

INSERT INTO public.word_bank_translations (word_bank_id, target_language, translated_text)
SELECT id, 'ar', 'علم الأحياء' FROM public.word_bank WHERE word_text = 'Biology' AND language_code = 'en';

-- -----------------------------------------------------------------------------
-- 5. Page Words
-- -----------------------------------------------------------------------------
-- These represent words found on specific pages for the interactive reader
-- word_id is varchar(20), so we generate a short unique string
INSERT INTO public.page_words (page_id, word_text, language_code, word_id)
VALUES
  -- Page: /courses/english-101/lesson-1
  ('/courses/english-101/lesson-1', 'Hello', 'en', substr(gen_random_uuid()::text, 1, 15)),
  ('/courses/english-101/lesson-1', 'Student', 'en', substr(gen_random_uuid()::text, 1, 15)),
  ('/courses/english-101/lesson-1', 'Learning', 'en', substr(gen_random_uuid()::text, 1, 15)),
  ('/courses/english-101/lesson-1', 'Book', 'en', substr(gen_random_uuid()::text, 1, 15)),
  ('/courses/english-101/lesson-1', 'Read', 'en', substr(gen_random_uuid()::text, 1, 15)),

  -- Page: /courses/science/intro
  ('/courses/science/intro', 'Science', 'en', substr(gen_random_uuid()::text, 1, 15)),
  ('/courses/science/intro', 'Biology', 'en', substr(gen_random_uuid()::text, 1, 15)),
  ('/courses/science/intro', 'Life', 'en', substr(gen_random_uuid()::text, 1, 15)),
  ('/courses/science/intro', 'Cell', 'en', substr(gen_random_uuid()::text, 1, 15)),
  ('/courses/science/intro', 'Energy', 'en', substr(gen_random_uuid()::text, 1, 15)),

  -- Page: /articles/technology-trends
  ('/articles/technology-trends', 'Computer', 'en', substr(gen_random_uuid()::text, 1, 15)),
  ('/articles/technology-trends', 'Future', 'en', substr(gen_random_uuid()::text, 1, 15)),
  ('/articles/technology-trends', 'AI', 'en', substr(gen_random_uuid()::text, 1, 15)),
  ('/articles/technology-trends', 'Robot', 'en', substr(gen_random_uuid()::text, 1, 15)),
  ('/articles/technology-trends', 'Data', 'en', substr(gen_random_uuid()::text, 1, 15));

-- -----------------------------------------------------------------------------
-- 6. User Word Highlights
-- -----------------------------------------------------------------------------
-- Create dummy highlights for the first found user in profiles.
-- We create a JSON structure simulating that the user highlighted some words on the pages above.

DO $$
DECLARE
    v_user_id UUID;
    v_page1_word1_id TEXT;
    v_page1_word2_id TEXT;
    v_page2_word1_id TEXT;
BEGIN
    -- Get a user ID (first one)
    SELECT id INTO v_user_id FROM public.profiles LIMIT 1;
    
    -- Get some word IDs from page_words to use in the JSON
    -- We select word_id column here assuming that matches the structure expected
    SELECT word_id INTO v_page1_word1_id FROM public.page_words WHERE word_text = 'Hello' LIMIT 1;
    SELECT word_id INTO v_page1_word2_id FROM public.page_words WHERE word_text = 'Student' LIMIT 1;
    SELECT word_id INTO v_page2_word1_id FROM public.page_words WHERE word_text = 'Science' LIMIT 1;

    IF v_user_id IS NOT NULL AND v_page1_word1_id IS NOT NULL THEN
        INSERT INTO public.user_word_highlights (user_id, highlighted_words, updated_at)
        VALUES (
            v_user_id,
            jsonb_build_object(
                'en', jsonb_build_object(
                    '/courses/english-101/lesson-1', jsonb_build_array(v_page1_word1_id, v_page1_word2_id),
                    '/courses/science/intro', jsonb_build_array(v_page2_word1_id)
                )
            ),
            NOW()
        )
        ON CONFLICT (user_id) 
        DO UPDATE SET highlighted_words = EXCLUDED.highlighted_words, updated_at = NOW();
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 7. Translation Cache
-- -----------------------------------------------------------------------------
-- Pre-fill some cache entries as if they were fetched from an API
INSERT INTO public.translation_cache (source_text, source_lang, target_lang, translated_text, provider_name, created_at)
VALUES
  ('Hello world', 'en', 'ar', 'مرحبا بالعالم', 'mymemory', NOW() - INTERVAL '1 day'),
  ('How are you?', 'en', 'ar', 'كيف حالك؟', 'mymemory', NOW() - INTERVAL '2 days'),
  ('Good morning', 'en', 'fr', 'Bonjour', 'google', NOW() - INTERVAL '5 days'),
  ('Software Engineering', 'en', 'ar', 'هندسة البرمجيات', 'mymemory', NOW()),
  ('Artificial Intelligence', 'en', 'ar', 'الذكاء الاصطناعي', 'openai', NOW())
ON CONFLICT (source_text, source_lang, target_lang) DO NOTHING;

-- End of seed script
