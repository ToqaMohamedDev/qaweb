/**
 * Device Service
 * 
 * Handles device tracking (تتبع الأجهزة)
 */

import { getSupabaseClient } from '../supabase-client';
import type { UserDevice, VisitorDevice, DeviceType } from '../database.types';

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

    // Detect device type
    let deviceType: string = 'desktop';
    if (/Mobile|Android|iPhone|iPad/i.test(ua)) {
        if (/iPad|Tablet/i.test(ua)) {
            deviceType = 'tablet';
        } else {
            deviceType = 'mobile';
        }
    }

    // Detect OS
    let osName = '';
    let osVersion = '';
    if (/Windows NT (\d+\.\d+)/.test(ua)) {
        osName = 'Windows';
        osVersion = RegExp.$1;
    } else if (/Mac OS X (\d+[._]\d+)/.test(ua)) {
        osName = 'macOS';
        osVersion = RegExp.$1.replace('_', '.');
    } else if (/Android (\d+\.\d+)/.test(ua)) {
        osName = 'Android';
        osVersion = RegExp.$1;
    } else if (/iPhone OS (\d+_\d+)/.test(ua)) {
        osName = 'iOS';
        osVersion = RegExp.$1.replace('_', '.');
    } else if (/Linux/.test(ua)) {
        osName = 'Linux';
    }

    // Detect browser
    let browser = '';
    let browserVersion = '';
    if (/Chrome\/(\d+\.\d+)/.test(ua) && !/Edg/.test(ua)) {
        browser = 'Chrome';
        browserVersion = RegExp.$1;
    } else if (/Firefox\/(\d+\.\d+)/.test(ua)) {
        browser = 'Firefox';
        browserVersion = RegExp.$1;
    } else if (/Safari\/(\d+\.\d+)/.test(ua) && !/Chrome/.test(ua)) {
        browser = 'Safari';
        const match = ua.match(/Version\/(\d+\.\d+)/);
        browserVersion = match ? match[1] : '';
    } else if (/Edg\/(\d+\.\d+)/.test(ua)) {
        browser = 'Edge';
        browserVersion = RegExp.$1;
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
