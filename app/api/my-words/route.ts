import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

// GET - Fetch user's saved words
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const search = searchParams.get("search") || "";
        const favoritesOnly = searchParams.get("favorites") === "true";

        const offset = (page - 1) * limit;

        let query = supabase
            .from("my_words")
            .select(`
                *,
                dictionary (
                    concept_id,
                    word_family_root,
                    definition,
                    part_of_speech,
                    domains,
                    lexical_entries,
                    relations
                )
            `, { count: "exact" })
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

        if (favoritesOnly) {
            query = query.eq("is_favorite", true);
        }

        query = query.range(offset, offset + limit - 1);

        const { data, error, count } = await query;

        if (error) {
            console.error("My words fetch error:", error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        // Filter by search if provided (client-side for now)
        let filteredData = data;
        if (search && data) {
            const searchLower = search.toLowerCase();
            filteredData = data.filter((item) => {
                const dict = item.dictionary as Record<string, unknown>;
                const wordRoot = (dict?.word_family_root as string) || "";
                const definition = (dict?.definition as string) || "";
                return wordRoot.toLowerCase().includes(searchLower) ||
                    definition.toLowerCase().includes(searchLower);
            });
        }

        return NextResponse.json({
            success: true,
            words: filteredData,
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit),
            },
        });
    } catch (error) {
        console.error("My words API error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

// POST - Save a word to user's collection
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { concept_id, notes, is_favorite } = body;

        if (!concept_id) {
            return NextResponse.json({ success: false, error: "concept_id is required" }, { status: 400 });
        }

        // Check if already saved
        const { data: existing } = await supabase
            .from("my_words")
            .select("id")
            .eq("user_id", user.id)
            .eq("concept_id", concept_id)
            .single();

        if (existing) {
            return NextResponse.json({ success: false, error: "Word already saved", alreadySaved: true }, { status: 409 });
        }

        const { data, error } = await supabase
            .from("my_words")
            .insert({
                user_id: user.id,
                concept_id,
                notes: notes || null,
                is_favorite: is_favorite || false,
            })
            .select()
            .single();

        if (error) {
            console.error("Save word error:", error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, word: data });
    } catch (error) {
        console.error("My words POST error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

// PATCH - Update a saved word (notes, favorite status)
export async function PATCH(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { id, concept_id, notes, is_favorite } = body;

        // Can update by id or concept_id
        const identifier = id || concept_id;
        const identifierField = id ? "id" : "concept_id";

        if (!identifier) {
            return NextResponse.json({ success: false, error: "id or concept_id required" }, { status: 400 });
        }

        const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (notes !== undefined) updateData.notes = notes;
        if (is_favorite !== undefined) updateData.is_favorite = is_favorite;

        const { data, error } = await supabase
            .from("my_words")
            .update(updateData)
            .eq("user_id", user.id)
            .eq(identifierField, identifier)
            .select()
            .single();

        if (error) {
            console.error("Update word error:", error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, word: data });
    } catch (error) {
        console.error("My words PATCH error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

// DELETE - Remove a word from user's collection
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");
        const conceptId = searchParams.get("concept_id");

        const identifier = id || conceptId;
        const identifierField = id ? "id" : "concept_id";

        if (!identifier) {
            return NextResponse.json({ success: false, error: "id or concept_id required" }, { status: 400 });
        }

        const { error } = await supabase
            .from("my_words")
            .delete()
            .eq("user_id", user.id)
            .eq(identifierField, identifier);

        if (error) {
            console.error("Delete word error:", error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("My words DELETE error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
