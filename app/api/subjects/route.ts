/**
 * Subjects API Route
 * 
 * Unified API endpoint for fetching subjects
 * This ensures consistent data fetching strategy with teachers API
 */

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// Security headers
const securityHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
};

// Helper function with timeout
async function withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    fallback: T
): Promise<T> {
    const timeoutPromise = new Promise<T>((resolve) => {
        setTimeout(() => resolve(fallback), timeoutMs);
    });
    return Promise.race([promise, timeoutPromise]);
}

export async function GET() {
    try {
        const supabase = await createServerClient();

        // Fetch subjects with 5-second timeout
        const { data, error } = await withTimeout(
            supabase
                .from('subjects')
                .select('*')
                .eq('is_active', true)
                .order('order_index', { ascending: true }),
            5000,
            { data: [], error: null }
        );

        if (error) {
            console.error('[Subjects API] Query error:', error.message);
            return NextResponse.json(
                { data: [], success: false, error: error.message },
                { status: 200, headers: securityHeaders }
            );
        }

        return NextResponse.json(
            { data: data || [], success: true },
            { status: 200, headers: securityHeaders }
        );

    } catch (error) {
        console.error('[Subjects API] Unexpected error:', error);
        return NextResponse.json(
            { data: [], success: false, error: 'Server error' },
            { status: 200, headers: securityHeaders }
        );
    }
}
