/**
 * Room Cleanup Utilities
 * 
 * Functions for cleaning up stale rooms and game data.
 * Should be called periodically via cron or on-demand.
 */

import { redis, REDIS_KEYS, RedisUtils, ROOM_TTL } from '../redis';
import { getRoom, getPlayersInRoom, deleteRoom } from './room-manager';
import { clearTimerState } from '../redis';
import { logger } from '@/lib/utils/logger';

// ============================================================================
// Types
// ============================================================================

export interface CleanupResult {
    roomsChecked: number;
    roomsCleaned: number;
    timersCleared: number;
    errors: string[];
}

// ============================================================================
// Cleanup Functions
// ============================================================================

/**
 * Clean up finished/stale rooms
 * A room is considered stale if:
 * - Status is 'finished' and older than 5 minutes
 * - Status is 'waiting' and older than 2 hours with no players
 * - Status is 'playing' but no activity for 30 minutes
 */
export async function cleanupStaleRooms(): Promise<CleanupResult> {
    const result: CleanupResult = {
        roomsChecked: 0,
        roomsCleaned: 0,
        timersCleared: 0,
        errors: [],
    };

    try {
        // Get all active rooms
        const activeRooms = await redis.smembers(REDIS_KEYS.activeRooms) as string[];
        result.roomsChecked = activeRooms.length;

        const now = Date.now();
        const FIVE_MINUTES = 5 * 60 * 1000;
        const THIRTY_MINUTES = 30 * 60 * 1000;
        const TWO_HOURS = 2 * 60 * 60 * 1000;

        for (const roomCode of activeRooms) {
            try {
                const room = await getRoom(roomCode);

                if (!room) {
                    // Room data doesn't exist, clean up indexes
                    await redis.srem(REDIS_KEYS.activeRooms, roomCode);
                    await redis.srem(REDIS_KEYS.publicRooms, roomCode);
                    await redis.zrem(REDIS_KEYS.activeTimers, roomCode);
                    result.roomsCleaned++;
                    continue;
                }

                let shouldClean = false;
                const roomAge = now - room.createdAt;

                if (room.status === 'finished') {
                    // Clean finished rooms after 5 minutes
                    shouldClean = roomAge > FIVE_MINUTES;
                } else if (room.status === 'waiting') {
                    // Check for empty waiting rooms older than 2 hours
                    const players = await getPlayersInRoom(roomCode);
                    if (players.length === 0 && roomAge > TWO_HOURS) {
                        shouldClean = true;
                    }
                } else if (room.status === 'playing') {
                    // Check for stale playing rooms (no activity)
                    const players = await getPlayersInRoom(roomCode);
                    if (players.length === 0) {
                        shouldClean = true;
                    } else {
                        // Check last activity
                        const lastActivity = Math.max(...players.map(p => p.lastActive || 0));
                        if (now - lastActivity > THIRTY_MINUTES) {
                            shouldClean = true;
                        }
                    }
                }

                if (shouldClean) {
                    await deleteRoom(roomCode);
                    await clearTimerState(roomCode);
                    result.roomsCleaned++;
                    result.timersCleared++;

                    logger.info(`Cleaned up stale room: ${roomCode}`, {
                        context: 'RoomCleanup',
                        data: { status: room.status, age: roomAge }
                    });
                }
            } catch (err) {
                const errorMsg = `Error processing room ${roomCode}: ${err}`;
                result.errors.push(errorMsg);
                logger.error(errorMsg, { context: 'RoomCleanup' });
            }
        }

        // Also clean up orphaned timers
        const expiredTimers = await redis.zrange(
            REDIS_KEYS.activeTimers,
            0,
            now - THIRTY_MINUTES,
            { byScore: true }
        ) as string[];

        for (const roomCode of expiredTimers) {
            const room = await getRoom(roomCode);
            if (!room || room.status !== 'playing') {
                await clearTimerState(roomCode);
                result.timersCleared++;
            }
        }

    } catch (error) {
        const errorMsg = `Cleanup failed: ${error}`;
        result.errors.push(errorMsg);
        logger.error(errorMsg, { context: 'RoomCleanup', data: error });
    }

    return result;
}

/**
 * Force cleanup a specific room
 */
export async function forceCleanupRoom(roomCode: string): Promise<boolean> {
    try {
        await deleteRoom(roomCode);
        await clearTimerState(roomCode);
        await RedisUtils.deleteRoomData(roomCode);

        logger.info(`Force cleaned room: ${roomCode}`, { context: 'RoomCleanup' });
        return true;
    } catch (error) {
        logger.error(`Failed to force clean room: ${roomCode}`, {
            context: 'RoomCleanup',
            data: error
        });
        return false;
    }
}

/**
 * Get room health status
 */
export async function getRoomHealth(roomCode: string): Promise<{
    exists: boolean;
    status?: string;
    playerCount?: number;
    hasTimer?: boolean;
    age?: number;
    isHealthy?: boolean;
}> {
    const room = await getRoom(roomCode);

    if (!room) {
        return { exists: false };
    }

    const players = await getPlayersInRoom(roomCode);
    const timer = await redis.exists(REDIS_KEYS.roomTimer(roomCode));
    const now = Date.now();
    const age = now - room.createdAt;

    let isHealthy = true;

    // Check health conditions
    if (room.status === 'playing') {
        if (!timer && players.length > 0) {
            // Playing but no timer - might be stuck
            isHealthy = false;
        }
    }

    if (players.length === 0 && room.status !== 'waiting') {
        isHealthy = false;
    }

    return {
        exists: true,
        status: room.status,
        playerCount: players.length,
        hasTimer: timer === 1,
        age,
        isHealthy,
    };
}

/**
 * Recover a stuck room
 * If a room is in 'playing' state but has no timer, try to recover
 */
export async function recoverStuckRoom(roomCode: string): Promise<boolean> {
    try {
        const room = await getRoom(roomCode);
        if (!room || room.status !== 'playing') {
            return false;
        }

        const timer = await redis.exists(REDIS_KEYS.roomTimer(roomCode));
        if (timer === 1) {
            // Timer exists, not stuck
            return false;
        }

        // Import and use game engine to start next question
        const { startQuestion } = await import('./game-engine');
        const result = await startQuestion(roomCode);

        if (result.success) {
            logger.info(`Recovered stuck room: ${roomCode}`, { context: 'RoomCleanup' });
            return true;
        }

        return false;
    } catch (error) {
        logger.error(`Failed to recover room: ${roomCode}`, {
            context: 'RoomCleanup',
            data: error
        });
        return false;
    }
}
