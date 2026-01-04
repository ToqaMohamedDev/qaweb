/**
 * Supabase Client Configuration (Internal)
 * 
 * This file is for internal use to avoid circular dependencies.
 * It provides the singleton browser client creation logic.
 */

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './database.types';

// Cached client instance for browser
let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

/**
 * Creates or returns the cached Supabase browser client
 * Use this for all client-side Supabase operations
 */
export function getSupabaseClient() {
    if (typeof window === 'undefined') {
        // Server-side: Create new instance (shouldn't be used on server)
        // For server-side, use createServerClient from @supabase/ssr
        return createBrowserClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
    }

    // Client-side: Reuse instance (singleton pattern)
    if (!browserClient) {
        browserClient = createBrowserClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
    }

    return browserClient;
}

/**
 * Proxy object for easy access to Supabase client
 * Usage: import { supabase } from '@/lib/supabase-client';
 */
export const supabase = new Proxy({} as ReturnType<typeof getSupabaseClient>, {
    get(_, prop) {
        const client = getSupabaseClient();
        return (client as unknown as Record<string, unknown>)[prop as string];
    }
});
