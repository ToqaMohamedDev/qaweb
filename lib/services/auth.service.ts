/**
 * Auth Service
 * 
 * Handles authentication operations: sign in, sign up, sign out, OAuth
 */

import { getSupabaseClient } from '../supabase-client';
import type { UserRole } from '../database.types';

// ==========================================
// Types
// ==========================================

export interface SignUpData {
    email: string;
    password: string;
    name: string;
    role?: UserRole;
}

export interface SignInData {
    email: string;
    password: string;
}

// ==========================================
// Auth Functions
// ==========================================

/**
 * Sign up with email and password
 */
export async function signUpWithEmail({ email, password, name, role = 'student' }: SignUpData) {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                name,
                role,
                role_selected: true,
            },
        },
    });

    if (error) throw error;
    return data;
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail({ email, password }: SignInData) {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) throw error;
    return data;
}

/**
 * Sign in with Google OAuth
 */
export async function signInWithGoogle() {
    const supabase = getSupabaseClient();

    const origin = typeof window !== 'undefined'
        ? window.location.origin
        : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${origin}/auth/callback`,
            queryParams: {
                access_type: 'offline',
                prompt: 'consent',
            },
        },
    });

    if (error) throw error;
    return data;
}

/**
 * Sign out the current user
 */
export async function signOut() {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

/**
 * Get the current session
 */
export async function getSession() {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
}

/**
 * Get the current user
 */
export async function getCurrentUser() {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
}

/**
 * Refresh the session
 */
export async function refreshSession() {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.refreshSession();
    if (error) throw error;
    return data;
}

/**
 * Reset password
 */
export async function resetPassword(email: string) {
    const supabase = getSupabaseClient();

    const origin = typeof window !== 'undefined'
        ? window.location.origin
        : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/reset-password`,
    });

    if (error) throw error;
    return data;
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
