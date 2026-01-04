/**
 * Lesson Service
 * 
 * Handles lessons (الدروس)
 */

import { getSupabaseClient } from '../supabase-client';
import type { Lesson, TablesInsert, TablesUpdate } from '../database.types';

// ==========================================
// Types
// ==========================================

import type { LessonFilters } from '../types';

export interface LessonWithRelations extends Lesson {
    subject?: { id: string; name: string };
    stage?: { id: string; name: string };
    creator?: { id: string; name: string };
}

// ==========================================
// Read Operations
// ==========================================

/**
 * Get all lessons with optional filters
 */
export async function getLessons(filters: LessonFilters = {}): Promise<Lesson[]> {
    const supabase = getSupabaseClient();

    let query = supabase
        .from('lessons')
        .select('*')
        .order('order_index');

    if (filters.subjectId) {
        query = query.eq('subject_id', filters.subjectId);
    }
    if (filters.stageId) {
        query = query.eq('stage_id', filters.stageId);
    }
    if (filters.createdBy) {
        query = query.eq('created_by', filters.createdBy);
    }
    if (filters.isPublished !== undefined) {
        query = query.eq('is_published', filters.isPublished);
    }
    if (filters.isFree !== undefined) {
        query = query.eq('is_free', filters.isFree);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
}

/**
 * Get published lessons only
 */
export async function getPublishedLessons(filters: Omit<LessonFilters, 'isPublished'> = {}): Promise<Lesson[]> {
    return getLessons({ ...filters, isPublished: true });
}

/**
 * Get a lesson by ID
 */
export async function getLessonById(id: string): Promise<Lesson | null> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('lessons')
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
 * Get lessons by subject
 */
export async function getLessonsBySubject(subjectId: string): Promise<Lesson[]> {
    return getPublishedLessons({ subjectId });
}

/**
 * Get lessons by teacher
 */
export async function getLessonsByTeacher(teacherId: string): Promise<Lesson[]> {
    return getLessons({ createdBy: teacherId });
}

// ==========================================
// Write Operations
// ==========================================

/**
 * Create a new lesson
 */
export async function createLesson(lesson: TablesInsert<'lessons'>): Promise<Lesson> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('lessons')
        .insert(lesson)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Update a lesson
 */
export async function updateLesson(
    id: string,
    updates: TablesUpdate<'lessons'>
): Promise<Lesson> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('lessons')
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
 * Delete a lesson
 */
export async function deleteLesson(id: string): Promise<void> {
    const supabase = getSupabaseClient();

    const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

/**
 * Publish a lesson
 */
export async function publishLesson(id: string): Promise<Lesson> {
    return updateLesson(id, { is_published: true });
}

/**
 * Unpublish a lesson
 */
export async function unpublishLesson(id: string): Promise<Lesson> {
    return updateLesson(id, { is_published: false });
}

/**
 * Increment lesson views
 */
export async function incrementLessonViews(id: string): Promise<void> {
    const supabase = getSupabaseClient();

    const { error } = await supabase.rpc('increment_lesson_views' as any, { lesson_id: id });

    // If RPC doesn't exist, do manual increment
    if (error) {
        const lesson = await getLessonById(id);
        if (lesson) {
            await updateLesson(id, { views_count: (lesson.views_count || 0) + 1 });
        }
    }
}

/**
 * Toggle lesson like (increment or decrement)
 */
export async function toggleLessonLike(id: string, like: boolean): Promise<void> {
    const lesson = await getLessonById(id);
    if (!lesson) throw new Error('Lesson not found');

    const currentLikes = lesson.likes_count || 0;
    const newLikes = like ? currentLikes + 1 : Math.max(0, currentLikes - 1);

    await updateLesson(id, { likes_count: newLikes });
}

/**
 * Increment lesson likes
 */
export async function incrementLessonLikes(id: string): Promise<void> {
    await toggleLessonLike(id, true);
}

/**
 * Decrement lesson likes
 */
export async function decrementLessonLikes(id: string): Promise<void> {
    await toggleLessonLike(id, false);
}

