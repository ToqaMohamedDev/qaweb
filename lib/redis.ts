/**
 * Redis Client Module for Quiz Battle Game
 * 
 * This module provides a centralized Redis client configuration and utility functions
 * for managing game state, timers, rooms, and real-time events.
 * 
 * @module lib/redis
 */

import { Redis } from '@upstash/redis';
import { logger } from '@/lib/utils/logger';

// ============================================================================
// Constants
// ============================================================================

/** Room Time-To-Live in seconds (2 hours) */
export const ROOM_TTL = 2 * 60 * 60;

/** Characters used for generating room codes (excludes confusing chars: 0, O, 1, I) */
const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Length of generated room codes */
const ROOM_CODE_LENGTH = 6;

/** Maximum attempts to generate a unique room code */
const MAX_ROOM_CODE_ATTEMPTS = 10;

// ============================================================================
// Redis Client Initialization
// ============================================================================

/**
 * Validates Redis environment variables
 * @throws Error if required environment variables are missing
 */
function validateRedisConfig(): { url: string; token: string } {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
        throw new Error(
            'Redis configuration error: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables are required'
        );
    }

    return { url, token };
}

/**
 * Creates a Redis client instance with singleton pattern
 */
function createRedisClient(): Redis {
    const config = validateRedisConfig();
    return new Redis({
        url: config.url,
        token: config.token,
    });
}

/** Singleton Redis client instance */
export const redis = createRedisClient();

// ============================================================================
// Redis Key Management
// ============================================================================

/**
 * Redis key generators for consistent key naming across the application
 * 
 * Key Structure:
 * - Room data: room:{code}
 * - Room players set: room:{code}:players
 * - Individual player: room:{code}:player:{userId}
 * - Room question state: room:{code}:question:{questionNum}
 * - Room timer: room:{code}:timer
 * - Room events channel: room:{code}:events
 * - Room events queue: room:{code}:events:queue
 * - Team chat: room:{code}:team:{team}:chat
 * - User session: user:{userId}:session
 * - Global indexes: rooms:active, rooms:public, rooms:activeTimers
 */
export const REDIS_KEYS = {
    // Room keys
    room: (code: string) => `room:${code}`,
    roomPlayers: (code: string) => `room:${code}:players`,
    roomPlayer: (code: string, odUserId: string) => `room:${code}:player:${odUserId}`,
    roomQuestion: (code: string, questionNum: number) => `room:${code}:question:${questionNum}`,
    roomTimer: (code: string) => `room:${code}:timer`,

    // Global indexes
    activeRooms: 'rooms:active',
    publicRooms: 'rooms:public',
    activeTimers: 'rooms:activeTimers',

    // User session
    userSession: (odUserId: string) => `user:${odUserId}:session`,

    // Pub/Sub channels
    roomEvents: (code: string) => `room:${code}:events`,
    roomEventsQueue: (code: string) => `room:${code}:events:queue`,
    teamChat: (code: string, team: 'A' | 'B') => `room:${code}:team:${team}:chat`,
} as const;

// ============================================================================
// Types
// ============================================================================

/**
 * Timer state stored in Redis for question timing
 */
export interface TimerState {
    /** Room code this timer belongs to */
    roomCode: string;
    /** Current question number being timed */
    questionNumber: number;
    /** Timestamp when the timer started (ms) */
    startedAt: number;
    /** Timestamp when the timer ends (ms) */
    endsAt: number;
    /** Time limit in seconds */
    timeLimit: number;
    /** Whether the timer is currently paused */
    isPaused: boolean;
    /** Timestamp when the timer was paused (ms), if paused */
    pausedAt?: number;
}

/**
 * Result type for Redis operations that may fail
 */
export interface RedisResult<T = void> {
    success: boolean;
    data?: T;
    error?: string;
}

// ============================================================================
// Room Code Generation
// ============================================================================

/**
 * Generates a random room code
 * @returns A 6-character alphanumeric room code
 */
export function generateRoomCode(): string {
    let code = '';
    for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
        const randomIndex = Math.floor(Math.random() * ROOM_CODE_CHARS.length);
        code += ROOM_CODE_CHARS.charAt(randomIndex);
    }
    return code;
}

/**
 * Generates a unique room code that doesn't exist in Redis
 * @param maxAttempts Maximum number of attempts before throwing an error
 * @returns A unique 6-character room code
 * @throws Error if unable to generate a unique code after max attempts
 */
