/**
 * Teacher Service
 * 
 * Handles teacher-specific operations
 */

import { apiClient, endpoints } from '../api-client';
import { createBrowserClient } from '../supabase';
import type { Profile, TeacherExam, TeacherRating } from '../database.types';

// Helper to get client
const getSupabaseClient = () => createBrowserClient();

// ==========================================
// Types
// ==========================================

export interface TeacherWithStats extends Profile {
    exams_count: number;
    subscriber_count: number;
}

export interface TeacherDetails extends Profile {
    exams: TeacherExam[];
    ratings: TeacherRating[];
    averageRating: number;
    totalExams: number;
}

// ==========================================
// Read Operations
// ==========================================

/**
 * Get all approved teachers - Uses unified API client
 */
export async function getTeachers(): Promise<Profile[]> {
    try {
        return await apiClient.fetchArray<Profile>(endpoints.teachers(200));
    } catch (error) {
        console.error('Error fetching teachers:', error);
        return [];
    }
}

/**
 * Get teachers with stats (exams count, subscriber count)
 */
export async function getTeachersWithStats(): Promise<TeacherWithStats[]> {
    // Uses same API route
    const teachers = await getTeachers();
    return teachers.map(teacher => ({
        ...teacher,
        exams_count: (teacher as any).exams_count || 0,
        subscriber_count: teacher.subscriber_count || 0,
    })) as TeacherWithStats[];
}

/**
 * Get a teacher by ID with full details
 */
export async function getTeacherById(teacherId: string): Promise<TeacherDetails | null> {
    const supabase = getSupabaseClient();

    // Get teacher profile
    const { data: teacher, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', teacherId)
        .eq('role', 'teacher')
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        console.error('Error fetching teacher by ID:', error);
        throw new Error(error.message || 'Failed to fetch teacher by ID');
    }
    if (!teacher) return null;

    // Get teacher's published exams
    const { data: exams } = await supabase
        .from('teacher_exams')
        .select('*')
        .eq('created_by', teacherId)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

    // Get teacher's ratings
    const { data: ratings } = await supabase
        .from('teacher_ratings')
        .select('*')
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: false });

    const teacherRatings = ratings || [];
    const averageRating = teacherRatings.length > 0
        ? teacherRatings.reduce((sum, r) => sum + r.rating, 0) / teacherRatings.length
        : 0;

    return {
        ...teacher,
        exams: exams || [],
        ratings: teacherRatings,
        averageRating,
        totalExams: (exams || []).length,
    };
}

/**
 * Search teachers by name
 */
export async function searchTeachers(query: string): Promise<Profile[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'teacher')
        .eq('is_teacher_approved', true)
        .ilike('name', `%${query}%`)
        .order('subscriber_count', { ascending: false })
        .limit(20);

    if (error) {
        console.error('Error searching teachers:', error);
        throw new Error(error.message || 'Failed to search teachers');
    }
    return data || [];
}

/**
 * Get top teachers by subscriber count
 */
export async function getTopTeachers(limit: number = 10): Promise<Profile[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'teacher')
        .eq('is_teacher_approved', true)
        .order('subscriber_count', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching top teachers:', error);
        throw new Error(error.message || 'Failed to fetch top teachers');
    }
    return data || [];
}

// ==========================================
// Ratings
// ==========================================

/**
 * Rate a teacher
 */
export async function rateTeacher(
    userId: string,
    teacherId: string,
    rating: number,
    review?: string
): Promise<TeacherRating> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('teacher_ratings')
        .upsert({
            user_id: userId,
            teacher_id: teacherId,
            rating,
            review,
            updated_at: new Date().toISOString(),
        }, {
            onConflict: 'user_id,teacher_id',
        })
        .select()
        .single();

    if (error) {
        console.error('Error rating teacher:', error);
        throw new Error(error.message || 'Failed to rate teacher');
    }
    return data;
}

/**
 * Get user's rating for a teacher
 */
export async function getUserRating(
    userId: string,
    teacherId: string
): Promise<TeacherRating | null> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('teacher_ratings')
        .select('*')
        .eq('user_id', userId)
        .eq('teacher_id', teacherId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        console.error('Error fetching user rating:', error);
        throw new Error(error.message || 'Failed to fetch user rating');
    }
    return data;
}

/**
 * Delete a rating
 */
export async function deleteRating(userId: string, teacherId: string): Promise<void> {
    const supabase = getSupabaseClient();

    const { error } = await supabase
        .from('teacher_ratings')
        .delete()
        .eq('user_id', userId)
        .eq('teacher_id', teacherId);

    if (error) {
        console.error('Error deleting rating:', error);
        throw new Error(error.message || 'Failed to delete rating');
    }
}
