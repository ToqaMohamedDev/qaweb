/**
 * Unified Supabase Client
 * 
 * Single source of truth for all Supabase client instances
 * - Browser client (singleton)
 * - Server client (per-request)
 */

import { createBrowserClient, createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '../database.types';

// =============================================
// Types
// =============================================

export type SupabaseClient = ReturnType<typeof createBrowserClient<Database>>;
export type SupabaseServerClient = ReturnType<typeof createServerClient<Database>>;

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
// Server Client (Per-Request)
// =============================================

/**
 * Create a server-side Supabase client
 * Use this in Server Components, Server Actions, and API Routes
 */
export async function getServerClient(): Promise<SupabaseServerClient> {
    const cookieStore = await cookies();

    return createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // Called from Server Component - ignore
                    }
                },
            },
        }
    );
}

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
