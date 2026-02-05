import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// Helper: استخدام service_role للعمليات الإدارية
async function adminFetch(endpoint: string, options: RequestInit = {}) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    return fetch(`${url}/rest/v1/${endpoint}`, {
        ...options,
        headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
            ...options.headers,
        },
    });
}

// GET - جلب ربط المواد بالمراحل
export async function GET(request: Request) {
    const supabase = await createServerClient();
    
    try {
        // التحقق من صلاحيات الأدمن
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

        // جلب البيانات باستخدام service_role
        const { searchParams } = new URL(request.url);
        const subjectId = searchParams.get('subject_id');

        let endpoint = 'subject_stages?order=order_index.asc';
        if (subjectId) {
            endpoint += `&subject_id=eq.${subjectId}`;
        }

        const response = await adminFetch(endpoint);
        const data = await response.json();

        if (!response.ok) {
            console.error('[Subject Stages API] Error:', data);
            return NextResponse.json({ error: data.message || 'Failed to fetch' }, { status: 500 });
        }

        return NextResponse.json({ data });
    } catch (error) {
        console.error('[Subject Stages API] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST - تحديث ربط مادة بالمراحل
export async function POST(request: Request) {
    const supabase = await createServerClient();
    
    try {
        // التحقق من صلاحيات الأدمن
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

        const body = await request.json();
        const { subjectId, stageIds } = body;

        if (!subjectId || !Array.isArray(stageIds)) {
            return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
        }

        // حذف الربط القديم باستخدام service_role
        const deleteResponse = await adminFetch(`subject_stages?subject_id=eq.${subjectId}`, {
            method: 'DELETE',
        });

        if (!deleteResponse.ok) {
            const deleteError = await deleteResponse.json();
            console.error('[Subject Stages API] Delete error:', deleteError);
            return NextResponse.json({ error: deleteError.message || 'Failed to delete' }, { status: 500 });
        }

        // إضافة الربط الجديد
        if (stageIds.length > 0) {
            const newRecords = stageIds.map((stageId: string, index: number) => ({
                subject_id: subjectId,
                stage_id: stageId,
                is_active: true,
                order_index: index
            }));

            const insertResponse = await adminFetch('subject_stages', {
                method: 'POST',
                body: JSON.stringify(newRecords),
            });

            if (!insertResponse.ok) {
                const insertError = await insertResponse.json();
                console.error('[Subject Stages API] Insert error:', insertError);
                return NextResponse.json({ error: insertError.message || 'Failed to insert' }, { status: 500 });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Subject Stages API] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
