/**
 * Subject Service
 * 
 * Handles subjects (المواد الدراسية)
 */

import { getSupabaseClient } from '../supabase-client';
import type { Subject, TablesInsert, TablesUpdate } from '../database.types';

// ==========================================
// Read Operations
// ==========================================

/**
 * Get all subjects
 */
export async function getSubjects(): Promise<Subject[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('order_index');

    if (error) {
        console.error('Error fetching subjects:', error);
        throw new Error(error.message || 'Failed to fetch subjects');
    }
    return data || [];
}

/**
 * Get active subjects only
 */
export async function getActiveSubjects(): Promise<Subject[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('is_active', true)
        .order('order_index');

    if (error) {
        if (error.code === '42501') {
            console.warn('[SubjectService] Permission denied (RLS). Please run the fix_permissions.sql script.');
            return [];
        }
        console.error('Error fetching active subjects:', error);
        throw new Error(error.message || 'Failed to fetch active subjects');
    }
    return data || [];
}

/**
 * Get subjects by stage
 */
export async function getSubjectsByStage(stageId: string): Promise<Subject[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('stage_id', stageId)
        .eq('is_active', true)
        .order('order_index');

    if (error) {
        console.error('Error fetching subjects by stage:', error);
        throw new Error(error.message || 'Failed to fetch subjects by stage');
    }
    return data || [];
}

/**
 * Get a subject by ID
 */
export async function getSubjectById(id: string): Promise<Subject | null> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        console.error('Error fetching subject by ID:', error);
        throw new Error(error.message || 'Failed to fetch subject by ID');
    }
    return data;
}

/**
 * Get a subject by slug
 */
export async function getSubjectBySlug(slug: string): Promise<Subject | null> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('slug', slug)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        console.error('Error fetching subject by slug:', error);
        throw new Error(error.message || 'Failed to fetch subject by slug');
    }
    return data;
}

// ==========================================
// Write Operations (Admin only)
// ==========================================

/**
 * Create a new subject
 */
export async function createSubject(subject: TablesInsert<'subjects'>): Promise<Subject> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('subjects')
        .insert(subject)
        .select()
        .single();

    if (error) {
        console.error('Error creating subject:', error);
        throw new Error(error.message || 'Failed to create subject');
    }
    return data;
}

/**
 * Update a subject
 */
export async function updateSubject(
    id: string,
    updates: TablesUpdate<'subjects'>
): Promise<Subject> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('subjects')
        .update({
            ...updates,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating subject:', error);
        throw new Error(error.message || 'Failed to update subject');
    }
    return data;
}

/**
 * Delete a subject
 */
export async function deleteSubject(id: string): Promise<void> {
    const supabase = getSupabaseClient();

    const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting subject:', error);
        throw new Error(error.message || 'Failed to delete subject');
    }
}
