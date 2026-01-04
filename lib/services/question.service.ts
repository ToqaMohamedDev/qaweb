/**
 * Question Service
 * 
 * Handles lesson questions (أسئلة الدروس)
 */

import { getSupabaseClient } from '../supabase-client';
import type { LessonQuestion, TablesInsert, TablesUpdate, Json } from '../database.types';

// ==========================================
// Types
// ==========================================

export interface QuestionFilters {
    lessonId?: string;
    type?: string;
    difficulty?: string;
    isActive?: boolean;
}

// ==========================================
// Read Operations
// ==========================================

/**
 * Get all questions with optional filters
 */
export async function getQuestions(filters: QuestionFilters = {}): Promise<LessonQuestion[]> {
    const supabase = getSupabaseClient();

    let query = supabase
        .from('lesson_questions')
        .select('*')
        .order('order_index');

    if (filters.lessonId) {
        query = query.eq('lesson_id', filters.lessonId);
    }
    if (filters.type) {
        query = query.eq('type', filters.type);
    }
    if (filters.difficulty) {
        query = query.eq('difficulty', filters.difficulty);
    }
    if (filters.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
}

/**
 * Get questions for a lesson
 */
export async function getQuestionsByLesson(lessonId: string): Promise<LessonQuestion[]> {
    return getQuestions({ lessonId, isActive: true });
}

/**
 * Get a question by ID
 */
export async function getQuestionById(id: string): Promise<LessonQuestion | null> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('lesson_questions')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
    }
    return data;
}

/**
 * Get questions count for a lesson
 */
export async function getQuestionsCount(lessonId: string): Promise<number> {
    const supabase = getSupabaseClient();

    const { count, error } = await supabase
        .from('lesson_questions')
        .select('*', { count: 'exact', head: true })
        .eq('lesson_id', lessonId)
        .eq('is_active', true);

    if (error) throw error;
    return count || 0;
}

// ==========================================
// Write Operations
// ==========================================

/**
 * Create a new question
 */
export async function createQuestion(question: TablesInsert<'lesson_questions'>): Promise<LessonQuestion> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('lesson_questions')
        .insert(question)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Create multiple questions at once
 */
export async function createQuestions(questions: TablesInsert<'lesson_questions'>[]): Promise<LessonQuestion[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('lesson_questions')
        .insert(questions)
        .select();

    if (error) throw error;
    return data || [];
}

/**
 * Update a question
 */
export async function updateQuestion(
    id: string,
    updates: TablesUpdate<'lesson_questions'>
): Promise<LessonQuestion> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('lesson_questions')
        .update({
            ...updates,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Delete a question
 */
export async function deleteQuestion(id: string): Promise<void> {
    const supabase = getSupabaseClient();

    const { error } = await supabase
        .from('lesson_questions')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

/**
 * Soft delete (deactivate) a question
 */
export async function deactivateQuestion(id: string): Promise<LessonQuestion> {
    return updateQuestion(id, { is_active: false });
}

/**
 * Reorder questions
 */
export async function reorderQuestions(
    lessonId: string,
    orderedIds: string[]
): Promise<void> {
    const supabase = getSupabaseClient();

    const updates = orderedIds.map((id, index) => ({
        id,
        order_index: index,
        updated_at: new Date().toISOString(),
    }));

    for (const update of updates) {
        const { error } = await supabase
            .from('lesson_questions')
            .update({ order_index: update.order_index, updated_at: update.updated_at })
            .eq('id', update.id)
            .eq('lesson_id', lessonId);

        if (error) throw error;
    }
}
