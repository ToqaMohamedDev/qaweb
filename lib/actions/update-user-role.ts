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

        const updateData = {
            email,
            name: name || email.split('@')[0],
            role,
            role_selected: true,
            is_teacher_approved: false, // يحتاج موافقة لاحقًا
            avatar_url: avatarUrl,
            educational_stage_id: educationalStageId || null,
            updated_at: new Date().toISOString()
        };

        // استخدام upsert لضمان إنشاء السجل أو تحديثه
        const { error } = await supabase
            .from('profiles')
            .upsert({
                id: userId,
                ...updateData
            });

        if (error) {
            console.error('[updateUserRole] Supabase Error:', error);
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
