import { NextRequest, NextResponse } from 'next/server';
import { getRoom, getPlayersInRoom, deleteRoom } from '@/lib/game/room-manager';
import { getCurrentQuestion } from '@/lib/game/game-engine';
import { supabase } from '@/lib/supabase';

// GET - Get room details
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
        if (room.status === 'playing') {
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
        }

        return NextResponse.json({
            success: true,
            room: safeRoom,
            players,
            currentQuestion,
        });
    } catch (error) {
        console.error('Error getting room:', error);
        return NextResponse.json(
            { success: false, error: 'خطأ في جلب الغرفة' },
            { status: 500 }
        );
    }
}

// DELETE - Delete room (creator only)
export async function DELETE(
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
        console.error('Error deleting room:', error);
        return NextResponse.json(
            { success: false, error: 'خطأ في حذف الغرفة' },
            { status: 500 }
        );
    }
}
