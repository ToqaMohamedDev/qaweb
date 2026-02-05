/**
 * Server-side Supabase Client
 * 
 * Use this ONLY in Server Components, Server Actions, and API Routes
 * NOT in client components or hooks
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '../database.types';

export type SupabaseServerClient = ReturnType<typeof createServerClient<Database>>;

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
