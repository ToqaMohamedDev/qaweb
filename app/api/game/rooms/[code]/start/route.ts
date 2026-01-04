import { NextRequest, NextResponse } from 'next/server';
import { getRoom, areAllPlayersReady, getPlayersInRoom } from '@/lib/game/room-manager';
import { startGame, startQuestion } from '@/lib/game/game-engine';
import { gameStartingEvent, gameStartedEvent } from '@/lib/game/event-manager';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/utils/logger';

/**
 * POST /api/game/rooms/[code]/start
 * 
 * Start a game. Only the room creator can call this.
 * 
 * Flow:
 * 1. Validate creator and players
 * 2. Load questions
 * 3. Publish events
 * 4. Start first question
 */

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
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });
        }

        // Validate room
        const room = await getRoom(code);
        if (!room) {
            return NextResponse.json({ success: false, error: 'الغرفة غير موجودة' }, { status: 404 });
        }

        if (room.creatorId !== user.id) {
            return NextResponse.json({ success: false, error: 'فقط مالك الغرفة يمكنه بدء اللعبة' }, { status: 403 });
        }

        // Validate players
        const players = await getPlayersInRoom(code);
        if (players.length < 2) {
            return NextResponse.json({ success: false, error: 'يجب أن يكون هناك لاعبان على الأقل' }, { status: 400 });
        }

        if (!(await areAllPlayersReady(code))) {
            return NextResponse.json({ success: false, error: 'ليس كل اللاعبين جاهزين' }, { status: 400 });
        }

        // Start game
        const startResult = await startGame(code);
        if (!startResult.success) {
            return NextResponse.json({ success: false, error: startResult.error }, { status: 400 });
        }

        // Publish events
        await gameStartingEvent(code, 3);
        await gameStartedEvent(code);

        // Start first question
        const questionResult = await startQuestion(code);

        if (!questionResult.success) {
            logger.error('Failed to start first question', { context: 'GameAPI', data: questionResult.error });
            return NextResponse.json({
                success: true,
                warning: 'اللعبة بدأت لكن السؤال الأول فشل في التحميل',
            });
        }

        logger.info(`Game started: ${code}`, { context: 'GameAPI' });

        return NextResponse.json({
            success: true,
            questionNumber: questionResult.questionNumber,
            endsAt: questionResult.endsAt,
            timeLimit: questionResult.timeLimit,
        });
    } catch (error) {
        logger.error('Start game error', { context: 'GameAPI', data: error });
        return NextResponse.json({ success: false, error: 'خطأ في بدء اللعبة' }, { status: 500 });
    }
}
