/**
 * Browser Supabase Client
 * 
 * Client-side only Supabase client (singleton)
 * For server-side usage, import from './server-client'
 */

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '../database.types';

// =============================================
// Types
// =============================================

export type SupabaseClient = ReturnType<typeof createBrowserClient<Database>>;

// Re-export server client type for convenience
export type { SupabaseServerClient } from './server-client';

// =============================================
// Browser Client (Singleton)
// =============================================

let browserClient: SupabaseClient | null = null;

/**
 * Get the browser Supabase client (singleton)
 * Use this for all client-side operations
 */
export function getBrowserClient(): SupabaseClient {
    if (typeof window === 'undefined') {
        throw new Error('getBrowserClient() should only be called on the client side');
    }

    if (!browserClient) {
        browserClient = createBrowserClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
    }

    return browserClient;
}

/**
 * Reset the browser client (use after logout)
 */
export function resetBrowserClient(): void {
    browserClient = null;
}

// =============================================
// Server Client - Import from separate file
// =============================================

// For server-side usage, import getServerClient from './server-client'
// This separation prevents next/headers from being bundled in client code

// =============================================
// Universal Client Getter
// =============================================

/**
 * Get the appropriate Supabase client based on environment
 * - Server: Creates new server client
 * - Browser: Returns singleton browser client
 */
export function getClient(): SupabaseClient {
    if (typeof window === 'undefined') {
        // Server-side: Return a browser-like client for compatibility
        // Note: For proper server-side usage, use getServerClient()
        return createBrowserClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
    }
    return getBrowserClient();
}

// =============================================
// Aliases for backward compatibility
// =============================================

export const createClient = getClient;
export const supabase = new Proxy({} as SupabaseClient, {
    get(_, prop) {
        const client = getClient();
        return (client as unknown as Record<string, unknown>)[prop as string];
    }
});
