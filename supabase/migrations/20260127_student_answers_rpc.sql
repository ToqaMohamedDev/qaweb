-- ============================================================================
-- Student Answers Implementation - RPC Functions
-- Version: 3.0
-- Date: 2026-01-27
-- ============================================================================

-- ============================================================================
-- 1. upsert_question_bank_answer - حفظ إجابة سؤال في بنك الأسئلة
-- ============================================================================

CREATE OR REPLACE FUNCTION upsert_question_bank_answer(
  p_question_bank_id UUID,
  p_question_id TEXT,
  p_answer JSONB,
  p_time_spent_seconds INTEGER DEFAULT NULL,
  p_flagged BOOLEAN DEFAULT FALSE
) RETURNS JSONB
SET search_path = public
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_attempt_id UUID;
  v_status TEXT;
  v_student_id UUID := auth.uid();
  v_question JSONB;
  v_is_correct BOOLEAN;
  v_points_earned INTEGER;
  v_max_points INTEGER;
  v_new_answers JSONB;
  v_total_questions INTEGER;
BEGIN
  -- التحقق من تسجيل الدخول
  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- 1) جلب أو إنشاء المحاولة
  INSERT INTO question_bank_attempts (question_bank_id, student_id, first_answered_at)
  VALUES (p_question_bank_id, v_student_id, NOW())
  ON CONFLICT (question_bank_id, student_id) DO NOTHING
  RETURNING id, status INTO v_attempt_id, v_status;
  
  IF v_attempt_id IS NULL THEN
    SELECT id, status INTO v_attempt_id, v_status
    FROM question_bank_attempts 
    WHERE question_bank_id = p_question_bank_id AND student_id = v_student_id;
  END IF;
  
  -- 2) منع التعديل بعد الإكمال
  IF v_status IS NOT NULL AND v_status != 'in_progress' THEN
    RAISE EXCEPTION 'Cannot modify completed attempt';
  END IF;
  
  -- 3) جلب السؤال من البنك لحساب التصحيح
  SELECT q, qb.total_questions INTO v_question, v_total_questions
  FROM question_banks qb,
       jsonb_array_elements(qb.questions) AS q
  WHERE qb.id = p_question_bank_id
    AND q->>'id' = p_question_id;
  
  IF v_question IS NULL THEN
    RAISE EXCEPTION 'Question not found in bank: %', p_question_id;
  END IF;
  
  -- 4) حساب التصحيح على السيرفر
  v_max_points := COALESCE((v_question->>'points')::int, 1);
  
  -- التصحيح التلقائي للأسئلة الموضوعية
  IF v_question->>'type' IN ('mcq', 'true_false', 'multi_select', 'single_choice', 'multiple_choice') THEN
    -- مقارنة الإجابة مع الإجابة الصحيحة
    IF v_question ? 'correctAnswer' THEN
      v_is_correct := (p_answer = v_question->'correctAnswer');
    ELSIF v_question ? 'correct_answer' THEN
      v_is_correct := (p_answer = v_question->'correct_answer');
    ELSIF v_question ? 'correctOptionId' THEN
      v_is_correct := (p_answer = v_question->'correctOptionId');
    ELSE
      v_is_correct := NULL;
    END IF;
    v_points_earned := CASE WHEN v_is_correct THEN v_max_points ELSE 0 END;
  ELSE
    -- أسئلة مقالية: لا تصحيح تلقائي
    v_is_correct := NULL;
    v_points_earned := NULL;
  END IF;
  
  -- 5) تحديث الإجابة
  UPDATE question_bank_attempts
  SET 
    answers = jsonb_set(
      COALESCE(answers, '{}'::jsonb),
      ARRAY[p_question_id],
      jsonb_build_object(
        'answer', p_answer,
        'answered_at', NOW(),
        'time_spent_seconds', p_time_spent_seconds,
        'flagged', p_flagged,
        'auto', CASE 
          WHEN v_is_correct IS NOT NULL THEN
            jsonb_build_object(
              'is_correct', v_is_correct,
              'points_earned', v_points_earned,
              'max_points', v_max_points
            )
          ELSE NULL
        END,
        'manual', NULL
      )
    ),
    last_answered_at = NOW(),
    total_questions = v_total_questions
  WHERE id = v_attempt_id
  RETURNING answers INTO v_new_answers;
  
  -- 6) تحديث counters باستخدام subquery صحيحة
  WITH stats AS (
    SELECT 
      COUNT(*)::integer AS answered,
      COUNT(*) FILTER (WHERE (value->'auto'->>'is_correct')::boolean = true)::integer AS correct,
      COALESCE(SUM((value->'auto'->>'points_earned')::int), 0)::integer AS earned,
      COALESCE(SUM((value->'auto'->>'max_points')::int), 0)::integer AS max_pts
    FROM jsonb_each(v_new_answers)
  )
  UPDATE question_bank_attempts
  SET 
    answered_count = stats.answered,
    correct_count = stats.correct,
    total_score = stats.earned,
    max_score = stats.max_pts,
    score_percentage = CASE 
      WHEN stats.max_pts > 0 THEN ROUND((stats.earned::numeric / stats.max_pts) * 100, 2)
      ELSE 0
    END
  FROM stats
  WHERE id = v_attempt_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'attempt_id', v_attempt_id,
    'is_correct', v_is_correct,
    'points_earned', v_points_earned,
    'max_points', v_max_points
  );
