-- =============================================
-- Fix RLS Policies for Public Tables
-- Allow public SELECT access for educational data
-- =============================================

-- =============================================
-- SUBJECTS TABLE
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "public_select_subjects" ON subjects;
DROP POLICY IF EXISTS "allow_public_select_subjects" ON subjects;
DROP POLICY IF EXISTS "select_subjects" ON subjects;

-- Enable RLS
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

-- Allow public SELECT for all subjects
CREATE POLICY "public_select_subjects"
    ON subjects
    FOR SELECT
    TO public, anon, authenticated
    USING (true);

-- Allow admins full access
CREATE POLICY "admin_all_subjects"
    ON subjects
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- =============================================
-- EDUCATIONAL_STAGES TABLE
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "public_select_stages" ON educational_stages;
DROP POLICY IF EXISTS "allow_public_select_stages" ON educational_stages;
DROP POLICY IF EXISTS "select_stages" ON educational_stages;

-- Enable RLS
ALTER TABLE educational_stages ENABLE ROW LEVEL SECURITY;

-- Allow public SELECT for all stages
CREATE POLICY "public_select_stages"
    ON educational_stages
    FOR SELECT
    TO public, anon, authenticated
    USING (true);

-- =============================================
-- LESSONS TABLE
-- =============================================

-- Drop existing policies for SELECT
DROP POLICY IF EXISTS "public_select_lessons" ON lessons;
DROP POLICY IF EXISTS "allow_public_select_lessons" ON lessons;
DROP POLICY IF EXISTS "select_lessons" ON lessons;

-- Enable RLS
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- Allow public SELECT for published lessons
CREATE POLICY "public_select_published_lessons"
    ON lessons
    FOR SELECT
    TO public, anon, authenticated
    USING (is_published = true);

-- =============================================
-- QUESTION_BANKS TABLE
-- =============================================

-- Drop existing policies for SELECT
DROP POLICY IF EXISTS "public_select_question_banks" ON question_banks;
DROP POLICY IF EXISTS "allow_public_select_question_banks" ON question_banks;

-- Enable RLS
ALTER TABLE question_banks ENABLE ROW LEVEL SECURITY;

-- Allow public SELECT for active question banks
CREATE POLICY "public_select_active_question_banks"
    ON question_banks
    FOR SELECT
    TO public, anon, authenticated
    USING (is_active = true);

-- =============================================
-- PROFILES TABLE (for teachers)
-- =============================================

-- Drop existing SELECT policies
DROP POLICY IF EXISTS "public_select_teacher_profiles" ON profiles;
DROP POLICY IF EXISTS "allow_public_select_teachers" ON profiles;

-- Allow public SELECT for approved teachers
CREATE POLICY "public_select_teacher_profiles"
    ON profiles
    FOR SELECT
    TO public, anon, authenticated
    USING (
        role = 'teacher' AND is_teacher_approved = true
        OR id = auth.uid()
    );

-- =============================================
-- COMPREHENSIVE_EXAMS TABLE
-- =============================================

-- Allow public SELECT for published exams
DROP POLICY IF EXISTS "public_select_published_exams" ON comprehensive_exams;

CREATE POLICY "public_select_published_exams"
    ON comprehensive_exams
    FOR SELECT
    TO public, anon, authenticated
    USING (is_published = true);

-- =============================================
-- TEACHER_EXAMS TABLE
-- =============================================

-- Allow public SELECT for published teacher exams
DROP POLICY IF EXISTS "public_select_published_teacher_exams" ON teacher_exams;

CREATE POLICY "public_select_published_teacher_exams"
    ON teacher_exams
    FOR SELECT
    TO public, anon, authenticated
    USING (is_published = true);

-- =============================================
-- RAISE NOTICE
-- =============================================

DO $$
BEGIN
    RAISE NOTICE 'Public RLS policies have been successfully created for subjects, educational_stages, lessons, question_banks, profiles, comprehensive_exams, and teacher_exams tables.';
END $$;
