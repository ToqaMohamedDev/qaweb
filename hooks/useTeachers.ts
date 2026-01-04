/**
 * useTeachers Hook - Simplified
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { getTeachers, getTeacherById } from '@/lib/services/teacher.service';
import type { Teacher } from '@/lib/types';

export function useTeachers() {
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    const fetchTeachers = useCallback(async () => {
        try {
            setStatus('loading');
            setError(null);
            const data = await getTeachers();
            setTeachers(data);
            setFilteredTeachers(data);
            setStatus('success');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch teachers');
            setStatus('error');
            console.error('Error fetching teachers:', err);
        }
    }, []);

    // Filter effect
    useEffect(() => {
        let result = teachers;

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(t =>
                t.name?.toLowerCase().includes(query) ||
                t.bio?.toLowerCase().includes(query)
            );
        }

        if (selectedCategory && selectedCategory !== 'all') {
            // Note: This assumes current filtering logic. Adjust if categories are strictly defined.
            result = result.filter(t => t.bio?.includes(selectedCategory));
        }

        setFilteredTeachers(result);
    }, [teachers, searchQuery, selectedCategory]);

    useEffect(() => {
        fetchTeachers();
    }, [fetchTeachers]);

    const featuredTeachers = filteredTeachers.filter(t => (t.subscriber_count ?? 0) > 100); // Simple threshold for now
    const regularTeachers = filteredTeachers.filter(t => (t.subscriber_count ?? 0) <= 100);

    const updateTeacher = useCallback((id: string, updates: Partial<Teacher>) => {
        setTeachers(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    }, []);

    const clearFilters = useCallback(() => {
        setSearchQuery('');
        setSelectedCategory('all');
    }, []);

    return {
        teachers,
        filteredTeachers,
        featuredTeachers,
        regularTeachers,
        status,
        error,
        searchQuery,
        selectedCategory,
        setSearchQuery,
        setSelectedCategory,
        clearFilters,
        updateTeacher,
        refetch: fetchTeachers,
    };
}

export function useTeacher(teacherId?: string) {
    const [teacher, setTeacher] = useState<Teacher | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTeacher = useCallback(async () => {
        if (!teacherId) {
            setTeacher(null);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const data = await getTeacherById(teacherId);
            setTeacher(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch teacher');
            console.error('Error fetching teacher:', err);
        } finally {
            setLoading(false);
        }
    }, [teacherId]);

    useEffect(() => {
        fetchTeacher();
    }, [fetchTeacher]);

    return {
        teacher,
        loading,
        error,
        refetch: fetchTeacher,
    };
}
