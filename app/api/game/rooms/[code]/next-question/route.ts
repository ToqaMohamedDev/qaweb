import { NextRequest, NextResponse } from 'next/server';
import { getRoom, getPlayersInRoom } from '@/lib/game/room-manager';
import { startQuestion } from '@/lib/game/game-engine';

// POST - Get/Start next question
export async function POST(
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

        if (room.status !== 'playing' && room.status !== 'starting') {
            return NextResponse.json(
                { success: false, error: 'اللعبة غير نشطة' },
                { status: 400 }
            );
        }

        // Start the question
        const result = await startQuestion(code);

        if (!result.success || !result.question) {
            return NextResponse.json(
                { success: false, error: result.error || 'فشل في تحميل السؤال' },
                { status: 400 }
            );
        }

        // Return question without correct answer
        const { correctAnswer, ...safeQuestion } = result.question;
        // Use endsAt from startQuestion (timer state already set and event pushed there)
        const endsAt = result.endsAt || Date.now() + (room.timePerQuestion * 1000);

        return NextResponse.json({
            success: true,
            question: safeQuestion,
            questionNumber: result.questionNumber,
            timeLimit: room.timePerQuestion,
            endsAt,
        });
    } catch (error) {
        console.error('Error getting next question:', error);
        return NextResponse.json(
            { success: false, error: 'خطأ في الخادم' },
            { status: 500 }
        );
    }
}
