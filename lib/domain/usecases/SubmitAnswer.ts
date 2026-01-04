/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                   SUBMIT ANSWER USE CASE - تقديم إجابة                   ║
 * ║                                                                          ║
 * ║  Use Cases Layer - حالات الاستخدام الأعمال                               ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import { Question, type AnswerResult } from '../entities/Question';
import type { Result } from '@/lib/types';
import { ok, err } from '@/lib/types';

// ═══════════════════════════════════════════════════════════════════════════
// 1. USE CASE INPUT/OUTPUT
// ═══════════════════════════════════════════════════════════════════════════

export interface SubmitAnswerInput {
    questionId: string;
    studentAnswer: string | string[];
    timeSpentSeconds?: number;
    attemptId?: string;
}

export interface SubmitAnswerOutput {
    questionId: string;
    result: AnswerResult;
    timeSpentSeconds?: number;
}

export type SubmitAnswerError =
    | { type: 'QUESTION_NOT_FOUND'; message: string }
    | { type: 'INVALID_ANSWER'; message: string }
    | { type: 'ALREADY_ANSWERED'; message: string };

// ═══════════════════════════════════════════════════════════════════════════
// 2. USE CASE IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * حالة استخدام: تقديم إجابة على سؤال
 */
export class SubmitAnswerUseCase {
    private submittedAnswers: Map<string, SubmitAnswerOutput> = new Map();

    async execute(
        input: SubmitAnswerInput,
        question: Question
    ): Promise<Result<SubmitAnswerOutput, SubmitAnswerError>> {
        // ─── Validation ───
        if (!question) {
            return err({
                type: 'QUESTION_NOT_FOUND',
                message: 'السؤال غير موجود',
            });
        }

        // تحقق من عدم الإجابة مسبقاً
        const existingAnswer = this.submittedAnswers.get(
            `${input.attemptId}-${input.questionId}`
        );
        if (existingAnswer && input.attemptId) {
            return err({
                type: 'ALREADY_ANSWERED',
                message: 'تم الإجابة على هذا السؤال مسبقاً',
            });
        }

        // ─── Check Answer ───
        const result = question.checkAnswer(input.studentAnswer);

        // ─── Create Output ───
        const output: SubmitAnswerOutput = {
            questionId: input.questionId,
            result,
            timeSpentSeconds: input.timeSpentSeconds,
        };

        // Store answered question
        if (input.attemptId) {
            this.submittedAnswers.set(
                `${input.attemptId}-${input.questionId}`,
                output
            );
        }

        return ok(output);
    }

    /**
     * مسح الإجابات المخزنة لمحاولة معينة
     */
    clearAttempt(attemptId: string): void {
        for (const key of this.submittedAnswers.keys()) {
            if (key.startsWith(`${attemptId}-`)) {
                this.submittedAnswers.delete(key);
            }
        }
    }

    /**
     * الحصول على إجابة سابقة
     */
    getPreviousAnswer(attemptId: string, questionId: string): SubmitAnswerOutput | undefined {
        return this.submittedAnswers.get(`${attemptId}-${questionId}`);
    }
}
