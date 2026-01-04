import { NextRequest, NextResponse } from 'next/server';
import { getRoom } from '@/lib/game/room-manager';
import { endQuestion, getTimerInfo } from '@/lib/game/game-engine';
import { clearTimerState } from '@/lib/redis';
import { logger } from '@/lib/utils/logger';

/**
 * POST /api/game/rooms/[code]/end-question
 * 
 * End the current question (fallback mechanism).
 * Primary timer enforcement is done by SSE polling.
 * 
 * This route validates that the timer has actually expired
 * before processing to prevent premature endings.
 */

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    try {
        const { code } = await params;
        const body = await request.json();
        const { questionNumber } = body;

        // Validate room
        const room = await getRoom(code);
        if (!room) {
            return NextResponse.json({ success: false, error: 'الغرفة غير موجودة' }, { status: 404 });
        }

        if (room.status !== 'playing') {
            return NextResponse.json({ success: false, error: 'اللعبة غير نشطة' }, { status: 400 });
        }

        // Check timer
        const timerInfo = await getTimerInfo(code);

        if (!timerInfo) {
            return NextResponse.json({
                success: true,
                alreadyProcessed: true,
                message: 'السؤال تم معالجته بالفعل',
            });
        }

        if (timerInfo.questionNumber !== questionNumber) {
            return NextResponse.json({
                success: false,
                error: 'رقم السؤال غير متطابق',
                currentQuestion: timerInfo.questionNumber,
            }, { status: 400 });
        }

        // Allow only if timer expired (500ms tolerance)
        if (timerInfo.timeRemaining > 0) {
            return NextResponse.json({
                success: false,
                error: 'الوقت لم ينتهِ بعد',
                timeRemaining: timerInfo.timeRemaining,
            }, { status: 400 });
        }

        // Clear timer and end question
        await clearTimerState(code);
        const result = await endQuestion(code, questionNumber);

        if (!result.success) {
            return NextResponse.json({ success: false, error: result.error }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            correctAnswer: result.correctAnswer,
            winnerId: result.winnerId,
            winnerName: result.winnerName,
            scores: result.scores,
            shouldEndGame: result.shouldEndGame,
            rankings: result.rankings,
        });
    } catch (error) {
        logger.error('End question route error', { context: 'GameAPI', data: error });
        return NextResponse.json({ success: false, error: 'خطأ في إنهاء السؤال' }, { status: 500 });
    }
}
