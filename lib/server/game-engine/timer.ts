/**
 * Server-Authoritative Game Timer
 * Handles question timing with persistence and recovery
 */

import { EventEmitter } from 'events';
import type Redis from 'ioredis';
import type { TimerState, TimerStatus } from '../types/index';

export interface TimerConfig {
    duration: number; // Duration in milliseconds
    syncIntervalMs: number; // How often to broadcast sync events
    gracePeriodMs: number; // Grace period for late submissions
}

export interface TimerEvents {
    'tick': (remainingMs: number) => void;
    'sync': (state: TimerState) => void;
    'expired': () => void;
    'paused': (remainingMs: number) => void;
    'resumed': (remainingMs: number) => void;
    'reset': () => void;
}

export class GameTimer extends EventEmitter {
    private roomId: string;
    private config: TimerConfig;
    private state: TimerState;
    private syncInterval: NodeJS.Timeout | null = null;
    private expirationTimeout: NodeJS.Timeout | null = null;
    private redis: Redis | null;

    constructor(
        roomId: string,
        config: Partial<TimerConfig> = {},
        redis: Redis | null = null
    ) {
        super();
        this.roomId = roomId;
        this.redis = redis;
        this.config = {
            duration: config.duration ?? 10000, // 10 seconds default
            syncIntervalMs: config.syncIntervalMs ?? 1000, // Sync every second
            gracePeriodMs: config.gracePeriodMs ?? 200, // 200ms grace period
        };

        this.state = this.createInitialState();
    }

    private createInitialState(): TimerState {
        return {
            roomId: this.roomId,
            status: 'IDLE',
            startTime: 0,
            duration: this.config.duration,
            pausedAt: undefined,
            totalPausedTime: 0,
            endTime: 0,
        };
    }

    /**
     * Start the timer
     */
    async start(): Promise<void> {
        if (this.state.status === 'RUNNING') {
            console.warn(`Timer for room ${this.roomId} is already running`);
            return;
        }

        const now = Date.now();
        this.state = {
            ...this.state,
            status: 'RUNNING',
            startTime: now,
            endTime: now + this.config.duration,
            totalPausedTime: 0,
            pausedAt: undefined,
        };

        // Persist to Redis
        await this.persist();

        // Start sync interval
        this.startSyncInterval();

        // Schedule expiration
        this.scheduleExpiration();

        this.emit('sync', { ...this.state });
    }

    /**
     * Pause the timer
     */
    async pause(): Promise<number> {
        if (this.state.status !== 'RUNNING') {
            throw new Error(`Cannot pause timer in ${this.state.status} state`);
        }

        const now = Date.now();
        const remaining = this.getRemainingMs();

        this.state = {
            ...this.state,
            status: 'PAUSED',
            pausedAt: now,
        };

        // Clear intervals
        this.clearIntervals();

        // Persist
        await this.persist();

        this.emit('paused', remaining);
        this.emit('sync', { ...this.state });

        return remaining;
    }

    /**
     * Resume the timer
     */
    async resume(): Promise<number> {
        if (this.state.status !== 'PAUSED' || !this.state.pausedAt) {
            throw new Error(`Cannot resume timer in ${this.state.status} state`);
        }

        const now = Date.now();
        const pauseDuration = now - this.state.pausedAt;

        this.state = {
            ...this.state,
            status: 'RUNNING',
            pausedAt: undefined,
            totalPausedTime: this.state.totalPausedTime + pauseDuration,
            endTime: this.state.endTime + pauseDuration,
        };

        // Resume sync interval
        this.startSyncInterval();

        // Reschedule expiration
        this.scheduleExpiration();

        // Persist
        await this.persist();

        const remaining = this.getRemainingMs();
        this.emit('resumed', remaining);
        this.emit('sync', { ...this.state });

        return remaining;
    }

    /**
     * Get remaining time in milliseconds
     */
    getRemainingMs(): number {
        if (this.state.status === 'IDLE' || this.state.status === 'EXPIRED') {
            return 0;
        }

        if (this.state.status === 'PAUSED' && this.state.pausedAt) {
            return Math.max(
                0,
                this.config.duration - (this.state.pausedAt - this.state.startTime - this.state.totalPausedTime)
            );
        }

        return Math.max(0, this.state.endTime - Date.now());
    }

    /**
     * Check if timer has expired (including grace period)
     */
    isExpired(): boolean {
        return this.getRemainingMs() <= 0;
    }

    /**
     * Check if within grace period
     */
    isInGracePeriod(): boolean {
        const remaining = this.getRemainingMs();
        return remaining <= 0 && remaining > -this.config.gracePeriodMs;
    }

    /**
     * Get timer state
     */
    getState(): TimerState {
        return { ...this.state };
    }

    /**
     * Get timer status
     */
    getStatus(): TimerStatus {
        return this.state.status;
    }

    /**
     * Reset timer
     */
    async reset(): Promise<void> {
        this.clearIntervals();
        this.state = this.createInitialState();
        await this.persist();
        this.emit('reset');
    }

    /**
     * Stop and cleanup
     */
    async stop(): Promise<void> {
        this.clearIntervals();
        this.state.status = 'EXPIRED';
        await this.persist();
    }

    /**
     * Update duration (for dynamic question times)
     */
    setDuration(durationMs: number): void {
        this.config.duration = durationMs;
        if (this.state.status === 'IDLE') {
            this.state.duration = durationMs;
        }
    }