END;
$$;

-- ============================================================================
-- 2. submit_question_bank_attempt - تسليم بنك الأسئلة
-- ============================================================================

CREATE OR REPLACE FUNCTION submit_question_bank_attempt(
  p_attempt_id UUID
) RETURNS JSONB
SET search_path = public
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_student_id UUID := auth.uid();
  v_result RECORD;
BEGIN
  -- التحقق من تسجيل الدخول
  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- التحقق من الملكية والحالة
  IF NOT EXISTS (
    SELECT 1 FROM question_bank_attempts 
    WHERE id = p_attempt_id 
      AND student_id = v_student_id 
      AND status = 'in_progress'
  ) THEN
    RAISE EXCEPTION 'Invalid attempt or already submitted';
  END IF;

  -- حساب الدرجات باستخدام CTE ثم UPDATE
  WITH scores AS (
    SELECT 
      COALESCE(SUM(
        COALESCE((value->'auto'->>'points_earned')::int, 0) +
        COALESCE((value->'manual'->>'points_earned')::int, 0)
      ), 0)::integer AS total_score,
      COALESCE(SUM(
        COALESCE((value->'auto'->>'max_points')::int, 0) +
        COALESCE((value->'manual'->>'max_points')::int, 0)
      ), 0)::integer AS max_score
    FROM question_bank_attempts qa,
         jsonb_each(qa.answers)
    WHERE qa.id = p_attempt_id
  )
  UPDATE question_bank_attempts
  SET 
    total_score = scores.total_score,
    max_score = scores.max_score,
    score_percentage = CASE 
      WHEN scores.max_score > 0 
      THEN ROUND((scores.total_score::numeric / scores.max_score) * 100, 2)
      ELSE 0
    END,
    status = 'completed',
    completed_at = NOW()
  FROM scores
  WHERE question_bank_attempts.id = p_attempt_id
  RETURNING question_bank_attempts.total_score, question_bank_attempts.max_score, question_bank_attempts.score_percentage 
  INTO v_result;

  RETURN jsonb_build_object(
    'success', true,
    'total_score', v_result.total_score,
    'max_score', v_result.max_score,
    'percentage', v_result.score_percentage
  );
END;
$$;

-- ============================================================================
-- 3. get_student_question_bank_progress - جلب تقدم الطالب
-- ============================================================================

