import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

/**
 * Toggle lesson like
 * POST /api/lessons/[id]/like
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: lessonId } = await params;
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'يجب تسجيل الدخول للإعجاب' },
                { status: 401 }
            );
        }

        // Check if user already liked (using type assertion since table may not be in types yet)
        const { data: existingLike, error: checkError } = await supabase
            .from('user_lesson_likes' as any)
            .select('id')
            .eq('user_id', user.id)
            .eq('lesson_id', lessonId)
            .single();

        if (checkError && checkError.code !== 'PGRST116') {
            throw checkError;
        }

        if (existingLike) {
            // Unlike: Remove the like
            const { error: deleteError } = await supabase
                .from('user_lesson_likes' as any)
                .delete()
                .eq('user_id', user.id)
                .eq('lesson_id', lessonId);

            if (deleteError) throw deleteError;

            // Decrement likes count
            const { data: lesson } = await supabase
                .from('lessons')
                .select('likes_count')
                .eq('id', lessonId)
                .single();

            if (lesson) {
                await supabase
                    .from('lessons')
                    .update({ likes_count: Math.max(0, (lesson.likes_count || 0) - 1) })
                    .eq('id', lessonId);
            }

            return NextResponse.json({ liked: false, message: 'تم إزالة الإعجاب' });
        } else {
            // Like: Add the like
            const { error: insertError } = await supabase
                .from('user_lesson_likes' as any)
                .insert({ user_id: user.id, lesson_id: lessonId });

            if (insertError) throw insertError;

            // Increment likes count
            const { data: lesson } = await supabase
                .from('lessons')
                .select('likes_count')
                .eq('id', lessonId)
                .single();

            if (lesson) {
                await supabase
                    .from('lessons')
                    .update({ likes_count: (lesson.likes_count || 0) + 1 })
                    .eq('id', lessonId);
            }

            return NextResponse.json({ liked: true, message: 'تم الإعجاب بنجاح' });
        }
    } catch (error: any) {
        console.error('Error toggling like:', error);
        return NextResponse.json(
            { error: error.message || 'حدث خطأ' },
            { status: 500 }
        );
    }
}

/**
 * Check if user liked a lesson
 * GET /api/lessons/[id]/like
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: lessonId } = await params;
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ liked: false });
        }

        const { data: like } = await supabase
            .from('user_lesson_likes' as any)
            .select('id')
            .eq('user_id', user.id)
            .eq('lesson_id', lessonId)
            .single();

        return NextResponse.json({ liked: !!like });
    } catch (error) {
        return NextResponse.json({ liked: false });
    }
}
