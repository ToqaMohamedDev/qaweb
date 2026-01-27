/**
 * Student Answers System - TypeScript Types
 * Version: 3.0
 * Date: 2026-01-27
 */

// ============================================================================
// JSONB Answer Structure
// ============================================================================

export interface AutoGrading {
  is_correct: boolean;
  points_earned: number;
  max_points: number;
}

export interface ManualGrading {
  is_correct: boolean | null;
  points_earned: number | null;
  max_points: number | null;
  comment: string | null;
  graded_by: string | null;
  graded_at: string | null;
}

export interface QuestionAnswer {
  answer: unknown; // string | string[] | number | boolean
  answered_at: string;
  time_spent_seconds?: number | null;
  flagged?: boolean;
  auto: AutoGrading | null;
  manual: ManualGrading | null;
}

export type AnswersJsonb = Record<string, QuestionAnswer>;

// ============================================================================
// Attempt Status Types
// ============================================================================

export type QuestionBankAttemptStatus = 'in_progress' | 'completed';
export type ExamAttemptStatus = 'in_progress' | 'submitted' | 'graded';

// ============================================================================
// Question Bank Attempts
// ============================================================================

export interface QuestionBankAttempt {
  id: string;
  question_bank_id: string;
  student_id: string;
  answers: AnswersJsonb;
  answered_count: number;
  correct_count: number;
  total_questions: number;
  total_score: number;
  max_score: number;
  score_percentage: number;
  status: QuestionBankAttemptStatus;
  first_answered_at: string | null;
  last_answered_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuestionBankProgress {
  attempt_id: string;
  question_bank_id: string;
  bank_title: { ar: string; en: string };
  lesson_id: string;
  lesson_title: string;
  answered_count: number;
  total_questions: number;
  correct_count: number;
  score_percentage: number;
  status: QuestionBankAttemptStatus;
  last_answered_at: string | null;
}

// ============================================================================
// Teacher Exam Attempts
// ============================================================================

export interface TeacherExamAttempt {
  id: string;
  exam_id: string;
  student_id: string;
  answers: AnswersJsonb;
  status: ExamAttemptStatus;
  total_score: number | null;
  max_score: number | null;
  percentage: number | null;
  answered_count: number;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeacherExamResult {
  attempt_id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  total_score: number | null;
  max_score: number | null;
  percentage: number | null;
  status: ExamAttemptStatus;
  started_at: string;
  completed_at: string | null;
  answered_count: number;
}

// ============================================================================
// Comprehensive Exam Attempts
// ============================================================================

export interface ComprehensiveExamAttempt {
  id: string;
  exam_id: string;
  student_id: string;
  answers: AnswersJsonb;
  status: ExamAttemptStatus;
  total_score: number | null;
  max_score: number | null;
  percentage: number | null;
  answered_count: number;
  completed_at: string | null;
  updated_at: string;
}

// ============================================================================
// RPC Function Parameters
// ============================================================================

export interface UpsertAnswerParams {
  p_question_bank_id?: string;
  p_exam_id?: string;
  p_question_id: string;
  p_answer: unknown;
  p_time_spent_seconds?: number | null;
  p_flagged?: boolean;
}

export interface SubmitAttemptParams {
  p_attempt_id: string;
}

export interface GradeEssayParams {
  p_attempt_id: string;
  p_question_id: string;
  p_points_earned: number;
  p_comment?: string | null;
}

// ============================================================================
// RPC Function Responses
// ============================================================================

export interface UpsertAnswerResponse {
  success: boolean;
  attempt_id: string;
  is_correct: boolean | null;
  points_earned: number | null;
  max_points: number;
}

export interface SubmitAttemptResponse {
  success: boolean;
  total_score: number;
  max_score: number;
  percentage: number;
}

export interface GetOrCreateAttemptResponse {
  attempt_id: string;
  status: QuestionBankAttemptStatus;
  answers: AnswersJsonb;
  answered_count: number;
  correct_count: number;
  total_questions: number;
  score_percentage: number;
  first_answered_at: string | null;
  last_answered_at: string | null;
}

export interface StudentExamAttemptsResponse {
  comprehensive_exams: Array<{
    attempt_id: string;
    exam_id: string;
    exam_title: { ar: string; en: string };
    total_score: number | null;
    max_score: number | null;
    percentage: number | null;
    status: ExamAttemptStatus;
    completed_at: string | null;
    answered_count: number;
  }>;
  teacher_exams: Array<{
    attempt_id: string;
    exam_id: string;
    exam_title: { ar: string; en: string };
    teacher_id: string;
    teacher_name: string;
    total_score: number | null;
    max_score: number | null;
    percentage: number | null;
    status: ExamAttemptStatus;
    completed_at: string | null;
    answered_count: number;
  }>;
}

// ============================================================================
// UI Display Types
// ============================================================================

export interface AttemptDisplayItem {
  id: string;
  title: string;
  status: string;
  percentage: number | null;
  answeredCount: number;
  totalQuestions: number;
  completedAt: string | null;
  type: 'question_bank' | 'comprehensive_exam' | 'teacher_exam';
}

export interface ExamQuestionWithAnswer {
  question: {
    id: string;
    type: string;
    text: { ar: string; en: string };
    options?: Array<{ id: string; text: { ar: string; en: string } }>;
    points: number;
  };
  answer: QuestionAnswer | null;
  isAnswered: boolean;
}

// ============================================================================
// Helper Type Guards
// ============================================================================

export function isAutoGraded(answer: QuestionAnswer): boolean {
  return answer.auto !== null && answer.auto.is_correct !== null;
}

export function isManualGraded(answer: QuestionAnswer): boolean {
  return answer.manual !== null && answer.manual.points_earned !== null;
}

export function getTotalPoints(answer: QuestionAnswer): number {
  const autoPoints = answer.auto?.points_earned ?? 0;
  const manualPoints = answer.manual?.points_earned ?? 0;
  return autoPoints + manualPoints;
}

export function getMaxPoints(answer: QuestionAnswer): number {
  const autoMax = answer.auto?.max_points ?? 0;
  const manualMax = answer.manual?.max_points ?? 0;
  return Math.max(autoMax, manualMax);
}
