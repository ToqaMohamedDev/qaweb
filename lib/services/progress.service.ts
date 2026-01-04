/**
 * Progress Service
 * 
 * Handles user lesson progress (تقدم الدروس)
 * Uses the user_lesson_progress table from the database
 */

import { getSupabaseClient } from '../supabase-client';
import type { UserLessonProgress, TablesInsert, TablesUpdate, Lesson } from '../database.types';

// ==========================================
// Types
// ==========================================

export interface ProgressWithLesson extends UserLessonProgress {
    lesson?: Lesson;
}

export interface UserProgressSummary {
    totalLessons: number;
    completedLessons: number;
    inProgressLessons: number;
    overallProgress: number; // percentage
}

// ==========================================
// Read Operations
// ==========================================

/**
 * Get user's progress for all lessons
 */
export async function getUserProgress(userId: string): Promise<ProgressWithLesson[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('user_lesson_progress')
        .select(`
            *,
            lesson:lessons(*)
        `)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

    if (error) throw error;
    return (data || []) as ProgressWithLesson[];
}

/**
 * Get user's progress for a specific lesson
 */
export async function getLessonProgress(
    userId: string,
    lessonId: string
): Promise<UserLessonProgress | null> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('user_lesson_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('lesson_id', lessonId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
    }
    return data;
}

/**
 * Get completed lessons for a user
 */
export async function getCompletedLessons(userId: string): Promise<ProgressWithLesson[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('user_lesson_progress')
        .select(`
            *,
            lesson:lessons(*)
        `)
        .eq('user_id', userId)
        .eq('is_completed', true)
        .order('updated_at', { ascending: false });

    if (error) throw error;
    return (data || []) as ProgressWithLesson[];
}

/**
 * Get in-progress lessons for a user
 */
export async function getInProgressLessons(userId: string): Promise<ProgressWithLesson[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('user_lesson_progress')
        .select(`
            *,
            lesson:lessons(*)
        `)
        .eq('user_id', userId)
        .eq('is_completed', false)
        .gt('progress_percentage', 0)
        .order('updated_at', { ascending: false });

    if (error) throw error;
    return (data || []) as ProgressWithLesson[];
}

/**
 * Get progress summary for a user
 */
export async function getProgressSummary(userId: string): Promise<UserProgressSummary> {
    const allProgress = await getUserProgress(userId);

    const completed = allProgress.filter(p => p.is_completed).length;
    const inProgress = allProgress.filter(p => !p.is_completed && (p.progress_percentage || 0) > 0).length;
    const totalProgress = allProgress.reduce((sum, p) => sum + (p.progress_percentage || 0), 0);

    return {
        totalLessons: allProgress.length,
        completedLessons: completed,
        inProgressLessons: inProgress,
        overallProgress: allProgress.length > 0 ? totalProgress / allProgress.length : 0,
    };
}

/**
 * Get user's progress for lessons in a specific subject
 */
export async function getSubjectProgress(
    userId: string,
    subjectId: string
): Promise<ProgressWithLesson[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('user_lesson_progress')
        .select(`
            *,
            lesson:lessons!inner(*)
        `)
        .eq('user_id', userId)
        .eq('lesson.subject_id', subjectId)
        .order('updated_at', { ascending: false });

    if (error) throw error;
    return (data || []) as ProgressWithLesson[];
}

// ==========================================
// Write Operations
// ==========================================

/**
 * Update or create lesson progress
 */
export async function updateLessonProgress(
    userId: string,
    lessonId: string,
    progressPercentage: number,
    lastPosition?: number
): Promise<UserLessonProgress> {
    const supabase = getSupabaseClient();

    // Validate progress
    progressPercentage = Math.max(0, Math.min(100, progressPercentage));

    const isCompleted = progressPercentage >= 100;

    const { data, error } = await supabase
        .from('user_lesson_progress')
        .upsert({
            user_id: userId,
            lesson_id: lessonId,
            progress_percentage: progressPercentage,
            is_completed: isCompleted,
            last_position: lastPosition ?? 0,
            updated_at: new Date().toISOString(),
        }, {
            onConflict: 'user_id,lesson_id',
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Mark lesson as completed
 */
export async function markLessonCompleted(
    userId: string,
    lessonId: string
): Promise<UserLessonProgress> {
    return updateLessonProgress(userId, lessonId, 100);
}

/**
 * Reset lesson progress
 */
export async function resetLessonProgress(
    userId: string,
    lessonId: string
): Promise<void> {
    const supabase = getSupabaseClient();

    const { error } = await supabase
        .from('user_lesson_progress')
        .delete()
        .eq('user_id', userId)
        .eq('lesson_id', lessonId);

    if (error) throw error;
}

/**
 * Reset all progress for a user
 */
export async function resetAllProgress(userId: string): Promise<void> {
    const supabase = getSupabaseClient();

    const { error } = await supabase
        .from('user_lesson_progress')
        .delete()
        .eq('user_id', userId);

    if (error) throw error;
}