export async function generateUniqueRoomCode(
    maxAttempts: number = MAX_ROOM_CODE_ATTEMPTS
): Promise<string> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const code = generateRoomCode();
        const exists = await redis.exists(REDIS_KEYS.room(code));

        if (!exists) {
            return code;
        }
    }

    throw new Error(
        `Failed to generate unique room code after ${maxAttempts} attempts`
    );
}

// ============================================================================
// Timer State Management
// ============================================================================

/**
 * Serializes TimerState for Redis storage
 * Converts boolean to string for proper storage
 */
function serializeTimerState(state: TimerState): Record<string, string | number> {
    return {
        roomCode: state.roomCode,
        questionNumber: state.questionNumber,
        startedAt: state.startedAt,
        endsAt: state.endsAt,
        timeLimit: state.timeLimit,
        isPaused: String(state.isPaused),
        ...(state.pausedAt !== undefined && { pausedAt: state.pausedAt }),
    };
}

/**
 * Deserializes timer data from Redis to TimerState
 */
function deserializeTimerState(data: Record<string, unknown>): TimerState {
    return {
        roomCode: String(data.roomCode),
        questionNumber: Number(data.questionNumber),
        startedAt: Number(data.startedAt),
        endsAt: Number(data.endsAt),
        timeLimit: Number(data.timeLimit),
        isPaused: data.isPaused === 'true',
        pausedAt: data.pausedAt ? Number(data.pausedAt) : undefined,
    };
}

/**
 * Sets the timer state in Redis using a pipeline for atomicity
 * @param state The timer state to store
 * @returns Result indicating success or failure
 */
export async function setTimerState(state: TimerState): Promise<RedisResult> {
    try {
        const timerKey = REDIS_KEYS.roomTimer(state.roomCode);
        const serialized = serializeTimerState(state);

        // Use pipeline for atomic operations
        const pipeline = redis.pipeline();
        pipeline.hset(timerKey, serialized);
        pipeline.expire(timerKey, ROOM_TTL);
        pipeline.zadd(REDIS_KEYS.activeTimers, {
            score: state.endsAt,
            member: state.roomCode,
        });

        await pipeline.exec();

        return { success: true };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Failed to set timer state', { context: 'Redis', data: { error: errorMessage } });
        return { success: false, error: errorMessage };
    }
}

/**
 * Retrieves the timer state for a room from Redis
 * @param code The room code
 * @returns The timer state or null if not found
 */
export async function getTimerState(code: string): Promise<TimerState | null> {
    try {
        const data = await redis.hgetall(REDIS_KEYS.roomTimer(code));

        if (!data || Object.keys(data).length === 0) {
            return null;
        }

        return deserializeTimerState(data);
    } catch (error) {
        logger.error('Failed to get timer state', { context: 'Redis', data: error });
        return null;
    }
}

/**
 * Gets the remaining time in seconds for a room's current timer
 * @param code The room code
 * @returns Remaining time in seconds, or 0 if no timer exists
 */
export async function getTimeRemaining(code: string): Promise<number> {
    const state = await getTimerState(code);

    if (!state) {
        return 0;
    }

    if (state.isPaused && state.pausedAt) {
        // If paused, calculate remaining time from when it was paused
        return Math.max(0, Math.floor((state.endsAt - state.pausedAt) / 1000));
    }

    const now = Date.now();
    return Math.max(0, Math.floor((state.endsAt - now) / 1000));
}

/**
 * Clears the timer state for a room using a pipeline for atomicity
 * @param code The room code
 * @returns Result indicating success or failure
 */
export async function clearTimerState(code: string): Promise<RedisResult> {
    try {
        const pipeline = redis.pipeline();
        pipeline.del(REDIS_KEYS.roomTimer(code));
        pipeline.zrem(REDIS_KEYS.activeTimers, code);

        await pipeline.exec();

        return { success: true };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Failed to clear timer state', { context: 'Redis', data: { error: errorMessage } });
        return { success: false, error: errorMessage };
    }
}

/**
 * Pauses the timer for a room
 * @param code The room code
 * @returns Result indicating success or failure
 */
export async function pauseTimer(code: string): Promise<RedisResult> {
    try {
        const state = await getTimerState(code);

        if (!state) {
            return { success: false, error: 'Timer not found' };
        }

        if (state.isPaused) {
            return { success: false, error: 'Timer already paused' };
        }

        const updatedState: TimerState = {
            ...state,
            isPaused: true,
            pausedAt: Date.now(),
        };

        return setTimerState(updatedState);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Failed to pause timer', { context: 'Redis', data: { error: errorMessage } });
        return { success: false, error: errorMessage };
    }
}

