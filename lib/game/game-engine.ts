/**
 * ============================================================================
 * GAME ENGINE - PRODUCTION READY (UNIFIED)
 * ============================================================================
 * 
 * 🎯 GOLDEN RULE: SERVER IS THE SINGLE SOURCE OF TRUTH
 * 
 * This file contains ALL game logic in one clean, organized place:
 * 
 * ├── Constants & Configuration
 * ├── Types & Interfaces  
 * ├── Question Management (load, start)
 * ├── Answer Handling (record only, no scoring)
 * ├── Scoring (ONLY in endQuestion)
 * ├── FFA Locking (atomic operations)
 * ├── Timer Enforcement (server-side)
 * └── Game Results
 * 
 * ⚠️ STRICT RULES:
 * - submitAnswer() NEVER updates scores
 * - endQuestion() is THE ONLY place for scoring
 * - No client-side logic affects game state
 * - All timing is server-controlled
 * 
 * @author Game Quiz System
 * @version 2.0.0 - Production Ready
 */

import { redis, REDIS_KEYS, setTimerState, clearTimerState, getTimerState, TimerState } from '../redis';
import { getRoom, getPlayersInRoom, getPlayer, updateRoomStatus } from './room-manager';
import {
    QuestionState,
    PlayerAnswer,
    GameQuestion,
    GameResults,
    PlayerResult,
} from './types';
import {
    questionStartEvent,
    questionResultEvent,
    gameEndedEvent,
    playerAnsweredEvent
} from './event-manager';
import { createClient } from '../supabase';
import { logger } from '@/lib/utils/logger';

// ============================================================================
// CONFIGURATION - SINGLE SOURCE OF TRUTH
// ============================================================================

/** Scoring Configuration */
export const SCORING_CONFIG = {
    /** Base points for correct answer */
    CORRECT: 100,
    /** Bonus for answering within speed threshold */
    SPEED_BONUS: 50,
    /** Bonus for maintaining streak */
    STREAK_BONUS: 25,
    /** Time threshold for speed bonus (seconds) */
    SPEED_THRESHOLD: 5,
    /** Minimum streak for bonus */
    STREAK_THRESHOLD: 3,
} as const;

/** Timing Configuration */
export const TIMING_CONFIG = {
    /** Delay before next question (ms) */
    NEXT_QUESTION_DELAY: 3000,
    /** Buffer for late answers due to network latency (ms) */
    ANSWER_BUFFER: 2000,
    /** FFA lock expiry (seconds) */
    FFA_LOCK_EXPIRY: 60,
} as const;

// ============================================================================
// TYPES
// ============================================================================

interface LessonQuestionDBRow {
    id: string;
    text: { ar?: string; en?: string };
    options: unknown;
    correct_option_id?: string;
    correct_answer?: unknown;
    difficulty: string;
}

export interface AnswerResult {
    success: boolean;
    recorded: boolean;
    isCorrect?: boolean;
    alreadyLocked?: boolean;
    error?: string;
}

export interface QuestionEndResult {
    success: boolean;
    correctAnswer?: number;
    winnerId?: string;
    winnerName?: string;
    scores?: ScoreUpdate[];
    shouldEndGame?: boolean;
    rankings?: PlayerRanking[];
    error?: string;
}

export interface ScoreUpdate {
    odUserId: string;
    odDisplayName: string;
    score: number;
    delta: number;
    isCorrect: boolean;
    responseTime?: number;
}

export interface PlayerRanking {
    odUserId: string;
    odDisplayName: string;
    score: number;
    rank: number;
}

export interface QuestionStartResult {
    success: boolean;
    questionNumber?: number;
    question?: { question: string; options: string[] };
    timeLimit?: number;
    endsAt?: number;
    error?: string;
}

// ============================================================================
// PRIVATE HELPERS
// ============================================================================

/** Generate FFA lock key */
const ffaLockKey = (code: string, qNum: number) => `ffa:lock:${code}:${qNum}`;

/** Generate next question schedule key */
const nextQuestionKey = (code: string) => `${REDIS_KEYS.room(code)}:nextQuestionAt`;

