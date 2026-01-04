/**
 * Teacher Service
 * 
 * Handles teacher-specific operations
 */

import { getSupabaseClient } from '../supabase-client';
import type { Profile, TeacherExam, TeacherRating, TablesInsert } from '../database.types';
import { getSubscriberCount } from './subscription.service';

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
 * Get all approved teachers
 */
export async function getTeachers(): Promise<Profile[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'teacher')
        .eq('is_teacher_approved', true)
        .order('subscriber_count', { ascending: false });

    if (error) {
        if (error.code === '42501') {
            console.warn('[TeacherService] Permission denied (RLS). Please run the fix_permissions.sql script.');
            return [];
        }
        console.error('Error fetching teachers:', error);
        throw new Error(error.message || 'Failed to fetch teachers');
    }

    if (!data || data.length === 0) return [];

    // Get exam counts for each teacher from BOTH tables
    const teacherIds = data.map(t => t.id);

    // Count from teacher_exams
    const { data: teacherExamCounts } = await supabase
        .from('teacher_exams')
        .select('created_by')
        .in('created_by', teacherIds)
        .eq('is_published', true);

    // Count from comprehensive_exams
    const { data: compExamCounts } = await supabase
        .from('comprehensive_exams')
        .select('created_by')
        .in('created_by', teacherIds)
        .eq('is_published', true);

    // Build combined exam count map
    const examCountMap: Record<string, number> = {};

    (teacherExamCounts || []).forEach(exam => {
        examCountMap[exam.created_by] = (examCountMap[exam.created_by] || 0) + 1;
    });

    (compExamCounts || []).forEach(exam => {
        if (exam.created_by) {
            examCountMap[exam.created_by] = (examCountMap[exam.created_by] || 0) + 1;
        }
    });

    // Map snake_case to camelCase for UI components
    // Note: New columns (cover_image_url, is_verified, etc.) are added via SQL migration
    return data.map(teacher => {
        const t = teacher as any; // Cast to any to access new columns
        const actualExamCount = examCountMap[teacher.id] || 0;
        return {
            ...teacher,
            // camelCase aliases for UI components
            coverImageURL: t.cover_image_url || null,
            photoURL: t.avatar_url,
            displayName: t.name,
            isVerified: t.is_verified || false,
            specialty: t.specialization || t.bio,
            subscriberCount: t.subscriber_count || 0,
            // Use actual exam count from query, not the potentially stale exam_count column
            examsCount: actualExamCount,
            exams_count: actualExamCount,
        };
    }) as Profile[];
}

/**
 * Get teachers with stats (exams count, subscriber count)
 */
export async function getTeachersWithStats(): Promise<TeacherWithStats[]> {
    const supabase = getSupabaseClient();

    const { data: teachers, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'teacher')
        .eq('is_teacher_approved', true)
        .order('subscriber_count', { ascending: false });

    if (error) {
        console.error('Error fetching teachers with stats:', error);
        throw new Error(error.message || 'Failed to fetch teachers with stats');
    }
    if (!teachers || teachers.length === 0) return [];

    // Get exam counts for each teacher from BOTH tables
    const teacherIds = teachers.map(t => t.id);

    // Count from teacher_exams
    const { data: teacherExamCounts } = await supabase
        .from('teacher_exams')
        .select('created_by')
        .in('created_by', teacherIds)
        .eq('is_published', true);

    // Count from comprehensive_exams
    const { data: compExamCounts } = await supabase
        .from('comprehensive_exams')
        .select('created_by')
        .in('created_by', teacherIds)
        .eq('is_published', true);

    // Build combined exam count map
    const examCountMap: Record<string, number> = {};

    (teacherExamCounts || []).forEach(exam => {
        examCountMap[exam.created_by] = (examCountMap[exam.created_by] || 0) + 1;
    });

    (compExamCounts || []).forEach(exam => {
        if (exam.created_by) {
            examCountMap[exam.created_by] = (examCountMap[exam.created_by] || 0) + 1;
        }
    });

    return teachers.map(teacher => ({
        ...teacher,
        exams_count: examCountMap[teacher.id] || 0,
        subscriber_count: teacher.subscriber_count || 0,
    }));
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
