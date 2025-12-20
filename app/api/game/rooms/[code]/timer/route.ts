import { NextRequest, NextResponse } from 'next/server';
import { getRoom } from '@/lib/game/room-manager';
import { getTimerState } from '@/lib/redis';

// GET - Get current timer state
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    try {
        const { code } = await params;

        const room = await getRoom(code);
        if (!room) {
            return NextResponse.json(
                { success: false, error: 'الغرفة غير موجودة' },
                { status: 404 }
            );
        }

        if (room.status !== 'playing') {
            return NextResponse.json({
                success: true,
                timer: null,
                status: room.status,
            });
        }

        const timerState = await getTimerState(code);

        if (!timerState) {
            return NextResponse.json({
                success: true,
                timer: null,
            });
        }

        const now = Date.now();
        const timeRemaining = Math.max(0, Math.ceil((timerState.endsAt - now) / 1000));

        return NextResponse.json({
            success: true,
            timer: {
                questionNumber: timerState.questionNumber,
                timeRemaining,
                endsAt: timerState.endsAt,
                startedAt: timerState.startedAt,
                timeLimit: timerState.timeLimit,
                serverTime: now,
            },
        });
    } catch (error) {
        console.error('Error getting timer:', error);
        return NextResponse.json(
            { success: false, error: 'خطأ في الخادم' },
            { status: 500 }
        );
    }
}