/** Default questions for fallback */
const DEFAULT_QUESTIONS: GameQuestion[] = [
    { id: '1', question: "ما جمع كلمة 'كتاب'؟", options: ['كتب', 'كتابات', 'كتابين', 'كتّاب'], correctAnswer: 0, category: 'arabic', difficulty: 'easy' },
    { id: '2', question: "ما مفرد كلمة 'أصدقاء'؟", options: ['صديق', 'صداقة', 'أصدق', 'صدق'], correctAnswer: 0, category: 'arabic', difficulty: 'easy' },
    { id: '3', question: "أي كلمة اسم؟", options: ['يكتب', 'جميل', 'من', 'إلى'], correctAnswer: 1, category: 'arabic', difficulty: 'medium' },
    { id: '4', question: "ما ضد كلمة 'كبير'؟", options: ['عظيم', 'صغير', 'ضخم', 'واسع'], correctAnswer: 1, category: 'arabic', difficulty: 'easy' },
    { id: '5', question: "ما نوع الجملة: ذهب الطالب؟", options: ['اسمية', 'فعلية', 'شرطية', 'استفهامية'], correctAnswer: 1, category: 'arabic', difficulty: 'medium' },
    { id: '6', question: "What is the past tense of 'go'?", options: ['goed', 'went', 'gone', 'going'], correctAnswer: 1, category: 'english', difficulty: 'easy' },
    { id: '7', question: "Choose the correct: She ___ to school.", options: ['go', 'goes', 'going', 'gone'], correctAnswer: 1, category: 'english', difficulty: 'easy' },
    { id: '8', question: "ما إعراب المبتدأ؟", options: ['منصوب', 'مجرور', 'مرفوع', 'مجزوم'], correctAnswer: 2, category: 'arabic', difficulty: 'medium' },
    { id: '9', question: "أي من التالي حرف جر؟", options: ['هو', 'من', 'ذهب', 'كتاب'], correctAnswer: 1, category: 'arabic', difficulty: 'easy' },
    { id: '10', question: "The opposite of 'happy' is?", options: ['glad', 'sad', 'excited', 'joyful'], correctAnswer: 1, category: 'english', difficulty: 'easy' },
    { id: '11', question: "ما معنى كلمة 'magnificent'?", options: ['صغير', 'رائع', 'سيء', 'بطيء'], correctAnswer: 1, category: 'english', difficulty: 'medium' },
    { id: '12', question: "اختر الفعل الماضي:", options: ['يلعب', 'لعب', 'العب', 'لاعب'], correctAnswer: 1, category: 'arabic', difficulty: 'easy' },
];

// ============================================================================
// SCORING - PRIVATE (only used by endQuestion)
// ============================================================================

/**
 * Calculate points for an answer
 * @private - Only called from endQuestion
 */
function calculatePoints(
    isCorrect: boolean,
    responseTime: number,
    currentStreak: number
): { points: number; newStreak: number } {
    if (!isCorrect) {
        return { points: 0, newStreak: 0 };
    }

    let points = SCORING_CONFIG.CORRECT;
    const newStreak = currentStreak + 1;

    // Speed bonus
    if (responseTime <= SCORING_CONFIG.SPEED_THRESHOLD) {
        points += SCORING_CONFIG.SPEED_BONUS;
    }

    // Streak bonus
    if (newStreak >= SCORING_CONFIG.STREAK_THRESHOLD) {
        points += SCORING_CONFIG.STREAK_BONUS;
    }

    return { points, newStreak };
}

// ============================================================================
// FFA LOCKING - ATOMIC OPERATIONS
// ============================================================================

/**
 * Attempt to acquire FFA lock (first correct answer wins)
 * Uses Redis SETNX for atomic operation - NO RACE CONDITIONS
 */
async function acquireFfaLock(code: string, questionNumber: number, odUserId: string): Promise<boolean> {
    const lockKey = ffaLockKey(code, questionNumber);
    const result = await redis.setnx(lockKey, odUserId);

    if (result === 1) {
        await redis.expire(lockKey, TIMING_CONFIG.FFA_LOCK_EXPIRY);
        return true;
    }
    return false;
}

/**
 * Get FFA winner for a question
 */
async function getFfaWinner(code: string, questionNumber: number): Promise<string | null> {
    return await redis.get(ffaLockKey(code, questionNumber)) as string | null;
}

