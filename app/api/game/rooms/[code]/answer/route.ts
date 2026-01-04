import { NextRequest, NextResponse } from 'next/server';
import { getRoom } from '@/lib/game/room-manager';
import { submitAnswer, forceEndQuestion } from '@/lib/game/game-engine';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { logger } from '@/lib/utils/logger';

/**
 * POST /api/game/rooms/[code]/answer
 * 
 * Submit an answer for the current question.
 * 
 * ⚠️ This route ONLY records answers - NO scoring!
 * Scoring happens in endQuestion ONLY.
 * 
 * For FFA mode: If this is the winning answer, it triggers endQuestion.
 */

async function createSupabaseClient() {
    const cookieStore = await cookies();
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) { return cookieStore.get(name)?.value; },
                set() { },
                remove() { },
            },
        }
    );
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    try {
        const { code } = await params;

        // Auth
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const supabase = await createSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });
        }

        // Validate input
        const body = await request.json();
        const { answer, questionNumber } = body;

        if (typeof answer !== 'number' || typeof questionNumber !== 'number') {
            return NextResponse.json({ success: false, error: 'بيانات غير صالحة' }, { status: 400 });
        }

        // Get room
        const room = await getRoom(code);
        if (!room) {
            return NextResponse.json({ success: false, error: 'الغرفة غير موجودة' }, { status: 404 });
        }

        // Submit answer
        const result = await submitAnswer(code, user.id, questionNumber, answer);

        if (!result.success) {
            return NextResponse.json({ success: false, error: result.error }, { status: 400 });
        }

        // FFA: Auto-end if winning answer
        if (room.gameMode === 'ffa' && result.isCorrect && !result.alreadyLocked) {
            await forceEndQuestion(code);
        }

        return NextResponse.json({
            success: true,
            recorded: result.recorded,
            isCorrect: result.isCorrect,
            alreadyLocked: result.alreadyLocked,
        });
    } catch (error) {
        logger.error('Answer route error', { context: 'GameAPI', data: error });
        return NextResponse.json({ success: false, error: 'خطأ في إرسال الإجابة' }, { status: 500 });
    }
}
