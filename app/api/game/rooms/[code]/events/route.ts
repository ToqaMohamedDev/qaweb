import { NextRequest } from 'next/server';
import { redis, REDIS_KEYS } from '@/lib/redis';

// SSE endpoint for real-time game events
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    const { code } = await params;

    // Check if room exists
    const roomExists = await redis.exists(REDIS_KEYS.room(code));
    if (!roomExists) {
        return new Response('Room not found', { status: 404 });
    }

    // Create a readable stream for SSE
    const stream = new ReadableStream({
        start(controller) {
            const encoder = new TextEncoder();

            // Send initial connection message
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected', roomCode: code })}\n\n`));

            // Set up Redis subscription
            // Note: Upstash Redis REST API doesn't support true pub/sub subscriptions
            // So we use polling as a workaround for SSE

            let lastEventId = Date.now();
            const pollInterval = setInterval(async () => {
                try {
                    // Get latest events from a list (alternative approach)
                    const events = await redis.lrange(REDIS_KEYS.roomEventsQueue(code), 0, 10);

                    if (events && events.length > 0) {
                        for (const eventStr of events) {
                            try {
                                const event = typeof eventStr === 'string' ? JSON.parse(eventStr) : eventStr;
                                if (event.timestamp > lastEventId) {
                                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
                                    lastEventId = event.timestamp;
                                }
                            } catch (e) {
                                console.error('Error parsing event:', e);
                            }
                        }
                    }

                    // Send heartbeat every poll
                    controller.enqueue(encoder.encode(`: heartbeat\n\n`));
                } catch (error) {
                    console.error('Polling error:', error);
                }
            }, 1000); // Poll every second

            // Clean up on close
            request.signal.addEventListener('abort', () => {
                clearInterval(pollInterval);
                controller.close();
            });
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}

// Helper to push events to the queue (call this from event-manager)
export async function pushEventToQueue(code: string, event: Record<string, unknown>) {
    await redis.rpush(`room:${code}:events:queue`, JSON.stringify(event));
    // Keep only last 100 events
    await redis.ltrim(`room:${code}:events:queue`, -100, -1);
    // Set expiry
    await redis.expire(`room:${code}:events:queue`, 3600);
}
