import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// GET - جلب كلمات المستخدم
export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        
        // التحقق من المستخدم
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json(
                { error: 'يجب تسجيل الدخول أولاً' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const favoritesOnly = searchParams.get('favorites') === 'true';
        const offset = (page - 1) * limit;

        let query = supabase
            .from('my_words' as any)
            .select(`
                *,
                dictionary:concept_id (
                    concept_id,
                    word_family_root,
                    definition,
                    part_of_speech,
                    lexical_entries,
                    domains,
                    relations
                )
            `, { count: 'exact' })
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (favoritesOnly) {
            query = query.eq('is_favorite', true);
        }

        query = query.range(offset, offset + limit - 1);

        const { data, error, count } = await query;

        if (error) {
            console.error('My words fetch error:', error);
            return NextResponse.json(
                { error: 'فشل في جلب الكلمات' },
                { status: 500 }
            );
        }

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
        console.error('My words API error:', error);
        return NextResponse.json(
            { error: 'حدث خطأ في الخادم' },
            { status: 500 }
        );
    }
}

// POST - إضافة كلمة جديدة
export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        
        // التحقق من المستخدم
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json(
                { error: 'يجب تسجيل الدخول أولاً' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { concept_id, notes } = body;

        if (!concept_id) {
            return NextResponse.json(
                { error: 'concept_id مطلوب' },
                { status: 400 }
            );
        }

        // التحقق من وجود الكلمة في القاموس
        const { data: dictEntry, error: dictError } = await supabase
            .from('dictionary' as any)
            .select('concept_id')
            .eq('concept_id', concept_id)
            .single();

        if (dictError || !dictEntry) {
            return NextResponse.json(
                { error: 'الكلمة غير موجودة في القاموس' },
                { status: 404 }
            );
        }

        // إضافة الكلمة
        const { data, error } = await supabase
            .from('my_words' as any)
            .upsert({
                user_id: user.id,
                concept_id,
                notes: notes || null,
                is_favorite: false
            }, {
                onConflict: 'user_id,concept_id'
            })
            .select()
            .single();

        if (error) {
            console.error('Add word error:', error);
            return NextResponse.json(
                { error: 'فشل في إضافة الكلمة' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data
        });

    } catch (error) {
        console.error('My words POST error:', error);
        return NextResponse.json(
            { error: 'حدث خطأ في الخادم' },
            { status: 500 }
        );
    }
}

// DELETE - حذف كلمة
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        
        // التحقق من المستخدم
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json(
                { error: 'يجب تسجيل الدخول أولاً' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const conceptId = searchParams.get('concept_id');

        if (!id && !conceptId) {
            return NextResponse.json(
                { error: 'id أو concept_id مطلوب' },
                { status: 400 }
            );
        }

        let deleteQuery = supabase
            .from('my_words' as any)
            .delete()
            .eq('user_id', user.id);

        if (id) {
            deleteQuery = deleteQuery.eq('id', id);
        } else if (conceptId) {
            deleteQuery = deleteQuery.eq('concept_id', conceptId);
        }

        const { error } = await deleteQuery;

        if (error) {
            console.error('Delete word error:', error);
            return NextResponse.json(
                { error: 'فشل في حذف الكلمة' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true
        });

    } catch (error) {
        console.error('My words DELETE error:', error);
        return NextResponse.json(
            { error: 'حدث خطأ في الخادم' },
            { status: 500 }
        );
    }
}

// PATCH - تحديث كلمة (المفضلة/الملاحظات)
export async function PATCH(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        
        // التحقق من المستخدم
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json(
                { error: 'يجب تسجيل الدخول أولاً' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { id, is_favorite, notes } = body;

        if (!id) {
            return NextResponse.json(
                { error: 'id مطلوب' },
                { status: 400 }
            );
        }

        const updates: Record<string, any> = { updated_at: new Date().toISOString() };
        if (typeof is_favorite === 'boolean') updates.is_favorite = is_favorite;
        if (notes !== undefined) updates.notes = notes;

        const { data, error } = await supabase
            .from('my_words' as any)
            .update(updates)
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single();

        if (error) {
            console.error('Update word error:', error);
            return NextResponse.json(
                { error: 'فشل في تحديث الكلمة' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data
        });

    } catch (error) {
        console.error('My words PATCH error:', error);
        return NextResponse.json(
            { error: 'حدث خطأ في الخادم' },
            { status: 500 }
        );
    }
}
