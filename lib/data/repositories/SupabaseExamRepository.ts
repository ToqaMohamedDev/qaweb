/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║              SUPABASE EXAM REPOSITORY - مستودع الامتحانات               ║
 * ║                                                                          ║
 * ║  Data Layer - تنفيذ واجهة المستودع باستخدام Supabase                    ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import { supabase } from '@/lib/supabase';
import type { ExamFilters, ExamRepositoryStats, ExamRepositoryError } from '@/lib/domain/repositories/IExamRepository';
import { Exam, createExam, type CreateExamParams, type ExamStatus } from '@/lib/domain/entities/Exam';
import { mapDbRowToExam, mapExamToDbRow, type ExamDBRow } from '../mappers/ExamMapper';
import type { Result } from '@/lib/types';
import { ok, err } from '@/lib/types';
import { logger } from '@/lib/utils/logger';

// ═══════════════════════════════════════════════════════════════════════════
// REPOSITORY IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * مستودع الامتحانات باستخدام Supabase
 * يوفر جميع عمليات CRUD والاستعلامات للامتحانات
 */
export class SupabaseExamRepository {
    private readonly tableName = 'comprehensive_exams';
    private readonly teacherTableName = 'teacher_exams';

    // ─── CRUD Operations ───

    async findById(id: string): Promise<Result<Exam, ExamRepositoryError>> {
        try {
            const { data, error } = await supabase
                .from(this.tableName)
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return err({ type: 'NOT_FOUND', message: 'الامتحان غير موجود' });
                }
                return err({
                    type: 'DATABASE_ERROR',
                    message: `خطأ في جلب الامتحان: ${error.message}`,
                });
            }

