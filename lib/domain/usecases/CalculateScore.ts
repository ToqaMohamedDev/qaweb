/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║               CALCULATE SCORE USE CASE - حساب الدرجة النهائية            ║
 * ║                                                                          ║
 * ║  Use Cases Layer - حالات الاستخدام الأعمال                               ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import { Exam, type ExamGrade } from '../entities/Exam';
import type { AnswerResult } from '../entities/Question';
import type { Result } from '@/lib/types';
import { ok, err } from '@/lib/types';

// ═══════════════════════════════════════════════════════════════════════════
// 1. USE CASE INPUT/OUTPUT
// ═══════════════════════════════════════════════════════════════════════════

export interface CalculateScoreInput {
    examId: string;
    answers: QuestionAnswer[];
    startedAt: Date;
    completedAt?: Date;
}

export interface QuestionAnswer {
    questionId: string;
    studentAnswer: string | string[];
    result: AnswerResult;
    timeSpentSeconds?: number;
}

export interface CalculateScoreOutput {
    examId: string;

    // الدرجات
    totalScore: number;
    maxScore: number;
    percentage: number;

    // النتيجة
    passed: boolean;
    grade: ExamGrade;

    // التفاصيل
    correctAnswers: number;
    wrongAnswers: number;
    skippedAnswers: number;
    pendingGrading: number;

    // الوقت
    totalTimeSeconds: number;
    averageTimePerQuestion: number;

    // تفاصيل الأسئلة
    questionResults: QuestionResult[];
}

export interface QuestionResult {
    questionId: string;
    isCorrect: boolean | null;
    earnedPoints: number;
    maxPoints: number;
    timeSpentSeconds?: number;
    requiresManualGrading: boolean;
}

export type CalculateScoreError =
    | { type: 'EXAM_NOT_FOUND'; message: string }
    | { type: 'NO_ANSWERS'; message: string }
    | { type: 'CALCULATION_ERROR'; message: string };

// ═══════════════════════════════════════════════════════════════════════════
// 2. USE CASE IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * حالة استخدام: حساب الدرجة النهائية للامتحان
 */
export class CalculateScoreUseCase {
    async execute(
        input: CalculateScoreInput,
        exam: Exam
    ): Promise<Result<CalculateScoreOutput, CalculateScoreError>> {
        // ─── Validation ───
        if (!exam) {
            return err({
                type: 'EXAM_NOT_FOUND',
                message: 'الامتحان غير موجود',
            });
        }

        if (!input.answers || input.answers.length === 0) {
            return err({
                type: 'NO_ANSWERS',
                message: 'لا توجد إجابات لحساب الدرجة',
            });
        }

        try {
            // ─── Calculate Score ───
            let totalScore = 0;
            let correctAnswers = 0;
            let wrongAnswers = 0;
            let skippedAnswers = 0;
            let pendingGrading = 0;
            let totalTimeSpent = 0;

            const questionResults: QuestionResult[] = input.answers.map(answer => {
                const { result, timeSpentSeconds = 0 } = answer;

                totalTimeSpent += timeSpentSeconds;
                totalScore += result.earnedPoints;

                if (result.requiresManualGrading) {
                    pendingGrading++;
                } else if (result.isCorrect === true) {
                    correctAnswers++;
                } else if (result.isCorrect === false) {
                    wrongAnswers++;
                } else {
                    skippedAnswers++;
                }

                return {
                    questionId: answer.questionId,
                    isCorrect: result.isCorrect,
                    earnedPoints: result.earnedPoints,
                    maxPoints: result.earnedPoints / (result.isCorrect ? 1 : 0) || 0,
                    timeSpentSeconds,
                    requiresManualGrading: result.requiresManualGrading,
                };
            });

            // ─── Calculate Time ───
            const completedAt = input.completedAt || new Date();
            const totalTimeSeconds = Math.floor(
                (completedAt.getTime() - input.startedAt.getTime()) / 1000
            );
            const averageTimePerQuestion =
                input.answers.length > 0 ? totalTimeSeconds / input.answers.length : 0;

            // ─── Calculate Results ───
            const percentage = exam.calculatePercentage(totalScore);
            const passed = exam.isPassing(totalScore);
            const grade = exam.getGrade(totalScore);

            return ok({
                examId: input.examId,
                totalScore,
                maxScore: exam.maxScore,
                percentage,
                passed,
                grade,
                correctAnswers,
                wrongAnswers,
                skippedAnswers,
                pendingGrading,
                totalTimeSeconds,
                averageTimePerQuestion,
                questionResults,
            });
        } catch (error) {
            return err({
                type: 'CALCULATION_ERROR',
                message: `خطأ في حساب الدرجة: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`,
            });
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * تنسيق الدرجة للعرض
 */
export function formatScore(output: CalculateScoreOutput): string {
    return `${output.totalScore} / ${output.maxScore} (${output.percentage}%)`;
}

/**
 * تنسيق الوقت للعرض
 */
export function formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * الحصول على رسالة النتيجة
 */
export function getResultMessage(output: CalculateScoreOutput): string {
    if (output.passed) {
        if (output.percentage >= 90) {
            return 'ممتاز! أداء رائع 🎉';
        } else if (output.percentage >= 80) {
            return 'جيد جداً! استمر في التقدم 👏';
        } else if (output.percentage >= 70) {
            return 'جيد! يمكنك التحسن أكثر 💪';
        } else {
            return 'ناجح! حاول تحسين درجتك 📚';
        }
    } else {
        if (output.percentage >= 40) {
            return 'قريب من النجاح! حاول مرة أخرى 🔄';
        } else {
            return 'تحتاج للمزيد من المذاكرة 📖';
        }
    }
}
