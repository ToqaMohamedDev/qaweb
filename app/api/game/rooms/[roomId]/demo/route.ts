/**
 * Load Questions API
 * Loads questions from local database and adds them to the game room
 */

import { NextRequest, NextResponse } from 'next/server';
import Redis from 'ioredis';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getQuestions } from '@/lib/game-questions';

const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

interface AuthTokenPayload {
    userId: string;
    sessionId: string;
}

/**
 * Add questions from local database to a game room
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ roomId: string }> }
) {
    try {
        const { roomId } = await params;
        const body = await request.json();

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

        // Verify room exists and user is admin
        const roomMeta = await redis.hgetall(`room:${roomId}:meta`);
        if (!roomMeta || !roomMeta.adminId) {
            return NextResponse.json(
                { success: false, error: 'Room not found' },
                { status: 404 }
            );
        }

        if (roomMeta.adminId !== decoded.userId) {
            return NextResponse.json(
                { success: false, error: 'Only room admin can add questions' },
                { status: 403 }
            );
        }

        // Get questions from local database
        const category = body.category || 'all';
        const difficulty = body.difficulty || 'all';
        const limit = body.limit || 10;

        const questions = getQuestions({
            category: category !== 'all' ? category : undefined,
            difficulty: difficulty !== 'all' ? difficulty : undefined,
            limit,
            random: true, // عشوائية
        });

        if (questions.length === 0) {
            return NextResponse.json(
                { success: false, error: 'No questions found. Please add questions to lib/game-questions.ts' },
                { status: 404 }
            );
        }

        // Clear existing questions
        const existingCount = parseInt(await redis.hget(`room:${roomId}:state`, 'totalQuestions') || '0', 10);
        const clearPipeline = redis.pipeline();
        for (let i = 0; i < existingCount; i++) {
            clearPipeline.del(`room:${roomId}:questions:${i}`);
        }
        await clearPipeline.exec();

        // Add questions to Redis
        const pipeline = redis.pipeline();

        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            const questionId = uuidv4();

            const questionData = {
                id: questionId,
                roomId,
                orderIndex: i.toString(),
                articleHtml: q.articleHtml || '',
                questionText: q.questionText,
                options: JSON.stringify(q.options),
                correctOption: q.correctOption,
                timeLimitSeconds: q.timeLimitSeconds.toString(),
                createdAt: new Date().toISOString(),
                // Store metadata
                sourceId: q.id,
                category: q.category,
                difficulty: q.difficulty,
            };

            pipeline.hset(`room:${roomId}:questions:${i}`, questionData);
        }

        // Update total questions count
        pipeline.hset(`room:${roomId}:state`, 'totalQuestions', questions.length.toString());

        await pipeline.exec();

        return NextResponse.json({
            success: true,
            message: 'Questions loaded successfully',
            total: questions.length,
            filters: {
                category,
                difficulty,
                limit,
            },
        });

    } catch (error) {
        console.error('Load questions error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to load questions' },
            { status: 500 }
        );
    }
}
