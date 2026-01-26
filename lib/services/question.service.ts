/**
 * Question Service
 * 
 * Handles quiz questions (أسئلة الكويز)
 * Supports both lesson-linked questions and standalone game questions
 */

import { getSupabaseClient } from '../supabase-client';
import type { QuizQuestion, LessonQuestion, TablesInsert, TablesUpdate, Json } from '../database.types';

// ==========================================
// Types
// ==========================================

export interface QuestionFilters {
    lessonId?: string;
    category?: string;
    type?: string;
    difficulty?: string;
    isActive?: boolean;
    forGame?: boolean; // If true, only get questions suitable for game mode
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
        .from('quiz_questions')
        .select('*')
        .order('order_index');

    if (filters.lessonId) {
        query = query.eq('lesson_id', filters.lessonId);
    }
    if (filters.category) {
        query = query.eq('category', filters.category);
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
    if (filters.forGame) {
        // Game mode questions must be MCQ type
        query = query.eq('type', 'mcq');
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
        .from('quiz_questions')
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
        .from('quiz_questions')
        .select('*', { count: 'exact', head: true })
        .eq('lesson_id', lessonId)
        .eq('is_active', true);

    if (error) throw error;
    return count || 0;
}

/**
 * Get questions for game mode
 */
export async function getGameQuestions(
    count: number,
    category?: string,
    difficulty?: string
): Promise<LessonQuestion[]> {
    const supabase = getSupabaseClient();

    let query = supabase
        .from('quiz_questions')
        .select('*')
        .eq('type', 'mcq')
        .eq('is_active', true)
        .limit(count * 2); // Get more to allow shuffling

    if (category && category !== 'general') {
        query = query.eq('category', category);
    }
    if (difficulty && difficulty !== 'mixed') {
        query = query.eq('difficulty', difficulty);
    }

    const { data, error } = await query;

    if (error) throw error;
    
    // Shuffle and return requested count
    const shuffled = (data || []).sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

// ==========================================
// Write Operations
// ==========================================

/**
 * Create a new question
 */
export async function createQuestion(question: TablesInsert<'quiz_questions'>): Promise<LessonQuestion> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('quiz_questions')
        .insert(question)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Create multiple questions at once
 */
export async function createQuestions(questions: TablesInsert<'quiz_questions'>[]): Promise<LessonQuestion[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('quiz_questions')
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
    updates: TablesUpdate<'quiz_questions'>
): Promise<LessonQuestion> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('quiz_questions')
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
        .from('quiz_questions')
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
            .from('quiz_questions')
            .update({ order_index: update.order_index, updated_at: update.updated_at })
            .eq('id', update.id)
            .eq('lesson_id', lessonId);

        if (error) throw error;
    }
}

/**
 * Get all questions for admin (no filters)
 */
export async function getAllQuestionsForAdmin(): Promise<LessonQuestion[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

/**
 * Get question statistics
 */
export async function getQuestionStats(): Promise<{
    total: number;
    active: number;
    byCategory: Record<string, number>;
    byDifficulty: Record<string, number>;
}> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('quiz_questions')
        .select('id, is_active, category, difficulty');

    if (error) throw error;

    const questions = data || [];
    const stats = {
        total: questions.length,
        active: questions.filter(q => q.is_active).length,
        byCategory: {} as Record<string, number>,
        byDifficulty: {} as Record<string, number>,
    };

    questions.forEach(q => {
        const cat = q.category || 'general';
        const diff = q.difficulty || 'medium';
        stats.byCategory[cat] = (stats.byCategory[cat] || 0) + 1;
        stats.byDifficulty[diff] = (stats.byDifficulty[diff] || 0) + 1;
    });

    return stats;
}