/**
 * Check if FFA question is locked
 */
async function isFfaLocked(code: string, questionNumber: number): Promise<boolean> {
    return (await redis.exists(ffaLockKey(code, questionNumber))) === 1;
}

// ============================================================================
// QUESTION MANAGEMENT
// ============================================================================

/**
 * Load questions for a game from database
 */
export async function loadQuestions(
    count: number,
    category: string,
    difficulty: string
): Promise<GameQuestion[]> {
    try {
        const supabase = createClient();
        // Use lesson_questions table instead of deprecated questions table
        let query = supabase
            .from('lesson_questions')
            .select('id, text, options, correct_option_id, correct_answer, difficulty')
            .eq('type', 'mcq')
            .eq('is_active', true)
            .limit(count * 2);

        if (difficulty && difficulty !== 'mixed') {
            query = query.eq('difficulty', difficulty as 'easy' | 'medium' | 'hard');
        }

        const { data, error } = await query;

        if (error || !data?.length) {
            logger.warn('Using default questions', { context: 'GameEngine' });
            return DEFAULT_QUESTIONS.slice(0, count);
        }

        // Shuffle and take required count
        const shuffled = (data as LessonQuestionDBRow[]).sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count).map((q) => {
            // Get question text (prefer Arabic, fallback to English)
            const questionText = q.text?.ar || q.text?.en || '';

            // Parse options - they are stored as JSONB array
            let optionsArr: string[] = [];
            if (Array.isArray(q.options)) {
                optionsArr = q.options.map((opt: { text?: { ar?: string; en?: string }; id?: string }) =>
                    opt?.text?.ar || opt?.text?.en || '');
            }

            // Get correct answer index
            let correctAnswer = 0;
            if (q.correct_option_id && Array.isArray(q.options)) {
                correctAnswer = q.options.findIndex((opt: { id?: string }) => opt?.id === q.correct_option_id);
                if (correctAnswer === -1) correctAnswer = 0;
            }

            return {
                id: q.id,
                question: questionText,
                options: optionsArr,
                correctAnswer,
                category: category || 'general',
                difficulty: (q.difficulty as 'easy' | 'medium' | 'hard') || 'medium',
            };
        });
    } catch (error) {
        logger.error('Failed to load questions', { context: 'GameEngine', data: error });
        return DEFAULT_QUESTIONS.slice(0, count);
    }
}

/**
 * Initialize and start a game
 */
export async function startGame(code: string): Promise<{ success: boolean; error?: string }> {
    const room = await getRoom(code);
    if (!room) return { success: false, error: 'الغرفة غير موجودة' };

    if (room.status !== 'waiting') {
        return { success: false, error: 'اللعبة بدأت بالفعل' };
    }

    const players = await getPlayersInRoom(code);
    if (players.length < 2) {
        return { success: false, error: 'يجب أن يكون هناك لاعبان على الأقل' };
    }

    // Load questions
    const questions = await loadQuestions(room.questionCount, room.category, room.difficulty);

    // Store questions
    await redis.hset(REDIS_KEYS.room(code), {
        questionIds: JSON.stringify(questions.map(q => q.id)),
        currentQuestion: 0,
        startedAt: Date.now(),
    });

    for (let i = 0; i < questions.length; i++) {
        await redis.set(`room:${code}:q:${i}`, JSON.stringify(questions[i]), { ex: 3600 });
    }

    await updateRoomStatus(code, 'starting');

    logger.info(`Game started: ${code}`, { context: 'GameEngine' });
    return { success: true };
}

/**
 * Start the next question
 */
