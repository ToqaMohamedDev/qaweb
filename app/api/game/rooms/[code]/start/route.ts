import { NextRequest, NextResponse } from 'next/server';
import { getRoom, areAllPlayersReady, getPlayersInRoom } from '@/lib/game/room-manager';
import { startGame, startQuestion } from '@/lib/game/game-engine';
import { gameStartingEvent, gameStartedEvent, questionStartEvent } from '@/lib/game/event-manager';
import { supabase } from '@/lib/supabase';

// POST - Start game (creator only)
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    try {
        const { code } = await params;

        // Get authenticated user
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json(
                { success: false, error: 'غير مصرح' },
                { status: 401 }
            );
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: 'غير مصرح' },
                { status: 401 }
            );
        }

        // Check if user is room creator
        const room = await getRoom(code);
        if (!room) {
            return NextResponse.json(
                { success: false, error: 'الغرفة غير موجودة' },
                { status: 404 }
            );
        }

        if (room.creatorId !== user.id) {
            return NextResponse.json(
                { success: false, error: 'فقط مالك الغرفة يمكنه بدء اللعبة' },
                { status: 403 }
            );
        }

        // Check if enough players
        const players = await getPlayersInRoom(code);
        if (players.length < 2) {
            return NextResponse.json(
                { success: false, error: 'يجب أن يكون هناك لاعبان على الأقل' },
                { status: 400 }
            );
        }

        // Check if all players are ready
        const allReady = await areAllPlayersReady(code);
        if (!allReady) {
            return NextResponse.json(
                { success: false, error: 'ليس كل اللاعبين جاهزين' },
                { status: 400 }
            );
        }

        // Start game
        const result = await startGame(code);
        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 400 }
            );
        }

        // Publish game starting event with countdown
        await gameStartingEvent(code, 3);
        await gameStartedEvent(code);

        // Start the first question immediately
        const questionResult = await startQuestion(code);
        if (questionResult.success && questionResult.question) {
            // Remove correct answer before sending
            const { correctAnswer, ...safeQuestion } = questionResult.question;

            // Use endsAt from startQuestion (timer state already set there)
            const endsAt = questionResult.endsAt || Date.now() + (room.timePerQuestion * 1000);

            // Publish question start event with endsAt for client-side timer
            await questionStartEvent(
                code,
                questionResult.questionNumber!,
                safeQuestion.question,
                safeQuestion.options,
                room.timePerQuestion
            );

            return NextResponse.json({
                success: true,
                questionNumber: questionResult.questionNumber,
                endsAt,
                timeLimit: room.timePerQuestion,
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error starting game:', error);
        return NextResponse.json(
            { success: false, error: 'خطأ في بدء اللعبة' },
            { status: 500 }
        );
    }
}
