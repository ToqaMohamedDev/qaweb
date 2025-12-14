/**
 * Answer Validator
 * Server-authoritative validation for all answer submissions
 */

import type Redis from 'ioredis';
import type {
    AnswerSubmission,
    ValidationResult,
    ValidationCheck,
    ValidationReason,
    RoomState,
    Question,
    StoredAnswer,
    AntiCheatFlags,
    RiskLevel,
} from '../types/index';
import { GameTimer } from './timer';

export interface ValidationConfig {
    gracePeriodMs: number;
    minAnswerTimeMs: number;
    suspiciousFastAnswerMs: number;
}

const DEFAULT_CONFIG: ValidationConfig = {
    gracePeriodMs: 200,
    minAnswerTimeMs: 500, // Reject answers faster than 0.5s as suspicious
    suspiciousFastAnswerMs: 1000, // Flag answers faster than 1s
};

export class AnswerValidator {
    private redis: Redis;
    private config: ValidationConfig;

    constructor(redis: Redis, config: Partial<ValidationConfig> = {}) {
        this.redis = redis;
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * Validate an answer submission
     * Returns detailed validation result with all checks performed
     */
    async validate(
        playerId: string,
        roomId: string,
        submission: AnswerSubmission,
        timer: GameTimer
    ): Promise<ValidationResult> {
        const checks: ValidationCheck[] = [];
        const receivedAt = Date.now();

        // ─────────────────────────────────────────
        // Check 1: Room exists and is active
        // ─────────────────────────────────────────
        const roomStateRaw = await this.redis.hgetall(`room:${roomId}:state`);

        if (!roomStateRaw || Object.keys(roomStateRaw).length === 0) {
            checks.push({ name: 'room_exists', passed: false, details: 'Room not found' });
            return this.failedResult('ROOM_NOT_FOUND', checks);
        }
        checks.push({ name: 'room_exists', passed: true });

        const roomState = this.parseRoomState(roomStateRaw);

        if (roomState.status !== 'QUESTION_ACTIVE') {
            checks.push({
                name: 'room_active',
                passed: false,
                details: `Room status is ${roomState.status}, expected QUESTION_ACTIVE`
            });
            return this.failedResult('ROOM_NOT_ACTIVE', checks);
        }
        checks.push({ name: 'room_active', passed: true });

        // ─────────────────────────────────────────
        // Check 2: Player is in room
        // ─────────────────────────────────────────
        const isInRoom = await this.redis.sismember(`room:${roomId}:players`, playerId);

        if (!isInRoom) {
            checks.push({ name: 'player_in_room', passed: false, details: 'Player not in room' });
            return this.failedResult('PLAYER_NOT_IN_ROOM', checks);
        }
        checks.push({ name: 'player_in_room', passed: true });

        // ─────────────────────────────────────────
        // Check 3: Timer is still active
        // ─────────────────────────────────────────
        const timerValidation = timer.isSubmissionValid(submission.clientTimestamp);

        if (!timerValidation.valid) {
            checks.push({
                name: 'timer_valid',
                passed: false,
                details: timerValidation.reason
            });
            return this.failedResult('QUESTION_CLOSED', checks);
        }
        checks.push({ name: 'timer_valid', passed: true });

        // ─────────────────────────────────────────
        // Check 4: Question ID matches current question
        // ─────────────────────────────────────────
        const questionKey = `room:${roomId}:questions:${roomState.currentQuestionIndex}`;
        const currentQuestion = await this.redis.hgetall(questionKey);

        if (!currentQuestion || currentQuestion.id !== submission.questionId) {
            checks.push({
                name: 'correct_question',
                passed: false,
                details: 'Question ID mismatch'
            });
            return this.failedResult('WRONG_QUESTION', checks);
        }
        checks.push({ name: 'correct_question', passed: true });

        // ─────────────────────────────────────────
        // Check 5: No previous answer from this player
        // ─────────────────────────────────────────
        const answersKey = `room:${roomId}:q:${roomState.currentQuestionIndex}:answers`;
        const existingAnswer = await this.redis.hget(answersKey, playerId);

        if (existingAnswer) {
            checks.push({
                name: 'first_answer',
                passed: false,
                details: 'Player already answered'
            });
            return this.failedResult('ALREADY_ANSWERED', checks);
        }
        checks.push({ name: 'first_answer', passed: true });

        // ─────────────────────────────────────────
        // Check 6: Valid option
        // ─────────────────────────────────────────
        const options = JSON.parse(currentQuestion.options || '[]') as Array<{ id: string }>;
        const validOptions = options.map(o => o.id);

        if (!validOptions.includes(submission.answer)) {
            checks.push({
                name: 'valid_option',
                passed: false,
                details: `Invalid option: ${submission.answer}`
            });
            return this.failedResult('INVALID_OPTION', checks);
        }
        checks.push({ name: 'valid_option', passed: true });

        // ─────────────────────────────────────────
        // Check 7: Timing analysis (security check, not rejection)
        // ─────────────────────────────────────────
        const timeTaken = receivedAt - (roomState.questionStartTime || 0);

        if (timeTaken < this.config.minAnswerTimeMs) {
            // Log but don't reject - could be legitimate
            await this.flagSuspiciousTiming(playerId, roomId, timeTaken, 'VERY_FAST_ANSWER');
            checks.push({
                name: 'timing_analysis',
                passed: true,
                details: `Warning: Very fast answer (${timeTaken}ms)`
            });
        } else if (timeTaken < this.config.suspiciousFastAnswerMs) {
            // Log for monitoring
            await this.flagSuspiciousTiming(playerId, roomId, timeTaken, 'FAST_ANSWER');
            checks.push({
                name: 'timing_analysis',
                passed: true,
                details: `Note: Fast answer (${timeTaken}ms)`
            });
        } else {
            checks.push({ name: 'timing_analysis', passed: true });
        }

        // All checks passed
        return {
            valid: true,
            checks,
        };
    }

    /**
     * Quick validation for rate limiting
     */
    async quickValidate(
        playerId: string,
        roomId: string,
        questionIndex: number
    ): Promise<boolean> {
        const pipeline = this.redis.pipeline();

        pipeline.sismember(`room:${roomId}:players`, playerId);
        pipeline.hget(`room:${roomId}:q:${questionIndex}:answers`, playerId);

        const results = await pipeline.exec();

        if (!results) return false;

        const [isInRoom, existingAnswer] = results.map(r => r?.[1]);

        return isInRoom === 1 && existingAnswer === null;
    }

    /**
     * Create failed validation result
     */
    private failedResult(reason: ValidationReason, checks: ValidationCheck[]): ValidationResult {
        return {
            valid: false,
            reason,
            checks,
        };
    }

    /**
     * Parse room state from Redis hash
     */
    private parseRoomState(raw: Record<string, string>): RoomState {
        return {
            roomId: raw.roomId || '',
            status: raw.status as RoomState['status'] || 'CREATED',
            currentQuestionIndex: parseInt(raw.currentQuestionIndex) || 0,
            totalQuestions: parseInt(raw.totalQuestions) || 0,
            questionStartTime: raw.questionStartTime ? parseInt(raw.questionStartTime) : undefined,
            questionEndTime: raw.questionEndTime ? parseInt(raw.questionEndTime) : undefined,
            pausedAt: raw.pausedAt ? parseInt(raw.pausedAt) : undefined,
            remainingWhenPaused: raw.remainingWhenPaused ? parseInt(raw.remainingWhenPaused) : undefined,
            adminId: raw.adminId || '',
            settings: raw.settings ? JSON.parse(raw.settings) : {},
        };
    }

    /**
     * Flag suspicious timing for anti-cheat
     */
    private async flagSuspiciousTiming(
        playerId: string,
        roomId: string,
        timeTakenMs: number,
        type: string
    ): Promise<void> {
        const flagKey = `room:${roomId}:flags:${playerId}`;

        await this.redis.hincrby(flagKey, 'suspiciousTimingCount', 1);
        await this.redis.rpush(
            `${flagKey}:patterns`,
            JSON.stringify({
                type,
                timeTakenMs,
                timestamp: Date.now(),
            })
        );
        await this.redis.expire(flagKey, 86400); // 24 hour TTL
        await this.redis.expire(`${flagKey}:patterns`, 86400);
    }
}

/**
 * Answer storage and retrieval
 */
export class AnswerStore {
    private redis: Redis;

