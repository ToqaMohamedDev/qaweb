/**
 * Auth Service
 * 
 * Handles authentication operations
 */

import { createBrowserClient } from '../supabase/index';

const getSupabaseClient = () => createBrowserClient();

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(options: {
    email: string;
    password: string;
    name?: string;
    role?: string;
    educationalStageId?: string;
}) {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase.auth.signUp({
        email: options.email,
        password: options.password,
        options: {
            data: {
                name: options.name,
                role: options.role,
                educational_stage_id: options.educationalStageId,
            },
        },
    });

    if (error) throw error;
    return data;
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(options: { email: string; password: string }) {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase.auth.signInWithPassword({
        email: options.email,
        password: options.password,
    });

    if (error) throw error;
    return data;
}

/**
 * Sign in with Google OAuth
 */
export async function signInWithGoogle() {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${window.location.origin}/auth/callback`,
        },
    });

    if (error) throw error;
    return data;
}

/**
 * Sign out
 */
export async function signOut() {
    const supabase = getSupabaseClient();
    
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

/**
 * Update password
 */
export async function updatePassword(newPassword: string) {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
    });

    if (error) throw error;
    return data;
}

/**
 * Reset password (send reset email)
 */
export async function resetPassword(email: string) {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;
    return data;
}
