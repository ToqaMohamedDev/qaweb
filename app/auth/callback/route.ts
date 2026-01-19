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

        // Call the upsert function
        const { data, error } = await supabase.rpc('upsert_user_device', rpcParams);

        if (error) {
            console.log('[AuthCallback] RPC ERROR:', JSON.stringify(error));
        } else {
            console.log('[AuthCallback] RPC SUCCESS! Device ID:', data);
        }
    } catch (error) {
        console.log('[AuthCallback] EXCEPTION:', error);
        // Don't fail the login if device tracking fails
    }
}

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const next = requestUrl.searchParams.get('next') ?? '/';
    const origin = requestUrl.origin;

    if (code) {
        const cookieStore = await cookies();

        // Track cookies that need to be set
        const cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }> = [];

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        // Store cookies to set them on the response later
                        cookiesToSet.push({ name, value, options });
                        // Also set in cookieStore for immediate use
                        try {
                            cookieStore.set({ name, value, ...options });
                        } catch (e) {
                            // Ignore errors during headers already sent
                        }
                    },
                    remove(name: string, options: CookieOptions) {
                        cookiesToSet.push({ name, value: '', options: { ...options, maxAge: 0 } });
                        try {
                            cookieStore.delete({ name, ...options });
                        } catch (e) {
                            // Ignore errors
                        }
                    },
                },
            }
        );

        console.log('[AuthCallback] Exchanging code for session...');
        const { error, data } = await supabase.auth.exchangeCodeForSession(code);

        console.log('[AuthCallback] Exchange result:', {
            hasError: !!error,
            hasUser: !!data?.user,
            userId: data?.user?.id,
            cookiesToSet: cookiesToSet.length
        });

        if (error) {
            console.error('[AuthCallback] Exchange error:', error.message);
            return NextResponse.redirect(`${origin}/login?error=auth_code_error`);
        }

        if (data?.user) {
            let redirectTo = `${origin}${next}`;

            // Check if new user needs onboarding
            try {
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

                const { data: profile } = await supabaseAdmin
                    .from('profiles')
                    .select('id, role_selected')
                    .eq('id', data.user.id)
                    .single();

                if (!profile) {
                    // Create profile for new user
                    await supabaseAdmin.from('profiles').insert({
                        id: data.user.id,
                        email: data.user.email,
                        name: data.user.user_metadata.full_name || data.user.user_metadata.name || 'مستخدم جديد',
                        avatar_url: data.user.user_metadata.avatar_url || data.user.user_metadata.picture,
                        role: 'student',
                        role_selected: false,
                        is_teacher_approved: false,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    });
                    redirectTo = `${origin}/onboarding`;
                } else if (!profile.role_selected) {
                    redirectTo = `${origin}/onboarding`;
                }

                // Track device
                await trackUserDevice(supabase, data.user.id, request);
            } catch (profileError) {
                console.error('[AuthCallback] Profile error:', profileError);
            }

            // Create redirect response and manually set cookies
            const response = NextResponse.redirect(redirectTo);

            // CRITICAL: Set all auth cookies on the response
            for (const cookie of cookiesToSet) {
                response.cookies.set(cookie.name, cookie.value, {
                    path: cookie.options.path || '/',
                    maxAge: cookie.options.maxAge,
                    domain: cookie.options.domain,
                    secure: cookie.options.secure ?? process.env.NODE_ENV === 'production',
                    httpOnly: cookie.options.httpOnly ?? false,
                    sameSite: (cookie.options.sameSite as 'lax' | 'strict' | 'none') || 'lax',
                });
            }

            console.log('[AuthCallback] Redirecting to:', redirectTo, 'with', cookiesToSet.length, 'cookies');
            return response;
        }
    }

    return NextResponse.redirect(`${origin}/login?error=auth_code_error`);
}