export async function startQuestion(code: string): Promise<QuestionStartResult> {
    try {
        const room = await getRoom(code);
        if (!room) {
            return { success: false, error: 'الغرفة غير موجودة' };
        }

        if (room.status !== 'playing' && room.status !== 'starting') {
            return { success: false, error: 'اللعبة غير نشطة' };
        }

        const questionNumber = room.currentQuestion;

        // IDEMPOTENCY: Use atomic SETNX to ensure only one process starts this question
        const processKey = `process:start:${code}:${questionNumber}`;
        const gotLock = await redis.setnx(processKey, Date.now().toString());

        // If we didn't get the lock, check if it was already started by the winner
        if (gotLock !== 1) {
            // Wait briefly to allow the winner to write state
            await new Promise(resolve => setTimeout(resolve, 500));
            // Return current state (handled by existing check below)
        } else {
            await redis.expire(processKey, 60);
        }

        // Check if already started (idempotent)
        const existing = await redis.hgetall(REDIS_KEYS.roomQuestion(code, questionNumber));
        if (existing?.startedAt) {
            const questionData = await redis.get(`room:${code}:q:${questionNumber}`);
            const question: GameQuestion = typeof questionData === 'string'
                ? JSON.parse(questionData) : questionData;

            return {
                success: true,
                questionNumber,
                question: { question: question.question, options: question.options },
                timeLimit: room.timePerQuestion,
                endsAt: Number(existing.endsAt),
            };
        }

        // Get question
        const questionData = await redis.get(`room:${code}:q:${questionNumber}`);
        if (!questionData) {
            return { success: false, error: 'السؤال غير موجود' };
        }

        const question: GameQuestion = typeof questionData === 'string'
            ? JSON.parse(questionData) : questionData;

        const now = Date.now();
        const endsAt = now + (room.timePerQuestion * 1000);

        // Create question state
        const questionState: QuestionState = {
            questionId: question.id,
            startedAt: now,
            endsAt,
            playerAnswers: {},
            isComplete: false,
        };

        await redis.hset(
            REDIS_KEYS.roomQuestion(code, questionNumber),
            questionState as unknown as Record<string, string>
        );
        await redis.expire(REDIS_KEYS.roomQuestion(code, questionNumber), 3600);

        // Set timer
        const timerState: TimerState = {
            roomCode: code,
            questionNumber,
            startedAt: now,
            endsAt,
            timeLimit: room.timePerQuestion,
            isPaused: false,
        };
        await setTimerState(timerState);
        await redis.zadd(REDIS_KEYS.activeTimers, { score: endsAt, member: code });

        // Update status
        if (room.status === 'starting') {
            await updateRoomStatus(code, 'playing');
        }

        // Publish event
        await questionStartEvent(code, questionNumber, question.question, question.options, room.timePerQuestion);

        logger.info(`Question ${questionNumber} started: ${code}`, { context: 'GameEngine' });

        return {
            success: true,
            questionNumber,
            question: { question: question.question, options: question.options },
            timeLimit: room.timePerQuestion,
            endsAt,
        };
    } catch (error) {
        logger.error('Failed to start question', { context: 'GameEngine', data: error });
        return { success: false, error: 'خطأ في بدء السؤال' };
    }
}

// ============================================================================
// ANSWER HANDLING - RECORDS ONLY, NO SCORING
// ============================================================================

/**
 * Submit an answer
 * 
 * ⚠️ CRITICAL: This function ONLY records the answer.
 * It does NOT calculate or update scores.
 * Scoring happens in endQuestion() ONLY.
 */
