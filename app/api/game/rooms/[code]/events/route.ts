import { NextRequest } from 'next/server';
import { redis, REDIS_KEYS, getTimerState } from '@/lib/redis';
import { logger } from '@/lib/utils/logger';
import { processExpiredTimers, checkNextQuestionSchedule, startQuestion } from '@/lib/game/game-engine';

/**
 * GET /api/game/rooms/[code]/events
 * 
 * Server-Sent Events endpoint - THE HEART OF THE GAME LOOP
 * 
 * This route does THREE critical things:
 * 1. STREAMS events to clients (display updates)
 * 2. ENFORCES timers server-side (processes expired timers)
 * 3. STARTS next questions when scheduled
 * 
 * Even if all clients disconnect, the next connection
 * will process any pending timer expirations.
 */

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    const { code } = await params;

    // Check room exists
    const roomExists = await redis.exists(REDIS_KEYS.room(code));
    if (!roomExists) {
        return new Response('Room not found', { status: 404 });
    }

    const stream = new ReadableStream({
        start(controller) {
            const encoder = new TextEncoder();
            let isClosed = false;
            let isProcessing = false;
            let lastEventId = Date.now();

            // Send connection event
            const connected = JSON.stringify({
                type: 'connected',
                roomCode: code,
                timestamp: Date.now(),
            });
            controller.enqueue(encoder.encode(`data: ${connected}\n\n`));

            const poll = setInterval(async () => {
                if (isProcessing || isClosed) return;
                isProcessing = true;

                try {
                    // 1. TIMER ENFORCEMENT (Server-side game loop)
                    await processExpiredTimers();

                    // 2. CHECK & START NEXT QUESTION
                    const schedule = await checkNextQuestionSchedule(code);
                    if (schedule.shouldStart) {
                        await startQuestion(code);
                    }

                    if (isClosed) return;

                    // 3. TIMER SYNC
                    const timerState = await getTimerState(code);
                    if (timerState && Date.now() < timerState.endsAt) {
                        const sync = JSON.stringify({
                            type: 'timer_sync',
                            roomCode: code,
                            timestamp: Date.now(),
                            data: {
                                questionNumber: timerState.questionNumber,
                                timeRemaining: Math.max(0, Math.ceil((timerState.endsAt - Date.now()) / 1000)),
                                endsAt: timerState.endsAt,
                            }
                        });
                        controller.enqueue(encoder.encode(`data: ${sync}\n\n`));
                    }

                    // 4. STREAM EVENTS
                    const events = await redis.lrange(REDIS_KEYS.roomEventsQueue(code), 0, 20);
                    if (events?.length) {
                        for (const eventStr of events) {
                            try {
                                const event = typeof eventStr === 'string' ? JSON.parse(eventStr) : eventStr;
                                if (event.timestamp > lastEventId && !isClosed) {
                                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
                                    lastEventId = event.timestamp;
                                }
                            } catch { /* skip */ }
                        }
                    }

                    // Heartbeat
                    if (!isClosed) {
                        controller.enqueue(encoder.encode(`: heartbeat\n\n`));
                    }
                } catch (error) {
                    if ((error as Error).message?.includes('closed')) {
                        isClosed = true;
                    } else {
                        logger.error('SSE error', { context: 'GameSSE', data: error });
                    }
                } finally {
                    isProcessing = false;
                }
            }, 1000);

            // Cleanup
            request.signal.addEventListener('abort', () => {
                isClosed = true;
                clearInterval(poll);
                try { controller.close(); } catch { /* already closed */ }
            });
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',
        },
    });
}
