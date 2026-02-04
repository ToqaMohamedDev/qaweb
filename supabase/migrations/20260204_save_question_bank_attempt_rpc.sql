-- Migration: Create save_question_bank_attempt RPC function
-- Date: 2026-02-04
-- Description: RPC function to save question bank attempts with proper authentication

CREATE OR REPLACE FUNCTION save_question_bank_attempt(
    p_question_bank_id uuid,
    p_answers jsonb,
    p_correct_count integer,
    p_total_count integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
    v_attempt_id uuid;
    v_score_percentage numeric;
BEGIN
    -- Get current user
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    
    -- Calculate percentage
    IF p_total_count > 0 THEN
        v_score_percentage := (p_correct_count::numeric / p_total_count::numeric) * 100;
    ELSE
        v_score_percentage := 0;
    END IF;
    
    -- Upsert the attempt
    INSERT INTO question_bank_attempts (
        question_bank_id,
        student_id,
        answers,
        correct_count,
        total_questions,
        answered_count,
        score_percentage,
        status,
        completed_at,
        last_answered_at
    ) VALUES (
        p_question_bank_id,
        v_user_id,
        p_answers,
        p_correct_count,
        p_total_count,
        p_total_count,
        v_score_percentage,
        'completed',
        NOW(),
        NOW()
    )
    ON CONFLICT (question_bank_id, student_id)
    DO UPDATE SET
        answers = EXCLUDED.answers,
        correct_count = EXCLUDED.correct_count,
        total_questions = EXCLUDED.total_questions,
        answered_count = EXCLUDED.answered_count,
        score_percentage = EXCLUDED.score_percentage,
        status = EXCLUDED.status,
        completed_at = EXCLUDED.completed_at,
        last_answered_at = EXCLUDED.last_answered_at
    RETURNING id INTO v_attempt_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'attempt_id', v_attempt_id,
        'score_percentage', v_score_percentage
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION save_question_bank_attempt(uuid, jsonb, integer, integer) TO authenticated;
