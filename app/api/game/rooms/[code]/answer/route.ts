import { NextRequest, NextResponse } from 'next/server';
import { getRoom, getPlayer, getPlayersInRoom } from '@/lib/game/room-manager';
import { submitAnswer, endQuestion } from '@/lib/game/game-engine';
import { playerAnsweredEvent } from '@/lib/game/event-manager';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Helper to create supabase client for API routes
async function createSupabaseClient() {
    const cookieStore = await cookies();
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
                set() { },
                remove() { },
            },
        }
    );
}

// POST - Submit answer
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
        const supabase = await createSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: 'غير مصرح' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { answer, questionNumber } = body;

        if (typeof answer !== 'number' || typeof questionNumber !== 'number') {
            return NextResponse.json(
                { success: false, error: 'بيانات غير صالحة' },
                { status: 400 }
            );
        }

        // Get player info
        const player = await getPlayer(code, user.id);
        if (!player) {
            return NextResponse.json(
                { success: false, error: 'اللاعب غير موجود' },
                { status: 400 }
            );
        }

        // Check captaincy for team mode
        const room = await getRoom(code);

        if (!room) {
            return NextResponse.json(
                { success: false, error: 'الغرفة غير موجودة' },
                { status: 404 }
            );
        }

        if (room.gameMode === 'team' && !player.isCaptain) {
            return NextResponse.json(
                { success: false, error: 'فقط القائد يمكنه الإجابة' },
                { status: 403 }
            );
        }

        // Submit answer
        const result = await submitAnswer(code, user.id, questionNumber, answer);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 400 }
            );
        }

        // Publish answer event
        await playerAnsweredEvent(
            code,
            user.id,
            player.odDisplayName,
            result.isCorrect
        );

        // Response data
        const responseData: any = {
            success: true,
            isCorrect: result.isCorrect,
            points: result.points,
        };

        // If answer was correct in FFA mode, end the question immediately
        // The game-engine will handle timer clearing and event pushing
        if (result.isCorrect && room.gameMode === 'ffa') {
            const endResult = await endQuestion(code, questionNumber);

            // Get updated scores
            const players = await getPlayersInRoom(code);
            const scores = players.map(p => ({
                odUserId: p.odUserId,
                score: p.score,
                delta: p.odUserId === user.id ? (result.points || 0) : 0,
            }));

            responseData.correctAnswer = endResult.correctAnswer;
            responseData.winnerId = user.id;
            responseData.winnerName = player.odDisplayName;
            responseData.scores = scores;

            // Check if game should end
            if (endResult.shouldEndGame) {
                const rankings = players
                    .sort((a, b) => b.score - a.score)
                    .map((p, i) => ({
                        odUserId: p.odUserId,
                        odDisplayName: p.odDisplayName,
                        score: p.score,
                        rank: i + 1,
                    }));

                responseData.shouldEndGame = true;
                responseData.rankings = rankings;
            }
        }

        return NextResponse.json(responseData);
    } catch (error) {
        console.error('Error submitting answer:', error);
        return NextResponse.json(
            { success: false, error: 'خطأ في إرسال الإجابة' },
            { status: 500 }
        );
    }
}
