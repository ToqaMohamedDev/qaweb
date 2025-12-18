'use server';

import { headers } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { UAParser } from 'ua-parser-js';

type DeviceType = 'mobile' | 'desktop' | 'tablet' | 'unknown';

/**
 * Get Supabase client for server actions (with anon key for visitors)
 */
async function getSupabaseClient() {
    const cookieStore = await cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
                set(name: string, value: string, options: any) {
                    try {
                        cookieStore.set({ name, value, ...options });
                    } catch {
                        // Ignore cookie errors in read-only contexts
                    }
                },
                remove(name: string, options: any) {
                    try {
                        cookieStore.delete({ name, ...options });
                    } catch {
                        // Ignore cookie errors in read-only contexts
                    }
                },
            },
        }
    );
}

/**
 * Parse device information from User-Agent string
 */
function parseDeviceInfo(userAgent: string) {
    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    let deviceType: DeviceType = 'unknown';
    const deviceTypeRaw = result.device.type?.toLowerCase();

    if (deviceTypeRaw === 'mobile') {
        deviceType = 'mobile';
    } else if (deviceTypeRaw === 'tablet') {
        deviceType = 'tablet';
    } else if (!deviceTypeRaw || deviceTypeRaw === 'desktop') {
        if (result.os.name && !['iOS', 'Android'].includes(result.os.name)) {
            deviceType = 'desktop';
        } else if (result.os.name === 'Android' || result.os.name === 'iOS') {
            deviceType = 'mobile';
        } else {
            deviceType = 'desktop';
        }
    }

    return {
        deviceType,
        osName: result.os.name || null,
        osVersion: result.os.version || null,
        browser: result.browser.name || null,
        browserVersion: result.browser.version || null,
    };
}

/**
 * Get IP address from headers
 */
function getIPAddress(headersList: Headers): string | null {
    const forwardedFor = headersList.get('x-forwarded-for');
    if (forwardedFor) {
        return forwardedFor.split(',')[0].trim();
    }
    return headersList.get('x-real-ip') ||
        headersList.get('cf-connecting-ip') ||
        '0.0.0.0';
}

/**
 * Track anonymous visitor device
 */
export async function trackVisitor(visitorId: string, pageUrl?: string, referrer?: string) {
    try {
        const supabase = await getSupabaseClient();
        const headersList = await headers();
        const userAgent = headersList.get('user-agent') || '';
        const ipAddress = getIPAddress(headersList);
        const deviceInfo = parseDeviceInfo(userAgent);

        const { data, error } = await supabase.rpc('upsert_visitor_device', {
            p_visitor_id: visitorId,
            p_device_type: deviceInfo.deviceType,
            p_os_name: deviceInfo.osName,
            p_os_version: deviceInfo.osVersion,
            p_browser: deviceInfo.browser,
            p_browser_version: deviceInfo.browserVersion,
            p_ip_address: ipAddress,
            p_user_agent: userAgent,
            p_page_url: pageUrl || null,
            p_referrer: referrer || null,
            p_country: null,
            p_city: null,
        });

        if (error) {
            console.error('Error tracking visitor:', error);
            return { success: false, error: error.message };
        }

        return { success: true, deviceId: data };
    } catch (error) {
        console.error('Track visitor error:', error);
        return { success: false, error: 'Failed to track visitor' };
    }
}

/**
 * Get all visitor devices (Admin only)
 */
export async function getAllVisitorDevices(options?: {
    limit?: number;
    offset?: number;
}) {
    try {
        const supabase = await getSupabaseClient();

        // Check if user is admin
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, devices: [], error: 'Not authenticated' };

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return { success: false, devices: [], error: 'Unauthorized' };
        }

        const { data, error, count } = await supabase
            .from('visitor_devices')
            .select('*', { count: 'exact' })
            .order('last_seen_at', { ascending: false })
            .range(
                options?.offset || 0,
                (options?.offset || 0) + (options?.limit || 50) - 1
            );

        if (error) {
            return { success: false, devices: [], error: error.message };
        }

        return { success: true, devices: data || [], total: count };
    } catch (error) {
        console.error('getAllVisitorDevices error:', error);
        return { success: false, devices: [], error: 'Failed to fetch visitor devices' };
    }
}

/**
 * Delete a visitor device record (Admin only)
 */
export async function deleteVisitorDevice(deviceId: string) {
    try {
        const supabase = await getSupabaseClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: 'Not authenticated' };

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return { success: false, error: 'Unauthorized' };
        }

        const { error } = await supabase
            .from('visitor_devices')
            .delete()
            .eq('id', deviceId);

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to delete visitor device' };
    }
}
