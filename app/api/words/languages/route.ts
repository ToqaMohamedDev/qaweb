/**
 * API: Supported Languages
 * جلب اللغات المدعومة للنظام (بصلاحيات Admin لتجنب مشاكل RLS)
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// GET - جلب اللغات المدعومة
export async function GET() {
    try {
        // استخدام Service Role لضمان الوصول للبيانات العامة للنظام
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: { persistSession: false }
            }
        );

        const { data, error } = await supabase
            .from('supported_languages')
            .select('*')
            .order('sort_order');

        if (error) {
            console.error('[Languages API] Database error:', error);
            throw error;
        }

        return NextResponse.json({
            success: true,
            languages: data || [],
        }, {
            headers: {
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
            }
        });
    } catch (error) {
        console.error('[Languages API] Exception:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch languages' },
            { status: 500 }
        );
    }
}
