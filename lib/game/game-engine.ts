import { redis, REDIS_KEYS } from '../redis';
import { getRoom, getPlayersInRoom, getPlayer, updateRoomStatus } from './room-manager';
import {
    QuestionState,
    PlayerAnswer,
    GameQuestion,
    RoomConfig,
    RoomPlayer,
    GameResults,
    PlayerResult,
} from './types';
import { supabase } from '../supabase';

/**
 * Game Engine - Handles game flow, questions, and scoring
 */

// Scoring Constants
const POINTS_CORRECT = 100;
const POINTS_SPEED_BONUS = 50; // If answered in first 5 seconds
const POINTS_STREAK_BONUS = 25; // For 3+ streak
const SPEED_BONUS_THRESHOLD = 5; // Seconds

// Load questions for a game
export async function loadQuestionsForGame(
    questionCount: number,
    category: string,
    difficulty: string
): Promise<GameQuestion[]> {
    // Fetch questions from Supabase (adjust table name as needed)
    let query = supabase
        .from('questions')
        .select('*')
        .limit(questionCount * 2); // Fetch more than needed for randomization

    if (category && category !== 'general') {
        query = query.eq('category', category);
    }

    if (difficulty && difficulty !== 'mixed') {
        query = query.eq('difficulty', difficulty as 'easy' | 'medium' | 'hard');
    }

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
        // Return default questions if database fails
        return getDefaultQuestions(questionCount);
    }

    // Shuffle and take required count
    const shuffled = data.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, questionCount).map((q: any) => ({
        id: q.id,
        question: q.question_text,
        options: typeof q.options === 'string' ? JSON.parse(q.options) : (q.options || []),
        correctAnswer: typeof q.correct_answer === 'number' ? q.correct_answer : parseInt(q.correct_answer || '0', 10),
        category: 'general', // TODO: Add category column to questions table if needed
        difficulty: (q.difficulty as 'easy' | 'medium' | 'hard') || 'medium',
    }));
}

// Default questions fallback
function getDefaultQuestions(count: number): GameQuestion[] {
    const defaults: GameQuestion[] = [
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

    return defaults.slice(0, count);
}

// Start a game
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
    const questions = await loadQuestionsForGame(
        room.questionCount,
        room.category,
        room.difficulty
    );

    // Store question IDs in room
    const questionIds = questions.map(q => q.id);
    await redis.hset(REDIS_KEYS.room(code), {
        questionIds: JSON.stringify(questionIds),
        currentQuestion: 0,
    });

    // Store questions temporarily
    for (let i = 0; i < questions.length; i++) {
        await redis.set(`room:${code}:q:${i}`, JSON.stringify(questions[i]), { ex: 3600 });
    }

    // Update room status
    await updateRoomStatus(code, 'starting');

    return { success: true };
}

// Start next question
export async function startQuestion(code: string): Promise<{
    success: boolean;
    question?: GameQuestion;
    questionNumber?: number;
    error?: string;
}> {
    const room = await getRoom(code);
    if (!room) return { success: false, error: 'الغرفة غير موجودة' };

    const questionNumber = room.currentQuestion;

    // Get question data
    const questionData = await redis.get(`room:${code}:q:${questionNumber}`);
    if (!questionData) {
        return { success: false, error: 'السؤال غير موجود' };
    }

    const question: GameQuestion = typeof questionData === 'string'
        ? JSON.parse(questionData)
        : questionData;

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

    // Update room status to playing if starting
    if (room.status === 'starting') {
        await updateRoomStatus(code, 'playing');
    }

    return { success: true, question, questionNumber };
}