CREATE OR REPLACE FUNCTION get_student_question_bank_progress(
  p_student_id UUID DEFAULT NULL
) RETURNS TABLE (
  attempt_id UUID,
  question_bank_id UUID,
  bank_title JSONB,
  lesson_id UUID,
  lesson_title TEXT,
  answered_count INTEGER,
  total_questions INTEGER,
  correct_count INTEGER,
  score_percentage NUMERIC,
  status TEXT,
  last_answered_at TIMESTAMPTZ
)
SET search_path = public
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_target_student_id UUID;
BEGIN
  v_target_student_id := COALESCE(p_student_id, auth.uid());
  
  IF v_target_student_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  RETURN QUERY
  SELECT 
    qba.id AS attempt_id,
    qba.question_bank_id,
    qb.title AS bank_title,
    qb.lesson_id,
    l.title AS lesson_title,
    qba.answered_count,
    COALESCE(qba.total_questions, qb.total_questions) AS total_questions,
    qba.correct_count,
    qba.score_percentage,
    qba.status,
    qba.last_answered_at
  FROM question_bank_attempts qba
  JOIN question_banks qb ON qb.id = qba.question_bank_id
  LEFT JOIN lessons l ON l.id = qb.lesson_id
  WHERE qba.student_id = v_target_student_id
  ORDER BY qba.last_answered_at DESC NULLS LAST;
END;
$$;

-- ============================================================================
-- 4. get_or_create_question_bank_attempt - جلب أو إنشاء محاولة
-- ============================================================================

CREATE OR REPLACE FUNCTION get_or_create_question_bank_attempt(
  p_question_bank_id UUID
) RETURNS JSONB
SET search_path = public
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_student_id UUID := auth.uid();
  v_attempt RECORD;
  v_bank RECORD;
BEGIN
  -- التحقق من تسجيل الدخول
  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- جلب بيانات البنك
  SELECT id, total_questions, questions INTO v_bank
  FROM question_banks
  WHERE id = p_question_bank_id AND is_published = true;
  
  IF v_bank.id IS NULL THEN
    RAISE EXCEPTION 'Question bank not found or not published';
  END IF;

  -- جلب أو إنشاء المحاولة
  INSERT INTO question_bank_attempts (
    question_bank_id, 
    student_id, 
    total_questions,
    first_answered_at
  )
  VALUES (
    p_question_bank_id, 
    v_student_id, 
    v_bank.total_questions,
    NULL
  )
  ON CONFLICT (question_bank_id, student_id) DO NOTHING;
  
  -- جلب المحاولة
  SELECT * INTO v_attempt
  FROM question_bank_attempts
  WHERE question_bank_id = p_question_bank_id AND student_id = v_student_id;

  RETURN jsonb_build_object(
    'attempt_id', v_attempt.id,
    'status', v_attempt.status,
    'answers', v_attempt.answers,
    'answered_count', v_attempt.answered_count,
    'correct_count', v_attempt.correct_count,
    'total_questions', v_attempt.total_questions,
    'score_percentage', v_attempt.score_percentage,
    'first_answered_at', v_attempt.first_answered_at,
    'last_answered_at', v_attempt.last_answered_at
  );
END;
$$;

-- ============================================================================
-- 5. upsert_teacher_exam_answer - حفظ إجابة في امتحان مدرس
-- ============================================================================

CREATE OR REPLACE FUNCTION upsert_teacher_exam_answer(
  p_exam_id UUID,
  p_question_id TEXT,
  p_answer JSONB,
  p_time_spent_seconds INTEGER DEFAULT NULL,
  p_flagged BOOLEAN DEFAULT FALSE
) RETURNS JSONB
SET search_path = public
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_attempt_id UUID;
  v_status TEXT;
  v_student_id UUID := auth.uid();
  v_question JSONB;
  v_is_correct BOOLEAN;
  v_points_earned INTEGER;
  v_max_points INTEGER;
  v_new_answers JSONB;
  v_exam RECORD;