export async function submitAnswer(
    code: string,
    odUserId: string,
    questionNumber: number,
    answer: number
): Promise<AnswerResult> {
    try {
        const room = await getRoom(code);
        if (!room || room.status !== 'playing') {
            return { success: false, recorded: false, error: 'اللعبة غير نشطة' };
        }

        const player = await getPlayer(code, odUserId);
        if (!player) {
            return { success: false, recorded: false, error: 'اللاعب غير موجود' };
        }

        // Team mode validation
        if (room.gameMode === 'team' && !player.isCaptain) {
            return { success: false, recorded: false, error: 'القائد فقط يمكنه الإجابة' };
        }

        // Get question state
        const qState = await redis.hgetall(REDIS_KEYS.roomQuestion(code, questionNumber));
        if (!qState) {
            return { success: false, recorded: false, error: 'السؤال غير موجود' };
        }

        if (qState.isComplete === 'true' || qState.isComplete === true) {
            return { success: false, recorded: false, error: 'السؤال انتهى' };
        }

        // Parse answers
        const answers: Record<string, PlayerAnswer> = qState.playerAnswers
            ? (typeof qState.playerAnswers === 'string'
                ? JSON.parse(qState.playerAnswers)
                : qState.playerAnswers)
            : {};

        if (answers[odUserId]) {
            return { success: false, recorded: false, error: 'لقد أجبت بالفعل' };
        }

        // Check time
        const now = Date.now();
        const endsAt = Number(qState.endsAt);
        if (now > endsAt + TIMING_CONFIG.ANSWER_BUFFER) {
            return { success: false, recorded: false, error: 'انتهى الوقت' };
        }

        // Get correct answer
        const questionData = await redis.get(`room:${code}:q:${questionNumber}`);
        if (!questionData) {
            return { success: false, recorded: false, error: 'السؤال غير موجود' };
        }

        const question: GameQuestion = typeof questionData === 'string'
            ? JSON.parse(questionData) : questionData;

        const responseTime = (now - Number(qState.startedAt)) / 1000;
        const isCorrect = answer === question.correctAnswer;

        // FFA: Check lock
        if (room.gameMode === 'ffa' && isCorrect) {
            if (await isFfaLocked(code, questionNumber)) {
                // Record as incorrect (too late)
                answers[odUserId] = {
                    odUserId,
                    answer,
                    timestamp: now,
                    isCorrect: false,
                    responseTime,
                };
                await redis.hset(REDIS_KEYS.roomQuestion(code, questionNumber), {
                    playerAnswers: JSON.stringify(answers),
                });

                return { success: true, recorded: true, isCorrect: false, alreadyLocked: true };
            }
        }

        // Record answer (NO SCORING!)
        answers[odUserId] = {
            odUserId,
            answer,
            timestamp: now,
            isCorrect,
            responseTime,
        };
        await redis.hset(REDIS_KEYS.roomQuestion(code, questionNumber), {
            playerAnswers: JSON.stringify(answers),
        });

        // Update last active only
        await redis.hset(REDIS_KEYS.roomPlayer(code, odUserId), { lastActive: now });

        // FFA: Try to acquire lock
        if (room.gameMode === 'ffa' && isCorrect) {
            const gotLock = await acquireFfaLock(code, questionNumber, odUserId);
            if (gotLock) {
                await redis.hset(REDIS_KEYS.roomQuestion(code, questionNumber), {
                    answeredBy: odUserId,
                    answeredAt: now,
                    isComplete: true,
                });
                logger.info(`FFA Winner: ${odUserId} Q${questionNumber} in ${code}`, { context: 'GameEngine' });
            }
        }

        await playerAnsweredEvent(code, odUserId, player.odDisplayName);

        return { success: true, recorded: true, isCorrect };
    } catch (error) {
        logger.error('Failed to submit answer', { context: 'GameEngine', data: error });
        return { success: false, recorded: false, error: 'خطأ في تسجيل الإجابة' };
    }
}

// ============================================================================
// END QUESTION - THE ONLY PLACE FOR SCORING
// ============================================================================

/**
 * End a question and calculate scores
 * 
 * ⚠️ THIS IS THE ONLY PLACE WHERE SCORES ARE CALCULATED
 */
