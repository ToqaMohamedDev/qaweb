/**
 * Rating Service
 * 
 * Handles teacher ratings (تقييمات المعلمين)
 * Uses the teacher_ratings table from the database
 */

import { getSupabaseClient } from '../supabase-client';
import type { TeacherRating, TablesInsert } from '../database.types';

// ==========================================
// Types
// ==========================================

export interface RatingWithUser extends TeacherRating {
    user?: {
        id: string;
        name: string | null;
        avatar_url: string | null;
    };
}

export interface TeacherRatingStats {
    averageRating: number;
    totalRatings: number;
    ratingDistribution: {
        1: number;
        2: number;
        3: number;
        4: number;
        5: number;
    };
}

// ==========================================
// Read Operations
// ==========================================

/**
 * Get all ratings for a teacher
 */
export async function getTeacherRatings(teacherId: string): Promise<RatingWithUser[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('teacher_ratings')
        .select(`
            *,
            user:profiles!teacher_ratings_user_id_fkey(id, name, avatar_url)
        `)
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as RatingWithUser[];
}

/**
 * Get a user's rating for a specific teacher
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
        throw error;
    }
    return data;
}

/**
 * Get rating statistics for a teacher
 */
export async function getTeacherRatingStats(teacherId: string): Promise<TeacherRatingStats> {
    const ratings = await getTeacherRatings(teacherId);

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let total = 0;
    let sum = 0;

    ratings.forEach(r => {
        if (r.rating >= 1 && r.rating <= 5) {
            distribution[r.rating as keyof typeof distribution]++;
            sum += r.rating;
            total++;
        }
    });

    return {
        averageRating: total > 0 ? sum / total : 0,
        totalRatings: total,
        ratingDistribution: distribution,
    };
}

/**
 * Check if user has rated a teacher
 */
export async function hasUserRated(userId: string, teacherId: string): Promise<boolean> {
    const rating = await getUserRating(userId, teacherId);
    return rating !== null;
}

// ==========================================
// Write Operations
// ==========================================

/**
 * Create or update a rating
 */
export async function rateTeacher(
    userId: string,
    teacherId: string,
    rating: number,
    review?: string
): Promise<TeacherRating> {
    const supabase = getSupabaseClient();

    // Validate rating
    if (rating < 1 || rating > 5) {
        throw new Error('Rating must be between 1 and 5');
    }

    // Check if user already rated
    const existingRating = await getUserRating(userId, teacherId);

    if (existingRating) {
        // Update existing rating
        const { data, error } = await supabase
            .from('teacher_ratings')
            .update({
                rating,
                review: review || null,
                updated_at: new Date().toISOString(),
            })
            .eq('id', existingRating.id)
            .select()
            .single();

        if (error) throw error;

        // Update teacher's average rating
        await updateTeacherRatingAverage(teacherId);

        return data;
    } else {
        // Create new rating
        const { data, error } = await supabase
            .from('teacher_ratings')
            .insert({
                user_id: userId,
                teacher_id: teacherId,
                rating,
                review: review || null,
            })
            .select()
            .single();

        if (error) throw error;

        // Update teacher's average rating
        await updateTeacherRatingAverage(teacherId);

        return data;
    }
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

    if (error) throw error;

    // Update teacher's average rating
    await updateTeacherRatingAverage(teacherId);
}

/**
 * Update teacher's average rating in their profile
 */
async function updateTeacherRatingAverage(teacherId: string): Promise<void> {
    const supabase = getSupabaseClient();
    const stats = await getTeacherRatingStats(teacherId);

    const { error } = await supabase
        .from('profiles')
        .update({
            rating_average: stats.averageRating,
            rating_count: stats.totalRatings,
            updated_at: new Date().toISOString(),
        })
        .eq('id', teacherId);

    if (error) throw error;
}
