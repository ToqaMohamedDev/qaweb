'use server';

/**
 * Track Device Server Action
 * 
 * Server-side action for device tracking
 */

import { headers } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '../database.types';

// ==========================================
// Types
// ==========================================

interface TrackDeviceParams {
    userId?: string;
    visitorId?: string;
    deviceType: string;
    osName: string;
    osVersion: string;
    browser: string;
    browserVersion: string;
    userAgent: string;
    pageUrl?: string;
    referrer?: string;
}

interface TrackDeviceResult {
    success: boolean;
    deviceId?: string;
    error?: string;
}

// ==========================================
// Helper: Create Server Client
// ==========================================

async function createSupabaseServerClient() {
    const cookieStore = await cookies();

    return createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // Ignore in server action
                    }
                },
            },
        }
    );
}

// ==========================================
// Helper: Get IP Address (Enhanced for Vercel/Cloudflare)
// ==========================================

async function getIpAddress(): Promise<string> {
    const headersList = await headers();

    // Priority order for IP detection:
    // 1. Vercel-specific header (most reliable on Vercel)
    const vercelForwardedFor = headersList.get('x-vercel-forwarded-for');
    if (vercelForwardedFor) {
        return vercelForwardedFor.split(',')[0].trim();
    }

    // 2. Cloudflare connecting IP (most reliable on Cloudflare)
    const cfConnectingIp = headersList.get('cf-connecting-ip');
    if (cfConnectingIp) {
        return cfConnectingIp.trim();
    }

    // 3. True-Client-IP (used by some CDNs like Akamai)
    const trueClientIp = headersList.get('true-client-ip');
    if (trueClientIp) {
        return trueClientIp.trim();
    }

    // 4. X-Real-IP (nginx/some proxies)
    const realIp = headersList.get('x-real-ip');
    if (realIp) {
        return realIp.trim();
    }

    // 5. X-Forwarded-For (standard proxy header - get the first/original IP)
    const forwardedFor = headersList.get('x-forwarded-for');
    if (forwardedFor) {
        // Get the first IP (original client IP)
        const ips = forwardedFor.split(',');
        const clientIp = ips[0].trim();
        
        // Validate it's not a private IP (sometimes proxies add local IPs)
        if (!isPrivateIP(clientIp)) {
            return clientIp;
        }
        // If first is private, try to find a public IP in the chain
        for (const ip of ips) {
            const trimmedIp = ip.trim();
            if (!isPrivateIP(trimmedIp)) {
                return trimmedIp;
            }
        }
        // Return first IP if all are private (local network)
        return clientIp;
    }

    // 6. X-Client-IP (some load balancers)
    const clientIp = headersList.get('x-client-ip');
    if (clientIp) {
        return clientIp.trim();
    }

    return '';
}

/**
 * Check if an IP address is private/local
 */
function isPrivateIP(ip: string): boolean {
    // IPv4 private ranges
    const privateRanges = [
        /^10\./,                    // 10.0.0.0 - 10.255.255.255
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0 - 172.31.255.255
        /^192\.168\./,              // 192.168.0.0 - 192.168.255.255
        /^127\./,                   // 127.0.0.0 - 127.255.255.255 (localhost)
        /^169\.254\./,              // 169.254.0.0 - 169.254.255.255 (link-local)
        /^::1$/,                    // IPv6 localhost
        /^fc00:/i,                  // IPv6 unique local
        /^fe80:/i,                  // IPv6 link-local
    ];
    
    return privateRanges.some(range => range.test(ip));
}

// ==========================================
// Track User Device
// ==========================================