export async function endQuestion(code: string, questionNumber: number): Promise<QuestionEndResult> {
    try {
        const room = await getRoom(code);
        if (!room) return { success: false, error: 'الغرفة غير موجودة' };

        // IDEMPOTENCY: Use atomic SETNX to ensure only one process handles this
        const processKey = `process:end:${code}:${questionNumber}`;
        const gotLock = await redis.setnx(processKey, Date.now().toString());
        if (gotLock !== 1) {
            // Another process is handling this, return success silently
            return { success: true };
        }
        await redis.expire(processKey, 60);

        // Mark complete
        await redis.hset(REDIS_KEYS.roomQuestion(code, questionNumber), { isComplete: true });

        // Get question
        const questionData = await redis.get(`room:${code}:q:${questionNumber}`);
        if (!questionData) return { success: false, error: 'السؤال غير موجود' };

        const question: GameQuestion = typeof questionData === 'string'
            ? JSON.parse(questionData) : questionData;

        // Get answers
        const qState = await redis.hgetall(REDIS_KEYS.roomQuestion(code, questionNumber));
        const answers: Record<string, PlayerAnswer> = qState?.playerAnswers
            ? (typeof qState.playerAnswers === 'string'
                ? JSON.parse(qState.playerAnswers)
                : qState.playerAnswers)
            : {};

        // Get players and FFA winner
        const players = await getPlayersInRoom(code);
        const ffaWinner = room.gameMode === 'ffa' ? await getFfaWinner(code, questionNumber) : null;

        // Calculate scores for all players
        const scoreUpdates: ScoreUpdate[] = [];

        for (const player of players) {
            const answer = answers[player.odUserId];
            let points = 0;
            let newStreak = player.streak;
            let isCorrect = false;
            let responseTime: number | undefined;

            if (answer) {
                responseTime = answer.responseTime;

                // FFA: only winner gets points
                isCorrect = room.gameMode === 'ffa'
                    ? answer.isCorrect && player.odUserId === ffaWinner
                    : answer.isCorrect;

                if (isCorrect) {
                    const calc = calculatePoints(true, answer.responseTime || 999, player.streak);
                    points = calc.points;
                    newStreak = calc.newStreak;
                }
            }

            // Update player in Redis
            const newScore = player.score + points;
            const update: Record<string, string | number> = {
                score: newScore,
                streak: isCorrect ? newStreak : 0,
                lastActive: Date.now(),
            };

            if (answer) {
                if (isCorrect) {
                    update.correctAnswers = player.correctAnswers + 1;
                } else if (answer.isCorrect === false) {
                    update.wrongAnswers = player.wrongAnswers + 1;
                }
            }

            await redis.hset(REDIS_KEYS.roomPlayer(code, player.odUserId), update);

            scoreUpdates.push({
                odUserId: player.odUserId,
                odDisplayName: player.odDisplayName,
                score: newScore,
                delta: points,
                isCorrect,
                responseTime,
            });
        }

        scoreUpdates.sort((a, b) => b.score - a.score);

        const winnerName = ffaWinner
            ? players.find(p => p.odUserId === ffaWinner)?.odDisplayName || ''
            : '';

        // Check if last question
        const isLast = questionNumber >= room.questionCount - 1;

        if (isLast) {
            await updateRoomStatus(code, 'finished');
            await clearTimerState(code);

            const rankings: PlayerRanking[] = scoreUpdates.map((s, i) => ({
                odUserId: s.odUserId,
                odDisplayName: s.odDisplayName,
                score: s.score,
                rank: i + 1,
            }));

            await questionResultEvent(
                code, questionNumber, question.correctAnswer,
                ffaWinner || undefined, winnerName,
                scoreUpdates.map(s => ({ odUserId: s.odUserId, score: s.score, delta: s.delta }))
            );

            await gameEndedEvent(code, {
                winnerId: rankings[0]?.odUserId,
                winnerName: rankings[0]?.odDisplayName,
                rankings,
            });

            logger.info(`Game ended: ${code}`, { context: 'GameEngine' });

            return {
                success: true,
                correctAnswer: question.correctAnswer,
                winnerId: ffaWinner || undefined,
                winnerName,
                scores: scoreUpdates,
                shouldEndGame: true,
                rankings,
            };
        }

        // Advance
        await redis.hset(REDIS_KEYS.room(code), { currentQuestion: questionNumber + 1 });

        await questionResultEvent(
            code, questionNumber, question.correctAnswer,
            ffaWinner || undefined, winnerName,
            scoreUpdates.map(s => ({ odUserId: s.odUserId, score: s.score, delta: s.delta }))
        );

        // Schedule next
        await scheduleNextQuestion(code);

        logger.info(`Question ${questionNumber} ended: ${code}`, { context: 'GameEngine' });

        return {
            success: true,
            correctAnswer: question.correctAnswer,
            winnerId: ffaWinner || undefined,
            winnerName,
            scores: scoreUpdates,
            shouldEndGame: false,
        };
    } catch (error) {
        logger.error('Failed to end question', { context: 'GameEngine', data: error });
        return { success: false, error: 'خطأ في إنهاء السؤال' };
    }
}

/**
 * Force end question (FFA winner)
 */
export async function forceEndQuestion(code: string): Promise<QuestionEndResult> {
    const room = await getRoom(code);
    if (!room) return { success: false, error: 'الغرفة غير موجودة' };

    await clearTimerState(code);
    await redis.zrem(REDIS_KEYS.activeTimers, code);

    return await endQuestion(code, room.currentQuestion);
}