// Submit an answer
export async function submitAnswer(
    code: string,
    odUserId: string,
    questionNumber: number,
    answer: number
): Promise<{
    success: boolean;
    isCorrect?: boolean;
    points?: number;
    error?: string;
}> {
    const room = await getRoom(code);
    if (!room || room.status !== 'playing') {
        return { success: false, error: 'اللعبة غير نشطة' };
    }

    const player = await getPlayer(code, odUserId);
    if (!player) {
        return { success: false, error: 'اللاعب غير موجود' };
    }

    // Team mode - only captain can answer
    if (room.gameMode === 'team' && !player.isCaptain) {
        return { success: false, error: 'القائد فقط يمكنه الإجابة' };
    }

    // Get question state
    const qStateData = await redis.hgetall(REDIS_KEYS.roomQuestion(code, questionNumber));
    if (!qStateData || qStateData.isComplete === 'true') {
        return { success: false, error: 'السؤال انتهى' };
    }

    // Check if already answered
    const playerAnswers = typeof qStateData.playerAnswers === 'string'
        ? JSON.parse(qStateData.playerAnswers)
        : qStateData.playerAnswers || {};

    if (playerAnswers[odUserId]) {
        return { success: false, error: 'لقد أجبت بالفعل' };
    }

    // Get correct answer
    const questionData = await redis.get(`room:${code}:q:${questionNumber}`);
    const question: GameQuestion = typeof questionData === 'string'
        ? JSON.parse(questionData)
        : questionData;

    const now = Date.now();
    const startedAt = Number(qStateData.startedAt);
    const responseTime = (now - startedAt) / 1000;
    const isCorrect = answer === question.correctAnswer;

    // Record answer
    const playerAnswer: PlayerAnswer = {
        odUserId,
        answer,
        timestamp: now,
        isCorrect,
        responseTime,
    };

    playerAnswers[odUserId] = playerAnswer;
    await redis.hset(REDIS_KEYS.roomQuestion(code, questionNumber), {
        playerAnswers: JSON.stringify(playerAnswers),
    });

    // Calculate points
    let points = 0;
    let newStreak = player.streak;

    if (isCorrect) {
        points = POINTS_CORRECT;

        // Speed bonus
        if (responseTime <= SPEED_BONUS_THRESHOLD) {
            points += POINTS_SPEED_BONUS;
        }

        // Streak bonus
        newStreak = player.streak + 1;
        if (newStreak >= 3) {
            points += POINTS_STREAK_BONUS;
        }

        // Update player stats
        await redis.hset(REDIS_KEYS.roomPlayer(code, odUserId), {
            score: player.score + points,
            correctAnswers: player.correctAnswers + 1,
            streak: newStreak,
            lastActive: now,
        });

        // FFA Mode: First correct answer wins the round
        if (room.gameMode === 'ffa' && !qStateData.answeredBy) {
            await redis.hset(REDIS_KEYS.roomQuestion(code, questionNumber), {
                answeredBy: odUserId,
                answeredAt: now,
                isComplete: true,
            });
        }
    } else {
        newStreak = 0;
        await redis.hset(REDIS_KEYS.roomPlayer(code, odUserId), {
            wrongAnswers: player.wrongAnswers + 1,
            streak: 0,
            lastActive: now,
        });
    }

    return { success: true, isCorrect, points };
}

// End current question (called when timer expires or all answered)
export async function endQuestion(code: string, questionNumber: number): Promise<{
    success: boolean;
    correctAnswer?: number;
    winner?: string;
    shouldEndGame?: boolean;
}> {
    const room = await getRoom(code);
    if (!room) return { success: false };

    // Mark question as complete
    await redis.hset(REDIS_KEYS.roomQuestion(code, questionNumber), {
        isComplete: true,
    });

    // Get question data for correct answer
    const questionData = await redis.get(`room:${code}:q:${questionNumber}`);
    const question: GameQuestion = typeof questionData === 'string'
        ? JSON.parse(questionData)
        : questionData;

    // Get winner (first correct answer)
    const qStateData = await redis.hgetall(REDIS_KEYS.roomQuestion(code, questionNumber));
    const winner = qStateData?.answeredBy as string | undefined;

    // Check if this was the last question
    const isLastQuestion = questionNumber >= room.questionCount - 1;

    if (isLastQuestion) {
        await updateRoomStatus(code, 'finished');
        return { success: true, correctAnswer: question.correctAnswer, winner, shouldEndGame: true };
    }

    // Advance to next question
    await redis.hset(REDIS_KEYS.room(code), {
        currentQuestion: questionNumber + 1,
    });

    return { success: true, correctAnswer: question.correctAnswer, winner, shouldEndGame: false };
}

// Get game results
export async function getGameResults(code: string): Promise<GameResults | null> {
    const room = await getRoom(code);
    if (!room) return null;

    const players = await getPlayersInRoom(code);

    // Sort by score
    const sortedPlayers = players.sort((a, b) => b.score - a.score);

    const playerResults: PlayerResult[] = sortedPlayers.map((p, index) => ({
        odUserId: p.odUserId,
        odDisplayName: p.odDisplayName,
        avatar: p.avatar,
        score: p.score,
        correctAnswers: p.correctAnswers,
        wrongAnswers: p.wrongAnswers,
        averageResponseTime: 0, // Would need to calculate from question states
        longestStreak: p.streak,
        rank: index + 1,
    }));

    const gameDuration = room.startedAt
        ? Math.floor((Date.now() - room.startedAt) / 1000)
        : 0;

    return {
        roomCode: code,
        gameMode: room.gameMode,
        players: playerResults,
        winner: playerResults[0],
        totalQuestions: room.questionCount,
        gameDuration,
    };
}

// Get current question for a room
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
        ? JSON.parse(questionData)
        : questionData;

    const qStateData = await redis.hgetall(REDIS_KEYS.roomQuestion(code, questionNumber));
    const endsAt = Number(qStateData?.endsAt || 0);
    const timeRemaining = Math.max(0, Math.floor((endsAt - Date.now()) / 1000));

    return { question, questionNumber, timeRemaining };
}
