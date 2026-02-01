import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);

        // Query parameters
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const search = searchParams.get("search") || "";
        const language = searchParams.get("language") || "en"; // en, ar, fr, de
        const partOfSpeech = searchParams.get("pos") || "";
        const conceptId = searchParams.get("concept_id") || "";

        const offset = (page - 1) * limit;

        // If requesting a specific word by concept_id
        if (conceptId) {
            const { data, error } = await supabase
                .from("dictionary")
                .select("*")
                .eq("concept_id", conceptId)
                .single();

            if (error) {
                return NextResponse.json({ success: false, error: error.message }, { status: 404 });
            }

            return NextResponse.json({ success: true, word: data });
        }

        // Build base query
        let query = supabase.from("dictionary").select("*", { count: "exact" });

        // Search filter - search in word_family_root or definition
        if (search) {
            // Search in word_family_root, definition, or inside lexical_entries
            query = query.or(
                `word_family_root.ilike.%${search}%,definition.ilike.%${search}%`
            );
        }

        // Part of speech filter
        if (partOfSpeech) {
            query = query.eq("part_of_speech", partOfSpeech);
        }

        // Order by word_family_root alphabetically
        query = query.order("word_family_root", { ascending: true });

        // Pagination
        query = query.range(offset, offset + limit - 1);

        const { data, error, count } = await query;

        if (error) {
            console.error("Dictionary fetch error:", error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        // Transform data to include language-specific entries
        const transformedData = data?.map((word) => {
            const lexicalEntries = word.lexical_entries as Record<string, unknown> || {};
            const langEntry = lexicalEntries[language] as Record<string, unknown> || {};

            return {
                ...word,
                // Add language-specific lemma for easy access
                lemma: langEntry?.lemma || word.word_family_root,
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