BEGIN
  -- التحقق من تسجيل الدخول
  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- جلب بيانات الامتحان
  SELECT id, blocks INTO v_exam
  FROM teacher_exams
  WHERE id = p_exam_id AND is_published = true;
  
  IF v_exam.id IS NULL THEN
    RAISE EXCEPTION 'Exam not found or not published';
  END IF;

  -- 1) جلب أو إنشاء المحاولة
  INSERT INTO teacher_exam_attempts (exam_id, student_id, started_at)
  VALUES (p_exam_id, v_student_id, NOW())
  ON CONFLICT (exam_id, student_id) DO NOTHING
  RETURNING id, status INTO v_attempt_id, v_status;
  
  IF v_attempt_id IS NULL THEN
    SELECT id, status INTO v_attempt_id, v_status
    FROM teacher_exam_attempts 
    WHERE exam_id = p_exam_id AND student_id = v_student_id;
  END IF;
  
  -- 2) منع التعديل بعد التسليم
  IF v_status IS NOT NULL AND v_status != 'in_progress' THEN
    RAISE EXCEPTION 'Cannot modify submitted attempt';
  END IF;
  
  -- 3) البحث عن السؤال في blocks
  SELECT q INTO v_question
  FROM jsonb_array_elements(v_exam.blocks) AS block,
       jsonb_array_elements(block->'questions') AS q
  WHERE q->>'id' = p_question_id;
  
  IF v_question IS NULL THEN
    RAISE EXCEPTION 'Question not found in exam: %', p_question_id;
  END IF;
  
  -- 4) حساب التصحيح على السيرفر
  v_max_points := COALESCE((v_question->>'points')::int, 1);
  
  IF v_question->>'type' IN ('mcq', 'true_false', 'multi_select', 'single_choice', 'multiple_choice') THEN
    IF v_question ? 'correctAnswer' THEN
      v_is_correct := (p_answer = v_question->'correctAnswer');
    ELSIF v_question ? 'correct_answer' THEN
      v_is_correct := (p_answer = v_question->'correct_answer');
    ELSIF v_question ? 'correctOptionId' THEN
      v_is_correct := (p_answer = v_question->'correctOptionId');
    ELSE
      v_is_correct := NULL;
    END IF;
    v_points_earned := CASE WHEN v_is_correct THEN v_max_points ELSE 0 END;
  ELSE
    v_is_correct := NULL;
    v_points_earned := NULL;
  END IF;
  
  -- 5) تحديث الإجابة
  UPDATE teacher_exam_attempts
  SET 
    answers = jsonb_set(
      COALESCE(answers, '{}'::jsonb),
      ARRAY[p_question_id],
      jsonb_build_object(
        'answer', p_answer,
        'answered_at', NOW(),
        'time_spent_seconds', p_time_spent_seconds,
        'flagged', p_flagged,
        'auto', CASE 
          WHEN v_is_correct IS NOT NULL THEN
            jsonb_build_object(
              'is_correct', v_is_correct,
              'points_earned', v_points_earned,
              'max_points', v_max_points
            )
          ELSE NULL
        END,
        'manual', NULL
      )
    )
  WHERE id = v_attempt_id
  RETURNING answers INTO v_new_answers;
  
  -- 6) تحديث counters
  WITH stats AS (
    SELECT 
      COUNT(*)::integer AS answered,
      COALESCE(SUM((value->'auto'->>'points_earned')::int), 0)::integer AS earned,
      COALESCE(SUM((value->'auto'->>'max_points')::int), 0)::integer AS max_pts
    FROM jsonb_each(v_new_answers)
  )
  UPDATE teacher_exam_attempts
  SET 
    answered_count = stats.answered,
    total_score = stats.earned,
    max_score = stats.max_pts,
    percentage = CASE 
      WHEN stats.max_pts > 0 THEN ROUND((stats.earned::numeric / stats.max_pts) * 100, 2)
      ELSE 0
    END
  FROM stats
  WHERE id = v_attempt_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'attempt_id', v_attempt_id,
    'is_correct', v_is_correct,
    'points_earned', v_points_earned,
    'max_points', v_max_points
  );
