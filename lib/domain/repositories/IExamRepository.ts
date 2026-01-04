/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║              EXAM REPOSITORY INTERFACE - واجهة مستودع الامتحانات          ║
 * ║                                                                          ║
 * ║  Domain Layer - يحدد العقد بين طبقة الأعمال وطبقة البيانات              ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import type { Exam, ExamStatus, CreateExamParams } from '../entities/Exam';
import type { Result } from '@/lib/types';

// ═══════════════════════════════════════════════════════════════════════════
// 1. REPOSITORY INTERFACE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * واجهة مستودع الامتحانات
 * تحدد العمليات الأساسية المطلوبة لإدارة الامتحانات
 */
export interface IExamRepository {
    // ─── CRUD Operations ───

    /**
     * الحصول على امتحان بالمعرف
     */
    findById(id: string): Promise<Result<Exam, ExamRepositoryError>>;

    /**
     * الحصول على جميع الامتحانات
     */
    findAll(filters?: ExamFilters): Promise<Result<Exam[], ExamRepositoryError>>;

    /**
     * إنشاء امتحان جديد
     */
    create(params: CreateExamParams): Promise<Result<Exam, ExamRepositoryError>>;

    /**
     * تحديث امتحان
     */
    update(id: string, data: Partial<CreateExamParams>): Promise<Result<Exam, ExamRepositoryError>>;

    /**
     * حذف امتحان
     */
    delete(id: string): Promise<Result<void, ExamRepositoryError>>;

    // ─── Query Operations ───

    /**
     * الحصول على امتحانات بحسب المادة
     */
    findBySubject(subjectId: string): Promise<Result<Exam[], ExamRepositoryError>>;

    /**
     * الحصول على امتحانات بحسب المرحلة
     */
    findByStage(stageId: string): Promise<Result<Exam[], ExamRepositoryError>>;

    /**
     * الحصول على امتحانات المعلم
     */
    findByTeacher(teacherId: string): Promise<Result<Exam[], ExamRepositoryError>>;

    /**
     * الحصول على الامتحانات المنشورة فقط
     */
    findPublished(filters?: ExamFilters): Promise<Result<Exam[], ExamRepositoryError>>;

    // ─── Status Operations ───

    /**
     * تغيير حالة الامتحان
     */
    updateStatus(id: string, status: ExamStatus): Promise<Result<Exam, ExamRepositoryError>>;

    /**
     * نشر امتحان
     */
    publish(id: string): Promise<Result<Exam, ExamRepositoryError>>;

    /**
     * أرشفة امتحان
     */
    archive(id: string): Promise<Result<Exam, ExamRepositoryError>>;

    // ─── Statistics ───

    /**
     * إحصائيات الامتحانات
     */
    getStats(): Promise<Result<ExamRepositoryStats, ExamRepositoryError>>;

    /**
     * عدد الامتحانات
     */
    count(filters?: ExamFilters): Promise<Result<number, ExamRepositoryError>>;
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. SUPPORTING TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * فلاتر البحث في الامتحانات
 */
export interface ExamFilters {
    language?: 'arabic' | 'english';
    status?: ExamStatus;
    stageId?: string;
    subjectId?: string;
    teacherId?: string;
    isTeacherExam?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
    sortBy?: 'createdAt' | 'updatedAt' | 'title';
    sortOrder?: 'asc' | 'desc';
}

/**
 * إحصائيات المستودع
 */
export interface ExamRepositoryStats {
    total: number;
    published: number;
    draft: number;
    archived: number;
    byLanguage: {
        arabic: number;
        english: number;
    };
    byStage: Record<string, number>;
}

/**
 * أخطاء المستودع
 */
export type ExamRepositoryError =
    | { type: 'NOT_FOUND'; message: string }
    | { type: 'VALIDATION_ERROR'; message: string }
    | { type: 'DATABASE_ERROR'; message: string }
    | { type: 'PERMISSION_DENIED'; message: string }
    | { type: 'UNKNOWN_ERROR'; message: string };