export async function trackUserDeviceAction(params: TrackDeviceParams): Promise<TrackDeviceResult> {
    try {
        if (!params.userId) {
            return { success: false, error: 'User ID is required' };
        }

        const supabase = await createSupabaseServerClient();
        const ipAddress = await getIpAddress();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase.rpc as any)('upsert_user_device', {
            p_user_id: params.userId,
            p_device_type: params.deviceType,
            p_os_name: params.osName,
            p_os_version: params.osVersion,
            p_browser: params.browser,
            p_browser_version: params.browserVersion,
            p_ip_address: ipAddress,
            p_user_agent: params.userAgent,
            p_country: null,
            p_city: null,
        });

        if (error) {
            console.error('Error tracking user device:', error);
            return { success: false, error: error.message };
        }

        return { success: true, deviceId: data };
    } catch (error) {
        console.error('Error in trackUserDeviceAction:', error);
        return { success: false, error: 'Internal server error' };
    }
}

// ==========================================
// Track Visitor Device
// ==========================================

export async function trackVisitorDeviceAction(params: TrackDeviceParams): Promise<TrackDeviceResult> {
    try {
        if (!params.visitorId) {
            return { success: false, error: 'Visitor ID is required' };
        }

        const supabase = await createSupabaseServerClient();
        const ipAddress = await getIpAddress();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase.rpc as any)('upsert_visitor_device', {
            p_visitor_id: params.visitorId,
            p_device_type: params.deviceType,
            p_os_name: params.osName,
            p_os_version: params.osVersion,
            p_browser: params.browser,
            p_browser_version: params.browserVersion,
            p_ip_address: ipAddress,
            p_user_agent: params.userAgent,
            p_page_url: params.pageUrl || '',
            p_referrer: params.referrer || '',
            p_country: '',
            p_city: '',
        });

        if (error) {
            console.error('Error tracking visitor device:', error);
            return { success: false, error: error.message };
        }

        return { success: true, deviceId: data };
    } catch (error) {
        console.error('Error in trackVisitorDeviceAction:', error);
        return { success: false, error: 'Internal server error' };
    }
}

// ==========================================
// Track Device (Auto-detect user or visitor)
// ==========================================

export async function trackDeviceAction(params: TrackDeviceParams): Promise<TrackDeviceResult> {
    if (params.userId) {
        return trackUserDeviceAction(params);
    } else if (params.visitorId) {
        return trackVisitorDeviceAction(params);
    } else {
        return { success: false, error: 'Either userId or visitorId is required' };
    }
}

// ==========================================
// Get All User Devices (Admin)
// ==========================================

interface GetAllDevicesParams {
    limit?: number;
    offset?: number;
}

interface GetAllDevicesResult {
    success: boolean;
    devices?: unknown[];
    total?: number;
    error?: string;
}

export async function getAllDevices(params: GetAllDevicesParams = {}): Promise<GetAllDevicesResult> {
    try {
        const { limit = 20, offset = 0 } = params;
        const supabase = await createSupabaseServerClient();

        // Get total count
        const { count, error: countError } = await supabase
            .from('user_devices')
            .select('*', { count: 'exact', head: true });

        if (countError) {
            console.error('Error counting devices:', countError);
            return { success: false, error: countError.message };
        }

        // Get devices with user profile info
        const { data, error } = await supabase
            .from('user_devices')
            .select(`
                *,
                profiles:user_id (
                    id,
                    name,
                    email,
                    avatar_url,
                    role
                )
            `)
            .order('last_seen_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Error fetching devices:', error);
            return { success: false, error: error.message };
        }

        return { success: true, devices: data || [], total: count || 0 };
    } catch (error) {
        console.error('Error in getAllDevices:', error);
        return { success: false, error: 'Internal server error' };
    }
}

// ==========================================
// Delete User Device (Admin)
// ==========================================

interface DeleteDeviceResult {
    success: boolean;
    error?: string;
}

export async function deleteDevice(deviceId: string): Promise<DeleteDeviceResult> {
    try {
        const supabase = await createSupabaseServerClient();

        const { error } = await supabase
            .from('user_devices')
            .delete()
            .eq('id', deviceId);

        if (error) {
            console.error('Error deleting device:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error) {
        console.error('Error in deleteDevice:', error);
        return { success: false, error: 'Internal server error' };
    }
}
