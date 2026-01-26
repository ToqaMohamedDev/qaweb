import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET() {
    try {
        const supabase = await createClient();

        // Try to fetch from word_categories table
        // If table doesn't exist, return empty array
        const { data, error } = await supabase
            .from('word_categories' as any)
            .select('*')
            .eq('is_active', true)
            .order('sort_order');

        if (error) {
            // Table might not exist, return empty
            console.log('Categories fetch error (table may not exist):', error.message);
            return NextResponse.json({
                success: true,
                categories: [],
            });
        }

        return NextResponse.json({
            success: true,
            categories: data || [],
        });
    } catch (error) {
        console.error('Categories API error:', error);
        return NextResponse.json({
            success: true,
            categories: [],
        });
    }
}
