/**
 * Device Service
 * 
 * Handles device tracking (تتبع الأجهزة)
 */

import { createBrowserClient } from '../supabase';

// Helper to get client
const getSupabaseClient = () => createBrowserClient();
import type { UserDevice, VisitorDevice } from '../database.types';

// ==========================================
// Types
// ==========================================

export interface DeviceInfo {
    deviceType: string;
    osName: string;
    osVersion: string;
    browser: string;
    browserVersion: string;
    userAgent: string;
}

export interface TrackUserDeviceParams extends DeviceInfo {
    userId: string;
    ipAddress?: string;
    country?: string;
    city?: string;
}

export interface TrackVisitorDeviceParams extends DeviceInfo {
    visitorId: string;
    ipAddress?: string;
    pageUrl?: string;
    referrer?: string;
    country?: string;
    city?: string;
}

// ==========================================
// User Devices
// ==========================================

/**
 * Track user device login
 */
export async function trackUserDevice(params: TrackUserDeviceParams): Promise<string | null> {
    const supabase = getSupabaseClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('upsert_user_device', {
        p_user_id: params.userId,
        p_device_type: params.deviceType,
        p_os_name: params.osName,
        p_os_version: params.osVersion,
        p_browser: params.browser,
        p_browser_version: params.browserVersion,
        p_ip_address: params.ipAddress || '',
        p_user_agent: params.userAgent,
        p_country: params.country || null,
        p_city: params.city || null,
    });

    if (error) {
        console.error('Error tracking user device:', error);
        return null;
    }

    return data;
}

/**
 * Get user's devices
 */