    constructor(redis: Redis) {
        this.redis = redis;
    }

    /**
     * Store an answer atomically
     */
    async storeAnswer(
        roomId: string,
        questionIndex: number,
        playerId: string,
        answer: StoredAnswer
    ): Promise<boolean> {
        const key = `room:${roomId}:q:${questionIndex}:answers`;

        // Use HSETNX for atomic check-and-set
        const result = await this.redis.hsetnx(key, playerId, JSON.stringify(answer));

        if (result === 1) {
            // Set TTL
            await this.redis.expire(key, 86400);
            return true;
        }

        return false;
    }

    /**
     * Get answer for a player
     */
    async getAnswer(
        roomId: string,
        questionIndex: number,
        playerId: string
    ): Promise<StoredAnswer | null> {
        const key = `room:${roomId}:q:${questionIndex}:answers`;
        const raw = await this.redis.hget(key, playerId);

        if (!raw) return null;

        try {
            return JSON.parse(raw) as StoredAnswer;
        } catch {
            return null;
        }
    }

    /**
     * Get all answers for a question
     */
    async getAllAnswers(
        roomId: string,
        questionIndex: number
    ): Promise<Map<string, StoredAnswer>> {
        const key = `room:${roomId}:q:${questionIndex}:answers`;
        const raw = await this.redis.hgetall(key);

        const answers = new Map<string, StoredAnswer>();

        for (const [playerId, data] of Object.entries(raw)) {
            try {
                answers.set(playerId, JSON.parse(data) as StoredAnswer);
            } catch {
                console.error(`Failed to parse answer for player ${playerId}`);
            }
        }

        return answers;
    }

