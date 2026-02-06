/**
 * Stages API Route
 * 
 * Fetches educational stages from the database
 * Uses server-side Supabase client for reliable connection on Vercel
 */

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// Security headers
const securityHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
};

export async function GET() {
    console.log('[Stages API] Fetching stages...');

    try {
        const supabase = await createServerClient();

        const { data, error } = await supabase
            .from('educational_stages')
            .select('id, name')
            .order('order_index', { ascending: true });

        if (error) {
            console.error('[Stages API] Query error:', error.message);
            return NextResponse.json(
                { data: [], success: false, error: error.message },
                { status: 200, headers: securityHeaders }
            );
        }

        console.log('[Stages API] Fetched', data?.length || 0, 'stages');
        return NextResponse.json(
            { data: data || [], success: true },
            { status: 200, headers: securityHeaders }
        );

    } catch (error) {
        console.error('[Stages API] Unexpected error:', error);
        return NextResponse.json(
            { data: [], success: false, error: 'Server error' },
            { status: 200, headers: securityHeaders }
        );
    }
}
