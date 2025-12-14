
import { NextRequest, NextResponse } from 'next/server';
import Redis from 'ioredis';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

// Initialize Redis client
const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const displayName = body.displayName || `Guest_${Math.floor(Math.random() * 1000)}`;

        // Use existing userId if provided (for page refresh), otherwise create new
        const userId = body.existingUserId || uuidv4();
        const sessionId = uuidv4();
        const deviceFingerprint = uuidv4(); // Simple random fingerprint for guest

        // 1. Create Session
        const sessionData = {
            id: sessionId,
            userId,
            isActive: true,
            createdAt: new Date().toISOString(),
            deviceInfo: {
                userAgent: 'guest-browser',
                platform: 'web',
            }
        };

        // Store session in Redis
        // Key: sessions:{userId}, Field: {sessionId}, Value: JSON string
        await redis.hset(`sessions:${userId}`, sessionId, JSON.stringify(sessionData));

        // 2. Create User Profile
        // Key: users:{userId}, Field: 'displayName', Value: name
        await redis.hset(`users:${userId}`, 'displayName', displayName);
        await redis.hset(`users:${userId}`, 'isGuest', 'true');

        // 3. Generate JWT
        const payload = {
            userId,
            sessionId,
            deviceFingerprint,
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

        return NextResponse.json({
            success: true,
            token,
            user: {
                id: userId,
                displayName,
            }
        });

    } catch (error) {
        console.error('Guest auth error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create guest session' },
            { status: 500 }
        );
    }
}
