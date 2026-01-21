// =============================================
// useTeacherSetup - Hook لإعداد ملف المعلم
// =============================================

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/utils/logger';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface TeacherProfile {
    id: string;
    email: string;
    name: string;
    role: string;
    avatar_url: string | null;
    bio: string | null;
    specialization: string | null;
    is_verified: boolean;
    is_teacher_profile_public: boolean;
    teacher_title: string | null;
    years_of_experience: number;
    education: string | null;
    phone: string | null;
    website: string | null;
    social_links: SocialLinks;
    subjects: string[];
    stages: string[];
    teaching_style: string | null;
    cover_image_url: string | null;
    is_featured: boolean;
    featured_until: string | null;
    subscriber_count: number;
    total_views: number;
    rating_average: number;
    rating_count: number;
}

export interface SocialLinks {
    tiktok?: string;
    youtube?: string;
    facebook?: string;
    instagram?: string;
    whatsapp?: string;
}

export interface Subject {
    id: string;
    name: string;
    slug: string;
}

export interface Stage {
    id: string;
    name: string;
}

export interface TeacherFormData {
    name: string;
    avatar_url: string;
    bio: string;
    specialization: string;
    teacher_title: string;
    years_of_experience: number;
    education: string;
    phone: string;
    website: string;
    cover_image_url: string;
    teaching_style: string;
    is_teacher_profile_public: boolean;
    social_links: SocialLinks;
    subject: string;
    stages: string[];
}

export type TabType = 'basic' | 'professional' | 'social' | 'preview';

// ═══════════════════════════════════════════════════════════════════════════
// INITIAL STATE
// ═══════════════════════════════════════════════════════════════════════════