END;
$$;

-- ============================================================================
-- 6. submit_teacher_exam_attempt - تسليم امتحان مدرس
-- ============================================================================

CREATE OR REPLACE FUNCTION submit_teacher_exam_attempt(
  p_attempt_id UUID
) RETURNS JSONB
SET search_path = public
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_student_id UUID := auth.uid();
  v_result RECORD;
BEGIN
  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM teacher_exam_attempts 
    WHERE id = p_attempt_id 
      AND student_id = v_student_id 
      AND status = 'in_progress'
  ) THEN
    RAISE EXCEPTION 'Invalid attempt or already submitted';
  END IF;

  WITH scores AS (
    SELECT 
      COALESCE(SUM(
        COALESCE((value->'auto'->>'points_earned')::int, 0) +
        COALESCE((value->'manual'->>'points_earned')::int, 0)
      ), 0)::integer AS total_score,
      COALESCE(SUM(
        COALESCE((value->'auto'->>'max_points')::int, 0) +
        COALESCE((value->'manual'->>'max_points')::int, 0)
      ), 0)::integer AS max_score
    FROM teacher_exam_attempts ta,
         jsonb_each(ta.answers)
    WHERE ta.id = p_attempt_id
  )
  UPDATE teacher_exam_attempts
  SET 
    total_score = scores.total_score,
    max_score = scores.max_score,
    percentage = CASE 
      WHEN scores.max_score > 0 
      THEN ROUND((scores.total_score::numeric / scores.max_score) * 100, 2)
      ELSE 0
    END,
    status = 'submitted',
    completed_at = NOW()
  FROM scores
  WHERE teacher_exam_attempts.id = p_attempt_id
  RETURNING teacher_exam_attempts.total_score, teacher_exam_attempts.max_score, teacher_exam_attempts.percentage 
  INTO v_result;

  RETURN jsonb_build_object(
    'success', true,
    'total_score', v_result.total_score,
    'max_score', v_result.max_score,
    'percentage', v_result.percentage
  );
END;
$$;

-- ============================================================================
-- 7. get_teacher_exam_results - نتائج امتحان للمدرس
-- ============================================================================

CREATE OR REPLACE FUNCTION get_teacher_exam_results(
  p_exam_id UUID
) RETURNS TABLE (
  attempt_id UUID,
  student_id UUID,
  student_name TEXT,
  student_email TEXT,
  total_score INTEGER,
  max_score INTEGER,
  percentage NUMERIC,
  status TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  answered_count INTEGER
)
SET search_path = public
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- التحقق من أن المستخدم هو صاحب الامتحان أو أدمن
  IF NOT EXISTS (
    SELECT 1 FROM teacher_exams 
    WHERE id = p_exam_id AND created_by = auth.uid()
  ) AND NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  RETURN QUERY
  SELECT 
    tea.id AS attempt_id,
    tea.student_id,
    p.name AS student_name,
    p.email AS student_email,
    tea.total_score,
    tea.max_score,
    tea.percentage,
    tea.status,
    tea.started_at,
    tea.completed_at,
    tea.answered_count
  FROM teacher_exam_attempts tea
  JOIN profiles p ON p.id = tea.student_id
  WHERE tea.exam_id = p_exam_id
  ORDER BY tea.completed_at DESC NULLS LAST;
END;
$$;

-- ============================================================================
-- 8. upsert_comprehensive_exam_answer - حفظ إجابة في امتحان الموقع
-- ============================================================================

CREATE OR REPLACE FUNCTION upsert_comprehensive_exam_answer(
  p_exam_id UUID,
  p_question_id TEXT,
  p_answer JSONB,
  p_time_spent_seconds INTEGER DEFAULT NULL,
  p_flagged BOOLEAN DEFAULT FALSE
) RETURNS JSONB
SET search_path = public
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_attempt_id UUID;
  v_status TEXT;
  v_student_id UUID := auth.uid();
  v_question JSONB;
  v_is_correct BOOLEAN;
  v_points_earned INTEGER;
  v_max_points INTEGER;
  v_new_answers JSONB;
  v_exam RECORD;
