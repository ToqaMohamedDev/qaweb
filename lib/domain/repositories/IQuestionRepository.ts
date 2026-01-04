/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║            QUESTION REPOSITORY INTERFACE - واجهة مستودع الأسئلة           ║
 * ║                                                                          ║
 * ║  Domain Layer - يحدد العقد بين طبقة الأعمال وطبقة البيانات              ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import type { Question, CreateQuestionParams, QuestionTypeName } from '../entities/Question';
import type { Result, DifficultyLevel } from '@/lib/types';

// ═══════════════════════════════════════════════════════════════════════════
// 1. REPOSITORY INTERFACE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * واجهة مستودع الأسئلة
 * تحدد العمليات الأساسية المطلوبة لإدارة الأسئلة
 */
export interface IQuestionRepository {
    // ─── CRUD Operations ───

    /**
     * الحصول على سؤال بالمعرف
     */
    findById(id: string): Promise<Result<Question, QuestionRepositoryError>>;

    /**
     * الحصول على جميع الأسئلة
     */
    findAll(filters?: QuestionFilters): Promise<Result<Question[], QuestionRepositoryError>>;

    /**
     * إنشاء سؤال جديد
     */
    create(params: CreateQuestionParams): Promise<Result<Question, QuestionRepositoryError>>;

    /**
     * إنشاء عدة أسئلة
     */
    createMany(params: CreateQuestionParams[]): Promise<Result<Question[], QuestionRepositoryError>>;

    /**
     * تحديث سؤال
     */
    update(id: string, data: Partial<CreateQuestionParams>): Promise<Result<Question, QuestionRepositoryError>>;

    /**
     * تحديث عدة أسئلة
     */
    updateMany(updates: { id: string; data: Partial<CreateQuestionParams> }[]): Promise<Result<Question[], QuestionRepositoryError>>;

    /**
     * حذف سؤال
     */
    delete(id: string): Promise<Result<void, QuestionRepositoryError>>;

    /**
     * حذف عدة أسئلة
     */
    deleteMany(ids: string[]): Promise<Result<void, QuestionRepositoryError>>;

    // ─── Query Operations ───

    /**
     * الحصول على أسئلة بحسب الدرس
     */
    findByLesson(lessonId: string): Promise<Result<Question[], QuestionRepositoryError>>;

    /**
     * الحصول على أسئلة بحسب المادة
     */
    findBySubject(subjectId: string): Promise<Result<Question[], QuestionRepositoryError>>;

    /**
     * الحصول على أسئلة بحسب المرحلة
     */
    findByStage(stageId: string): Promise<Result<Question[], QuestionRepositoryError>>;

    /**
     * الحصول على أسئلة بحسب المجموعة
     */
    findByGroup(groupId: string): Promise<Result<Question[], QuestionRepositoryError>>;

    /**
     * البحث في الأسئلة
     */
    search(query: string, filters?: QuestionFilters): Promise<Result<Question[], QuestionRepositoryError>>;

    // ─── Group Operations ───

    /**
     * الحصول على مجموعات الأسئلة
     */
    getGroups(lessonId: string): Promise<Result<QuestionGroup[], QuestionRepositoryError>>;

    /**
     * حذف مجموعة أسئلة
     */
    deleteGroup(groupId: string): Promise<Result<void, QuestionRepositoryError>>;

    // ─── Statistics ───

    /**
     * إحصائيات الأسئلة
     */
    getStats(lessonId?: string): Promise<Result<QuestionRepositoryStats, QuestionRepositoryError>>;

    /**
     * عدد الأسئلة
     */
    count(filters?: QuestionFilters): Promise<Result<number, QuestionRepositoryError>>;
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. SUPPORTING TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * فلاتر البحث في الأسئلة
 */
export interface QuestionFilters {
    lessonId?: string;
    stageId?: string;
    subjectId?: string;
    groupId?: string;
    type?: QuestionTypeName;
    difficulty?: DifficultyLevel;
    tags?: string[];
    isActive?: boolean;
    createdBy?: string;
    search?: string;
    limit?: number;
    offset?: number;
    sortBy?: 'createdAt' | 'updatedAt' | 'orderIndex' | 'difficulty';
    sortOrder?: 'asc' | 'desc';
}

/**
 * مجموعة أسئلة
 */
export interface QuestionGroup {
    groupId: string;
    sectionTitle?: { ar?: string; en?: string };
    sectionType: 'reading' | 'poetry' | 'standard';
    media?: {
        type: 'reading' | 'poetry';
        title?: string;
        text?: string;
        verses?: { first: string; second: string }[];
    };
    questionsCount: number;
    totalPoints: number;
}

/**
 * إحصائيات المستودع
 */
export interface QuestionRepositoryStats {
    total: number;
    active: number;
    inactive: number;
    byType: Record<QuestionTypeName, number>;
    byDifficulty: Record<DifficultyLevel, number>;
    byLesson: Record<string, number>;
}

/**
 * أخطاء المستودع
 */
export type QuestionRepositoryError =
    | { type: 'NOT_FOUND'; message: string }
    | { type: 'VALIDATION_ERROR'; message: string }
    | { type: 'DATABASE_ERROR'; message: string }
    | { type: 'PERMISSION_DENIED'; message: string }
    | { type: 'UNKNOWN_ERROR'; message: string };
