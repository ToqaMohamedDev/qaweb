import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';
import { UAParser } from 'ua-parser-js';
import { logger } from '@/lib/utils/logger';

// Helper function to track device
async function trackUserDevice(supabase: any, userId: string, request: Request) {
    console.log('[AuthCallback] trackUserDevice called for user:', userId);
    try {
        const headersList = await headers();
        const userAgent = headersList.get('user-agent') || '';

        // Parse device info (ua-parser-js v2.x API)
        const parser = new UAParser(userAgent);
        const result = parser.getResult();

        // Determine device type
        let deviceType = 'unknown';
        const deviceTypeRaw = result.device.type?.toLowerCase();
        if (deviceTypeRaw === 'mobile') deviceType = 'mobile';
        else if (deviceTypeRaw === 'tablet') deviceType = 'tablet';
        else deviceType = 'desktop';

        // Get IP address
        const forwardedFor = headersList.get('x-forwarded-for');
        const ipAddress = forwardedFor?.split(',')[0].trim() ||
            headersList.get('x-real-ip') ||
            headersList.get('cf-connecting-ip') ||
            '0.0.0.0';

        console.log('[AuthCallback] Device info:', { deviceType, os: result.os.name, browser: result.browser.name, ip: ipAddress });

        // Prepare RPC params
        const rpcParams = {
            p_user_id: userId,
            p_device_type: deviceType,
            p_os_name: result.os.name || '',
            p_os_version: result.os.version || '',
            p_browser: result.browser.name || '',
            p_browser_version: result.browser.version || '',
            p_ip_address: ipAddress,
            p_user_agent: userAgent,
            p_country: null,
            p_city: null,
        };
        console.log('[AuthCallback] RPC params:', JSON.stringify(rpcParams));

        // Call the upsert function
        const { data, error } = await supabase.rpc('upsert_user_device', rpcParams);

        if (error) {
            console.log('[AuthCallback] RPC ERROR:', JSON.stringify(error));
            logger.error('Failed to track device - RPC error', { context: 'AuthCallback', data: error });
        } else {
            console.log('[AuthCallback] RPC SUCCESS! Device ID:', data);
        }
    } catch (error) {
        console.log('[AuthCallback] EXCEPTION:', error);
        logger.error('Failed to track device', { context: 'AuthCallback', data: error });
        // Don't fail the login if device tracking fails
    }
}

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    // إذا كان هناك معلم "next" للتوجيه، استخدمه، وإلا اذهب للصفحة الرئيسية
    const next = searchParams.get('next') ?? '/';

    if (code) {
        const cookieStore = await cookies();

        // إنشاء Server Client يمكنه التعامل مع Cookies
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        cookieStore.set({ name, value, ...options });
                    },
                    remove(name: string, options: CookieOptions) {
                        cookieStore.delete({ name, ...options });
                    },
                },
            }
        );

        // تبادل الكود بالجلسة
        console.log('[AuthCallback] Exchanging code for session...');
        const { error, data } = await supabase.auth.exchangeCodeForSession(code);
        console.log('[AuthCallback] Exchange result:', {
            hasError: !!error,
            hasUser: !!data?.user,
            userId: data?.user?.id,
            sessionExpiry: data?.session?.expires_at
        });
        if (error) {
            console.error('[AuthCallback] Exchange error:', error.message);
        }

        if (!error && data?.user) {
            // Create an admin client to fetch profile securely, bypassing RLS
            // We use the direct supabase-js client here for admin privileges
            const { createClient: createAdminClient } = require('@supabase/supabase-js');
            const supabaseAdmin = createAdminClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!,
                {
                    auth: {
                        autoRefreshToken: false,
                        persistSession: false
                    }
                }
            );

            // ✅ Check profile using Admin client
            const { data: profile } = await supabaseAdmin
                .from('profiles')
                .select('id, role_selected')
                .eq('id', data.user.id)
                .single();

            let isNewUser = false;

            if (!profile) {
                // إذا لم يوجد ملف شخصي، قم بإنشائه الآن (مستخدم جديد بجوجل)
                isNewUser = true;
                await supabase.from('profiles').insert({
                    id: data.user.id,
                    email: data.user.email,
                    name: data.user.user_metadata.full_name || data.user.user_metadata.name || 'مستخدم جديد',
                    avatar_url: data.user.user_metadata.avatar_url || data.user.user_metadata.picture,
                    role: 'student', // دور مؤقت سيتم تغييره في onboarding
                    role_selected: false, // لم يختر الدور بعد
                    is_teacher_approved: false,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                });
            } else if (!profile.role_selected) {
                // المستخدم موجود لكن لم يختر دوره بعد
                isNewUser = true;
            }

            // 📱 تتبع الجهاز
            await trackUserDevice(supabase, data.user.id, request);

            // توجيه المستخدمين الجدد لصفحة اختيار الدور
            if (isNewUser) {
                return NextResponse.redirect(`${origin}/onboarding`);
            }

            // الجلسة محفوظة الآن! يمكننا تحويل المستخدم
            return NextResponse.redirect(`${origin}${next}`);
        }
    }

    // في حال حدوث خطأ، أعد المستخدم لصفحة تسجيل الدخول مع رسالة خطأ
    return NextResponse.redirect(`${origin}/login?error=auth_code_error`);
}