    /**
     * Validate if a submission is on time
     */
    isSubmissionValid(clientTimestamp?: number): { valid: boolean; reason?: string } {
        const remaining = this.getRemainingMs();

        // Timer not started or already expired
        if (this.state.status !== 'RUNNING' && this.state.status !== 'PAUSED') {
            return { valid: false, reason: 'TIMER_NOT_ACTIVE' };
        }

        // Within normal time
        if (remaining > 0) {
            return { valid: true };
        }

        // Within grace period
        if (remaining > -this.config.gracePeriodMs) {
            return { valid: true };
        }

        return { valid: false, reason: 'TIMER_EXPIRED' };
    }

    /**
     * Persist timer state to Redis
     */
    private async persist(): Promise<void> {
        if (!this.redis) return;

        try {
            await this.redis.hset(`room:${this.roomId}:timer`, {
                status: this.state.status,
                startTime: this.state.startTime.toString(),
                duration: this.state.duration.toString(),
                pausedAt: this.state.pausedAt?.toString() ?? '',
                totalPausedTime: this.state.totalPausedTime.toString(),
                endTime: this.state.endTime.toString(),
            });

            // Set TTL of 24 hours
            await this.redis.expire(`room:${this.roomId}:timer`, 86400);
        } catch (error) {
            console.error(`Failed to persist timer state for room ${this.roomId}:`, error);
        }
    }

    /**
     * Recover timer state from Redis
     */
    static async recover(
        roomId: string,
        redis: Redis,
        config?: Partial<TimerConfig>
    ): Promise<GameTimer | null> {
        try {
            const data = await redis.hgetall(`room:${roomId}:timer`);

            if (!data || !data.status) {
                return null;
            }

            const timer = new GameTimer(roomId, config, redis);

            timer.state = {
                roomId,
                status: data.status as TimerStatus,
                startTime: parseInt(data.startTime) || 0,
                duration: parseInt(data.duration) || timer.config.duration,
                pausedAt: data.pausedAt ? parseInt(data.pausedAt) : undefined,
                totalPausedTime: parseInt(data.totalPausedTime) || 0,
                endTime: parseInt(data.endTime) || 0,
            };

            // Check if timer should have expired during downtime
            if (timer.state.status === 'RUNNING') {
                const elapsed = Date.now() - timer.state.startTime - timer.state.totalPausedTime;
                if (elapsed >= timer.state.duration) {
                    timer.state.status = 'EXPIRED';
                    await timer.persist();
                } else {
                    // Resume timing
                    timer.startSyncInterval();
                    timer.scheduleExpiration();
                }
            }

            return timer;
        } catch (error) {
            console.error(`Failed to recover timer for room ${roomId}:`, error);
            return null;
        }
    }

    /**
     * Start sync interval for broadcasting timer updates
     */
    private startSyncInterval(): void {
        this.clearIntervals();

        this.syncInterval = setInterval(() => {
            if (this.state.status !== 'RUNNING') {
                return;
            }

            const remaining = this.getRemainingMs();
            this.emit('tick', remaining);
            this.emit('sync', { ...this.state, remainingMs: remaining });
        }, this.config.syncIntervalMs);
    }

    /**
     * Schedule expiration callback
     */
    private scheduleExpiration(): void {
        if (this.expirationTimeout) {
            clearTimeout(this.expirationTimeout);
        }

        const remaining = this.getRemainingMs();
        if (remaining <= 0) {
            this.handleExpiration();
            return;
        }

        this.expirationTimeout = setTimeout(() => {
            this.handleExpiration();
        }, remaining);
    }

    /**
     * Handle timer expiration
     */
    private handleExpiration(): void {
        if (this.state.status === 'EXPIRED') {
            return;
        }

        this.clearIntervals();
        this.state.status = 'EXPIRED';

        this.persist().catch(console.error);
        this.emit('expired');
    }

    /**
     * Clear all intervals and timeouts
     */
    private clearIntervals(): void {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
        if (this.expirationTimeout) {
            clearTimeout(this.expirationTimeout);
            this.expirationTimeout = null;
        }
    }

    /**
     * Calculate server timestamp for client synchronization
     */
    getServerTimestamp(): number {
        return Date.now();
    }

    /**
     * Get sync payload for broadcasting to clients
     */
    getSyncPayload(): {
        remainingMs: number;
        serverTimestamp: number;
        status: TimerStatus;
        endTime: number;
    } {
        return {
            remainingMs: this.getRemainingMs(),
            serverTimestamp: this.getServerTimestamp(),
            status: this.state.status,
            endTime: this.state.endTime,
        };
    }
}

/**
 * Timer manager for handling multiple room timers
 */
export class TimerManager {
    private timers: Map<string, GameTimer> = new Map();
    private redis: Redis;
    private defaultConfig: Partial<TimerConfig>;

    constructor(redis: Redis, defaultConfig: Partial<TimerConfig> = {}) {
        this.redis = redis;
        this.defaultConfig = defaultConfig;
    }

    /**
     * Get or create timer for a room
     */
    getTimer(roomId: string, config?: Partial<TimerConfig>): GameTimer {
        let timer = this.timers.get(roomId);

        if (!timer) {
            timer = new GameTimer(
                roomId,
                { ...this.defaultConfig, ...config },
                this.redis
            );
            this.timers.set(roomId, timer);
        }

        return timer;
    }

    /**
     * Remove timer for a room
     */
    async removeTimer(roomId: string): Promise<void> {
        const timer = this.timers.get(roomId);
        if (timer) {
            await timer.stop();
            this.timers.delete(roomId);
        }
    }

    /**
     * Recover all active timers from Redis
     */
    async recoverTimers(): Promise<void> {
        // This would need to scan Redis for active timers
        // Implementation depends on how rooms are tracked
        console.log('Timer recovery would happen here');
    }

    /**
     * Cleanup expired timers
     */
    cleanup(): void {
        for (const [roomId, timer] of this.timers) {
            if (timer.getStatus() === 'EXPIRED') {
                this.timers.delete(roomId);
            }
        }
    }
}