BEGIN
  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  SELECT id, blocks INTO v_exam
  FROM comprehensive_exams
  WHERE id = p_exam_id AND is_published = true;
  
  IF v_exam.id IS NULL THEN
    RAISE EXCEPTION 'Exam not found or not published';
  END IF;

  INSERT INTO comprehensive_exam_attempts (exam_id, student_id)
  VALUES (p_exam_id, v_student_id)
  ON CONFLICT (exam_id, student_id) DO NOTHING
  RETURNING id, status INTO v_attempt_id, v_status;
  
  IF v_attempt_id IS NULL THEN
    SELECT id, status INTO v_attempt_id, v_status
    FROM comprehensive_exam_attempts 
    WHERE exam_id = p_exam_id AND student_id = v_student_id;
  END IF;
  
  IF v_status IS NOT NULL AND v_status != 'in_progress' THEN
    RAISE EXCEPTION 'Cannot modify submitted attempt';
  END IF;
  
  SELECT q INTO v_question
  FROM jsonb_array_elements(v_exam.blocks) AS block,
       jsonb_array_elements(block->'questions') AS q
  WHERE q->>'id' = p_question_id;
  
  IF v_question IS NULL THEN
    RAISE EXCEPTION 'Question not found in exam: %', p_question_id;
  END IF;
  
  v_max_points := COALESCE((v_question->>'points')::int, 1);
  
  IF v_question->>'type' IN ('mcq', 'true_false', 'multi_select', 'single_choice', 'multiple_choice') THEN
    IF v_question ? 'correctAnswer' THEN
      v_is_correct := (p_answer = v_question->'correctAnswer');
    ELSIF v_question ? 'correct_answer' THEN
      v_is_correct := (p_answer = v_question->'correct_answer');
    ELSIF v_question ? 'correctOptionId' THEN
      v_is_correct := (p_answer = v_question->'correctOptionId');
    ELSE
      v_is_correct := NULL;
    END IF;
    v_points_earned := CASE WHEN v_is_correct THEN v_max_points ELSE 0 END;
  ELSE
    v_is_correct := NULL;
    v_points_earned := NULL;
  END IF;
  
  UPDATE comprehensive_exam_attempts
  SET 
    answers = jsonb_set(
      COALESCE(answers, '{}'::jsonb),
      ARRAY[p_question_id],
      jsonb_build_object(
        'answer', p_answer,
        'answered_at', NOW(),
        'time_spent_seconds', p_time_spent_seconds,
        'flagged', p_flagged,
        'auto', CASE 
          WHEN v_is_correct IS NOT NULL THEN
            jsonb_build_object(
              'is_correct', v_is_correct,
              'points_earned', v_points_earned,
              'max_points', v_max_points
            )
          ELSE NULL
        END,
        'manual', NULL
      )
    )
  WHERE id = v_attempt_id
  RETURNING answers INTO v_new_answers;
  
  WITH stats AS (
    SELECT 
      COUNT(*)::integer AS answered,
      COALESCE(SUM((value->'auto'->>'points_earned')::int), 0)::integer AS earned,
      COALESCE(SUM((value->'auto'->>'max_points')::int), 0)::integer AS max_pts
    FROM jsonb_each(v_new_answers)
  )
  UPDATE comprehensive_exam_attempts
  SET 
    answered_count = stats.answered,
    total_score = stats.earned,
    max_score = stats.max_pts,
    percentage = CASE 
      WHEN stats.max_pts > 0 THEN ROUND((stats.earned::numeric / stats.max_pts) * 100, 2)
      ELSE 0
    END
  FROM stats
  WHERE id = v_attempt_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'attempt_id', v_attempt_id,
    'is_correct', v_is_correct,
    'points_earned', v_points_earned,
    'max_points', v_max_points
  );
