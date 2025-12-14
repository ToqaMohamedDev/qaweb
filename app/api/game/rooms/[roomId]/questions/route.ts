/**
 * Questions API for Game Rooms
 * Add questions to a room (Admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import Redis from 'ioredis';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

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

interface QuestionInput {
    articleHtml?: string;
    questionText: string;
    options: { id: string; text: string }[];
    correctOption: string;
    timeLimitSeconds?: number;
}

/**
 * Add questions to a room
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ roomId: string }> }
) {
    try {
        const { roomId } = await params;

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

        const body = await request.json();
        const questions: QuestionInput[] = body.questions || [];

        if (questions.length === 0) {
            return NextResponse.json(
                { success: false, error: 'No questions provided' },
                { status: 400 }
            );
        }

        // Get current question count
        const currentCount = parseInt(await redis.hget(`room:${roomId}:state`, 'totalQuestions') || '0', 10);

        // Add questions to Redis
        const pipeline = redis.pipeline();
        const addedQuestions: any[] = [];

        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            const questionId = uuidv4();
            const orderIndex = currentCount + i;

            const questionData = {
                id: questionId,
                roomId,
                orderIndex: orderIndex.toString(),
                articleHtml: q.articleHtml || '',
                questionText: q.questionText,
                options: JSON.stringify(q.options),
                correctOption: q.correctOption,
                timeLimitSeconds: (q.timeLimitSeconds || 10).toString(),
                createdAt: new Date().toISOString(),
            };

            pipeline.hset(`room:${roomId}:question:${orderIndex}`, questionData);
            addedQuestions.push({
                id: questionId,
                orderIndex,
                questionText: q.questionText,
            });
        }

        // Update total questions count
        pipeline.hset(`room:${roomId}:state`, 'totalQuestions', (currentCount + questions.length).toString());

        await pipeline.exec();

        return NextResponse.json({
            success: true,
            added: addedQuestions.length,
            total: currentCount + questions.length,
            questions: addedQuestions,
        });

    } catch (error) {
        console.error('Add questions error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to add questions' },
            { status: 500 }
        );
    }
}

/**
 * Get questions for a room (without correct answers for players)
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ roomId: string }> }
) {
    try {
        const { roomId } = await params;

        // Check if room exists
        const roomMeta = await redis.hgetall(`room:${roomId}:meta`);
        if (!roomMeta || !roomMeta.code) {
            return NextResponse.json(
                { success: false, error: 'Room not found' },
                { status: 404 }
            );
        }

        // Get total questions
        const totalQuestions = parseInt(await redis.hget(`room:${roomId}:state`, 'totalQuestions') || '0', 10);

        // Check if admin (to show correct answers)
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.replace('Bearer ', '');
        let isAdmin = false;

        if (token) {
            try {
                const decoded = jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
                isAdmin = decoded.userId === roomMeta.adminId;
            } catch {
                // Invalid token, treat as non-admin
            }
        }

        const questions: any[] = [];

        for (let i = 0; i < totalQuestions; i++) {
            const questionData = await redis.hgetall(`room:${roomId}:question:${i}`);
            if (questionData && questionData.id) {
                const question: any = {
                    id: questionData.id,
                    orderIndex: parseInt(questionData.orderIndex, 10),
                    articleHtml: questionData.articleHtml,
                    questionText: questionData.questionText,
                    options: JSON.parse(questionData.options || '[]'),
                    timeLimitSeconds: parseInt(questionData.timeLimitSeconds || '10', 10),
                };

                // Only include correct answer for admin
                if (isAdmin) {
                    question.correctOption = questionData.correctOption;
                }

                questions.push(question);
            }
        }

        return NextResponse.json({
            success: true,
            roomId,
            total: questions.length,
            questions,
        });

    } catch (error) {
        console.error('Get questions error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to get questions' },
            { status: 500 }
        );
    }
}
