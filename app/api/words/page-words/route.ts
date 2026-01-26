/**
 * API: Page Words (النظام الأول)
 * إدارة كلمات الصفحات
 * البنية الجديدة: page_id + word_id + word_text
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { AllHighlights } from '@/lib/words/types';

// GET - جلب كلمات صفحة معينة مع حالة التعليم
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        
        const page_id = searchParams.get('page_id');
        const language_code = searchParams.get('language_code');

        if (!page_id || !language_code) {
            return NextResponse.json(
                { success: false, error: 'page_id and language_code are required' },
                { status: 400 }
            );
        }

        // جلب المستخدم الحالي
        const { data: { user } } = await supabase.auth.getUser();

        // جلب كلمات الصفحة
        const { data: words, error: wordsError } = await supabase
            .from('page_words')
            .select('*')
            .eq('page_id', page_id)
            .eq('language_code', language_code)
            .eq('is_active', true)
            .order('word_position');

        if (wordsError) {
            throw wordsError;
        }

        // جلب الكلمات المعلّمة للمستخدم (البنية الجديدة)
        let pageHighlights: Record<string, { at: string }> = {};
        if (user) {
            const { data: highlights } = await supabase
                .from('user_word_highlights')
                .select('highlighted_words')
                .eq('user_id', user.id)
                .single();

            if (highlights?.highlighted_words) {
                const allHighlights = highlights.highlighted_words as AllHighlights;
                pageHighlights = allHighlights[language_code]?.[page_id] || {};
            }
        }

        // دمج البيانات مع حالة التعليم
        const wordsWithHighlight = (words || []).map((word) => ({
            ...word,
            is_highlighted: !!pageHighlights[word.word_id],
            highlighted_at: pageHighlights[word.word_id]?.at || null,
        }));

        return NextResponse.json({
            success: true,
            words: wordsWithHighlight,
        });
    } catch (error) {
        console.error('Error fetching page words:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch page words' },
            { status: 500 }
        );
    }
}

// POST - إضافة كلمة جديدة (أدمن فقط)
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        
        // تحقق من صلاحيات الأدمن
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json(
                { success: false, error: 'Admin access required' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { language_code, word_id, page_id, word_text, word_position, word_context } = body;

        if (!language_code || !word_id || !page_id || !word_text) {
            return NextResponse.json(
                { success: false, error: 'language_code, word_id, page_id, and word_text are required' },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('page_words')
            .insert({
                language_code,
                word_id,
                page_id,
                word_text,
                word_position: word_position || 0,
                word_context,
            })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                return NextResponse.json(
                    { success: false, error: 'Word already exists for this page' },
                    { status: 409 }
                );
            }
            throw error;
        }

        return NextResponse.json({ success: true, word: data });
    } catch (error) {
        console.error('Error creating page word:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create page word' },
            { status: 500 }
        );
    }
}
