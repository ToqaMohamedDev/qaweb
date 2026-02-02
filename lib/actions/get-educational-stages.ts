'use server';

import { createClient } from '@supabase/supabase-js';

export async function getEducationalStagesAction() {
    try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

        if (!key || !url) {
            console.error('Missing Supabase credentials');
            return [];
        }

        // استخدام عميل Supabase بصلاحيات Service Role لتجاوز RLS
        const supabase = createClient(url, key);

        const { data, error } = await supabase
            .from('educational_stages')
            .select('id, name, slug')
            .order('order_index', { ascending: true });

        if (error) {
            console.error('Error fetching stages:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Exception fetching stages:', error);
        return [];
    }
}
