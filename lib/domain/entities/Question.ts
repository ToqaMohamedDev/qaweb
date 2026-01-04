/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                       QUESTION ENTITY - كيان السؤال                      ║
 * ║                                                                          ║
 * ║  Business Logic Layer - كيانات الأعمال الأساسية                          ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import type { LangText, AnswerOption, QuestionMedia, DifficultyLevel } from '@/lib/types';

// ═══════════════════════════════════════════════════════════════════════════
// 1. QUESTION ENTITY
// ═══════════════════════════════════════════════════════════════════════════

/**
 * كيان السؤال - يمثل البيانات الأساسية للسؤال
 */
export class Question {
    constructor(
        public readonly id: string,
        public readonly type: QuestionTypeName,
        public readonly text: LangText,
        public readonly options: AnswerOption[],
        public readonly correctOptionId: string | null,
        public readonly correctAnswer: unknown,
        public readonly points: number,
        public readonly difficulty: DifficultyLevel,
        public readonly orderIndex: number,
        public readonly media?: QuestionMedia,
        public readonly hint?: LangText,
        public readonly explanation?: LangText,
        public readonly sectionTitle?: LangText,
        public readonly metadata?: QuestionMetadataType,
        public readonly lessonId?: string,
        public readonly stageId?: string,
        public readonly subjectId?: string,
        public readonly groupId?: string,
        public readonly tags?: string[],
        public readonly isActive: boolean = true,
        public readonly createdBy?: string,
        public readonly createdAt?: Date,
        public readonly updatedAt?: Date,
    ) { }

    // ─── Business Rules ───

    /**
     * هل السؤال اختيار متعدد؟
     */
    get isMultipleChoice(): boolean {
        return this.type === 'mcq';
    }

    /**
     * هل السؤال صح/خطأ؟
     */
    get isTrueFalse(): boolean {
        return this.type === 'truefalse';
    }

    /**
     * هل السؤال مقالي؟
     */
    get isEssay(): boolean {
        return this.type === 'essay';
    }

    /**
     * هل السؤال يتطلب تصحيح يدوي؟
     */
    get requiresManualGrading(): boolean {
        return ['essay', 'parsing', 'extraction'].includes(this.type);
    }

    /**
     * عدد الخيارات المتاحة
     */
    get optionsCount(): number {
        return this.options?.length || 0;
    }

    /**
     * الحصول على الإجابة الصحيحة
     */
    getCorrectOption(): AnswerOption | undefined {
        if (!this.correctOptionId) return undefined;
        return this.options?.find(opt => opt.id === this.correctOptionId);
    }

    /**
     * التحقق من صحة إجابة الطالب
     */
    checkAnswer(studentAnswer: string | string[]): AnswerResult {
        // للأسئلة التي تتطلب تصحيح يدوي
        if (this.requiresManualGrading) {
            return {
                isCorrect: null,
                earnedPoints: 0,
                requiresManualGrading: true,
                feedback: 'يتطلب التصحيح اليدوي',
            };
        }

        // اختيار متعدد وصح/خطأ
        if (this.isMultipleChoice || this.isTrueFalse) {
            const isCorrect = studentAnswer === this.correctOptionId;
            return {
                isCorrect,
                earnedPoints: isCorrect ? this.points : 0,
                requiresManualGrading: false,
                correctAnswer: this.correctOptionId || undefined,
                feedback: isCorrect ? 'إجابة صحيحة!' : 'إجابة خاطئة',
            };
        }

        // أنواع أخرى - تتطلب تصحيح يدوي
        return {
            isCorrect: null,
            earnedPoints: 0,
            requiresManualGrading: true,
        };
    }

    /**
     * هل نص السؤال به وسائط؟
     */
    get hasMedia(): boolean {
        return this.media !== undefined && this.media !== null;
    }

    /**
     * اسم نوع السؤال بالعربية
     */
    get typeLabel(): string {
        const labels: Record<QuestionTypeName, string> = {
            mcq: 'اختيار متعدد',
            truefalse: 'صح/خطأ',
            essay: 'مقالي',
            fill_blank: 'أكمل الفراغ',
            matching: 'مطابقة',
            parsing: 'إعراب',
            extraction: 'استخراج',
        };
        return labels[this.type] || this.type;
    }

    /**
     * مستوى الصعوبة بالعربية
     */
    get difficultyLabel(): string {
        const labels: Record<DifficultyLevel, string> = {
            easy: 'سهل',
            medium: 'متوسط',
            hard: 'صعب',
        };
        return labels[this.difficulty] || this.difficulty;
    }

    /**
     * لون مستوى الصعوبة
     */
    get difficultyColor(): string {
        const colors: Record<DifficultyLevel, string> = {
            easy: 'green',
            medium: 'yellow',
            hard: 'red',
        };
        return colors[this.difficulty] || 'gray';
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. SUPPORTING TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type QuestionTypeName =
    | 'mcq'
    | 'truefalse'
    | 'essay'
    | 'fill_blank'
    | 'matching'
    | 'parsing'
    | 'extraction';

export interface QuestionMetadataType {
    underlinedWord?: string;
    blankText?: LangText;
    extractionTarget?: string;
    [key: string]: unknown;
}

export interface AnswerResult {
    isCorrect: boolean | null;
    earnedPoints: number;
    requiresManualGrading: boolean;
    correctAnswer?: string;
    feedback?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. FACTORY FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

export interface CreateQuestionParams {
    id?: string;
    type: QuestionTypeName;
    text: LangText;
    options?: AnswerOption[];
    correctOptionId?: string | null;
    correctAnswer?: unknown;
    points?: number;
    difficulty?: DifficultyLevel;
    orderIndex?: number;
    media?: QuestionMedia;
    hint?: LangText;
    explanation?: LangText;
    sectionTitle?: LangText;
    metadata?: QuestionMetadataType;
    lessonId?: string;
    stageId?: string;
    subjectId?: string;
    groupId?: string;
    tags?: string[];
    isActive?: boolean;
    createdBy?: string;
}

/**
 * إنشاء كيان سؤال جديد
 */
export function createQuestion(params: CreateQuestionParams): Question {
    return new Question(
        params.id || crypto.randomUUID(),
        params.type,
        params.text,
        params.options || [],
        params.correctOptionId || null,
        params.correctAnswer,
        params.points || 1,
        params.difficulty || 'medium',
        params.orderIndex || 0,
        params.media,
        params.hint,
        params.explanation,
        params.sectionTitle,
        params.metadata,
        params.lessonId,
        params.stageId,
        params.subjectId,
        params.groupId,
        params.tags,
        params.isActive ?? true,
        params.createdBy,
        new Date(),
        new Date(),
    );
}
