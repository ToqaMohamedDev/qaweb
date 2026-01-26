/**
 * API: Word Bank (النظام الثاني - منفصل 100%)
 * إدارة بنك الكلمات للأدمن
 * ⚠️ هذا النظام منفصل تماماً عن نظام كلمات الصفحات والتعليم
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// GET - جلب كلمات بنك الكلمات مع فلترة
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        
        const language_code = searchParams.get('language_code');
        const category = searchParams.get('category');
        const difficulty = searchParams.get('difficulty');
        const search = searchParams.get('search');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = (page - 1) * limit;

        let query = supabase
            .from('word_bank')
            .select(`
                *,
                translations:word_bank_translations(*)
            `, { count: 'exact' })
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        // فلترة حسب اللغة
        if (language_code) {
            query = query.eq('language_code', language_code);
        }

        // فلترة حسب التصنيف
        if (category) {
            query = query.eq('category_slug', category);
        }

        // فلترة حسب الصعوبة
        if (difficulty) {
            query = query.eq('difficulty_level', parseInt(difficulty));
        }

        // بحث في الكلمات
        if (search) {
            query = query.ilike('word_text', `%${search}%`);
        }

        // Pagination
        query = query.range(offset, offset + limit - 1);

        const { data, error, count } = await query;

        if (error) throw error;

        return NextResponse.json({
            success: true,
            words: data || [],
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching word bank:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch word bank' },
            { status: 500 }
        );
    }
}

// POST - إضافة كلمة جديدة لبنك الكلمات (أدمن فقط)
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
        const {
            language_code,
            word_text,
            word_definition,
            category_slug,
            difficulty_level,
            example_sentence,
            phonetic_text,
            notes,
            translations, // Array of translations
        } = body;

        if (!language_code || !word_text) {
            return NextResponse.json(
                { success: false, error: 'language_code and word_text are required' },
                { status: 400 }
            );
        }

        // إضافة الكلمة الأساسية
        const { data: wordData, error: wordError } = await supabase
            .from('word_bank')
            .insert({
                language_code,
                word_text,
                word_definition,
                category_slug,
                difficulty_level: difficulty_level || 'beginner',
                example_sentence,
                phonetic_text,
                notes,
            })
            .select()
            .single();

        if (wordError) {
            if (wordError.code === '23505') {
                return NextResponse.json(
                    { success: false, error: 'Word already exists in this language' },
                    { status: 409 }
                );
            }
            throw wordError;
        }

        // إضافة الترجمات إذا موجودة
        if (translations && Array.isArray(translations) && translations.length > 0) {
            const translationsToInsert = translations.map((t: {
                target_language: string;
                translation: string;
                pronunciation_url?: string;
                example_sentence?: string;
            }) => ({
                word_bank_id: wordData.id,
                target_language: t.target_language,
                translation: t.translation,
                pronunciation_url: t.pronunciation_url,
                example_sentence: t.example_sentence,
            }));

            const { error: transError } = await supabase
                .from('word_bank_translations')
                .insert(translationsToInsert);

            if (transError) {
                console.error('Error adding translations:', transError);
            }
        }

        // جلب الكلمة مع الترجمات
        const { data: fullWord } = await supabase
            .from('word_bank')
            .select(`
                *,
                translations:word_bank_translations(*)
            `)
            .eq('id', wordData.id)
            .single();

        return NextResponse.json({ success: true, word: fullWord });
    } catch (error) {
        console.error('Error creating word in bank:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create word' },
            { status: 500 }
        );
    }
}
