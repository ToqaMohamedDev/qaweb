import { NextRequest, NextResponse } from 'next/server';
import { getRoom, getPlayer, getPlayersInRoom } from '@/lib/game/room-manager';
import { submitAnswer, endQuestion, startQuestion } from '@/lib/game/game-engine';
import { playerAnsweredEvent, questionResultEvent, questionStartEvent, gameEndedEvent } from '@/lib/game/event-manager';
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

        // Publish answer event (hide correctness until round ends in team mode)
        await playerAnsweredEvent(
            code,
            user.id,
            player.odDisplayName,
            // In FFA show correctness immediately (or maybe hide to keep suspense? let's kept it revealed for sender)
            // Actually, for fairness, we might want to hide it from OTHERS, but here we are publishing to everyone.
            // In Speed mode (First to answer correct wins), it doesn't matter much because game pauses.
            // Let's reveal it.
            result.isCorrect
        );

        // If answer was correct, end the question immediately (First Correct Wins)
        if (result.isCorrect) {
            const endResult = await endQuestion(code, questionNumber);

            // Get updated scores
            const players = await getPlayersInRoom(code);
            const scores = players.map(p => ({
                odUserId: p.odUserId,
                score: p.score,
                delta: p.odUserId === user.id ? (result.points || 0) : 0,
            }));

            await questionResultEvent(
                code,
                questionNumber,
                endResult.correctAnswer!,
                user.id,
                player.odDisplayName,
                scores
            );

            // Start next question or end game
            if (endResult.shouldEndGame) {
                const rankings = players
                    .sort((a, b) => b.score - a.score)
                    .map((p, i) => ({
                        odUserId: p.odUserId,
                        odDisplayName: p.odDisplayName,
                        score: p.score,
                        rank: i + 1,
                    }));

                await gameEndedEvent(code, {
                    winnerId: rankings[0]?.odUserId,
                    winnerName: rankings[0]?.odDisplayName,
                    rankings,
                });
            } else {
                // Wait 2 seconds then start next question
                setTimeout(async () => {
                    const nextQ = await startQuestion(code);
                    if (nextQ.success && nextQ.question) {
                        await questionStartEvent(
                            code,
                            nextQ.questionNumber!,
                            nextQ.question.question,
                            nextQ.question.options,
                            room.timePerQuestion
                        );
                    }
                }, 2000);
            }
        }

        return NextResponse.json({
            success: true,
            isCorrect: result.isCorrect,
            points: result.points,
        });
    } catch (error) {
        console.error('Error submitting answer:', error);
        return NextResponse.json(
            { success: false, error: 'خطأ في إرسال الإجابة' },
            { status: 500 }
        );
    }
}
