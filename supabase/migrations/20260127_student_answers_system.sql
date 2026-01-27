-- ============================================================================
-- Student Answers Implementation - Complete Migration
-- Version: 3.0
-- Date: 2026-01-27
-- ============================================================================

-- ============================================================================
-- STEP 1: CREATE NEW TABLE - question_bank_attempts
-- ============================================================================

CREATE TABLE IF NOT EXISTS question_bank_attempts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- العلاقات الأساسية
    question_bank_id    UUID NOT NULL REFERENCES question_banks(id) ON DELETE CASCADE,
    student_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- بيانات الإجابات (JSONB ذكي)
    answers             JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- الإحصائيات المحسوبة
    answered_count      INTEGER DEFAULT 0,
    correct_count       INTEGER DEFAULT 0,
    total_questions     INTEGER DEFAULT 0,
    total_score         INTEGER DEFAULT 0,
    max_score           INTEGER DEFAULT 0,
    score_percentage    NUMERIC(5,2) DEFAULT 0,
    
    -- الحالة
    status              TEXT DEFAULT 'in_progress' 
                        CHECK (status IN ('in_progress', 'completed')),
    
    -- التوقيتات
    first_answered_at   TIMESTAMPTZ,
    last_answered_at    TIMESTAMPTZ,
    completed_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now(),
    
    -- القيد الفريد: صف واحد فقط لكل طالب + بنك أسئلة
    UNIQUE(question_bank_id, student_id)
);

-- ============================================================================
-- STEP 2: ALTER EXISTING TABLES
-- ============================================================================

-- 2.1 comprehensive_exam_attempts
ALTER TABLE comprehensive_exam_attempts 
ADD COLUMN IF NOT EXISTS answered_count INTEGER DEFAULT 0;

ALTER TABLE comprehensive_exam_attempts 
ADD COLUMN IF NOT EXISTS percentage NUMERIC(5,2);

-- Add UNIQUE constraint if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_student_comprehensive_exam'
    ) THEN
        ALTER TABLE comprehensive_exam_attempts 
        ADD CONSTRAINT unique_student_comprehensive_exam UNIQUE (exam_id, student_id);
    END IF;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

-- 2.2 teacher_exam_attempts
ALTER TABLE teacher_exam_attempts 
ADD COLUMN IF NOT EXISTS answered_count INTEGER DEFAULT 0;

ALTER TABLE teacher_exam_attempts 
ADD COLUMN IF NOT EXISTS percentage NUMERIC(5,2);

ALTER TABLE teacher_exam_attempts 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Add UNIQUE constraint if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_student_teacher_exam'
    ) THEN
        ALTER TABLE teacher_exam_attempts 
        ADD CONSTRAINT unique_student_teacher_exam UNIQUE (exam_id, student_id);
    END IF;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

-- ============================================================================
-- STEP 3: CREATE INDEXES
-- ============================================================================

-- question_bank_attempts indexes
CREATE INDEX IF NOT EXISTS idx_qb_attempts_student ON question_bank_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_qb_attempts_bank ON question_bank_attempts(question_bank_id);
CREATE INDEX IF NOT EXISTS idx_qb_attempts_status ON question_bank_attempts(status);
CREATE INDEX IF NOT EXISTS idx_qb_attempts_student_updated ON question_bank_attempts(student_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_qb_attempts_answers_gin ON question_bank_attempts USING GIN (answers);

-- comprehensive_exam_attempts indexes (if not exist)
CREATE INDEX IF NOT EXISTS idx_comp_attempts_student ON comprehensive_exam_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_comp_attempts_exam ON comprehensive_exam_attempts(exam_id);
CREATE INDEX IF NOT EXISTS idx_comp_attempts_status ON comprehensive_exam_attempts(status);

-- teacher_exam_attempts indexes (if not exist)
CREATE INDEX IF NOT EXISTS idx_teacher_attempts_student ON teacher_exam_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_teacher_attempts_exam ON teacher_exam_attempts(exam_id);
CREATE INDEX IF NOT EXISTS idx_teacher_attempts_status ON teacher_exam_attempts(status);

-- ============================================================================
-- STEP 4: CREATE updated_at TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Apply trigger to question_bank_attempts
DROP TRIGGER IF EXISTS trg_question_bank_attempts_updated_at ON question_bank_attempts;
CREATE TRIGGER trg_question_bank_attempts_updated_at
    BEFORE UPDATE ON question_bank_attempts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 5: RLS POLICIES - question_bank_attempts
-- ============================================================================

ALTER TABLE question_bank_attempts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Students view own qb attempts" ON question_bank_attempts;
DROP POLICY IF EXISTS "Students create own qb attempts" ON question_bank_attempts;
DROP POLICY IF EXISTS "Students update own in_progress qb attempts" ON question_bank_attempts;
DROP POLICY IF EXISTS "Admins full access qb attempts" ON question_bank_attempts;

-- الطالب يرى محاولاته فقط
CREATE POLICY "Students view own qb attempts" ON question_bank_attempts
  FOR SELECT USING (auth.uid() = student_id);

-- الطالب يُنشئ محاولة لنفسه فقط
CREATE POLICY "Students create own qb attempts" ON question_bank_attempts
  FOR INSERT WITH CHECK (auth.uid() = student_id);

-- الطالب يُحدث محاولته فقط أثناء in_progress
CREATE POLICY "Students update own in_progress qb attempts" ON question_bank_attempts
  FOR UPDATE USING (
    auth.uid() = student_id 
    AND status = 'in_progress'
  );

-- الأدمن يرى ويعدل الكل
CREATE POLICY "Admins full access qb attempts" ON question_bank_attempts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- STEP 6: RLS POLICIES - teacher_exam_attempts
-- ============================================================================

ALTER TABLE teacher_exam_attempts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Students view own teacher attempts" ON teacher_exam_attempts;
DROP POLICY IF EXISTS "Students create own teacher attempts" ON teacher_exam_attempts;
DROP POLICY IF EXISTS "Students update own in_progress teacher attempts" ON teacher_exam_attempts;
DROP POLICY IF EXISTS "Teachers view their exam attempts" ON teacher_exam_attempts;
DROP POLICY IF EXISTS "Teachers grade submitted attempts" ON teacher_exam_attempts;
DROP POLICY IF EXISTS "Admins full access teacher attempts" ON teacher_exam_attempts;

-- الطالب يرى محاولاته فقط
CREATE POLICY "Students view own teacher attempts" ON teacher_exam_attempts
  FOR SELECT USING (auth.uid() = student_id);

-- الطالب يُنشئ محاولة لنفسه فقط
CREATE POLICY "Students create own teacher attempts" ON teacher_exam_attempts
  FOR INSERT WITH CHECK (auth.uid() = student_id);

-- الطالب يُحدث محاولته فقط أثناء in_progress
CREATE POLICY "Students update own in_progress teacher attempts" ON teacher_exam_attempts
  FOR UPDATE USING (
    auth.uid() = student_id 
    AND status = 'in_progress'
  );

-- المدرس يرى محاولات امتحاناته
CREATE POLICY "Teachers view their exam attempts" ON teacher_exam_attempts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM teacher_exams 
      WHERE id = exam_id AND created_by = auth.uid()
    )
  );

