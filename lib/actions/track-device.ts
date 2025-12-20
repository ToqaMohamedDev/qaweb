'use server';

import { headers } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { UAParser } from 'ua-parser-js';

// Device type mapping
type DeviceType = 'mobile' | 'desktop' | 'tablet' | 'unknown';

interface DeviceInfo {
    deviceType: DeviceType;
    osName: string | null;
    osVersion: string | null;
    browser: string | null;
    browserVersion: string | null;
    ipAddress: string | null;
    userAgent: string | null;
}

interface TrackDeviceResult {
    success: boolean;
    deviceId?: string;
    error?: string;
}

/**
 * Get Supabase client for server actions
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
                    cookieStore.set({ name, value, ...options });
                },
                remove(name: string, options: any) {
                    cookieStore.delete({ name, ...options });
                },
            },
        }
    );
}

/**
 * Parse device information from User-Agent string
 */
function parseDeviceInfo(userAgent: string): Omit<DeviceInfo, 'ipAddress' | 'userAgent'> {
    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    // Determine device type
    let deviceType: DeviceType = 'unknown';
    const deviceTypeRaw = result.device.type?.toLowerCase();

    if (deviceTypeRaw === 'mobile') {
        deviceType = 'mobile';
    } else if (deviceTypeRaw === 'tablet') {
        deviceType = 'tablet';
    } else if (!deviceTypeRaw || deviceTypeRaw === 'desktop') {
        // If no device type or explicitly desktop, check if it's likely a desktop
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
 * Extract IP address from request headers
 */
function getIPAddress(headersList: Headers): string | null {
    // Check various headers for IP address
    const forwardedFor = headersList.get('x-forwarded-for');
    if (forwardedFor) {
        // Get the first IP if multiple are present
        return forwardedFor.split(',')[0].trim();
    }

    const realIP = headersList.get('x-real-ip');
    if (realIP) {
        return realIP;
    }

    const cfConnectingIP = headersList.get('cf-connecting-ip');
    if (cfConnectingIP) {
        return cfConnectingIP;
    }

    // Fallback
    return headersList.get('x-client-ip') || '0.0.0.0';
}

/**
 * Track user device on login or page visit
 * This should be called after successful authentication
 */
export async function trackDevice(): Promise<TrackDeviceResult> {
    try {
        const supabase = await getSupabaseClient();

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: 'User not authenticated' };
        }

        // Get request headers
        const headersList = await headers();
        const userAgent = headersList.get('user-agent') || '';
        const ipAddress = getIPAddress(headersList);

        // Parse device info
        const deviceInfo = parseDeviceInfo(userAgent);

        // Fetch Geolocation Data
        let country = null;
        let city = null;

        if (ipAddress && ipAddress !== '0.0.0.0' && ipAddress !== '127.0.0.1' && ipAddress !== '::1') {
            try {
                const geoRes = await fetch(`http://ip-api.com/json/${ipAddress}`);
                if (geoRes.ok) {
                    const geoData = await geoRes.json();
                    if (geoData.status === 'success') {
                        country = geoData.country;
                        city = geoData.city;
                    }
                }
            } catch (e) {
                // Ignore geo fetch errors
            }
        }

        // Call the upsert function
        const { data, error } = await supabase.rpc('upsert_user_device', {
            p_user_id: user.id,
            p_device_type: deviceInfo.deviceType,
            p_os_name: deviceInfo.osName,
            p_os_version: deviceInfo.osVersion,
            p_browser: deviceInfo.browser,
            p_browser_version: deviceInfo.browserVersion,
            p_ip_address: ipAddress,
            p_user_agent: userAgent,
            p_country: country,
            p_city: city,
        });

        if (error) {
            console.error('Error tracking device:', error);
            return { success: false, error: error.message };
        }

        return { success: true, deviceId: data };
    } catch (error) {
        console.error('Track device error:', error);
        return { success: false, error: 'Failed to track device' };
    }
}

/**
 * Get all devices for a specific user
 */
export async function getUserDevices(userId?: string) {
    try {
        const supabase = await getSupabaseClient();

        // Get current user if userId not provided
        if (!userId) {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return { success: false, devices: [], error: 'Not authenticated' };
            userId = user.id;
        }

        const { data, error } = await supabase
            .from('user_devices')
            .select('*')
            .eq('user_id', userId)
            .order('last_seen_at', { ascending: false });

        if (error) {
            return { success: false, devices: [], error: error.message };
        }

        return { success: true, devices: data };
    } catch (error) {
        return { success: false, devices: [], error: 'Failed to fetch devices' };
    }
}

/**
 * Get all devices (Admin only)
 */
export async function getAllDevices(options?: {
    limit?: number;
    offset?: number;
    userId?: string;
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

        // First get devices
        let query = supabase
            .from('user_devices')
            .select('*', { count: 'exact' });

        if (options?.userId) {
            query = query.eq('user_id', options.userId);
        }

        query = query
            .order('last_seen_at', { ascending: false })
            .range(
                options?.offset || 0,
                (options?.offset || 0) + (options?.limit || 50) - 1
            );

        const { data: devices, error, count } = await query;

        if (error) {
            return { success: false, devices: [], error: error.message };
        }

        // Get user profiles for each unique user_id
        if (devices && devices.length > 0) {
            const userIds = [...new Set(devices.map(d => d.user_id))];
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, name, email, avatar_url, role')
                .in('id', userIds);

            // Map profiles to devices
            const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);
            const devicesWithProfiles = devices.map(device => ({
                ...device,
                profiles: profilesMap.get(device.user_id) || null
            }));

            return { success: true, devices: devicesWithProfiles, total: count };
        }

        return { success: true, devices: devices || [], total: count };
    } catch (error) {
        console.error('getAllDevices error:', error);
        return { success: false, devices: [], error: 'Failed to fetch devices' };
    }
}

/**
 * Delete a device record
 */
export async function deleteDevice(deviceId: string) {
    try {
        const supabase = await getSupabaseClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: 'Not authenticated' };

        // Delete (RLS will ensure user can only delete their own)
        const { error } = await supabase
            .from('user_devices')
            .delete()
            .eq('id', deviceId);

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to delete device' };
    }
}
