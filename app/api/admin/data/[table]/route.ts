import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ table: string }> }
) {
    try {
        const resolvedParams = await params;
        const table = resolvedParams.table;
        const { searchParams } = new URL(request.url);
        const select = searchParams.get('select') || '*';
        const limit = parseInt(searchParams.get('limit') || '50');
        const orderBy = searchParams.get('orderBy') || 'created_at';
        const ascending = searchParams.get('ascending') === 'true';

        const cookieStore = await cookies();

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll() { },
                },
            }
        );

        // Verify user is admin
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Allowed tables for admin
        const allowedTables = [
            'profiles', 'educational_stages', 'subjects', 'lessons',
            'comprehensive_exams', 'lesson_questions', 'user_progress',
            'notifications', 'support_chats', 'chat_messages', 'devices'
        ];

        if (!allowedTables.includes(table)) {
            return NextResponse.json({ error: 'Table not allowed' }, { status: 400 });
        }

        // Fetch data
        const query = supabase
            .from(table)
            .select(select, { count: 'exact' })
            .order(orderBy, { ascending })
            .limit(limit);

        const { data, error, count } = await query;

        if (error) {
            console.error(`[API] Admin Data Error (${table}):`, error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data, count });
    } catch (error) {
        console.error('[API] Admin Data Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
