/**
 * API: Translation Service
 * ترجمة الكلمات متعددة اللغات مع كاش في قاعدة البيانات
 */

import { NextRequest, NextResponse } from 'next/server';
import { translationService } from '@/lib/words/translation-service';
import { createClient } from '@/lib/supabase-server';

// اللغات المدعومة
const validLanguages = ['ar', 'en', 'fr', 'de', 'es', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'tr', 'nl', 'pl', 'sv', 'da', 'fi', 'no', 'el', 'he', 'hi', 'th', 'vi', 'id', 'ms'];

// جلب الترجمة من الكاش
async function getCachedTranslation(
    supabase: Awaited<ReturnType<typeof createClient>>,
    text: string,
    from: string,
    to: string
): Promise<string | null> {
    try {
        const { data } = await supabase
            .from('translation_cache')
            .select('translated_text')
            .eq('source_text', text.toLowerCase().trim())
            .eq('source_lang', from)
            .eq('target_lang', to)
            .single();

        return data?.translated_text || null;
    } catch {
        return null;
    }
}

// حفظ الترجمة في الكاش
async function saveCachedTranslation(
    supabase: Awaited<ReturnType<typeof createClient>>,
    text: string,
    from: string,
    to: string,
    translation: string
): Promise<void> {
    try {
        await supabase.from('translation_cache').upsert(
            {
                source_text: text.toLowerCase().trim(),
                source_lang: from,
                target_lang: to,
                translated_text: translation,
                provider_name: 'mymemory',
            },
            {
                onConflict: 'source_text,source_lang,target_lang',
            }
        );
    } catch (error) {
        console.error('Cache save error:', error);
    }
}

// دالة الترجمة الموحدة
async function handleTranslation(text: string, from: string, to: string) {
    // التحقق من صحة اللغات
    if (!validLanguages.includes(from) || !validLanguages.includes(to)) {
        return {
            success: false,
            error: 'Invalid language code',
            status: 400,
        };
    }

    // نفس اللغة
    if (from === to) {
        return {
            success: true,
            translation: text,
            from_language: from,
            to_language: to,
        };
    }

    const supabase = await createClient();

    // البحث في الكاش أولاً
    const cached = await getCachedTranslation(supabase, text, from, to);
    if (cached) {
        return {
            success: true,
            translation: cached,
            from_language: from,
            to_language: to,
            cached: true,
        };
    }

    // ترجمة جديدة
    const result = await translationService.translate(text, from, to);

    // حفظ في الكاش إذا نجحت الترجمة
    if (result.success && result.translation !== text) {
        await saveCachedTranslation(supabase, text, from, to, result.translation);
    }

    return result;
}

// POST - ترجمة نص
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { text, from, to } = body;

        if (!text || !from || !to) {
            return NextResponse.json(
                { success: false, error: 'text, from, and to are required' },
                { status: 400 }
            );
        }

        const result = await handleTranslation(text, from, to);

        if ('status' in result && result.status) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: result.status }
            );
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error('Translation error:', error);
        return NextResponse.json(
            { success: false, error: 'Translation failed' },
            { status: 500 }
        );
    }
}

// GET - ترجمة سريعة عبر query params
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const text = searchParams.get('text');
        const from = searchParams.get('from');
        const to = searchParams.get('to');

        if (!text || !from || !to) {
            return NextResponse.json(
                { success: false, error: 'text, from, and to are required' },
                { status: 400 }
            );
        }

        const result = await handleTranslation(text, from, to);

        if ('status' in result && result.status) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: result.status }
            );
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error('Translation error:', error);
        return NextResponse.json(
            { success: false, error: 'Translation failed' },
            { status: 500 }
        );
    }
}
