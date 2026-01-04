import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    console.log('🚀 Onboarding API called');

    try {
        const body = await request.json();
        console.log('📦 Request body:', body);

        const { role } = body;

        if (!role || !['student', 'teacher'].includes(role)) {
            console.log('❌ Invalid role:', role);
            return NextResponse.json(
                { error: 'Invalid role' },
                { status: 400 }
            );
        }

        const cookieStore = await cookies();

        // Client عادي للتحقق من المستخدم
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            cookieStore.set(name, value, options);
                        });
                    },
                },
            }
        );

        // جلب المستخدم الحالي
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        console.log('👤 User:', user?.id, user?.email);

        if (userError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const profileData = {
            id: user.id,
            email: user.email || '',
            name: user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'مستخدم',
            role: role,
            role_selected: true,
            is_teacher_approved: false,
            avatar_url: user.user_metadata?.avatar_url || null,
            updated_at: new Date().toISOString(),
        };

        console.log('📝 Profile data:', profileData);

        // استخدام REST API مباشرة مع service role key
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

        const response = await fetch(
            `${supabaseUrl}/rest/v1/profiles?on_conflict=id`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': serviceKey,
                    'Authorization': `Bearer ${serviceKey}`,
                    'Prefer': 'resolution=merge-duplicates',
                },
                body: JSON.stringify(profileData),
            }
        );

        console.log('📡 Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API error:', errorText);
            return NextResponse.json(
                { error: errorText },
                { status: response.status }
            );
        }

        console.log('✅ Profile saved successfully');
        return NextResponse.json({ success: true, role });

    } catch (error: any) {
        console.error('❌ Onboarding error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
