/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                    SERVER SUPABASE CLIENT                                ║
 * ║                                                                          ║
 * ║  Server-only code - uses next/headers                                    ║
 * ║  DO NOT import this in client components!                                ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '../database.types';

// =============================================
// Types
// =============================================

export type SupabaseServerClient = Awaited<ReturnType<typeof createServerClient>>;

// =============================================
// Environment Variables
// =============================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// =============================================
// Server Client (Per-Request)
// =============================================

/**
 * Create a server-side Supabase client with cookie handling
 * Use this in API Routes, Server Components, Server Actions
 */
export async function createServerClient() {
    const cookieStore = await cookies();

    return createSupabaseServerClient<Database>(
        SUPABASE_URL,
        SUPABASE_ANON_KEY,
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

/**
 * Create a read-only server client (for Server Components)
 */
export async function createReadOnlyServerClient() {
    const cookieStore = await cookies();

    return createSupabaseServerClient<Database>(
        SUPABASE_URL,
        SUPABASE_ANON_KEY,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll() {
                    // Read-only
                },
            },
        }
    );
}

// =============================================
// Admin Client (Service Role - Bypasses RLS)
// =============================================

/**
 * Create an admin Supabase client with service role key
 * ⚠️ CAUTION: This bypasses Row Level Security!
 */
export function createAdminClient() {
    if (!SUPABASE_SERVICE_ROLE_KEY) {
        console.error('[createAdminClient] SUPABASE_SERVICE_ROLE_KEY is not defined!');
        throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined');
    }
    console.log('[createAdminClient] Creating admin client with service role key');

    return createSupabaseServerClient<Database>(
        SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY,
        {
            cookies: {
                getAll() {
                    return [];
                },
                setAll() {
                    // Admin client doesn't need cookies
                },
            },
        }
    );
}

// Alias
export const createClient = createServerClient;
