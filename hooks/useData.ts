/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                    UNIFIED DATA HOOKS                                     ║
 * ║                                                                           ║
 * ║  Centralized data fetching using API routes (server-side Supabase)        ║
 * ║  Works reliably on Vercel - NO browser Supabase client timeouts!          ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { API_ENDPOINTS } from '@/lib/api-client/endpoints';

// =============================================
// TYPES
// =============================================

export interface SessionData {
    user: {
        id: string;
        email: string;
        user_metadata?: {
            name?: string;
            full_name?: string;
            avatar_url?: string;
        };
    } | null;
    profile: {
        id: string;
        name: string;
        email: string;
        role: 'student' | 'teacher' | 'admin';
        avatar_url?: string;
        bio?: string;
        phone?: string;
        is_teacher_approved?: boolean;
        subscriber_count?: number;
        rating_average?: number;
        rating_count?: number;
        subjects?: string[];
        stages?: string[];
        specialization?: string;
        teacher_title?: string;
        years_of_experience?: number;
        education?: string;
        website?: string;
        teaching_style?: string;
        social_links?: Record<string, string>;
        cover_image_url?: string;
        is_teacher_profile_public?: boolean;
    } | null;
}

export interface Stage {
    id: string;
    name: string;
    order_index?: number;
}

export interface Subject {
    id: string;
    name: string;
    is_active?: boolean;
    order_index?: number;
}

export interface DataState<T> {
    data: T | null;
    isLoading: boolean;
    error: string | null;
}

