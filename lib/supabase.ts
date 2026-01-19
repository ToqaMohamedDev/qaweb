/**
 * Supabase Client Configuration
 * 
 * This is the main entry point for Supabase client.
 * It provides a singleton browser client for client-side usage.
 */

import { getSupabaseClient, supabase } from './supabase-client';

// Debug: Log Supabase configuration
if (typeof window !== 'undefined') {
    console.log('[Supabase] URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET ✓' : 'NOT SET ✗');
    console.log('[Supabase] KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET ✓' : 'NOT SET ✗');
}

// Re-export core client functions
export { getSupabaseClient, supabase };
export { getSupabaseClient as createClient };

// Re-export commonly used functions from services for backward compatibility
export {
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    signOut,
    getCurrentUser,
    updatePassword,
    resetPassword,
} from './services/auth.service';

export {
    getCurrentProfile,
    getProfile,
    updateProfile,
    isAdmin,
    isTeacher,
    isStudent,
    isCurrentUserAdmin,
} from './services/profile.service';

// Aliases for backward compatibility
export { getCurrentProfile as getUserProfile } from './services/profile.service';
export { updateProfile as updateUserProfile } from './services/profile.service';

