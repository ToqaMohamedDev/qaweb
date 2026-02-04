/**
 * API: Supported Languages
 * Returns a static list of supported languages (table was deleted)
 */

import { NextResponse } from 'next/server';

// Static list of supported languages (since 'supported_languages' table was deleted)
const SUPPORTED_LANGUAGES = [
    { code: 'en', name: 'English', name_ar: 'الإنجليزية', flag: '🇬🇧', sort_order: 1 },
    { code: 'ar', name: 'Arabic', name_ar: 'العربية', flag: '🇸🇦', sort_order: 2 },
    { code: 'fr', name: 'French', name_ar: 'الفرنسية', flag: '🇫🇷', sort_order: 3 },
    { code: 'de', name: 'German', name_ar: 'الألمانية', flag: '🇩🇪', sort_order: 4 },
];

// GET - جلب اللغات المدعومة
export async function GET() {
    return NextResponse.json({
        success: true,
        languages: SUPPORTED_LANGUAGES,
    }, {
        headers: {
            'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=86400',
        }
    });
}
