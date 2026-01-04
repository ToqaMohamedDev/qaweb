/**
 * Settings Service
 * 
 * Handles site settings (إعدادات الموقع)
 */

import { getSupabaseClient } from '../supabase-client';
import type { SiteSetting, Json, TablesInsert } from '../database.types';

// ==========================================
// Read Operations
// ==========================================

/**
 * Get all site settings
 */
export async function getAllSettings(): Promise<SiteSetting[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .order('key');

    if (error) throw error;
    return data || [];
}

/**
 * Get a setting by key
 */
export async function getSetting(key: string): Promise<SiteSetting | null> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('key', key)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
    }
    return data;
}

/**
 * Get setting value by key
 */
export async function getSettingValue<T = unknown>(key: string): Promise<T | null> {
    const setting = await getSetting(key);
    if (!setting) return null;
    return setting.value as T;
}

/**
 * Get multiple settings by keys
 */
export async function getSettings(keys: string[]): Promise<Record<string, Json | null>> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', keys);

    if (error) throw error;

    const result: Record<string, Json | null> = {};
    (data || []).forEach(setting => {
        result[setting.key] = setting.value;
    });

    return result;
}

// ==========================================
// Common Settings Helpers
// ==========================================

/**
 * Get site name
 */
export async function getSiteName(): Promise<string> {
    const value = await getSettingValue<string>('site_name');
    return value || 'QAlaa';
}

/**
 * Get site description
 */
export async function getSiteDescription(): Promise<string> {
    const value = await getSettingValue<string>('site_description');
    return value || '';
}

/**
 * Check if site is in maintenance mode
 */
export async function isMaintenanceMode(): Promise<boolean> {
    const value = await getSettingValue<boolean>('maintenance_mode');
    return value === true;
}

/**
 * Check if registration is enabled
 */
export async function isRegistrationEnabled(): Promise<boolean> {
    const value = await getSettingValue<boolean>('registration_enabled');
    return value !== false; // Default to true
}

// ==========================================
// Write Operations (Admin only)
// ==========================================

/**
 * Update or create a setting
 */
export async function setSetting(
    key: string,
    value: Json,
    description?: string
): Promise<SiteSetting> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('site_settings')
        .upsert({
            key,
            value,
            description,
            updated_at: new Date().toISOString(),
        }, {
            onConflict: 'key',
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Update multiple settings
 */
export async function setSettings(settings: Array<{
    key: string;
    value: Json;
    description?: string;
}>): Promise<SiteSetting[]> {
    const supabase = getSupabaseClient();

    const updates = settings.map(s => ({
        key: s.key,
        value: s.value,
        description: s.description,
        updated_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
        .from('site_settings')
        .upsert(updates, {
            onConflict: 'key',
        })
        .select();

    if (error) throw error;
    return data || [];
}

/**
 * Delete a setting
 */
export async function deleteSetting(key: string): Promise<void> {
    const supabase = getSupabaseClient();

    const { error } = await supabase
        .from('site_settings')
        .delete()
        .eq('key', key);

    if (error) throw error;
}

// ==========================================
// Maintenance Mode Helpers
// ==========================================

/**
 * Enable maintenance mode
 */
export async function enableMaintenanceMode(): Promise<void> {
    await setSetting('maintenance_mode', true, 'وضع الصيانة');
}

/**
 * Disable maintenance mode
 */
export async function disableMaintenanceMode(): Promise<void> {
    await setSetting('maintenance_mode', false, 'وضع الصيانة');
}

/**
 * Enable registration
 */
export async function enableRegistration(): Promise<void> {
    await setSetting('registration_enabled', true, 'السماح بالتسجيل');
}

/**
 * Disable registration
 */
export async function disableRegistration(): Promise<void> {
    await setSetting('registration_enabled', false, 'السماح بالتسجيل');
}