/**
 * Resumes a paused timer
 * @param code The room code
 * @returns Result indicating success or failure
 */
export async function resumeTimer(code: string): Promise<RedisResult> {
    try {
        const state = await getTimerState(code);

        if (!state) {
            return { success: false, error: 'Timer not found' };
        }

        if (!state.isPaused || !state.pausedAt) {
            return { success: false, error: 'Timer is not paused' };
        }

        // Calculate new end time based on remaining time when paused
        const remainingMs = state.endsAt - state.pausedAt;
        const now = Date.now();

        const updatedState: TimerState = {
            ...state,
            isPaused: false,
            endsAt: now + remainingMs,
            pausedAt: undefined,
        };

        return setTimerState(updatedState);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Failed to resume timer', { context: 'Redis', data: { error: errorMessage } });
        return { success: false, error: errorMessage };
    }
}

/**
 * Gets all expired timers that need processing
 * @returns Array of room codes with expired timers
 */
export async function getExpiredTimers(): Promise<string[]> {
    try {
        const now = Date.now();
        const expired = await redis.zrange(
            REDIS_KEYS.activeTimers,
            0,
            now,
            { byScore: true }
        );

        return expired as string[];
    } catch (error) {
        logger.error('Failed to get expired timers', { context: 'Redis', data: error });
        return [];
    }
}

// ============================================================================
// Redis Utilities
// ============================================================================

/**
 * Utility functions for Redis operations
 */
export const RedisUtils = {
    /**
     * Gets all Redis keys associated with a room
     * @param code The room code
     * @returns Array of Redis keys for the room
     */
    getRoomKeys(code: string): string[] {
        return [
            REDIS_KEYS.room(code),
            REDIS_KEYS.roomPlayers(code),
            REDIS_KEYS.roomTimer(code),
            REDIS_KEYS.roomEvents(code),
            REDIS_KEYS.roomEventsQueue(code),
            REDIS_KEYS.teamChat(code, 'A'),
            REDIS_KEYS.teamChat(code, 'B'),
        ];
    },

    /**
     * Deletes all data associated with a room
     * @param code The room code
     * @returns Result indicating success or failure
     */
    async deleteRoomData(code: string): Promise<RedisResult> {
        try {
            const keys = this.getRoomKeys(code);
            const pipeline = redis.pipeline();

            // Delete all room-specific keys
            for (const key of keys) {
                pipeline.del(key);
            }

            // Remove from global indexes
            pipeline.srem(REDIS_KEYS.activeRooms, code);
            pipeline.srem(REDIS_KEYS.publicRooms, code);
            pipeline.zrem(REDIS_KEYS.activeTimers, code);

            await pipeline.exec();

            return { success: true };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger.error('Failed to delete room data', { context: 'Redis', data: { error: errorMessage } });
            return { success: false, error: errorMessage };
        }
    },

    /**
     * Checks if a room exists in Redis
     * @param code The room code
     * @returns True if the room exists
     */
    async roomExists(code: string): Promise<boolean> {
        try {
            const exists = await redis.exists(REDIS_KEYS.room(code));
            return exists === 1;
        } catch {
            return false;
        }
    },

    /**
     * Extends the TTL of all room-related keys
     * @param code The room code
     * @param ttl Time-to-live in seconds (defaults to ROOM_TTL)
     */
    async extendRoomTTL(code: string, ttl: number = ROOM_TTL): Promise<RedisResult> {
        try {
            const keys = this.getRoomKeys(code);
            const pipeline = redis.pipeline();

            for (const key of keys) {
                pipeline.expire(key, ttl);
            }

            await pipeline.exec();

            return { success: true };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger.error('Failed to extend room TTL', { context: 'Redis', data: { error: errorMessage } });
            return { success: false, error: errorMessage };
        }
    },
};

// ============================================================================
// Health Check
// ============================================================================

/**
 * Checks if the Redis connection is healthy
 * @returns True if Redis is responding, false otherwise
 */
export async function checkRedisHealth(): Promise<boolean> {
    try {
        const result = await redis.ping();
        return result === 'PONG';
    } catch {
        return false;
    }
}

/**
 * Gets Redis connection status with details
 * @returns Object containing connection status and latency
 */
export async function getRedisStatus(): Promise<{
    connected: boolean;
    latencyMs: number | null;
    error?: string;
}> {
    const startTime = Date.now();

    try {
        await redis.ping();
        const latencyMs = Date.now() - startTime;

        return {
            connected: true,
            latencyMs,
        };
    } catch (error) {
        return {
            connected: false,
            latencyMs: null,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
