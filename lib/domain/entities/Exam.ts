/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                         EXAM ENTITY - كيان الامتحان                       ║
 * ║                                                                          ║
 * ║  Business Logic Layer - كيانات الأعمال الأساسية                          ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import type { ExamLanguage, DifficultyLevel, ExamSettings, ExamBlock } from '@/lib/types';

// ═══════════════════════════════════════════════════════════════════════════
// 1. EXAM ENTITY
// ═══════════════════════════════════════════════════════════════════════════

/**
 * كيان الامتحان - يمثل البيانات الأساسية للامتحان
 * هذا الكيان مستقل عن قاعدة البيانات ويحتوي على قواعد العمل الأساسية
 */
export class Exam {
    constructor(
        public readonly id: string,
        public readonly title: string,
        public readonly description: string,
        public readonly language: ExamLanguage,
        public readonly totalPoints: number,
        public readonly passingScore: number,
        public readonly blocks: ExamBlock[],
        public readonly settings: ExamSettings,
        public readonly status: ExamStatus,
        public readonly isTeacherExam: boolean,
        public readonly createdBy: string,
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
        public readonly stageId?: string,
        public readonly subjectId?: string,
        public readonly teacherId?: string,
    ) { }

    // ─── Business Rules ───

    /**
     * هل الامتحان منشور ومتاح للطلاب؟
     */
    get isPublished(): boolean {
        return this.status === 'published';
    }

    /**
     * هل الامتحان مؤرشف؟
     */
    get isArchived(): boolean {
        return this.status === 'archived';
    }

    /**
     * عدد الأسئلة الإجمالي
     */
    get totalQuestions(): number {
        return this.blocks.reduce((total, block) => {
            return total + (block.questions?.length || 0);
        }, 0);
    }

    /**
     * إجمالي درجات الامتحان
     */
    get maxScore(): number {
        return this.totalPoints;
    }

    /**
     * هل الامتحان يحتاج وقت محدد؟
     */
    get isTimed(): boolean {
        return (this.settings as any)?.totalTimeMinutes !== undefined &&
            (this.settings as any).totalTimeMinutes > 0;
    }

    /**
     * الوقت بالدقائق
     */
    get timeInMinutes(): number | undefined {
        return (this.settings as any)?.totalTimeMinutes;
    }

    /**
     * هل يمكن للطالب تخطي أسئلة؟
     */
    get allowSkipping(): boolean {
        return this.settings?.allowBack ?? true;
    }

    /**
     * هل يتم عرض الإجابات فوراً؟
     */
    get showInstantFeedback(): boolean {
        return this.settings?.showCorrectAnswers ?? false;
    }

    /**
     * حساب درجة النجاح كنسبة مئوية
     */
    get passingPercentage(): number {
        if (this.totalPoints === 0) return 0;
        return (this.passingScore / this.totalPoints) * 100;
    }

    /**
     * هل درجة معينة ناجحة؟
     */
    isPassing(score: number): boolean {
        return score >= this.passingScore;
    }

    /**
     * حساب نسبة الدرجة
     */
    calculatePercentage(score: number): number {
        if (this.totalPoints === 0) return 0;
        return Math.round((score / this.totalPoints) * 100);
    }

    /**
     * الحصول على تقييم الدرجة
     */
    getGrade(score: number): ExamGrade {
        const percentage = this.calculatePercentage(score);
        if (percentage >= 90) return { grade: 'A+', label: 'ممتاز', color: 'emerald' };
        if (percentage >= 80) return { grade: 'A', label: 'جيد جداً', color: 'green' };
        if (percentage >= 70) return { grade: 'B', label: 'جيد', color: 'blue' };
        if (percentage >= 60) return { grade: 'C', label: 'مقبول', color: 'yellow' };
        if (percentage >= 50) return { grade: 'D', label: 'ضعيف', color: 'orange' };
        return { grade: 'F', label: 'راسب', color: 'red' };
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. SUPPORTING TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type ExamStatus = 'draft' | 'published' | 'archived';

export interface ExamGrade {
    grade: string;
    label: string;
    color: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. FACTORY FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

export interface CreateExamParams {
    id?: string;
    title: string;
    description?: string;
    language: ExamLanguage;
    totalPoints?: number;
    passingScore?: number;
    blocks?: ExamBlock[];
    settings?: Partial<ExamSettings>;
    status?: ExamStatus;
    isTeacherExam?: boolean;
    createdBy: string;
    stageId?: string;
    subjectId?: string;
    teacherId?: string;
}

/**
 * إنشاء كيان امتحان جديد
 */
export function createExam(params: CreateExamParams): Exam {
    const defaultSettings: ExamSettings = {
        shuffleQuestions: false,
        shuffleOptions: false,
        allowBack: true,
        passScore: 60,
        showResults: true,
        showCorrectAnswers: true,
    };

    return new Exam(
        params.id || crypto.randomUUID(),
        params.title,
        params.description || '',
        params.language,
        params.totalPoints || 0,
        params.passingScore || 0,
        params.blocks || [],
        { ...defaultSettings, ...params.settings },
        params.status || 'draft',
        params.isTeacherExam || false,
        params.createdBy,
        new Date(),
        new Date(),
        params.stageId,
        params.subjectId,
        params.teacherId,
    );
}