END;
$$;

-- ============================================================================
-- 9. submit_comprehensive_exam_attempt - تسليم امتحان الموقع
-- ============================================================================

CREATE OR REPLACE FUNCTION submit_comprehensive_exam_attempt(
  p_attempt_id UUID
) RETURNS JSONB
SET search_path = public
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_student_id UUID := auth.uid();
  v_result RECORD;
BEGIN
  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM comprehensive_exam_attempts 
    WHERE id = p_attempt_id 
      AND student_id = v_student_id 
      AND status = 'in_progress'
  ) THEN
    RAISE EXCEPTION 'Invalid attempt or already submitted';
  END IF;

  WITH scores AS (
    SELECT 
      COALESCE(SUM(
        COALESCE((value->'auto'->>'points_earned')::int, 0) +
        COALESCE((value->'manual'->>'points_earned')::int, 0)
      ), 0)::integer AS total_score,
      COALESCE(SUM(
        COALESCE((value->'auto'->>'max_points')::int, 0) +
        COALESCE((value->'manual'->>'max_points')::int, 0)
      ), 0)::integer AS max_score
    FROM comprehensive_exam_attempts ca,
         jsonb_each(ca.answers)
    WHERE ca.id = p_attempt_id
  )
  UPDATE comprehensive_exam_attempts
  SET 
    total_score = scores.total_score,
    max_score = scores.max_score,
    percentage = CASE 
      WHEN scores.max_score > 0 
      THEN ROUND((scores.total_score::numeric / scores.max_score) * 100, 2)
      ELSE 0
    END,
    status = 'submitted',
    completed_at = NOW()
  FROM scores
  WHERE comprehensive_exam_attempts.id = p_attempt_id
  RETURNING comprehensive_exam_attempts.total_score, comprehensive_exam_attempts.max_score, comprehensive_exam_attempts.percentage 
  INTO v_result;

  RETURN jsonb_build_object(
    'success', true,
    'total_score', v_result.total_score,
    'max_score', v_result.max_score,
    'percentage', v_result.percentage
  );
END;
$$;

-- ============================================================================
-- 10. get_student_exam_attempts - جلب محاولات امتحانات الطالب
-- ============================================================================

CREATE OR REPLACE FUNCTION get_student_exam_attempts(
  p_student_id UUID DEFAULT NULL
) RETURNS JSONB
SET search_path = public
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_target_student_id UUID;
  v_comprehensive JSONB;
  v_teacher JSONB;
BEGIN
  v_target_student_id := COALESCE(p_student_id, auth.uid());
  
  IF v_target_student_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- جلب امتحانات الموقع
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'attempt_id', ca.id,
      'exam_id', ca.exam_id,
      'exam_title', ce.title,
      'total_score', ca.total_score,
      'max_score', ca.max_score,
      'percentage', ca.percentage,
      'status', ca.status,
      'completed_at', ca.completed_at,
      'answered_count', ca.answered_count
    ) ORDER BY ca.completed_at DESC NULLS LAST
  ), '[]'::jsonb) INTO v_comprehensive
  FROM comprehensive_exam_attempts ca
  JOIN comprehensive_exams ce ON ce.id = ca.exam_id
  WHERE ca.student_id = v_target_student_id;

  -- جلب امتحانات المدرسين
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'attempt_id', ta.id,
      'exam_id', ta.exam_id,
      'exam_title', te.title,
      'teacher_id', te.created_by,
      'teacher_name', p.name,
      'total_score', ta.total_score,
      'max_score', ta.max_score,
      'percentage', ta.percentage,
      'status', ta.status,
      'completed_at', ta.completed_at,
      'answered_count', ta.answered_count
    ) ORDER BY ta.completed_at DESC NULLS LAST
  ), '[]'::jsonb) INTO v_teacher
  FROM teacher_exam_attempts ta
  JOIN teacher_exams te ON te.id = ta.exam_id
  JOIN profiles p ON p.id = te.created_by
  WHERE ta.student_id = v_target_student_id;

  RETURN jsonb_build_object(
    'comprehensive_exams', v_comprehensive,
    'teacher_exams', v_teacher
  );