-- المدرس يُحدث للتصحيح اليدوي (بعد submitted)
CREATE POLICY "Teachers grade submitted attempts" ON teacher_exam_attempts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM teacher_exams 
      WHERE id = exam_id AND created_by = auth.uid()
    )
    AND status IN ('submitted', 'graded')
  );

-- الأدمن يرى ويعدل الكل
CREATE POLICY "Admins full access teacher attempts" ON teacher_exam_attempts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- STEP 7: RLS POLICIES - comprehensive_exam_attempts
-- ============================================================================

ALTER TABLE comprehensive_exam_attempts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Students view own comp attempts" ON comprehensive_exam_attempts;
DROP POLICY IF EXISTS "Students create own comp attempts" ON comprehensive_exam_attempts;
DROP POLICY IF EXISTS "Students update own in_progress comp attempts" ON comprehensive_exam_attempts;
DROP POLICY IF EXISTS "Admins full access comp attempts" ON comprehensive_exam_attempts;

-- الطالب يرى محاولاته فقط
CREATE POLICY "Students view own comp attempts" ON comprehensive_exam_attempts
  FOR SELECT USING (auth.uid() = student_id);

-- الطالب يُنشئ محاولة لنفسه فقط
CREATE POLICY "Students create own comp attempts" ON comprehensive_exam_attempts
  FOR INSERT WITH CHECK (auth.uid() = student_id);

-- الطالب يُحدث محاولته فقط أثناء in_progress
CREATE POLICY "Students update own in_progress comp attempts" ON comprehensive_exam_attempts
  FOR UPDATE USING (
    auth.uid() = student_id 
    AND status = 'in_progress'
  );

-- الأدمن يرى ويعدل الكل
CREATE POLICY "Admins full access comp attempts" ON comprehensive_exam_attempts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- STEP 8: FREEZE AFTER PUBLISH TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION prevent_published_question_edit()
RETURNS TRIGGER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if is_published column exists and is true
  IF TG_TABLE_NAME = 'question_banks' THEN
    IF OLD.is_published = true AND NEW.questions IS DISTINCT FROM OLD.questions THEN
      RAISE EXCEPTION 'Cannot modify questions of a published question bank. Unpublish first.';
    END IF;
  ELSIF TG_TABLE_NAME = 'comprehensive_exams' THEN
    IF OLD.is_published = true AND NEW.blocks IS DISTINCT FROM OLD.blocks THEN
      RAISE EXCEPTION 'Cannot modify blocks of a published exam. Unpublish first.';
    END IF;
  ELSIF TG_TABLE_NAME = 'teacher_exams' THEN
    IF OLD.is_published = true AND NEW.blocks IS DISTINCT FROM OLD.blocks THEN
      RAISE EXCEPTION 'Cannot modify blocks of a published exam. Unpublish first.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Apply to question_banks
DROP TRIGGER IF EXISTS trg_prevent_published_question_edit ON question_banks;
CREATE TRIGGER trg_prevent_published_question_edit
BEFORE UPDATE ON question_banks
FOR EACH ROW
EXECUTE FUNCTION prevent_published_question_edit();

-- Apply to comprehensive_exams (if is_published column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'comprehensive_exams' AND column_name = 'is_published'
  ) THEN
    DROP TRIGGER IF EXISTS trg_prevent_published_exam_edit ON comprehensive_exams;
    CREATE TRIGGER trg_prevent_published_exam_edit
    BEFORE UPDATE ON comprehensive_exams
    FOR EACH ROW
    EXECUTE FUNCTION prevent_published_question_edit();
  END IF;
END $$;

-- Apply to teacher_exams (if is_published column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'teacher_exams' AND column_name = 'is_published'
  ) THEN
    DROP TRIGGER IF EXISTS trg_prevent_published_teacher_exam_edit ON teacher_exams;
    CREATE TRIGGER trg_prevent_published_teacher_exam_edit
    BEFORE UPDATE ON teacher_exams
    FOR EACH ROW
    EXECUTE FUNCTION prevent_published_question_edit();
  END IF;
END $$;

-- ============================================================================
-- COMPLETE
-- ============================================================================
