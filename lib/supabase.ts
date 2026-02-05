/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                    SUPABASE CLIENT - MAIN ENTRY POINT                    ║
 * ║                                                                          ║
 * ║  Browser-safe exports only                                               ║
 * ║  For server imports, use '@/lib/supabase/server'                         ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

// =============================================
// Re-export browser-safe exports
// =============================================
export {
    // Main browser client
    createBrowserClient,
    
    // Aliases (backward compatibility)
    createClient,
    getSupabaseClient,
    getClient,
    getBrowserClient,
    supabase,
    
    // Utilities
    resetBrowserClient,
    isServer,
    isClient,
    
    // Types
    type SupabaseClient,
} from './supabase/index';

// =============================================
// Re-export auth services (backward compatibility)
// =============================================
export {
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    signOut,
    updatePassword,
    resetPassword,
} from './services/auth.service';

// =============================================
// Re-export profile services (backward compatibility)
// =============================================
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

