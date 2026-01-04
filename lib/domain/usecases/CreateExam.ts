/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                   CREATE EXAM USE CASE - إنشاء امتحان                    ║
 * ║                                                                          ║
 * ║  Use Cases Layer - حالات الاستخدام الأعمال                               ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import type { IExamRepository, ExamRepositoryError } from '../repositories/IExamRepository';
import type { Result, ExamLanguage, ExamSettings, ExamBlock } from '@/lib/types';
import { Exam, createExam, type ExamStatus } from '../entities/Exam';
import { ok, err } from '@/lib/types';

// ═══════════════════════════════════════════════════════════════════════════
// 1. USE CASE INPUT/OUTPUT
// ═══════════════════════════════════════════════════════════════════════════

export interface CreateExamInput {
    title: string;
    description?: string;
    language: ExamLanguage;
    totalPoints?: number;
    passingScore?: number;
    blocks?: ExamBlock[];
    settings?: Partial<ExamSettings>;
    status?: ExamStatus;
    isTeacherExam?: boolean;
    stageId?: string;
    subjectId?: string;
    teacherId?: string;
    createdBy: string;
}

export interface CreateExamOutput {
    exam: Exam;
    message: string;
}

export type CreateExamError =
    | ExamRepositoryError
    | { type: 'VALIDATION_ERROR'; message: string };

// ═══════════════════════════════════════════════════════════════════════════
// 2. USE CASE IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * حالة استخدام: إنشاء امتحان جديد
 */
export class CreateExamUseCase {
    constructor(private readonly examRepository: IExamRepository) { }

    async execute(input: CreateExamInput): Promise<Result<CreateExamOutput, CreateExamError>> {
        // ─── Validation ───
        const validationResult = this.validate(input);
        if (validationResult) {
            return err(validationResult);
        }

        // ─── Create Entity ───
        const examParams = {
            title: input.title.trim(),
            description: input.description?.trim() || '',
            language: input.language,
            totalPoints: input.totalPoints || this.calculateTotalPoints(input.blocks || []),
            passingScore: input.passingScore || 0,
            blocks: input.blocks || [],
            settings: input.settings,
            status: input.status || 'draft',
            isTeacherExam: input.isTeacherExam || false,
            stageId: input.stageId,
            subjectId: input.subjectId,
            teacherId: input.teacherId,
            createdBy: input.createdBy,
        };

        // ─── Save to Repository ───
        const result = await this.examRepository.create(examParams);

        if (!result.success) {
            return result;
        }

        return ok({
            exam: result.data,
            message: 'تم إنشاء الامتحان بنجاح',
        });
    }

    // ─── Private Methods ───

    private validate(input: CreateExamInput): CreateExamError | null {
        if (!input.title || input.title.trim().length === 0) {
            return { type: 'VALIDATION_ERROR', message: 'عنوان الامتحان مطلوب' };
        }

        if (input.title.trim().length < 3) {
            return { type: 'VALIDATION_ERROR', message: 'عنوان الامتحان يجب أن يكون 3 أحرف على الأقل' };
        }

        if (!input.language) {
            return { type: 'VALIDATION_ERROR', message: 'اللغة مطلوبة' };
        }

        if (!['arabic', 'english'].includes(input.language)) {
            return { type: 'VALIDATION_ERROR', message: 'اللغة غير صالحة' };
        }

        if (!input.createdBy) {
            return { type: 'VALIDATION_ERROR', message: 'معرف المنشئ مطلوب' };
        }

        if (input.passingScore !== undefined && input.passingScore < 0) {
            return { type: 'VALIDATION_ERROR', message: 'درجة النجاح يجب أن تكون موجبة' };
        }

        return null;
    }

    private calculateTotalPoints(blocks: ExamBlock[]): number {
        return blocks.reduce((total, block) => {
            if (!block.questions) return total;
            return total + block.questions.reduce((qTotal, q) => qTotal + (q.points || 0), 0);
        }, 0);
    }
}
