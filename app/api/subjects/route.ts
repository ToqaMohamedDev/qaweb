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

export async function GET() {
    // Safety timeout - ensure we don't hang forever
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
        const supabase = await createServerClient();

        const { data, error } = await supabase
            .from('subjects')
            .select('*')
            .eq('is_active', true)
            .order('order_index', { ascending: true });

        clearTimeout(timeoutId);

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
        clearTimeout(timeoutId);
        console.error('[Subjects API] Unexpected error:', error);
        return NextResponse.json(
            { data: [], success: false, error: 'Server error' },
            { status: 200, headers: securityHeaders }
        );
    }
}
