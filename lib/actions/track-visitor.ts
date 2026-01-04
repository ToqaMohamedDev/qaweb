'use server';

/**
 * Track Visitor Server Action (Re-export for backward compatibility)
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '../database.types';

// Helper: Create Server Client
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

export async function trackVisitor(...args: Parameters<typeof import('./track-device').trackVisitorDeviceAction>) {
    const { trackVisitorDeviceAction } = await import('./track-device');
    return trackVisitorDeviceAction(...args);
}

// ==========================================
// Get All Visitor Devices (Admin)
// ==========================================

interface GetAllVisitorDevicesParams {
    limit?: number;
    offset?: number;
}

interface GetAllVisitorDevicesResult {
    success: boolean;
    devices?: unknown[];
    total?: number;
    error?: string;
}

export async function getAllVisitorDevices(params: GetAllVisitorDevicesParams = {}): Promise<GetAllVisitorDevicesResult> {
    try {
        const { limit = 20, offset = 0 } = params;
        const supabase = await createSupabaseServerClient();

        // Get total count
        const { count, error: countError } = await supabase
            .from('visitor_devices')
            .select('*', { count: 'exact', head: true });

        if (countError) {
            console.error('Error counting visitor devices:', countError);
            return { success: false, error: countError.message };
        }

        // Get visitor devices
        const { data, error } = await supabase
            .from('visitor_devices')
            .select('*')
            .order('last_seen_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Error fetching visitor devices:', error);
            return { success: false, error: error.message };
        }

        return { success: true, devices: data || [], total: count || 0 };
    } catch (error) {
        console.error('Error in getAllVisitorDevices:', error);
        return { success: false, error: 'Internal server error' };
    }
}

// ==========================================
// Delete Visitor Device (Admin)
// ==========================================

interface DeleteVisitorDeviceResult {
    success: boolean;
    error?: string;
}

export async function deleteVisitorDevice(deviceId: string): Promise<DeleteVisitorDeviceResult> {
    try {
        const supabase = await createSupabaseServerClient();

        const { error } = await supabase
            .from('visitor_devices')
            .delete()
            .eq('id', deviceId);

        if (error) {
            console.error('Error deleting visitor device:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error) {
        console.error('Error in deleteVisitorDevice:', error);
        return { success: false, error: 'Internal server error' };
    }
}