    /**
     * Count answers for a question
     */
    async countAnswers(roomId: string, questionIndex: number): Promise<number> {
        const key = `room:${roomId}:q:${questionIndex}:answers`;
        return await this.redis.hlen(key);
    }

    /**
     * Clear answers for a question (for restart)
     */
    async clearAnswers(roomId: string, questionIndex: number): Promise<void> {
        const key = `room:${roomId}:q:${questionIndex}:answers`;
        await this.redis.del(key);
    }

    /**
     * Update player answer status
     */
    async updatePlayerStatus(
        roomId: string,
        playerId: string,
        status: 'PENDING' | 'ANSWERED' | 'SKIPPED'
    ): Promise<void> {
        await this.redis.hset(`room:${roomId}:playerStatus`, playerId, status);
    }

    /**
     * Get all player statuses
     */
    async getAllPlayerStatuses(
        roomId: string
    ): Promise<Map<string, 'PENDING' | 'ANSWERED' | 'SKIPPED'>> {
        const raw = await this.redis.hgetall(`room:${roomId}:playerStatus`);
        const statuses = new Map<string, 'PENDING' | 'ANSWERED' | 'SKIPPED'>();

        for (const [playerId, status] of Object.entries(raw)) {
            statuses.set(playerId, status as 'PENDING' | 'ANSWERED' | 'SKIPPED');
        }

        return statuses;
    }

    /**
     * Reset all player statuses to pending
     */
    async resetPlayerStatuses(roomId: string): Promise<void> {
        const players = await this.redis.smembers(`room:${roomId}:players`);

        if (players.length === 0) return;

        const pipeline = this.redis.pipeline();
        for (const playerId of players) {
            pipeline.hset(`room:${roomId}:playerStatus`, playerId, 'PENDING');
        }
        await pipeline.exec();
    }
}
