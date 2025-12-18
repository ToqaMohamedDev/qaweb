import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

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

            // الجلسة محفوظة الآن! يمكننا تحويل المستخدم
            return NextResponse.redirect(`${origin}${next}`);
        }
    }

    // في حال حدوث خطأ، أعد المستخدم لصفحة تسجيل الدخول مع رسالة خطأ
    return NextResponse.redirect(`${origin}/login?error=auth_code_error`);
}