// =============================================
// GENERIC FETCH FUNCTION
// =============================================

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<{ data: T | null; error: string | null }> {
    try {
        const res = await fetch(endpoint, {
            cache: 'no-store',
            ...options,
        });

        if (!res.ok) {
            return { data: null, error: `HTTP ${res.status}` };
        }

        const json = await res.json();

        // Handle different API response formats
        if (json.success === false) {
            return { data: null, error: json.error || 'Request failed' };
        }

        return { data: json.data ?? json, error: null };
    } catch (error) {
        return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

// =============================================
// HOOK: useSession (User + Profile)
// =============================================

export function useSession() {
    const [state, setState] = useState<DataState<SessionData>>({
        data: null,
        isLoading: true,
        error: null,
    });
    const isMounted = useRef(true);

    const refetch = useCallback(async () => {
        setState(prev => ({ ...prev, isLoading: true }));

        const res = await fetch(API_ENDPOINTS.AUTH_SESSION, { cache: 'no-store' });

        if (!isMounted.current) return;

        if (res.ok) {
            const data = await res.json();
            setState({
                data: { user: data.user, profile: data.profile },
                isLoading: false,
                error: null,
            });
        } else {
            setState({
                data: null,
                isLoading: false,
                error: 'Failed to fetch session',
            });
        }
    }, []);

    useEffect(() => {
        isMounted.current = true;
        refetch();
        return () => { isMounted.current = false; };
    }, [refetch]);

    return { ...state, refetch };
}

// =============================================
// HOOK: useStages
// =============================================

export function useStages() {
    const [state, setState] = useState<DataState<Stage[]>>({
        data: null,
        isLoading: true,
        error: null,
    });
    const isMounted = useRef(true);

    const refetch = useCallback(async () => {
        setState(prev => ({ ...prev, isLoading: true }));

        const { data, error } = await fetchApi<Stage[]>(API_ENDPOINTS.STAGES);

        if (!isMounted.current) return;

        setState({
            data: data || [],
            isLoading: false,
            error,
        });
    }, []);

    useEffect(() => {
        isMounted.current = true;
        refetch();
        return () => { isMounted.current = false; };
    }, [refetch]);

    return { ...state, refetch };
}

// =============================================
// HOOK: useSubjects
// =============================================

export function useSubjects() {
    const [state, setState] = useState<DataState<Subject[]>>({
        data: null,
        isLoading: true,
        error: null,
    });
    const isMounted = useRef(true);

    const refetch = useCallback(async () => {
        setState(prev => ({ ...prev, isLoading: true }));

        const { data, error } = await fetchApi<Subject[]>(API_ENDPOINTS.SUBJECTS);

        if (!isMounted.current) return;

        setState({
            data: data || [],
            isLoading: false,
            error,
        });
    }, []);

    useEffect(() => {
        isMounted.current = true;
        refetch();
        return () => { isMounted.current = false; };
    }, [refetch]);

    return { ...state, refetch };
}

// =============================================
// HOOK: useTeacherDashboard
// =============================================

export interface TeacherDashboardData {
    exams: any[];
    profile: {
        subscriber_count: number;
        rating_average: number;
        rating_count: number;
    };
    attempts: any[];
}

export function useTeacherDashboard() {
    const [state, setState] = useState<DataState<TeacherDashboardData>>({
        data: null,
        isLoading: true,
        error: null,
    });
    const isMounted = useRef(true);

    const refetch = useCallback(async () => {
        setState(prev => ({ ...prev, isLoading: true }));

        const res = await fetch(API_ENDPOINTS.TEACHER_DASHBOARD, { cache: 'no-store' });

        if (!isMounted.current) return;

        if (res.ok) {
            const json = await res.json();
            if (json.success) {
                setState({
                    data: {
                        exams: json.exams || [],
                        profile: json.profile || { subscriber_count: 0, rating_average: 0, rating_count: 0 },
                        attempts: json.attempts || [],
                    },
                    isLoading: false,
                    error: null,
                });
            } else {
                setState({
                    data: null,
                    isLoading: false,
                    error: json.error || 'Failed to fetch dashboard',
                });
            }
        } else {
            setState({
                data: null,
                isLoading: false,
                error: `HTTP ${res.status}`,
            });
        }
    }, []);

    useEffect(() => {
        isMounted.current = true;
        refetch();
        return () => { isMounted.current = false; };
    }, [refetch]);

    return { ...state, refetch };
}

// =============================================
// HOOK: useTeacherProfile (Full Profile Data)
// =============================================

export interface TeacherProfileData {
    session: SessionData;
    stages: Stage[];
    subjects: Subject[];
}

export function useTeacherProfile() {
    const [state, setState] = useState<DataState<TeacherProfileData>>({
        data: null,
        isLoading: true,
        error: null,
    });
    const isMounted = useRef(true);

    const refetch = useCallback(async () => {
        setState(prev => ({ ...prev, isLoading: true }));

        // Fetch all data in parallel via API routes
        const [sessionRes, subjectsRes, stagesRes] = await Promise.all([
            fetch(API_ENDPOINTS.AUTH_SESSION, { cache: 'no-store' }),
            fetch(API_ENDPOINTS.SUBJECTS, { cache: 'no-store' }),
            fetch(API_ENDPOINTS.STAGES, { cache: 'no-store' }),
        ]);

        if (!isMounted.current) return;

        const [sessionJson, subjectsJson, stagesJson] = await Promise.all([
            sessionRes.json(),
            subjectsRes.json(),
            stagesRes.json(),
        ]);

        setState({
            data: {
                session: { user: sessionJson.user, profile: sessionJson.profile },
                stages: stagesJson.data || [],
                subjects: subjectsJson.data || [],
            },
            isLoading: false,
            error: null,
        });
    }, []);

    useEffect(() => {
        isMounted.current = true;
        refetch();
        return () => { isMounted.current = false; };
    }, [refetch]);

    return { ...state, refetch };
}

// =============================================
// HOOK: useReferenceData (Stages + Subjects)
// =============================================

export interface ReferenceData {
    stages: Stage[];
    subjects: Subject[];
}

export function useReferenceData() {
    const [state, setState] = useState<DataState<ReferenceData>>({
        data: null,
        isLoading: true,
        error: null,
    });
    const isMounted = useRef(true);

    const refetch = useCallback(async () => {
        setState(prev => ({ ...prev, isLoading: true }));

        const [subjectsRes, stagesRes] = await Promise.all([
            fetch(API_ENDPOINTS.SUBJECTS, { cache: 'no-store' }),
            fetch(API_ENDPOINTS.STAGES, { cache: 'no-store' }),
        ]);

        if (!isMounted.current) return;

        const [subjectsJson, stagesJson] = await Promise.all([
            subjectsRes.json(),
            stagesRes.json(),
        ]);

        setState({
            data: {
                stages: stagesJson.data || [],
                subjects: subjectsJson.data || [],
            },
            isLoading: false,
            error: null,
        });
    }, []);

    useEffect(() => {
        isMounted.current = true;
        refetch();
        return () => { isMounted.current = false; };
    }, [refetch]);

    return { ...state, refetch };
}