const initialFormData: TeacherFormData = {
    name: '',
    avatar_url: '',
    bio: '',
    specialization: '',
    teacher_title: '',
    years_of_experience: 0,
    education: '',
    phone: '',
    website: '',
    cover_image_url: '',
    teaching_style: '',
    is_teacher_profile_public: false,
    social_links: {
        tiktok: '',
        youtube: '',
        facebook: '',
        instagram: '',
        whatsapp: '',
    },
    subject: '',
    stages: [],
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN HOOK
// ═══════════════════════════════════════════════════════════════════════════

export function useTeacherSetup() {
    const router = useRouter();

    // UI State
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('basic');

    // Data State
    const [profile, setProfile] = useState<TeacherProfile | null>(null);
    const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
    const [availableStages, setAvailableStages] = useState<Stage[]>([]);
    const [formData, setFormData] = useState<TeacherFormData>(initialFormData);

    // ═══════════════════════════════════════════════════════════════════════
    // DATA FETCHING
    // ═══════════════════════════════════════════════════════════════════════

    const fetchProfile = useCallback(async () => {
        setIsLoading(true);
        try {
            // Use API instead of direct supabase.auth.getUser() for Vercel compatibility
            const authRes = await fetch('/api/auth/user');
            const authResult = await authRes.json();

            if (!authResult.success || !authResult.data?.user) {
                router.push('/login');
                return;
            }

            const userId = authResult.data.user.id;

            // Fetch subjects
            const { data: subjectsData, error: subjectsError } = await supabase
                .from('subjects')
                .select('id, name, slug')
                .eq('is_active', true)
                .order('order_index', { ascending: true });

            if (subjectsError) {
                logger.error('Error fetching subjects', { context: 'TeacherSetup', data: subjectsError });
            } else if (subjectsData) {
                setAvailableSubjects(subjectsData);
            }

            // Fetch stages
            const { data: stagesData, error: stagesError } = await supabase
                .from('educational_stages')
                .select('id, name')
                .order('order_index', { ascending: true });

            if (stagesError) {
                logger.error('Error fetching stages', { context: 'TeacherSetup', data: stagesError });
            } else if (stagesData) {
                setAvailableStages(stagesData);
            }

            // Fetch profile
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (profileError) throw profileError;

            if (profileData) {
                const data = profileData as any;
                setProfile(data as TeacherProfile);
                setFormData({
                    name: data.name || '',
                    avatar_url: data.avatar_url || '',
                    bio: data.bio || '',
                    specialization: data.specialization || '',
                    teacher_title: data.teacher_title || '',
                    years_of_experience: data.years_of_experience || 0,
                    education: data.education || '',
                    phone: data.phone || '',
                    website: data.website || '',
                    cover_image_url: data.cover_image_url || '',
                    teaching_style: data.teaching_style || '',
                    is_teacher_profile_public: data.is_teacher_profile_public || false,
                    social_links: data.social_links || initialFormData.social_links,
                    subject: data.subjects?.[0] || data.subject || '',
                    stages: data.stages || [],
                });
            }
        } catch (err) {
            logger.error('Error fetching profile', { context: 'TeacherSetup', data: err });
            setError('حدث خطأ في جلب البيانات');
        } finally {
            setIsLoading(false);
        }
    }, [router]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    // ═══════════════════════════════════════════════════════════════════════
    // FORM HANDLERS
    // ═══════════════════════════════════════════════════════════════════════

    const updateField = useCallback(<K extends keyof TeacherFormData>(field: K, value: TeacherFormData[K]) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const updateSocialLink = useCallback((key: keyof SocialLinks, value: string) => {
        setFormData(prev => ({
            ...prev,
            social_links: { ...prev.social_links, [key]: value }
        }));
    }, []);

    const selectSubject = useCallback((subject: string) => {
        setFormData(prev => ({
            ...prev,
            subject: prev.subject === subject ? '' : subject
        }));
    }, []);

    const toggleStage = useCallback((stage: string) => {
        setFormData(prev => ({
            ...prev,
            stages: prev.stages.includes(stage)
                ? prev.stages.filter(s => s !== stage)
                : [...prev.stages, stage]
        }));
    }, []);

    // ═══════════════════════════════════════════════════════════════════════
    // SAVE HANDLER
    // ═══════════════════════════════════════════════════════════════════════

    const handleSave = useCallback(async () => {
        if (!profile) return;

        // Validation
        if (!formData.subject) {
            setError('يجب اختيار المادة التي تدرسها');
            return;
        }

        if (!formData.name.trim()) {
            setError('يجب إدخال الاسم');
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    name: formData.name,
                    avatar_url: formData.avatar_url || null,
                    bio: formData.bio || null,
                    specialization: formData.specialization || null,
                    teacher_title: formData.teacher_title || null,
                    years_of_experience: formData.years_of_experience,
                    education: formData.education || null,
                    phone: formData.phone || null,
                    website: formData.website || null,
                    cover_image_url: formData.cover_image_url || null,
                    teaching_style: formData.teaching_style || null,
                    is_teacher_profile_public: formData.is_teacher_profile_public,
                    social_links: formData.social_links as unknown as Record<string, string>,
                    subjects: formData.subject ? [formData.subject] : [],
                    stages: formData.stages,
                    role: 'teacher',
                    updated_at: new Date().toISOString(),
                })
                .eq('id', profile.id);

            if (updateError) throw updateError;

            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);

            await fetchProfile();
        } catch (err) {
            logger.error('Error saving profile', { context: 'TeacherSetup', data: err });
            setError('حدث خطأ أثناء حفظ البيانات');
        } finally {
            setIsSaving(false);
        }
    }, [profile, formData, fetchProfile]);

    // ═══════════════════════════════════════════════════════════════════════
    // COMPUTED VALUES
    // ═══════════════════════════════════════════════════════════════════════

    const completionPercentage = useMemo(() => {
        const fields = [
            formData.name,
            formData.avatar_url,
            formData.bio,
            formData.specialization,
            formData.teacher_title,
            formData.education,
            formData.subject ? true : false,
            formData.stages.length > 0,
        ];
        const filled = fields.filter(Boolean).length;
        return Math.round((filled / fields.length) * 100);
    }, [formData]);

    const tabs = useMemo(() => [
        { id: 'basic' as const, label: 'المعلومات الأساسية' },
        { id: 'professional' as const, label: 'المعلومات المهنية' },
        { id: 'social' as const, label: 'التواصل الاجتماعي' },
        { id: 'preview' as const, label: 'معاينة' },
    ], []);

    // ═══════════════════════════════════════════════════════════════════════
    // RETURN
    // ═══════════════════════════════════════════════════════════════════════

    return {
        // UI State
        isLoading,
        isSaving,
        saveSuccess,
        error,
        setError,
        activeTab,
        setActiveTab,

        // Data
        profile,
        formData,
        availableSubjects,
        availableStages,

        // Form Handlers
        updateField,
        updateSocialLink,
        selectSubject,
        toggleStage,
        handleSave,

        // Computed
        completionPercentage,
        tabs,
    };
}

export type UseTeacherSetupReturn = ReturnType<typeof useTeacherSetup>;
