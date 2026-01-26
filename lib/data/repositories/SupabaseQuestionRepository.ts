/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║            SUPABASE QUESTION REPOSITORY - مستودع الأسئلة                ║
 * ║                                                                          ║
 * ║  Data Layer - تنفيذ عمليات الأسئلة باستخدام Supabase                    ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import { supabase } from '@/lib/supabase';
import { Question, createQuestion, type CreateQuestionParams } from '@/lib/domain/entities/Question';
import { mapDbRowToQuestion, mapQuestionToDbRow, type QuestionDBRow } from '../mappers/QuestionMapper';
import type { Result } from '@/lib/types';
import { ok, err } from '@/lib/types';
import { logger } from '@/lib/utils/logger';

// ═══════════════════════════════════════════════════════════════════════════
// LOCAL TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface QuestionFilters {
    lessonId?: string;
    type?: string;
    difficulty?: string;
    groupId?: string;
    search?: string;
    limit?: number;
    offset?: number;
}

export interface QuestionRepositoryStats {
    total: number;
    byType: Record<string, number>;
    byDifficulty: Record<string, number>;
}

export type QuestionRepositoryError =
    | { type: 'NOT_FOUND'; message: string }
    | { type: 'DATABASE_ERROR'; message: string }
    | { type: 'UNKNOWN_ERROR'; message: string };

// ═══════════════════════════════════════════════════════════════════════════
// REPOSITORY IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * مستودع الأسئلة باستخدام Supabase
 * يوفر جميع عمليات CRUD والاستعلامات للأسئلة
 */
export class SupabaseQuestionRepository {
    private readonly tableName = 'quiz_questions';

    // ─── CRUD Operations ───

    async findById(id: string): Promise<Result<Question, QuestionRepositoryError>> {
        try {
            const { data, error } = await supabase
                .from(this.tableName)
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return err({ type: 'NOT_FOUND', message: 'السؤال غير موجود' });
                }
                return err({
                    type: 'DATABASE_ERROR',
                    message: `خطأ في جلب السؤال: ${error.message}`,
                });
            }