export async function getUserDevices(userId: string): Promise<UserDevice[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('user_devices')
        .select('*')
        .eq('user_id', userId)
        .order('last_seen_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

/**
 * Get all user devices (admin)
 */
export async function getAllUserDevices(): Promise<UserDevice[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('user_devices')
        .select('*')
        .order('last_seen_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

/**
 * Delete a user device
 */
export async function deleteUserDevice(deviceId: string): Promise<void> {
    const supabase = getSupabaseClient();

    const { error } = await supabase
        .from('user_devices')
        .delete()
        .eq('id', deviceId);

    if (error) throw error;
}

/**
 * Delete all devices for a user except current
 */
export async function logoutOtherDevices(userId: string, currentDeviceId: string): Promise<void> {
    const supabase = getSupabaseClient();

    const { error } = await supabase
        .from('user_devices')
        .delete()
        .eq('user_id', userId)
        .neq('id', currentDeviceId);

    if (error) throw error;
}

// ==========================================
// Visitor Devices
// ==========================================

/**
 * Track visitor device
 */
export async function trackVisitorDevice(params: TrackVisitorDeviceParams): Promise<string | null> {
    const supabase = getSupabaseClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('upsert_visitor_device', {
        p_visitor_id: params.visitorId,
        p_device_type: params.deviceType,
        p_os_name: params.osName,
        p_os_version: params.osVersion,
        p_browser: params.browser,
        p_browser_version: params.browserVersion,
        p_ip_address: params.ipAddress || '',
        p_user_agent: params.userAgent,
        p_page_url: params.pageUrl || '',
        p_referrer: params.referrer || '',
        p_country: params.country || '',
        p_city: params.city || '',
    });

    if (error) {
        console.error('Error tracking visitor device:', error);
        return null;
    }

    return data;
}

/**
 * Get all visitor devices (admin)
 */
export async function getVisitorDevices(): Promise<VisitorDevice[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('visitor_devices')
        .select('*')
        .order('last_seen_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

/**
 * Delete a visitor device
 */
export async function deleteVisitorDevice(deviceId: string): Promise<void> {
    const supabase = getSupabaseClient();

    const { error } = await supabase
        .from('visitor_devices')
        .delete()
        .eq('id', deviceId);

    if (error) throw error;
}

/**
 * Delete all visitor devices
 */
export async function clearVisitorDevices(): Promise<void> {
    const supabase = getSupabaseClient();

    const { error } = await supabase
        .from('visitor_devices')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (error) throw error;
}

// ==========================================
// Device Stats (Admin)
// ==========================================

/**
 * Get device statistics
 */
export async function getDeviceStats(): Promise<{
    totalUserDevices: number;
    totalVisitorDevices: number;
    activeUsersToday: number;
    activeVisitorsToday: number;
}> {
    const supabase = getSupabaseClient();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    // Get user device counts
    const { count: totalUserDevices } = await supabase
        .from('user_devices')
        .select('*', { count: 'exact', head: true });

    const { count: activeUsersToday } = await supabase
        .from('user_devices')
        .select('*', { count: 'exact', head: true })
        .gte('last_seen_at', todayISO);

    // Get visitor device counts
    const { count: totalVisitorDevices } = await supabase
        .from('visitor_devices')
        .select('*', { count: 'exact', head: true });

    const { count: activeVisitorsToday } = await supabase
        .from('visitor_devices')
        .select('*', { count: 'exact', head: true })
        .gte('last_seen_at', todayISO);

    return {
        totalUserDevices: totalUserDevices || 0,
        totalVisitorDevices: totalVisitorDevices || 0,
        activeUsersToday: activeUsersToday || 0,
        activeVisitorsToday: activeVisitorsToday || 0,
    };
}

// ==========================================
// Helper: Detect Device Info
// ==========================================

/**
 * Detect device info from user agent
 * Call this on the client side
 * Enhanced version with better accuracy
 */
export function detectDeviceInfo(): DeviceInfo {
    if (typeof window === 'undefined') {
        return {
            deviceType: 'unknown',
            osName: '',
            osVersion: '',
            browser: '',
            browserVersion: '',
            userAgent: '',
        };
    }

    const ua = navigator.userAgent;

    // ==========================================
    // Enhanced Device Type Detection
    // ==========================================
    let deviceType: string = 'desktop';
    
    // Check for mobile first (more specific patterns)
    const mobilePatterns = [
        /iPhone/i,
        /iPod/i,
        /Android.*Mobile/i,
        /Mobile.*Android/i,
        /webOS/i,
        /BlackBerry/i,
        /Windows Phone/i,
        /Opera Mini/i,
        /IEMobile/i,
        /Mobile Safari/i,
    ];
    
    const tabletPatterns = [
        /iPad/i,
        /Android(?!.*Mobile)/i,  // Android without "Mobile"
        /Tablet/i,
        /Kindle/i,
        /Silk/i,
        /PlayBook/i,
    ];
    
    // Check tablet first (iPad, Android tablets, etc.)
    if (tabletPatterns.some(pattern => pattern.test(ua))) {
        deviceType = 'tablet';
    }
    // Then check mobile
    else if (mobilePatterns.some(pattern => pattern.test(ua))) {
        deviceType = 'mobile';
    }
    // Additional check using screen size for responsive detection
    else if (typeof window !== 'undefined' && window.innerWidth <= 768) {
        deviceType = window.innerWidth <= 480 ? 'mobile' : 'tablet';
    }

    // ==========================================
    // Enhanced OS Detection
    // ==========================================
    let osName = '';
    let osVersion = '';
    
    // Windows detection with version mapping
    const windowsMatch = ua.match(/Windows NT (\d+\.\d+)/);
    if (windowsMatch) {
        osName = 'Windows';
        const ntVersion = windowsMatch[1];
        // Map NT version to Windows version
        const windowsVersionMap: Record<string, string> = {
            '10.0': '10/11',
            '6.3': '8.1',
            '6.2': '8',
            '6.1': '7',
            '6.0': 'Vista',
            '5.1': 'XP',
        };
        osVersion = windowsVersionMap[ntVersion] || ntVersion;
    }
    // macOS detection
    else if (/Mac OS X/.test(ua)) {
        osName = 'macOS';
        const macMatch = ua.match(/Mac OS X (\d+[._]\d+[._]?\d*)/);
        if (macMatch) {
            osVersion = macMatch[1].replace(/_/g, '.');
        }
    }
    // iOS detection (iPhone/iPad/iPod)
    else if (/iPhone|iPad|iPod/.test(ua)) {
        osName = 'iOS';
        const iosMatch = ua.match(/OS (\d+_\d+_?\d*)/);
        if (iosMatch) {
            osVersion = iosMatch[1].replace(/_/g, '.');
        }
    }
    // Android detection
    else if (/Android/.test(ua)) {
        osName = 'Android';
        const androidMatch = ua.match(/Android (\d+\.?\d*\.?\d*)/);
        if (androidMatch) {
            osVersion = androidMatch[1];
        }
    }
    // Linux detection
    else if (/Linux/.test(ua)) {
        osName = 'Linux';
        if (/Ubuntu/.test(ua)) osName = 'Ubuntu';
        else if (/Fedora/.test(ua)) osName = 'Fedora';
        else if (/CrOS/.test(ua)) osName = 'Chrome OS';
    }

    // ==========================================
    // Enhanced Browser Detection
    // ==========================================
    let browser = '';
    let browserVersion = '';
    
    // Order matters! Check more specific browsers first
    
    // Samsung Browser
    const samsungMatch = ua.match(/SamsungBrowser\/(\d+\.?\d*)/);
    if (samsungMatch) {
        browser = 'Samsung Browser';
        browserVersion = samsungMatch[1];
    }
    // Edge (Chromium-based)
    else if (/Edg\//.test(ua)) {
        const edgeMatch = ua.match(/Edg\/(\d+\.?\d*\.?\d*)/);
        browser = 'Edge';
        browserVersion = edgeMatch ? edgeMatch[1] : '';
    }
    // Opera
    else if (/OPR\//.test(ua) || /Opera/.test(ua)) {
        const operaMatch = ua.match(/(?:OPR|Opera)[\/\s](\d+\.?\d*)/);
        browser = 'Opera';
        browserVersion = operaMatch ? operaMatch[1] : '';
    }
    // Brave (identifies as Chrome but has Brave in UA)
    else if (/Brave/.test(ua)) {
        const braveMatch = ua.match(/Brave\/(\d+\.?\d*)/) || ua.match(/Chrome\/(\d+\.?\d*)/);
        browser = 'Brave';
        browserVersion = braveMatch ? braveMatch[1] : '';
    }
    // Firefox
    else if (/Firefox/.test(ua)) {
        const firefoxMatch = ua.match(/Firefox\/(\d+\.?\d*)/);
        browser = 'Firefox';
        browserVersion = firefoxMatch ? firefoxMatch[1] : '';
    }
    // Safari (must check before Chrome because Chrome also has Safari in UA)
    else if (/Safari/.test(ua) && !/Chrome/.test(ua)) {
        browser = 'Safari';
        const versionMatch = ua.match(/Version\/(\d+\.?\d*\.?\d*)/);
        browserVersion = versionMatch ? versionMatch[1] : '';
    }
    // Chrome (check last because many browsers include Chrome in UA)
    else if (/Chrome/.test(ua)) {
        const chromeMatch = ua.match(/Chrome\/(\d+\.?\d*\.?\d*)/);
        browser = 'Chrome';
        browserVersion = chromeMatch ? chromeMatch[1] : '';
    }
    // Internet Explorer
    else if (/MSIE|Trident/.test(ua)) {
        browser = 'Internet Explorer';
        const ieMatch = ua.match(/(?:MSIE |rv:)(\d+\.?\d*)/);
        browserVersion = ieMatch ? ieMatch[1] : '';
    }

    return {
        deviceType,
        osName,
        osVersion,
        browser,
        browserVersion,
        userAgent: ua,
    };
}

/**
 * Generate a unique visitor ID
 */
export function generateVisitorId(): string {
    if (typeof window === 'undefined') {
        return `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Try to get from localStorage
    const stored = localStorage.getItem('visitor_id');
    if (stored) return stored;

    // Generate new ID
    const newId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('visitor_id', newId);
    return newId;
}
