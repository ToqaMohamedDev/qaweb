/**
 * Stage Service
 * 
 * Handles educational stages (المراحل التعليمية)
 */

import { getSupabaseClient } from '../supabase-client';
import type { EducationalStage, TablesInsert, TablesUpdate } from '../database.types';

// ==========================================
// Read Operations
// ==========================================

/**
 * Get all educational stages
 */
export async function getStages(): Promise<EducationalStage[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('educational_stages')
        .select('*')
        .order('order_index');

    if (error) throw error;
    return data || [];
}

/**
 * Get active stages only
 */
export async function getActiveStages(): Promise<EducationalStage[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('educational_stages')
        .select('*')
        .eq('is_active', true)
        .order('order_index');

    if (error) throw error;
    return data || [];
}

/**
 * Get a stage by ID
 */
export async function getStageById(id: string): Promise<EducationalStage | null> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('educational_stages')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
    }
    return data;
}

/**
 * Get a stage by slug
 */
export async function getStageBySlug(slug: string): Promise<EducationalStage | null> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('educational_stages')
        .select('*')
        .eq('slug', slug)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
    }
    return data;
}

// ==========================================
// Write Operations (Admin only)
// ==========================================

/**
 * Create a new stage
 */
export async function createStage(stage: TablesInsert<'educational_stages'>): Promise<EducationalStage> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('educational_stages')
        .insert(stage)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Update a stage
 */
export async function updateStage(
    id: string,
    updates: TablesUpdate<'educational_stages'>
): Promise<EducationalStage> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('educational_stages')
        .update({
            ...updates,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Delete a stage
 */
export async function deleteStage(id: string): Promise<void> {
    const supabase = getSupabaseClient();

    const { error } = await supabase
        .from('educational_stages')
        .delete()
        .eq('id', id);

    if (error) throw error;
}
