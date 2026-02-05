'use server';

import { createAdminClient } from '@/lib/supabase/server';

/**
 * Get Educational Stages - Robust Server Action with Timeout
 * Uses Service Role to bypass RLS and includes timeout protection
 */
export async function getEducationalStagesAction() {
    console.log('[getEducationalStages] Starting...');
    
    try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

        // تحقق صريح من المتغيرات البيئية مع رسائل واضحة
        if (!url) {
            console.error('[getEducationalStages] ERROR: NEXT_PUBLIC_SUPABASE_URL is missing!');
            return [];
        }
        
        if (!key) {
            console.error('[getEducationalStages] ERROR: SUPABASE_SERVICE_ROLE_KEY is missing!');
            console.error('[getEducationalStages] Make sure this env var is set in Vercel dashboard');
            return [];
        }

        console.log('[getEducationalStages] Credentials OK, connecting to Supabase...');

        // استخدام عميل Supabase بصلاحيات Service Role لتجاوز RLS
        const supabase = createAdminClient();

        // إضافة Timeout لتجنب التعليق اللانهائي على Vercel
        const dbPromise = supabase
            .from('educational_stages')
            .select('id, name, slug')
            .order('order_index', { ascending: true });

        // ننتظر بحد أقصى 8 ثواني (مثل updateUserRoleAction)
        const timeoutPromise = new Promise<{ data: null; error: Error }>((resolve) =>
            setTimeout(() => resolve({ 
                data: null, 
                error: new Error('Timeout: Database query took too long') 
            }), 8000)
        );

        const { data, error } = await Promise.race([dbPromise, timeoutPromise]);

        if (error) {
            console.error('[getEducationalStages] Database Error:', error.message);
            return [];
        }

        console.log('[getEducationalStages] Success! Found', data?.length || 0, 'stages');
        return data || [];
        
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('[getEducationalStages] Exception:', message);
        return [];
    }
}
