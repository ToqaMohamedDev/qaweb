/**
 * API: Supported Languages
 * جلب اللغات المدعومة للنظام (بصلاحيات Admin لتجنب مشاكل RLS)
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// GET - جلب اللغات المدعومة
export async function GET() {
    try {
        // Check if environment variables are set
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        
        if (!supabaseUrl || !serviceKey) {
            console.error('[Languages API] Missing environment variables');
            // Return empty array instead of error to prevent page hang
            return NextResponse.json({
                success: true,
                languages: [],
            }, {
                headers: {
                    'Cache-Control': 'public, s-maxage=60',
                }
            });
        }

        // استخدام Service Role لضمان الوصول للبيانات العامة للنظام
        const supabase = createClient(
            supabaseUrl,
            serviceKey,
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
            // Return empty array instead of throwing to prevent page hang
            return NextResponse.json({
                success: true,
                languages: [],
            }, {
                headers: {
                    'Cache-Control': 'public, s-maxage=60',
                }
            });
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
        // Return empty array instead of 500 error to prevent page hang
        return NextResponse.json({
            success: true,
            languages: [],
        }, {
            headers: {
                'Cache-Control': 'public, s-maxage=60',
            }
        });
    }
}
