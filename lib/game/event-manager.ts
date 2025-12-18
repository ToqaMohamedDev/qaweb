import { redis, REDIS_KEYS } from '../redis';
import { GameEvent, GameEventType } from './types';

/**
 * Event Manager - Handles real-time events via Redis Pub/Sub
 */

// Publish an event to room channel
export async function publishRoomEvent(
    roomCode: string,
    type: GameEventType,
    data: Record<string, unknown>
): Promise<void> {
    const event: GameEvent = {
        type,
        roomCode,
        timestamp: Date.now(),
        data,
    };

    // Push to queue for polling clients
    await redis.rpush(REDIS_KEYS.roomEventsQueue(roomCode), JSON.stringify(event));
    await redis.ltrim(REDIS_KEYS.roomEventsQueue(roomCode), -100, -1);
    await redis.expire(REDIS_KEYS.roomEventsQueue(roomCode), 3600);

    // Publish to channel (legacy/future support)
    await redis.publish(REDIS_KEYS.roomEvents(roomCode), JSON.stringify(event));
}

// Publish team chat message
export async function publishTeamChat(
    roomCode: string,
    team: 'A' | 'B',
    senderId: string,
    senderName: string,
    message: string
): Promise<void> {
    const event: GameEvent = {
        type: 'chat_message',
        roomCode,
        timestamp: Date.now(),
        data: {
            senderId,
            senderName,
            message,
            team,
        },
    };

    // Push to queue
    await redis.rpush(REDIS_KEYS.roomEventsQueue(roomCode), JSON.stringify(event));
    await redis.ltrim(REDIS_KEYS.roomEventsQueue(roomCode), -100, -1);
    await redis.publish(REDIS_KEYS.roomEvents(roomCode), JSON.stringify(event));
}

// Event Helpers

export function playerJoinedEvent(roomCode: string, player: {
    odUserId: string;
    odDisplayName: string;
    avatar?: string;
    team?: string | null;
}) {
    return publishRoomEvent(roomCode, 'player_joined', {
        odUserId: player.odUserId,
        odDisplayName: player.odDisplayName,
        avatar: player.avatar,
        team: player.team,
    });
}

export function playerLeftEvent(roomCode: string, odUserId: string, odDisplayName: string) {
    return publishRoomEvent(roomCode, 'player_left', { odUserId, odDisplayName });
}

export function playerReadyEvent(roomCode: string, odUserId: string, isReady: boolean) {
    return publishRoomEvent(roomCode, 'player_ready', { odUserId, isReady });
}

export function gameStartingEvent(roomCode: string, countdown: number = 3) {
    return publishRoomEvent(roomCode, 'game_starting', { countdown });
}

export function gameStartedEvent(roomCode: string) {
    return publishRoomEvent(roomCode, 'game_started', {});
}

export function questionStartEvent(
    roomCode: string,
    questionNumber: number,
    question: string,
    options: string[],
    timeLimit: number
) {
    return publishRoomEvent(roomCode, 'question_start', {
        questionNumber,
        question,
        options,
        timeLimit,
    });
}

export function playerAnsweredEvent(
    roomCode: string,
    odUserId: string,
    odDisplayName: string,
    isCorrect?: boolean // Only sent for non-FFA or after round ends
) {
    return publishRoomEvent(roomCode, 'player_answered', {
        odUserId,
        odDisplayName,
        isCorrect,
    });
}

export function questionResultEvent(
    roomCode: string,
    questionNumber: number,
    correctAnswer: number,
    winnerId?: string,
    winnerName?: string,
    scores: { odUserId: string; score: number; delta: number }[] = []
) {
    return publishRoomEvent(roomCode, 'question_result', {
        questionNumber,
        correctAnswer,
        winnerId,
        winnerName,
        scores,
    });
}

export function gameEndedEvent(
    roomCode: string,
    results: {
        winnerId?: string;
        winnerName?: string;
        rankings: { odUserId: string; odDisplayName: string; score: number; rank: number }[];
    }
) {
    return publishRoomEvent(roomCode, 'game_ended', results);
}

export function captainChangedEvent(
    roomCode: string,
    team: 'A' | 'B',
    newCaptainId: string,
    newCaptainName: string
) {
    return publishRoomEvent(roomCode, 'captain_changed', {
        team,
        newCaptainId,
        newCaptainName,
    });
}

export async function answerSuggestionEvent(
    roomCode: string,
    team: 'A' | 'B',
    suggesterId: string,
    suggesterName: string,
    suggestedAnswer: number
) {
    const event: GameEvent = {
        type: 'answer_suggestion',
        roomCode,
        timestamp: Date.now(),
        data: {
            suggesterId,
            suggesterName,
            suggestedAnswer,
            team,
        },
    };

    // Push to queue
    await redis.rpush(REDIS_KEYS.roomEventsQueue(roomCode), JSON.stringify(event));
    await redis.ltrim(REDIS_KEYS.roomEventsQueue(roomCode), -100, -1);
    return redis.publish(REDIS_KEYS.roomEvents(roomCode), JSON.stringify(event));
}
