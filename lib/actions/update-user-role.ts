'use server';

/**
 * Update User Role & Profile - Simple Direct Approach
 * Also saves educational stage for students
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

    try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

        if (!key || !url) {
            return {
                success: false,
                error: 'Configuration error: Missing credentials'
            };
        }

        const response = await fetch(`${url}/rest/v1/profiles`, {
            method: 'POST',
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates,return=representation'
            },
            body: JSON.stringify({
                id: userId,
                email,
                name: name || email.split('@')[0],
                role,
                role_selected: true,
                is_teacher_approved: false,
                avatar_url: avatarUrl,
                educational_stage_id: educationalStageId || null,
                updated_at: new Date().toISOString()
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[updateUserRole] Error response:', errorText);

            let errorMessage = 'فشل في حفظ البيانات';
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.message || errorMessage;
            } catch { }

            return {
                success: false,
                error: errorMessage
            };
        }

        return { success: true };
    } catch (error: any) {
        console.error('[updateUserRole] Exception:', error);
        return {
            success: false,
            error: error?.message || 'حدث خطأ غير متوقع'
        };
    }
}
