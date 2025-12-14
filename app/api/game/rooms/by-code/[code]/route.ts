/**
 * Room Info API
 * Get room information by code
 */

import { NextRequest, NextResponse } from 'next/server';
import Redis from 'ioredis';

const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
});

/**
 * Get room info by code
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    try {
        const { code } = await params;

        // Get room ID from code
        const roomId = await redis.get(`roomCode:${code.toUpperCase()}`);
        if (!roomId) {
            return NextResponse.json(
                { success: false, error: 'Room not found' },
                { status: 404 }
            );
        }

        // Get room metadata
        const roomMeta = await redis.hgetall(`room:${roomId}:meta`);
        const roomState = await redis.hgetall(`room:${roomId}:state`);
        const totalQuestions = parseInt(roomState?.totalQuestions || '0', 10);

        return NextResponse.json({
            success: true,
            room: {
                id: roomId,
                code: roomMeta.code,
                title: roomMeta.title,
                adminId: roomMeta.adminId,
                totalQuestions,
                createdAt: roomMeta.createdAt,
            }
        });

    } catch (error) {
        console.error('Get room error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to get room' },
            { status: 500 }
        );
    }
}
