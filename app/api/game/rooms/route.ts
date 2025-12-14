/**
 * Game Rooms API
 * Create and manage game rooms
 */

import { NextRequest, NextResponse } from 'next/server';
import Redis from 'ioredis';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { nanoid } from 'nanoid';

// Initialize Redis client
const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

interface AuthTokenPayload {
    userId: string;
    sessionId: string;
    deviceFingerprint: string;
}

/**
 * Create a new game room
 */
export async function POST(request: NextRequest) {
    try {
        // Get auth token
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json(
                { success: false, error: 'Authentication required' },
                { status: 401 }
            );
        }

        // Verify token
        let decoded: AuthTokenPayload;
        try {
            decoded = jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
        } catch {
            return NextResponse.json(
                { success: false, error: 'Invalid token' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const roomName = body.roomName || 'Quiz Battle Room';

        // Generate room ID and code
        const roomId = uuidv4();
        const roomCode = generateRoomCode();
        const inviteToken = nanoid(32);

        // Default room settings
        const settings = {
            maxTeams: 10,
            maxPlayersPerTeam: 5,
            questionTimeSeconds: 30,
            showResultsSeconds: 5,
            countdownSeconds: 3,
            allowReconnect: true,
            reconnectTimeoutSeconds: 60,
            shuffleQuestions: false,
            shuffleOptions: false,
        };

        // Create room in Redis
        const roomMeta = {
            code: roomCode,
            adminId: decoded.userId,
            inviteToken,
            title: roomName,
            createdAt: new Date().toISOString(),
        };

        const roomState = {
            id: roomId,
            code: roomCode,
            adminId: decoded.userId,
            status: 'WAITING',
            settings: JSON.stringify(settings),
            createdAt: new Date().toISOString(),
            players: JSON.stringify([]),
            questions: JSON.stringify([]),
        };

        // Store in Redis
        await redis.hset(`room:${roomId}:meta`, roomMeta);
        await redis.hset(`room:${roomId}:state`, roomState);
        await redis.set(`roomCode:${roomCode}`, roomId);
        await redis.set(`inviteToken:${inviteToken}`, roomId);

        // Set expiry for the room (24 hours)
        await redis.expire(`room:${roomId}:meta`, 86400);
        await redis.expire(`room:${roomId}:state`, 86400);
        await redis.expire(`roomCode:${roomCode}`, 86400);
        await redis.expire(`inviteToken:${inviteToken}`, 86400);

        return NextResponse.json({
            success: true,
            room: {
                id: roomId,
                code: roomCode,
                inviteToken,
                name: roomName,
            }
        });

    } catch (error) {
        console.error('Create room error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create room' },
            { status: 500 }
        );
    }
}

/**
 * Generate a random 6-character room code
 */
function generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid ambiguous characters
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}
