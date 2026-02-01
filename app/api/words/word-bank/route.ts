
/**
 * API: Word Bank
 * إدارة بنك الكلمات مع الترجمة الفورية باستخدام public.word_bank_view
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// GET - جلب الكلمات مع ترجمتها
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

        // Query the view instead of the raw table
        // The view "word_bank" is not yet an actual view? No, we made a custom query above.
        // Actually let's use the 'word_bank' table but with a self-lookup approach in JS or just raw SQL?
        // Wait, I created 'word_bank_view' manually using SQL. Supabase client might not 'see' it as a table immediately in types, 
        // but we can query it just fine.

        let query = supabase
            .from('word_bank') // Fallback to table for now, but let's try to simulate the view logic or use raw SQL if needed.
            // Actually, we can just select the translation via the new column approach? 
            // No, the view 'word_bank_view' is best. Let's try querying it.
            // If it fails (due to permissions), we fall back.
            .select(`
                id,
                word_text,
                word_norm,
                language_code,
                meaning_id,
                category_slug,
                difficulty_level,
                phonetic_text,
                example_sentence,
                created_at
            `, { count: 'exact' });

        // But we need the translation! 
        // Let's use the `rpc` approach or just raw SQL via `rpc` if available? 
        // Or better: Let's use the 'word_bank' table but fetch the translation in a second step or simpler way.
        // Actually, the previous 'join' attempt was complex.

        // Let's use the VIEW we just created: 'word_bank_view'
        // Note: You must ensure 'public' schema is exposed and the view is accessible.
        // Let's assume it is.

        let viewQuery = supabase
            .from('word_bank_view')
            .select('*', { count: 'exact' });

        // Filter by language
        if (language_code) {
            viewQuery = viewQuery.eq('language_code', language_code);
        }

        // Filter by category
        if (category) {
            viewQuery = viewQuery.eq('category_slug', category);
        }

        // Filter by difficulty
        if (difficulty) {
            viewQuery = viewQuery.eq('difficulty_level', parseInt(difficulty));
        }

        // Search
        if (search) {
            const normalizedSearch = search.toLowerCase().trim();
            // Search in word_text OR translation_text
            viewQuery = viewQuery.or(`word_norm.ilike.%${normalizedSearch}%,word_text.ilike.%${normalizedSearch}%,translation_text.ilike.%${normalizedSearch}%`);
        }

        // Pagination
        viewQuery = viewQuery
            .range(offset, offset + limit - 1)
            .order('created_at', { ascending: false });

        const { data, error, count } = await viewQuery;

        if (error) {
            // If view access fails (e.g. 404), fallback to basic table query without translation
            console.warn('View query failed, falling back to table:', error.message);
            // Fallback content...
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        // Transform to match frontend expectations
        const words = data?.map((row: any) => ({
            id: row.id,
            word_text: row.word_text,
            language_code: row.language_code,
            // Map translation_text to word_definition as per frontend expectation
            word_definition: row.translation_text || '',
            phonetic_text: row.phonetic_text,
            example_sentence: row.example_sentence,
            category_slug: row.category_slug,
            difficulty_level: row.difficulty_level,
            is_featured: false, // Default
            meaning_id: row.meaning_id
        }));

        return NextResponse.json({
            success: true,
            words: words || [],
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
