import { NextRequest, NextResponse } from 'next/server';

/**
 * API لحفظ profile المستخدم بعد التسجيل بالإيميل مباشرة
 * يستقبل البيانات من صفحة signup ويحفظها في جدول profiles
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, email, name, role, educationalStageId } = body;

        if (!userId || !email || !role) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

        if (!key || !url) {
            return NextResponse.json(
                { error: 'Configuration error' },
                { status: 500 }
            );
        }

        // حفظ البيانات في جدول profiles
        const response = await fetch(`${url}/rest/v1/profiles`, {
            method: 'POST',
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates,return=representation'
            },
            body: JSON.stringify({
                id: userId,
                email,
                name: name || email.split('@')[0],
                role,
                role_selected: true,
                is_teacher_approved: role === 'teacher' ? false : null,
                educational_stage_id: educationalStageId || null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Signup Profile API] Error:', errorText);
            return NextResponse.json(
                { error: 'Failed to create profile' },
                { status: response.status }
            );
        }

        const profileData = await response.json();
        console.log('[Signup Profile API] Profile created successfully:', profileData);

        return NextResponse.json({ 
            success: true,
            profile: profileData 
        });

    } catch (error) {
        console.error('[Signup Profile API] Exception:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}