            return ok(mapDbRowToExam(data as unknown as ExamDBRow));
        } catch (e) {
            logger.error('Error in findById', { context: 'SupabaseExamRepository', data: e });
            return err({
                type: 'UNKNOWN_ERROR',
                message: 'حدث خطأ غير متوقع',
                originalError: e,
            });
        }
    }

    async findAll(filters?: ExamFilters): Promise<Result<Exam[], ExamRepositoryError>> {
        try {
            let query = supabase
                .from(this.tableName)
                .select('*')
                .order('created_at', { ascending: false });

            if (filters?.language) {
                query = query.eq('language', filters.language);
            }
            if (filters?.status) {
                query = query.eq('status', filters.status);
            }
            if (filters?.stageId) {
                query = query.eq('stage_id', filters.stageId);
            }
            if (filters?.subjectId) {
                query = query.eq('subject_id', filters.subjectId);
            }
            if (filters?.teacherId) {
                query = query.eq('teacher_id', filters.teacherId);
            }
            if (filters?.search) {
                query = query.ilike('exam_title', `%${filters.search}%`);
            }
            if (filters?.limit) {
                query = query.limit(filters.limit);
            }
            if (filters?.offset) {
                query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
            }

            const { data, error } = await query;

            if (error) {
                return err({
                    type: 'DATABASE_ERROR',
                    message: `خطأ في جلب الامتحانات: ${error.message}`,
                    originalError: error,
                });
            }

            const exams = (data || []).map(row => mapDbRowToExam(row as unknown as ExamDBRow));
            return ok(exams);
        } catch (e) {
            logger.error('Error in findAll', { context: 'SupabaseExamRepository', data: e });
            return err({
                type: 'UNKNOWN_ERROR',
                message: 'حدث خطأ غير متوقع',
                originalError: e,
            });
        }
    }

    async create(params: CreateExamParams): Promise<Result<Exam, ExamRepositoryError>> {
        try {
            const exam = createExam(params);
            const dbRow = mapExamToDbRow(exam);

            const { data, error } = await supabase
                .from(this.tableName)
                .insert({
                    ...dbRow,
                    exam_title: exam.title,
                    exam_description: exam.description,
                    is_published: exam.status === 'published',
                } as any)
                .select()
                .single();

            if (error) {
                return err({
                    type: 'DATABASE_ERROR',
                    message: `خطأ في إنشاء الامتحان: ${error.message}`,
                    originalError: error,
                });
            }

            return ok(mapDbRowToExam(data as unknown as ExamDBRow));
        } catch (e) {
            logger.error('Error in create', { context: 'SupabaseExamRepository', data: e });
            return err({
                type: 'UNKNOWN_ERROR',
                message: 'حدث خطأ غير متوقع',
                originalError: e,
            });
        }
    }

    async update(id: string, updates: Partial<CreateExamParams>): Promise<Result<Exam, ExamRepositoryError>> {
        try {
            // First, get the existing exam
            const existingResult = await this.findById(id);
            if (!existingResult.success) return existingResult;
            if (!existingResult.data) {
                return err({ type: 'NOT_FOUND', message: 'الامتحان غير موجود' });
            }

            // Prepare update data
            const updateData: Record<string, any> = {};
            if (updates.title) updateData.exam_title = updates.title;
            if (updates.description) updateData.exam_description = updates.description;
            if (updates.language) updateData.language = updates.language;
            if (updates.totalPoints) updateData.total_marks = updates.totalPoints;
            if (updates.passingScore) updateData.passing_score = updates.passingScore;
            if (updates.blocks) updateData.blocks = updates.blocks;
            if (updates.settings) updateData.settings = updates.settings;
            if (updates.status) updateData.is_published = updates.status === 'published';
            updateData.updated_at = new Date().toISOString();

            const { data, error } = await supabase
                .from(this.tableName)
                .update(updateData)
                .eq('id', id)
                .select()
                .single();

            if (error) {
                return err({
                    type: 'DATABASE_ERROR',
                    message: `خطأ في تحديث الامتحان: ${error.message}`,
                    originalError: error,
                });
            }

            return ok(mapDbRowToExam(data as unknown as ExamDBRow));
        } catch (e) {
            logger.error('Error in update', { context: 'SupabaseExamRepository', data: e });
            return err({
                type: 'UNKNOWN_ERROR',
                message: 'حدث خطأ غير متوقع',
                originalError: e,
            });
        }
    }

    async delete(id: string): Promise<Result<boolean, ExamRepositoryError>> {
        try {
            const { error } = await supabase
                .from(this.tableName)
                .delete()
                .eq('id', id);

            if (error) {
                return err({
                    type: 'DATABASE_ERROR',
                    message: `خطأ في حذف الامتحان: ${error.message}`,
                    originalError: error,
                });
            }

            return ok(true);
        } catch (e) {
            logger.error('Error in delete', { context: 'SupabaseExamRepository', data: e });
            return err({
                type: 'UNKNOWN_ERROR',
                message: 'حدث خطأ غير متوقع',
                originalError: e,
            });
        }
    }

    // ─── Query Methods ───

    async findBySubject(subjectId: string): Promise<Result<Exam[], ExamRepositoryError>> {
        return this.findAll({ subjectId });
    }

    async findByStage(stageId: string): Promise<Result<Exam[], ExamRepositoryError>> {
        return this.findAll({ stageId });
    }

    async findPublished(): Promise<Result<Exam[], ExamRepositoryError>> {
        return this.findAll({ status: 'published' });
    }

    async findByTeacher(teacherId: string): Promise<Result<Exam[], ExamRepositoryError>> {
        try {
            const { data, error } = await supabase
                .from(this.teacherTableName as any)
                .select('*')
                .eq('created_by', teacherId)
                .order('created_at', { ascending: false });

            if (error) {
                return err({
                    type: 'DATABASE_ERROR',
                    message: `خطأ في جلب امتحانات المعلم: ${error.message}`,
                    originalError: error,
                });
            }

            const exams = (data || []).map(row => mapDbRowToExam(row as unknown as ExamDBRow));
            return ok(exams);
        } catch (e) {
            logger.error('Error in findByTeacher', { context: 'SupabaseExamRepository', data: e });
            return err({
                type: 'UNKNOWN_ERROR',
                message: 'حدث خطأ غير متوقع',
                originalError: e,
            });
        }
    }

    // ─── Status Updates ───

    async publish(id: string): Promise<Result<Exam, ExamRepositoryError>> {
        return this.update(id, { status: 'published' });
    }

    async unpublish(id: string): Promise<Result<Exam, ExamRepositoryError>> {
        return this.update(id, { status: 'draft' });
    }

    async archive(id: string): Promise<Result<Exam, ExamRepositoryError>> {
        return this.update(id, { status: 'archived' });
    }

    // ─── Statistics ───

    async getStats(): Promise<Result<ExamRepositoryStats, ExamRepositoryError>> {
        try {
            // Get counts by status
            const { data: allExams, error } = await supabase
                .from(this.tableName)
                .select('id, is_published, language')
                .limit(1000);

            if (error) {
                return err({
                    type: 'DATABASE_ERROR',
                    message: `خطأ في جلب الإحصائيات: ${error.message}`,
                    originalError: error,
                });
            }

            const exams = allExams || [];
            const total = exams.length;
            const published = exams.filter(e => e.is_published).length;
            const draft = exams.filter(e => !e.is_published).length;
            const archived = 0; // Would need a status field to track this

            // Count by language
            const byLanguage: Record<string, number> = {};
            exams.forEach(e => {
                const lang = e.language || 'unknown';
                byLanguage[lang] = (byLanguage[lang] || 0) + 1;
            });

            return ok({
                total,
                published,
                draft,
                archived,
                byLanguage: {
                    arabic: byLanguage['arabic'] || 0,
                    english: byLanguage['english'] || 0,
                },
                byStage: {}, // Would need stage join
            });
        } catch (e) {
            logger.error('Error in getStats', { context: 'SupabaseExamRepository', data: e });
            return err({
                type: 'UNKNOWN_ERROR',
                message: 'حدث خطأ غير متوقع',
                originalError: e,
            });
        }
    }

    async count(filters?: ExamFilters): Promise<Result<number, ExamRepositoryError>> {
        try {
            let query = supabase
                .from(this.tableName)
                .select('id', { count: 'exact', head: true });

            if (filters?.language) {
                query = query.eq('language', filters.language);
            }
            if (filters?.status) {
                query = query.eq('is_published', filters.status === 'published');
            }

            const { count, error } = await query;

            if (error) {
                return err({
                    type: 'DATABASE_ERROR',
                    message: `خطأ في عد الامتحانات: ${error.message}`,
                    originalError: error,
                });
            }

            return ok(count || 0);
        } catch (e) {
            logger.error('Error in count', { context: 'SupabaseExamRepository', data: e });
            return err({
                type: 'UNKNOWN_ERROR',
                message: 'حدث خطأ غير متوقع',
                originalError: e,
            });
        }
    }
}

// Export a singleton instance
export const examRepository = new SupabaseExamRepository();
