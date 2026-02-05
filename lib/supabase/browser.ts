/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                    BROWSER SUPABASE CLIENT                               ║
 * ║                                                                          ║
 * ║  Browser-safe code only - no server imports                              ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr';
import type { Database } from '../database.types';

// =============================================
// Types
// =============================================

export type SupabaseClient = ReturnType<typeof createSupabaseBrowserClient<Database>>;

// =============================================
// Environment Variables
// =============================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// =============================================
// Browser Client (Singleton)
// =============================================

let browserClientInstance: SupabaseClient | null = null;

/**
 * Get the browser Supabase client (singleton)
 * Use this for all CLIENT-SIDE operations in React components
 */
export function createBrowserClient(): SupabaseClient {
    if (typeof window === 'undefined') {
        return createSupabaseBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
    }

    if (!browserClientInstance) {
        browserClientInstance = createSupabaseBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
    }

    return browserClientInstance;
}

/**
 * Reset the browser client (use after logout)
 */
export function resetBrowserClient(): void {
    browserClientInstance = null;
}

// =============================================
// Aliases for Backward Compatibility
// =============================================

export const createClient = createBrowserClient;
export const getSupabaseClient = createBrowserClient;
export const getClient = createBrowserClient;
export const getBrowserClient = createBrowserClient;

export const supabase = new Proxy({} as SupabaseClient, {
    get(_, prop) {
        const client = createBrowserClient();
        return (client as unknown as Record<string, unknown>)[prop as string];
    }
});

// =============================================
// Utility Functions
// =============================================

export function isServer(): boolean {
    return typeof window === 'undefined';
}

export function isClient(): boolean {
    return typeof window !== 'undefined';
}
