import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const { searchParams } = new URL(request.url);

        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const search = searchParams.get("search") || "";
        const language = searchParams.get("language") || "en";
        const partOfSpeech = searchParams.get("pos") || "";
        const conceptId = searchParams.get("concept_id") || "";

        const offset = (page - 1) * limit;

        // If requesting a specific word by concept_id
        if (conceptId) {
            const { data, error } = await supabase
                .from("dictionary" as any)
                .select("*")
                .eq("concept_id", conceptId)
                .single();

            if (error) {
                return NextResponse.json({ success: false, error: error.message }, { status: 404 });
            }

            return NextResponse.json({ success: true, word: data });
        }

        // Build base query
        let query = supabase.from("dictionary" as any).select("*", { count: "exact" });

        // Search filter
        if (search) {
            query = query.or(
                `word_family_root.ilike.%${search}%,definition.ilike.%${search}%`
            );
        }

        // Part of speech filter
        if (partOfSpeech) {
            query = query.eq("part_of_speech", partOfSpeech);
        }

        // Order and pagination
        query = query.order("word_family_root", { ascending: true });
        query = query.range(offset, offset + limit - 1);

        const { data, error, count } = await query;

        if (error) {
            console.error("Dictionary fetch error:", error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        // Transform data to include language-specific entries
        const transformedData = (data as any[])?.map((word) => {
            const lexicalEntries = word.lexical_entries as Record<string, unknown> || {};
            const langEntry = lexicalEntries[language] as Record<string, unknown> || {};

            return {
                ...word,
                lemma: (langEntry?.lemma as string) || word.word_family_root,
                pronunciations: langEntry?.pronunciations || [],
                examples: langEntry?.examples || [],
                inflections: langEntry?.inflections || [],
                gender: langEntry?.gender || null,
            };
        });

        return NextResponse.json({
            success: true,
            words: transformedData,
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit),
            },
        });
    } catch (error) {
        console.error("Dictionary API error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
