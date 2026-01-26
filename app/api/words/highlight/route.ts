/**
 * API: Word Highlight Toggle (النظام الأول)
 * تعليم/إلغاء تعليم كلمة - سجل واحد لكل مستخدم
 * البنية الجديدة: { lang: { pageId: { wordId: { at: timestamp } } } }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { AllHighlights } from '@/lib/words/types';

// POST - Toggle تعليم كلمة
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        
        // تحقق من تسجيل الدخول
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'يجب تسجيل الدخول' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { language_code, page_id, word_id } = body;

        if (!language_code || !page_id || !word_id) {
            return NextResponse.json(
                { success: false, error: 'language_code, page_id, and word_id are required' },
                { status: 400 }
            );
        }

        // محاولة استخدام الـ RPC function الجديدة
        const { data, error } = await supabase.rpc('toggle_word_highlight_v2', {
            p_user_id: user.id,
            p_language_code: language_code,
            p_page_id: page_id,
            p_word_id: word_id,
        });

        if (error) {
            // إذا الـ function غير موجودة، نستخدم الطريقة اليدوية
            if (error.code === '42883') {
                return await manualToggleV2(supabase, user.id, language_code, page_id, word_id);
            }
            throw error;
        }

        return NextResponse.json({
            success: true,
            highlighted_words: data.highlighted_words,
            is_now_highlighted: data.is_now_highlighted,
        });
    } catch (error) {
        console.error('Error toggling highlight:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to toggle highlight' },
            { status: 500 }
        );
    }
}

// GET - جلب جميع الكلمات المعلّمة للمستخدم
export async function GET() {
    try {
        const supabase = await createClient();
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'يجب تسجيل الدخول' },
                { status: 401 }
            );
        }

        const { data, error } = await supabase
            .from('user_word_highlights')
            .select('highlighted_words, updated_at')
            .eq('user_id', user.id)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        return NextResponse.json({
            success: true,
            highlighted_words: data?.highlighted_words || {},
            updated_at: data?.updated_at,
        });
    } catch (error) {
        console.error('Error fetching highlights:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch highlights' },
            { status: 500 }
        );
    }
}

// طريقة يدوية للـ Toggle V2 (البنية الجديدة: lang → pageId → wordId)
async function manualToggleV2(
    supabase: Awaited<ReturnType<typeof createClient>>,
    userId: string,
    languageCode: string,
    pageId: string,
    wordId: string
) {
    // جلب السجل الحالي
    const { data: existing } = await supabase
        .from('user_word_highlights')
        .select('*')
        .eq('user_id', userId)
        .single();

    const now = new Date().toISOString();
    const currentData: AllHighlights = existing?.highlighted_words || {};
    let isNowHighlighted: boolean;

    // التحقق من وجود الكلمة
    const wordExists = currentData[languageCode]?.[pageId]?.[wordId];

    if (wordExists) {
        // إزالة الكلمة
        delete currentData[languageCode][pageId][wordId];
        isNowHighlighted = false;

        // تنظيف: حذف الصفحة إذا فارغة
        if (Object.keys(currentData[languageCode][pageId]).length === 0) {
            delete currentData[languageCode][pageId];
        }
        // تنظيف: حذف اللغة إذا فارغة
        if (Object.keys(currentData[languageCode]).length === 0) {
            delete currentData[languageCode];
        }
    } else {
        // إضافة الكلمة
        if (!currentData[languageCode]) {
            currentData[languageCode] = {};
        }
        if (!currentData[languageCode][pageId]) {
            currentData[languageCode][pageId] = {};
        }
        currentData[languageCode][pageId][wordId] = { at: now };
        isNowHighlighted = true;
    }

    // حفظ أو تحديث
    if (!existing) {
        const { data: newRecord, error: insertError } = await supabase
            .from('user_word_highlights')
            .insert({
                user_id: userId,
                highlighted_words: currentData,
            })
            .select()
            .single();

        if (insertError) throw insertError;

        return NextResponse.json({
            success: true,
            highlighted_words: newRecord.highlighted_words,
            is_now_highlighted: isNowHighlighted,
        });
    }

    const { data: updated, error: updateError } = await supabase
        .from('user_word_highlights')
        .update({ highlighted_words: currentData })
        .eq('user_id', userId)
        .select()
        .single();

    if (updateError) throw updateError;

    return NextResponse.json({
        success: true,
        highlighted_words: updated.highlighted_words,
        is_now_highlighted: isNowHighlighted,
    });
}
