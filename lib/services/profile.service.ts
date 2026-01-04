/**
 * Profile Service
 * 
 * Handles user profile operations: get, update, role checks
 */

import { getSupabaseClient } from '../supabase-client';
import type { Profile, UserRole, TablesUpdate } from '../database.types';

// ==========================================
// Profile CRUD
// ==========================================

/**
 * Get a user profile by ID
 */
export async function getProfile(userId: string): Promise<Profile | null> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        // Handle "not found" gracefully
        if (error.code === 'PGRST116') return null;

        // Handle "Permission Denied" (RLS) gracefully - treat as restricted access
        if (error.code === '42501') {
            console.warn(`[ProfileService] Permission denied reading profile for ${userId}. RLS policies may be missing.`);
            return null;
        }

        console.error(`[ProfileService] Error fetching profile for userId "${userId}":`, error);
        throw new Error(error.message || `Failed to fetch profile (Code: ${error.code})`);
    }

    return data;
}

/**
 * Get the current user's profile
 */
export async function getCurrentProfile(): Promise<Profile | null> {
    const supabase = getSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    return getProfile(user.id);
}

/**
 * Update a user profile
 */
export async function updateProfile(
    userId: string,
    updates: TablesUpdate<'profiles'>
): Promise<Profile> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('profiles')
        .update({
            ...updates,
            updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

    if (error) {
        console.error('Error updating profile:', error);
        throw new Error(error.message || 'Failed to update profile');
    }
    return data;
}

/**
 * Update the current user's role (during onboarding)
 */
export async function updateUserRole(userId: string, role: UserRole): Promise<Profile> {
    return updateProfile(userId, {
        role,
        role_selected: true,
    });
}

// ==========================================
// Role Checks
// ==========================================

/**
 * Check if a user is an admin
 */
export async function isAdmin(userId: string): Promise<boolean> {
    try {
        const profile = await getProfile(userId);
        return profile?.role === 'admin';
    } catch (error) {
        console.error(`Error checking admin status for ${userId}:`, error);
        return false;
    }
}

/**
 * Check if a user is a teacher
 */
export async function isTeacher(userId: string): Promise<boolean> {
    try {
        const profile = await getProfile(userId);
        return profile?.role === 'teacher';
    } catch (error) {
        console.error(`Error checking teacher status for ${userId}:`, error);
        return false;
    }
}

/**
 * Check if a user is a student
 */
export async function isStudent(userId: string): Promise<boolean> {
    try {
        const profile = await getProfile(userId);
        return profile?.role === 'student';
    } catch (error) {
        console.error(`Error checking student status for ${userId}:`, error);
        return false;
    }
}

/**
 * Check if the current user is an admin
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    return isAdmin(user.id);
}

// ==========================================
// Teacher-specific
// ==========================================

/**
 * Get all approved teachers
 */
export async function getApprovedTeachers(): Promise<Profile[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'teacher')
        .eq('is_teacher_approved', true)
        .order('subscriber_count', { ascending: false });

    if (error) {
        console.error('Error fetching approved teachers:', error);
        throw new Error(error.message || 'Failed to fetch approved teachers');
    }
    return data || [];
}

/**
 * Get public teachers (for listing)
 */
export async function getPublicTeachers(): Promise<Profile[]> {
    return getApprovedTeachers();
}


