/**
 * Timer Manager - Server-side timer management with Redis
 * Provides synchronized timer state across all clients
 */

import { redis, REDIS_KEYS, setTimerState, getTimerState, clearTimerState, TimerState } from '../redis';
import { getRoom, getPlayersInRoom, updateRoomStatus } from './room-manager';
import { endQuestion, startQuestion } from './game-engine';
import { questionResultEvent, gameEndedEvent, questionStartEvent } from './event-manager';

// Timer tick event type for broadcasting
export interface TimerTickEvent {
    roomCode: string;
    questionNumber: number;
    timeRemaining: number;
    endsAt: number;
}

/**
 * Start a new question timer and store in Redis
 */
export async function startQuestionTimer(
    roomCode: string,
    questionNumber: number,
    timeLimit: number
): Promise<TimerState> {
    const now = Date.now();
    const endsAt = now + (timeLimit * 1000);

    const timerState: TimerState = {
        roomCode,
        questionNumber,
        startedAt: now,
        endsAt,
        timeLimit,
        isPaused: false,
    };

    await setTimerState(timerState);

    console.log(`⏰ Timer started for room ${roomCode}, Q${questionNumber}, ends at ${new Date(endsAt).toISOString()}`);

    return timerState;
}

/**
 * Get current timer state and remaining time
 */
export async function getTimerInfo(roomCode: string): Promise<{
    timeRemaining: number;
    questionNumber: number;
    endsAt: number;
} | null> {
    const state = await getTimerState(roomCode);
    if (!state) return null;

    const now = Date.now();
    const timeRemaining = Math.max(0, Math.ceil((state.endsAt - now) / 1000));

    return {
        timeRemaining,
        questionNumber: state.questionNumber,
        endsAt: state.endsAt,
    };
}

/**
 * End the current timer and process question end
 * Returns true if successfully ended, false if already ended
 */
export async function endCurrentTimer(roomCode: string): Promise<{
    success: boolean;
    nextQuestion?: boolean;
    gameEnded?: boolean;
    correctAnswer?: number;
    winnerId?: string;
    winnerName?: string;
    scores?: { odUserId: string; score: number; delta: number }[];
    rankings?: { odUserId: string; odDisplayName: string; score: number; rank: number }[];
}> {
    const timerState = await getTimerState(roomCode);
    if (!timerState) {
        return { success: false };
    }

    // Clear the timer first to prevent duplicate processing
    await clearTimerState(roomCode);

    // End the question in game-engine
    const result = await endQuestion(roomCode, timerState.questionNumber);
    if (!result.success) {
        return { success: false };
    }

    // Get updated player scores
    const players = await getPlayersInRoom(roomCode);
    const sortedPlayers = players.sort((a, b) => b.score - a.score);

    let winnerName = '';
    if (result.winner) {
        const winner = players.find(p => p.odUserId === result.winner);
        winnerName = winner?.odDisplayName || '';
    }

    const scores = sortedPlayers.map(p => ({
        odUserId: p.odUserId,
        score: p.score,
        delta: 0,
    }));

    // Publish question result event
    await questionResultEvent(
        roomCode,
        timerState.questionNumber,
        result.correctAnswer!,
        result.winner,
        winnerName,
        scores
    );

    if (result.shouldEndGame) {
        // Game is finished
        const rankings = sortedPlayers.map((p, index) => ({
            odUserId: p.odUserId,
            odDisplayName: p.odDisplayName,
            score: p.score,
            rank: index + 1,
        }));

        await gameEndedEvent(roomCode, {
            winnerId: rankings[0]?.odUserId,
            winnerName: rankings[0]?.odDisplayName,
            rankings,
        });

        return {
            success: true,
            gameEnded: true,
            correctAnswer: result.correctAnswer,
            winnerId: result.winner,
            winnerName,
            scores,
            rankings,
        };
    }

    return {
        success: true,
        nextQuestion: true,
        correctAnswer: result.correctAnswer,
        winnerId: result.winner,
        winnerName,
        scores,
    };
}

/**
 * Start the next question with a new timer
 */
export async function startNextQuestion(roomCode: string, delayMs: number = 3000): Promise<{
    success: boolean;
    question?: {
        questionNumber: number;
        question: string;
        options: string[];
        timeLimit: number;
    };
}> {
    const room = await getRoom(roomCode);
    if (!room || room.status !== 'playing') {
        return { success: false };
    }

    // Start the next question in game-engine
    const result = await startQuestion(roomCode);
    if (!result.success || !result.question) {
        return { success: false };
    }

    // Start the timer
    await startQuestionTimer(roomCode, result.questionNumber!, room.timePerQuestion);

    // Publish question start event
    await questionStartEvent(
        roomCode,
        result.questionNumber!,
        result.question.question,
        result.question.options,
        room.timePerQuestion
    );

    return {
        success: true,
        question: {
            questionNumber: result.questionNumber!,
            question: result.question.question,
            options: result.question.options,
            timeLimit: room.timePerQuestion,
        },
    };
}

/**
 * Process timer expiration for a room
 * Called by the timer worker or polling mechanism
 */
export async function processTimerExpiration(roomCode: string): Promise<void> {
    console.log(`⏰ Processing timer expiration for room ${roomCode}`);

    const result = await endCurrentTimer(roomCode);

    if (result.success && result.nextQuestion) {
        // Schedule next question after delay
        // Note: In serverless, we rely on the Socket.IO server or client polling
        // The Socket.IO server will handle the actual scheduling
        console.log(`⏰ Room ${roomCode} ready for next question`);
    } else if (result.success && result.gameEnded) {
        console.log(`🏁 Game ended for room ${roomCode}`);
    }
}

/**
 * Force end the current question (e.g., all players answered)
 */
export async function forceEndQuestion(roomCode: string): Promise<boolean> {
    const timerState = await getTimerState(roomCode);
    if (!timerState) return false;

    // Process the end
    await endCurrentTimer(roomCode);
    return true;
}

/**
 * Check if timer has expired for a room
 */
export async function isTimerExpired(roomCode: string): Promise<boolean> {
    const timerState = await getTimerState(roomCode);
    if (!timerState) return true;

    return Date.now() >= timerState.endsAt;
}
