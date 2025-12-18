import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';
import { UAParser } from 'ua-parser-js';

// Helper function to track device
async function trackUserDevice(supabase: any, userId: string, request: Request) {
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

        // Call the upsert function
        await supabase.rpc('upsert_user_device', {
            p_user_id: userId,
            p_device_type: deviceType,
            p_os_name: result.os.name || null,
            p_os_version: result.os.version || null,
            p_browser: result.browser.name || null,
            p_browser_version: result.browser.version || null,
            p_ip_address: ipAddress,
            p_user_agent: userAgent,
            p_country: null,
            p_city: null,
        });
    } catch (error) {
        console.error('Failed to track device:', error);
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
        const { error, data } = await supabase.auth.exchangeCodeForSession(code);

        if (!error && data?.user) {
            // ✅ شبكة أمان: تأكد من وجود Profile للمستخدم
            const { data: profile } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', data.user.id)
                .single();

            if (!profile) {
                // إذا لم يوجد ملف شخصي، قم بإنشائه الآن
                await supabase.from('profiles').insert({
                    id: data.user.id,
                    email: data.user.email,
                    name: data.user.user_metadata.full_name || data.user.user_metadata.name || 'مستخدم جديد',
                    avatar_url: data.user.user_metadata.avatar_url || data.user.user_metadata.picture,
                    role: 'student', // دور افتراضي
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                });
            }

            // 📱 تتبع الجهاز
            await trackUserDevice(supabase, data.user.id, request);

            // الجلسة محفوظة الآن! يمكننا تحويل المستخدم
            return NextResponse.redirect(`${origin}${next}`);
        }
    }

    // في حال حدوث خطأ، أعد المستخدم لصفحة تسجيل الدخول مع رسالة خطأ
    return NextResponse.redirect(`${origin}/login?error=auth_code_error`);
}

