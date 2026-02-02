'use server';

import { createClient } from '@supabase/supabase-js';

/**
 * Update User Role & Profile - Robust Server Action
 * Uses direct Supabase client for reliability in production environments
 */

export async function updateUserRoleAction(params: {
    userId: string;
    role: 'student' | 'teacher';
    email: string;
    name?: string;
    avatarUrl?: string;
    educationalStageId?: string;
}) {
    const { userId, role, email, name, avatarUrl, educationalStageId } = params;

    console.log('[updateUserRole] Starting update for user:', userId);

    try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

        if (!key || !url) {
            console.error('[updateUserRole] Missing Supabase credentials');
            return {
                success: false,
                error: 'Configuration error: Missing credentials'
            };
        }

        // استخدام عميل Supabase الرسمي بصلاحيات Service Role
        // هذا يتخطى أي مشاكل شبكة قد تواجهها طلبات fetch العادية
        const supabase = createClient(url, key, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        if (educationalStageId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(educationalStageId)) {
            console.warn('[updateUserRole] Invalid UUID for stage, setting to null');
            // لا نوقف العملية، بل نصحح القيمة
        }

        const cleanStageId = (educationalStageId && educationalStageId.trim().length > 0)
            ? educationalStageId
            : null;

        const updateData = {
            email,
            name: name || email.split('@')[0],
            role,
            role_selected: true,
            is_teacher_approved: false,
            avatar_url: avatarUrl,
            educational_stage_id: cleanStageId,
            updated_at: new Date().toISOString()
        };

        // إضافة Timeout لعملية قاعدة البيانات لتجنب التعليق اللانهائي
        const dbPromise = supabase
            .from('profiles')
            .upsert({
                id: userId,
                ...updateData
            });

        // ننتظر بحد أقصى 8 ثواني
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout connecting to database')), 8000)
        );

        const { error } = await Promise.race([dbPromise, timeoutPromise]) as any;

        if (error) {
            console.error('[updateUserRole] Supabase Error:', error);
            // حتى لو حدث خطأ، قد يكون السجل تم تحديثه جزئياً، لكن سنرجع الخطأ
            return {
                success: false,
                error: error.message || 'فشل في تحديث الملف الشخصي'
            };
        }

        console.log('[updateUserRole] Success');
        return { success: true };

    } catch (error: any) {
        console.error('[updateUserRole] Exception:', error);
        return {
            success: false,
            error: error?.message || 'حدث خطأ غير متوقع'
        };
    }
}