END;
$$;

-- ============================================================================
-- 11. grade_essay_answer - تصحيح سؤال مقالي (للمدرس)
-- ============================================================================

CREATE OR REPLACE FUNCTION grade_essay_answer(
  p_attempt_id UUID,
  p_question_id TEXT,
  p_points_earned INTEGER,
  p_comment TEXT DEFAULT NULL
) RETURNS JSONB
SET search_path = public
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_teacher_id UUID := auth.uid();
  v_attempt RECORD;
  v_max_points INTEGER;
  v_current_answer JSONB;
BEGIN
  IF v_teacher_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- التحقق من وجود المحاولة وصلاحية المدرس
  SELECT ta.*, te.blocks INTO v_attempt
  FROM teacher_exam_attempts ta
  JOIN teacher_exams te ON te.id = ta.exam_id
  WHERE ta.id = p_attempt_id
    AND (te.created_by = v_teacher_id OR EXISTS (
      SELECT 1 FROM profiles WHERE id = v_teacher_id AND role = 'admin'
    ))
    AND ta.status IN ('submitted', 'graded');

  IF v_attempt.id IS NULL THEN
    RAISE EXCEPTION 'Attempt not found or unauthorized';
  END IF;

  -- جلب السؤال للحصول على max_points
  SELECT q INTO v_current_answer
  FROM jsonb_array_elements(v_attempt.blocks) AS block,
       jsonb_array_elements(block->'questions') AS q
  WHERE q->>'id' = p_question_id;

  IF v_current_answer IS NULL THEN
    RAISE EXCEPTION 'Question not found';
  END IF;

  v_max_points := COALESCE((v_current_answer->>'points')::int, 1);

  IF p_points_earned > v_max_points OR p_points_earned < 0 THEN
    RAISE EXCEPTION 'Points must be between 0 and %', v_max_points;
  END IF;

  -- تحديث التصحيح اليدوي
  UPDATE teacher_exam_attempts
  SET answers = jsonb_set(
    answers,
    ARRAY[p_question_id, 'manual'],
    jsonb_build_object(
      'is_correct', p_points_earned = v_max_points,
      'points_earned', p_points_earned,
      'max_points', v_max_points,
      'comment', p_comment,
      'graded_by', v_teacher_id,
      'graded_at', NOW()
    )
  )
  WHERE id = p_attempt_id;

  -- إعادة حساب الدرجة الكلية
  WITH scores AS (
    SELECT 
      COALESCE(SUM(
        COALESCE((value->'auto'->>'points_earned')::int, 0) +
        COALESCE((value->'manual'->>'points_earned')::int, 0)
      ), 0)::integer AS total_score,
      COALESCE(SUM(
        COALESCE((value->'auto'->>'max_points')::int, 0) +
        COALESCE((value->'manual'->>'max_points')::int, 0)
      ), 0)::integer AS max_score
    FROM teacher_exam_attempts ta,
         jsonb_each(ta.answers)
    WHERE ta.id = p_attempt_id
  )
  UPDATE teacher_exam_attempts
  SET 
    total_score = scores.total_score,
    max_score = scores.max_score,
    percentage = CASE 
      WHEN scores.max_score > 0 
      THEN ROUND((scores.total_score::numeric / scores.max_score) * 100, 2)
      ELSE 0
    END,
    status = 'graded'
  FROM scores
  WHERE teacher_exam_attempts.id = p_attempt_id;

  RETURN jsonb_build_object(
    'success', true,
    'points_earned', p_points_earned,
    'max_points', v_max_points
  );
END;
$$;

-- ============================================================================
-- COMPLETE
-- ============================================================================
