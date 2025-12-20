import { NextRequest, NextResponse } from 'next/server';
import { getRoom, getPlayersInRoom } from '@/lib/game/room-manager';
import { endQuestion } from '@/lib/game/game-engine';
import { redis, REDIS_KEYS } from '@/lib/redis';

// POST - End current question (called when timer expires)
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    try {
        const { code } = await params;
        const body = await request.json();
        const { questionNumber } = body;

        const room = await getRoom(code);
        if (!room) {
            return NextResponse.json(
                { success: false, error: 'الغرفة غير موجودة' },
                { status: 404 }
            );
        }

        if (room.status !== 'playing') {
            return NextResponse.json(
                { success: false, error: 'اللعبة غير نشطة' },
                { status: 400 }
            );
        }

        // End the question
        const result = await endQuestion(code, questionNumber);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: 'فشل في إنهاء السؤال' },
                { status: 400 }
            );
        }

        // Get players with updated scores
        const players = await getPlayersInRoom(code);
        const sortedPlayers = players.sort((a, b) => b.score - a.score);

        // Get question state for winner info
        const qState = await redis.hgetall(REDIS_KEYS.roomQuestion(code, questionNumber));
        let winnerName = '';
        if (result.winner) {
            const winner = players.find(p => p.odUserId === result.winner);
            winnerName = winner?.odDisplayName || '';
        }

        // Prepare scores update
        const scores = sortedPlayers.map(p => ({
            odUserId: p.odUserId,
            odDisplayName: p.odDisplayName,
            score: p.score,
            delta: 0, // Would need to track this per question
        }));

        // If game ended, prepare rankings
        let rankings = null;
        if (result.shouldEndGame) {
            rankings = sortedPlayers.map((p, index) => ({
                odUserId: p.odUserId,
                odDisplayName: p.odDisplayName,
                score: p.score,
                rank: index + 1,
            }));
        }

        return NextResponse.json({
            success: true,
            correctAnswer: result.correctAnswer,
            winnerId: result.winner,
            winnerName,
            scores,
            shouldEndGame: result.shouldEndGame,
            rankings,
        });
    } catch (error) {
        console.error('Error ending question:', error);
        return NextResponse.json(
            { success: false, error: 'خطأ في الخادم' },
            { status: 500 }
        );
    }
}
