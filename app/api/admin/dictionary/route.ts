import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - handled by /api/dictionary

// POST - Create new word
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        
        // Check admin auth
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // Check admin role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { definition, word_family_root, lexical_entries } = body;

        // Generate concept_id from first lemma
        const firstLemma = Object.values(lexical_entries || {})[0] as { lemma?: string } | undefined;
        const concept_id = body.concept_id || `${firstLemma?.lemma || 'word'}_${Date.now()}`;

        const { data, error } = await supabase
            .from('dictionary')
            .insert({
                concept_id,
                definition,
                word_family_root,
                lexical_entries
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, word: data });
    } catch (error: any) {
        console.error('Error creating word:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// PUT - Update word
export async function PUT(request: NextRequest) {
    try {
        const supabase = await createClient();
        
        // Check admin auth
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // Check admin role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { concept_id, definition, word_family_root, lexical_entries } = body;

        if (!concept_id) {
            return NextResponse.json({ success: false, error: 'concept_id is required' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('dictionary')
            .update({
                definition,
                word_family_root,
                lexical_entries
            })
            .eq('concept_id', concept_id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, word: data });
    } catch (error: any) {
        console.error('Error updating word:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// DELETE - Delete word
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient();
        
        // Check admin auth
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // Check admin role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const concept_id = searchParams.get('concept_id');

        if (!concept_id) {
            return NextResponse.json({ success: false, error: 'concept_id is required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('dictionary')
            .delete()
            .eq('concept_id', concept_id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting word:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
