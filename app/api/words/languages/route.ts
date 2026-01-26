/**
 * API: Supported Languages
 * جلب اللغات المدعومة للنظام
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// GET - جلب اللغات المدعومة
export async function GET() {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('supported_languages')
            .select('*')
            .order('sort_order');

        if (error) throw error;

        return NextResponse.json({
            success: true,
            languages: data || [],
        });
    } catch (error) {
        console.error('Error fetching languages:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch languages' },
            { status: 500 }
        );
    }
}
