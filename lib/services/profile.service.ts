/**
 * Profile Service
 * 
 * Handles user profile operations
 */

import { createBrowserClient } from '../supabase/index';
import type { Profile } from '../database.types';

const getSupabaseClient = () => createBrowserClient();

/**
 * Get current user's profile
 */
export async function getCurrentProfile(): Promise<Profile | null> {
    const supabase = getSupabaseClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
    }
    return data;
}

/**
 * Get a profile by ID
 */
export async function getProfile(userId: string): Promise<Profile | null> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
    }
    return data;
}

/**
 * Update profile
 */
export async function updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
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

    if (error) throw error;
    return data;
}

/**
 * Check if user is admin
 */
export async function isAdmin(userId?: string): Promise<boolean> {
    const profile = userId ? await getProfile(userId) : await getCurrentProfile();
    return profile?.role === 'admin';
}

/**
 * Check if user is teacher
 */
export async function isTeacher(userId?: string): Promise<boolean> {
    const profile = userId ? await getProfile(userId) : await getCurrentProfile();
    return profile?.role === 'teacher';
}

/**
 * Check if user is student
 */
export async function isStudent(userId?: string): Promise<boolean> {
    const profile = userId ? await getProfile(userId) : await getCurrentProfile();
    return profile?.role === 'student';
}

/**
 * Check if current user is admin
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
    return isAdmin();
}
