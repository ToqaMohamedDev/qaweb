/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                    SUPABASE CLIENT - BROWSER ONLY                        ║
 * ║                                                                          ║
 * ║  This file re-exports browser-safe code only                             ║
 * ║  For server clients, import from '@/lib/supabase/server'                 ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

// Re-export everything from browser module
export {
    createBrowserClient,
    resetBrowserClient,
    createClient,
    getSupabaseClient,
    getClient,
    getBrowserClient,
    supabase,
    isServer,
    isClient,
    type SupabaseClient,
} from './browser';