            return ok(mapDbRowToQuestion(data as unknown as QuestionDBRow));
        } catch (e) {
            logger.error('Error in findById', { context: 'SupabaseQuestionRepository', data: e });
            return err({ type: 'UNKNOWN_ERROR', message: 'حدث خطأ غير متوقع' });
        }
    }

    async findAll(filters?: QuestionFilters): Promise<Result<Question[], QuestionRepositoryError>> {
        try {
            let query = supabase
                .from(this.tableName)
                .select('*')
                .order('order_index', { ascending: true })
                .order('created_at', { ascending: false });

            if (filters?.lessonId) {
                query = query.eq('lesson_id', filters.lessonId);
            }
            if (filters?.type) {
                query = query.eq('type', filters.type);
            }
            if (filters?.difficulty) {
                query = query.eq('difficulty', filters.difficulty);
            }
            if (filters?.groupId) {
                query = query.eq('group_id', filters.groupId);
            }
            if (filters?.search) {
                query = query.or(`text_ar.ilike.%${filters.search}%,text_en.ilike.%${filters.search}%`);
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
                    message: `خطأ في جلب الأسئلة: ${error.message}`,
                });
            }

            const questions = (data || []).map(row => mapDbRowToQuestion(row as unknown as QuestionDBRow));
            return ok(questions);
        } catch (e) {
            logger.error('Error in findAll', { context: 'SupabaseQuestionRepository', data: e });
            return err({ type: 'UNKNOWN_ERROR', message: 'حدث خطأ غير متوقع' });
        }
    }

    async create(params: CreateQuestionParams): Promise<Result<Question, QuestionRepositoryError>> {
        try {
            const question = createQuestion(params);
            const dbRow = mapQuestionToDbRow(question);

            const { data, error } = await supabase
                .from(this.tableName)
                .insert(dbRow as any)
                .select()
                .single();

            if (error) {
                return err({
                    type: 'DATABASE_ERROR',
                    message: `خطأ في إنشاء السؤال: ${error.message}`,
                });
            }

            return ok(mapDbRowToQuestion(data as unknown as QuestionDBRow));
        } catch (e) {
            logger.error('Error in create', { context: 'SupabaseQuestionRepository', data: e });
            return err({ type: 'UNKNOWN_ERROR', message: 'حدث خطأ غير متوقع' });
        }
    }

    async createMany(params: CreateQuestionParams[]): Promise<Result<Question[], QuestionRepositoryError>> {
        try {
            const questions = params.map(p => createQuestion(p));
            const dbRows = questions.map(q => mapQuestionToDbRow(q));

            const { data, error } = await supabase
                .from(this.tableName)
                .insert(dbRows as any[])
                .select();

            if (error) {
                return err({
                    type: 'DATABASE_ERROR',
                    message: `خطأ في إنشاء الأسئلة: ${error.message}`,
                });
            }

            const createdQuestions = (data || []).map(row =>
                mapDbRowToQuestion(row as unknown as QuestionDBRow)
            );
            return ok(createdQuestions);
        } catch (e) {
            logger.error('Error in createMany', { context: 'SupabaseQuestionRepository', data: e });
            return err({ type: 'UNKNOWN_ERROR', message: 'حدث خطأ غير متوقع' });
        }
    }

    async update(id: string, updates: Partial<CreateQuestionParams>): Promise<Result<Question, QuestionRepositoryError>> {
        try {
            const updateData: Record<string, any> = {
                updated_at: new Date().toISOString(),
            };

            if (updates.type) updateData.type = updates.type;
            if (updates.text) updateData.text_ar = updates.text; // Map to text_ar
            if (updates.options) updateData.options = updates.options;
            if (updates.correctAnswer !== undefined) updateData.correct_answer = updates.correctAnswer;
            if (updates.points) updateData.points = updates.points;
            if (updates.difficulty) updateData.difficulty = updates.difficulty;
            if (updates.orderIndex !== undefined) updateData.order_index = updates.orderIndex;

            const { data, error } = await supabase
                .from(this.tableName)
                .update(updateData)
                .eq('id', id)
                .select()
                .single();

            if (error) {
                return err({
                    type: 'DATABASE_ERROR',
                    message: `خطأ في تحديث السؤال: ${error.message}`,
                });
            }

            return ok(mapDbRowToQuestion(data as unknown as QuestionDBRow));
        } catch (e) {
            logger.error('Error in update', { context: 'SupabaseQuestionRepository', data: e });
            return err({ type: 'UNKNOWN_ERROR', message: 'حدث خطأ غير متوقع' });
        }
    }

    async delete(id: string): Promise<Result<void, QuestionRepositoryError>> {
        try {
            const { error } = await supabase
                .from(this.tableName)
                .delete()
                .eq('id', id);

            if (error) {
                return err({
                    type: 'DATABASE_ERROR',
                    message: `خطأ في حذف السؤال: ${error.message}`,
                });
            }

            return ok(undefined);
        } catch (e) {
            logger.error('Error in delete', { context: 'SupabaseQuestionRepository', data: e });
            return err({ type: 'UNKNOWN_ERROR', message: 'حدث خطأ غير متوقع' });
        }
    }

    async deleteMany(ids: string[]): Promise<Result<void, QuestionRepositoryError>> {
        try {
            const { error } = await supabase
                .from(this.tableName)
                .delete()
                .in('id', ids);

            if (error) {
                return err({
                    type: 'DATABASE_ERROR',
                    message: `خطأ في حذف الأسئلة: ${error.message}`,
                });
            }

            return ok(undefined);
        } catch (e) {
            logger.error('Error in deleteMany', { context: 'SupabaseQuestionRepository', data: e });
            return err({ type: 'UNKNOWN_ERROR', message: 'حدث خطأ غير متوقع' });
        }
    }

    // ─── Query Methods ───

    async findByLesson(lessonId: string): Promise<Result<Question[], QuestionRepositoryError>> {
        return this.findAll({ lessonId });
    }

    async findByGroup(groupId: string): Promise<Result<Question[], QuestionRepositoryError>> {
        return this.findAll({ groupId });
    }

    async findByType(type: string): Promise<Result<Question[], QuestionRepositoryError>> {
        return this.findAll({ type });
    }

    async search(query: string): Promise<Result<Question[], QuestionRepositoryError>> {
        return this.findAll({ search: query });
    }

    // ─── Group Operations ───

    async deleteGroup(groupId: string): Promise<Result<void, QuestionRepositoryError>> {
        try {
            const { error } = await supabase
                .from(this.tableName)
                .delete()
                .eq('group_id', groupId);

            if (error) {
                return err({
                    type: 'DATABASE_ERROR',
                    message: `خطأ في حذف المجموعة: ${error.message}`,
                });
            }

            return ok(undefined);
        } catch (e) {
            logger.error('Error in deleteGroup', { context: 'SupabaseQuestionRepository', data: e });
            return err({ type: 'UNKNOWN_ERROR', message: 'حدث خطأ غير متوقع' });
        }
    }

    // ─── Statistics ───

    async getStats(): Promise<Result<QuestionRepositoryStats, QuestionRepositoryError>> {
        try {
            const { data, error } = await supabase
                .from(this.tableName)
                .select('id, type, difficulty')
                .limit(5000);

            if (error) {
                return err({
                    type: 'DATABASE_ERROR',
                    message: `خطأ في جلب الإحصائيات: ${error.message}`,
                });
            }

            const questions = data || [];
            const total = questions.length;

            // Count by type
            const byType: Record<string, number> = {};
            questions.forEach(q => {
                const type = q.type || 'unknown';
                byType[type] = (byType[type] || 0) + 1;
            });

            // Count by difficulty
            const byDifficulty: Record<string, number> = {};
            questions.forEach(q => {
                const diff = q.difficulty || 'unknown';
                byDifficulty[diff] = (byDifficulty[diff] || 0) + 1;
            });

            return ok({
                total,
                byType,
                byDifficulty,
            });
        } catch (e) {
            logger.error('Error in getStats', { context: 'SupabaseQuestionRepository', data: e });
            return err({ type: 'UNKNOWN_ERROR', message: 'حدث خطأ غير متوقع' });
        }
    }

    async count(filters?: QuestionFilters): Promise<Result<number, QuestionRepositoryError>> {
        try {
            let query = supabase
                .from(this.tableName)
                .select('id', { count: 'exact', head: true });

            if (filters?.lessonId) {
                query = query.eq('lesson_id', filters.lessonId);
            }
            if (filters?.type) {
                query = query.eq('type', filters.type);
            }
            if (filters?.difficulty) {
                query = query.eq('difficulty', filters.difficulty);
            }

            const { count, error } = await query;

            if (error) {
                return err({
                    type: 'DATABASE_ERROR',
                    message: `خطأ في عد الأسئلة: ${error.message}`,
                });
            }

            return ok(count || 0);
        } catch (e) {
            logger.error('Error in count', { context: 'SupabaseQuestionRepository', data: e });
            return err({ type: 'UNKNOWN_ERROR', message: 'حدث خطأ غير متوقع' });
        }
    }

    // ─── Order Management ───

    async reorder(questionIds: string[]): Promise<Result<void, QuestionRepositoryError>> {
        try {
            for (let i = 0; i < questionIds.length; i++) {
                const { error } = await supabase
                    .from(this.tableName)
                    .update({ order_index: i })
                    .eq('id', questionIds[i]);

                if (error) {
                    return err({
                        type: 'DATABASE_ERROR',
                        message: `خطأ في إعادة ترتيب الأسئلة: ${error.message}`,
                    });
                }
            }

            return ok(undefined);
        } catch (e) {
            logger.error('Error in reorder', { context: 'SupabaseQuestionRepository', data: e });
            return err({ type: 'UNKNOWN_ERROR', message: 'حدث خطأ غير متوقع' });
        }
    }
}

// Export a singleton instance
export const questionRepository = new SupabaseQuestionRepository();
