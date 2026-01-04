import { NextRequest, NextResponse } from 'next/server';
import { getRoom } from '@/lib/game/room-manager';
import { startQuestion, checkNextQuestionSchedule, getTimerInfo } from '@/lib/game/game-engine';
import { logger } from '@/lib/utils/logger';

/**
 * POST /api/game/rooms/[code]/next-question
 * 
 * Start the next question (fallback mechanism).
 * Primary question starting is done by SSE polling.
 * 
 * This route validates state before starting.
 */

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    try {
        const { code } = await params;

        // Validate room
        const room = await getRoom(code);
        if (!room) {
            return NextResponse.json({ success: false, error: 'الغرفة غير موجودة' }, { status: 404 });
        }

        if (room.status !== 'playing' && room.status !== 'starting') {
            return NextResponse.json({ success: false, error: 'اللعبة غير نشطة' }, { status: 400 });
        }

        // Check if question already in progress
        const timerInfo = await getTimerInfo(code);
        if (timerInfo && timerInfo.timeRemaining > 0) {
            return NextResponse.json({
                success: false,
                error: 'سؤال قيد التنفيذ بالفعل',
                currentQuestion: timerInfo.questionNumber,
                timeRemaining: timerInfo.timeRemaining,
            }, { status: 400 });
        }

        // Check schedule
        const schedule = await checkNextQuestionSchedule(code);
        if (!schedule.shouldStart && schedule.startTime) {
            return NextResponse.json({
                success: false,
                error: 'في انتظار بدء السؤال التالي',
                waitMs: schedule.startTime - Date.now(),
            }, { status: 400 });
        }

        // Start question
        const result = await startQuestion(code);

        if (!result.success) {
            return NextResponse.json({ success: false, error: result.error }, { status: 400 });
        }

        logger.info(`Next question started: ${code}`, { context: 'GameAPI' });

        return NextResponse.json({
            success: true,
            question: result.question,
            questionNumber: result.questionNumber,
            timeLimit: result.timeLimit,
            endsAt: result.endsAt,
        });
    } catch (error) {
        logger.error('Next question error', { context: 'GameAPI', data: error });
        return NextResponse.json({ success: false, error: 'خطأ في الخادم' }, { status: 500 });
    }
}