// ============================================================================
// TIMER SCHEDULING
// ============================================================================

/**
 * Schedule next question start
 */
async function scheduleNextQuestion(code: string): Promise<void> {
    const startTime = Date.now() + TIMING_CONFIG.NEXT_QUESTION_DELAY;
    await redis.set(nextQuestionKey(code), startTime, { ex: 60 });
}

/**
 * Check if next question should start
 */
export async function checkNextQuestionSchedule(code: string): Promise<{ shouldStart: boolean; startTime?: number }> {
    const startTimeStr = await redis.get(nextQuestionKey(code));
    if (!startTimeStr) return { shouldStart: false };

    const startTime = Number(startTimeStr);
    if (Date.now() >= startTime) {
        await redis.del(nextQuestionKey(code));
        return { shouldStart: true, startTime };
    }

    return { shouldStart: false, startTime };
}

/**
 * Process expired timers (called by SSE polling)
 */
export async function processExpiredTimers(): Promise<string[]> {
    const processed: string[] = [];
    const now = Date.now();

    try {
        const expired = await redis.zrange(REDIS_KEYS.activeTimers, 0, now, { byScore: true }) as string[];

        for (const roomCode of expired) {
            try {
                const timerState = await redis.hgetall(REDIS_KEYS.roomTimer(roomCode));
                if (!timerState?.endsAt) {
                    await redis.zrem(REDIS_KEYS.activeTimers, roomCode);
                    continue;
                }

                if (Date.now() >= Number(timerState.endsAt)) {
                    await endQuestion(roomCode, Number(timerState.questionNumber));
                    await redis.zrem(REDIS_KEYS.activeTimers, roomCode);
                    processed.push(roomCode);
                }
            } catch (err) {
                logger.error(`Timer error: ${roomCode}`, { context: 'GameEngine', data: err });
            }
        }
    } catch (error) {
        logger.error('Failed to process timers', { context: 'GameEngine', data: error });
    }

    return processed;
}

// ============================================================================
// GAME RESULTS
// ============================================================================

/**
 * Get final game results
 */
export async function getGameResults(code: string): Promise<GameResults | null> {
    const room = await getRoom(code);
    if (!room) return null;

    const players = await getPlayersInRoom(code);
    const sorted = players.sort((a, b) => b.score - a.score);

    const results: PlayerResult[] = sorted.map((p, i) => ({
        odUserId: p.odUserId,
        odDisplayName: p.odDisplayName,
        avatar: p.avatar,
        score: p.score,
        correctAnswers: p.correctAnswers,
        wrongAnswers: p.wrongAnswers,
        averageResponseTime: 0,
        longestStreak: p.streak,
        rank: i + 1,
    }));

    return {
        roomCode: code,
        gameMode: room.gameMode,
        players: results,
        winner: results[0],
        totalQuestions: room.questionCount,
        gameDuration: room.startedAt ? Math.floor((Date.now() - room.startedAt) / 1000) : 0,
    };
}

/**
 * Get current question state
 */
export async function getCurrentQuestion(code: string): Promise<{
    question: GameQuestion;
    questionNumber: number;
    timeRemaining: number;
} | null> {
    const room = await getRoom(code);
    if (!room || room.status !== 'playing') return null;

    const questionNumber = room.currentQuestion;
    const questionData = await redis.get(`room:${code}:q:${questionNumber}`);
    if (!questionData) return null;

    const question: GameQuestion = typeof questionData === 'string'
        ? JSON.parse(questionData) : questionData;

    const qState = await redis.hgetall(REDIS_KEYS.roomQuestion(code, questionNumber));
    const endsAt = Number(qState?.endsAt || 0);

    return {
        question,
        questionNumber,
        timeRemaining: Math.max(0, Math.floor((endsAt - Date.now()) / 1000)),
    };
}

/**
 * Get timer info
 */
export async function getTimerInfo(code: string): Promise<{
    timeRemaining: number;
    questionNumber: number;
    endsAt: number;
} | null> {
    const state = await getTimerState(code);
    if (!state) return null;

    return {
        timeRemaining: Math.max(0, Math.ceil((state.endsAt - Date.now()) / 1000)),
        questionNumber: state.questionNumber,
        endsAt: state.endsAt,
    };
}
