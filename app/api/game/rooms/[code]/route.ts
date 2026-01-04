import { NextRequest, NextResponse } from 'next/server';
import { getRoom, getPlayersInRoom, deleteRoom } from '@/lib/game/room-manager';
import { getCurrentQuestion, getTimerInfo } from '@/lib/game/game-engine';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/game/rooms/[code]
 * 
 * Get room details including players, current question, and timer state.
 * Used by clients for initial state and reconnection.
 */
export async function GET(
    _request: NextRequest,
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

        const players = await getPlayersInRoom(code);

        // Don't send password
        const { password, ...safeRoom } = room;

        let currentQuestion = null;
        let timerInfo = null;

        if (room.status === 'playing') {
            // Get current question
            const qData = await getCurrentQuestion(code);
            if (qData) {
                // Hide correct answer
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { correctAnswer, ...safeQuestion } = qData.question;
                currentQuestion = {
                    ...safeQuestion,
                    questionNumber: qData.questionNumber,
                    timeRemaining: qData.timeRemaining
                };
            }

            // Get timer info for accurate client sync
            const timer = await getTimerInfo(code);
            if (timer) {
                timerInfo = {
                    questionNumber: timer.questionNumber,
                    timeRemaining: timer.timeRemaining,
                    endsAt: timer.endsAt,
                    serverTime: Date.now(),
                };
            }
        }

        return NextResponse.json({
            success: true,
            room: safeRoom,
            players,
            currentQuestion,
            timerInfo,
        });
    } catch (error) {
        logger.error('Error getting room', { context: 'GameAPI', data: error });
        return NextResponse.json(
            { success: false, error: 'خطأ في جلب الغرفة' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/game/rooms/[code]
 * 
 * Delete a room. Only the creator can delete.
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    try {
        const { code } = await params;

        // Auth
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

        const room = await getRoom(code);
        if (!room) {
            return NextResponse.json(
                { success: false, error: 'الغرفة غير موجودة' },
                { status: 404 }
            );
        }

        if (room.creatorId !== user.id) {
            return NextResponse.json(
                { success: false, error: 'غير مصرح بحذف الغرفة' },
                { status: 403 }
            );
        }

        await deleteRoom(code);

        return NextResponse.json({ success: true });
    } catch (error) {
        logger.error('Error deleting room', { context: 'GameAPI', data: error });
        return NextResponse.json(
            { success: false, error: 'خطأ في حذف الغرفة' },
            { status: 500 }
        );
    }
}
