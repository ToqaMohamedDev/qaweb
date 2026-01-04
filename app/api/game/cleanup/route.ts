import { NextRequest, NextResponse } from 'next/server';
import { cleanupStaleRooms, getRoomHealth, recoverStuckRoom } from '@/lib/game/room-cleanup';
import { logger } from '@/lib/utils/logger';

/**
 * Cleanup API - For maintenance tasks
 * 
 * This route can be called by:
 * - Vercel Cron
 * - Manual admin calls
 * - Upstash QStash scheduled jobs
 * 
 * Protected by a simple API key check
 */

// POST - Run cleanup
export async function POST(request: NextRequest) {
    try {
        // Simple API key protection
        const authHeader = request.headers.get('authorization');
        const apiKey = process.env.CLEANUP_API_KEY || 'dev-cleanup-key';

        if (authHeader !== `Bearer ${apiKey}`) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json().catch(() => ({}));
        const action = body.action || 'cleanup';

        switch (action) {
            case 'cleanup':
                const result = await cleanupStaleRooms();
                logger.info('Cleanup completed', { context: 'CleanupAPI', data: result });
                return NextResponse.json({
                    success: true,
                    result,
                });

            case 'health':
                if (!body.roomCode) {
                    return NextResponse.json(
                        { success: false, error: 'roomCode required' },
                        { status: 400 }
                    );
                }
                const health = await getRoomHealth(body.roomCode);
                return NextResponse.json({
                    success: true,
                    health,
                });

            case 'recover':
                if (!body.roomCode) {
                    return NextResponse.json(
                        { success: false, error: 'roomCode required' },
                        { status: 400 }
                    );
                }
                const recovered = await recoverStuckRoom(body.roomCode);
                return NextResponse.json({
                    success: true,
                    recovered,
                });

            default:
                return NextResponse.json(
                    { success: false, error: 'Unknown action' },
                    { status: 400 }
                );
        }
    } catch (error) {
        logger.error('Cleanup API error', { context: 'CleanupAPI', data: error });
        return NextResponse.json(
            { success: false, error: 'Internal error' },
            { status: 500 }
        );
    }
}

// For Vercel Cron - accepts GET requests
export async function GET(request: NextRequest) {
    // Check for cron secret (Vercel sets this automatically)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'dev-cron-secret';

    if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json(
            { success: false, error: 'Unauthorized' },
            { status: 401 }
        );
    }

    try {
        const result = await cleanupStaleRooms();
        logger.info('Cron cleanup completed', { context: 'CleanupAPI', data: result });

        return NextResponse.json({
            success: true,
            result,
        });
    } catch (error) {
        logger.error('Cron cleanup error', { context: 'CleanupAPI', data: error });
        return NextResponse.json(
            { success: false, error: 'Cleanup failed' },
            { status: 500 }
        );
    }
}
