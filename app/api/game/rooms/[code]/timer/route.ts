import { NextRequest, NextResponse } from 'next/server';
import { getTimerInfo } from '@/lib/game/game-engine';
import { getRoom } from '@/lib/game/room-manager';

/**
 * GET /api/game/rooms/[code]/timer
 * 
 * Get current timer state for a room.
 * Used by clients for initial sync on reconnect.
 */

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    try {
        const { code } = await params;

        const room = await getRoom(code);
        if (!room) {
            return NextResponse.json({ success: false, error: 'الغرفة غير موجودة' }, { status: 404 });
        }

        const timerInfo = await getTimerInfo(code);

        if (!timerInfo) {
            return NextResponse.json({
                success: true,
                active: false,
                message: 'لا يوجد تايمر نشط',
            });
        }

        return NextResponse.json({
            success: true,
            active: true,
            timeRemaining: timerInfo.timeRemaining,
            questionNumber: timerInfo.questionNumber,
            endsAt: timerInfo.endsAt,
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'خطأ في جلب التايمر' }, { status: 500 });
    }
}
