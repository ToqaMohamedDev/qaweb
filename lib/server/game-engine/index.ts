/**
 * Game Engine
 * Core game logic orchestrator - Server Authoritative
 */

import { EventEmitter } from 'events';
import type Redis from 'ioredis';
import type { Server as SocketIOServer, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { nanoid } from 'nanoid';

import { GameStateMachine, QuestionStateMachine } from './state-machine';
import { GameTimer, TimerManager } from './timer';
import { AnswerValidator, AnswerStore } from './answer-validator';
import { ScoreCalculator, GameResultsCalculator } from './score-calculator';

import type {
    Room,
    RoomState,
    RoomSettings,
    RoomStatus,
    Question,
    QuestionPayload,
    Player,
    Team,
    AnswerSubmission,
    QuestionResults,
    Leaderboard,
    DEFAULT_ROOM_SETTINGS,
} from '../types/index';

import type {
    ServerToClientEvents,
    ClientToServerEvents,
    QuestionStartPayload,
    QuestionResultsPayload,
    GameEndedPayload,
} from '../types/socket-events';

export interface GameEngineConfig {
    questionTimeSeconds: number;
    resultsDisplaySeconds: number;
    countdownSeconds: number;
    gracePeriodMs: number;
    syncIntervalMs: number;
}

const DEFAULT_CONFIG: GameEngineConfig = {
    questionTimeSeconds: 10,
    resultsDisplaySeconds: 5,
    countdownSeconds: 3,
    gracePeriodMs: 200,
    syncIntervalMs: 1000,
};

interface GameRoom {
    id: string;
    code: string;
    adminId: string;
    settings: RoomSettings;
    stateMachine: GameStateMachine;
    questionStateMachine: QuestionStateMachine;
    timer: GameTimer;
    questions: Question[];
    players: Map<string, Player>;
    teams: Map<string, Team>;
    createdAt: Date;
    startedAt?: Date;
    endedAt?: Date;
}

export class GameEngine extends EventEmitter {
    private redis: Redis;
    private io: SocketIOServer;
    private config: GameEngineConfig;
    private rooms: Map<string, GameRoom> = new Map();
    private timerManager: TimerManager;
    private answerValidator: AnswerValidator;
    private answerStore: AnswerStore;
    private scoreCalculator: ScoreCalculator;
    private resultsCalculator: GameResultsCalculator;

    constructor(
        redis: Redis,
        io: SocketIOServer,
        config: Partial<GameEngineConfig> = {}
    ) {
        super();
        this.redis = redis;
        this.io = io;
        this.config = { ...DEFAULT_CONFIG, ...config };

        this.timerManager = new TimerManager(redis, {
            syncIntervalMs: this.config.syncIntervalMs,
            gracePeriodMs: this.config.gracePeriodMs,
        });

        this.answerValidator = new AnswerValidator(redis, {
            gracePeriodMs: this.config.gracePeriodMs,
        });

        this.answerStore = new AnswerStore(redis);
        this.scoreCalculator = new ScoreCalculator(redis);
        this.resultsCalculator = new GameResultsCalculator(redis);
    }

    // ═══════════════════════════════════════════════════════════
    // ROOM MANAGEMENT
    // ═══════════════════════════════════════════════════════════

    /**
     * Create a new game room
     */
    async createRoom(
        adminId: string,
        title: string,
        settings: Partial<RoomSettings> = {}
    ): Promise<{ room: GameRoom; inviteToken: string }> {
        const roomId = uuidv4();
        const roomCode = this.generateRoomCode();
        const inviteToken = nanoid(32);

        return this.createRoomWithCode(adminId, roomCode, title, settings, inviteToken);
    }

    /**
     * Create a new game room with a specific code
     */
    async createRoomWithCode(
        adminId: string,
        roomCode: string,
        title: string,
        settings: Partial<RoomSettings> = {},
        inviteToken?: string
    ): Promise<{ room: GameRoom; inviteToken: string }> {
        const roomId = uuidv4();
        const finalInviteToken = inviteToken || nanoid(32);

        // Check if room code already exists
        const existingRoomId = await this.redis.get(`roomCode:${roomCode.toUpperCase()}`);
        if (existingRoomId) {
            throw new Error(`Room code ${roomCode.toUpperCase()} already exists`);
        }

        const fullSettings: RoomSettings = {
            maxTeams: settings.maxTeams ?? 10,
            maxPlayersPerTeam: settings.maxPlayersPerTeam ?? 5,
            questionTimeSeconds: settings.questionTimeSeconds ?? this.config.questionTimeSeconds,
            showResultsSeconds: settings.showResultsSeconds ?? this.config.resultsDisplaySeconds,
            countdownSeconds: settings.countdownSeconds ?? this.config.countdownSeconds,
            allowReconnect: settings.allowReconnect ?? true,
            reconnectTimeoutSeconds: settings.reconnectTimeoutSeconds ?? 60,
            shuffleQuestions: settings.shuffleQuestions ?? false,
            shuffleOptions: settings.shuffleOptions ?? false,
        };

        const room: GameRoom = {
            id: roomId,
            code: roomCode.toUpperCase(),
            adminId,
            settings: fullSettings,
            stateMachine: new GameStateMachine('CREATED'),
            questionStateMachine: new QuestionStateMachine(),
            timer: this.timerManager.getTimer(roomId, {
                duration: fullSettings.questionTimeSeconds * 1000,
            }),
            questions: [],
            players: new Map(),
            teams: new Map(),
            createdAt: new Date(),
        };

        // Setup timer events
        this.setupTimerEvents(room);

        // Store in memory
        this.rooms.set(roomId, room);

        // Persist to Redis
        await this.persistRoomState(room);
        await this.redis.hset(`room:${roomId}:meta`, {
            code: roomCode.toUpperCase(),
            adminId,
            inviteToken: finalInviteToken,
            title,
            createdAt: room.createdAt.toISOString(),
        });
        await this.redis.set(`roomCode:${roomCode.toUpperCase()}`, roomId);
        await this.redis.set(`inviteToken:${finalInviteToken}`, roomId);

        // Transition to WAITING
        room.stateMachine.transition('WAITING', {
            roomId,
            initiatedBy: adminId,
            reason: 'Room created',
        });

        await this.persistRoomState(room);

        return { room, inviteToken: finalInviteToken };
    }

    /**
     * Get room by ID
     */
    getRoom(roomId: string): GameRoom | undefined {
        return this.rooms.get(roomId);
    }

    /**
     * Get room by code
     */
    async getRoomByCode(code: string): Promise<GameRoom | null> {
        const roomId = await this.redis.get(`roomCode:${code.toUpperCase()}`);
        if (!roomId) return null;

        // Check if room is in memory
        const existingRoom = this.rooms.get(roomId);
        if (existingRoom) return existingRoom;

        // Try to load room from Redis
        const loadedRoom = await this.loadRoomFromRedis(roomId);
        return loadedRoom;
    }

    /**
     * Load room from Redis into memory
     */
    private async loadRoomFromRedis(roomId: string): Promise<GameRoom | null> {
        try {
            // Get room metadata
            const meta = await this.redis.hgetall(`room:${roomId}:meta`);
            if (!meta || !meta.code) return null;

            // Get room state
            const state = await this.redis.hgetall(`room:${roomId}:state`);

            // Parse settings
            let settings: RoomSettings;
            try {
                settings = state.settings ? JSON.parse(state.settings) : {
                    maxTeams: 10,
                    maxPlayersPerTeam: 5,
                    questionTimeSeconds: this.config.questionTimeSeconds,
                    showResultsSeconds: this.config.resultsDisplaySeconds,
                    countdownSeconds: this.config.countdownSeconds,
                    allowReconnect: true,
                    reconnectTimeoutSeconds: 60,
                    shuffleQuestions: false,
                    shuffleOptions: false,
                };
            } catch {
                settings = {
                    maxTeams: 10,
                    maxPlayersPerTeam: 5,
                    questionTimeSeconds: this.config.questionTimeSeconds,
                    showResultsSeconds: this.config.resultsDisplaySeconds,
                    countdownSeconds: this.config.countdownSeconds,
                    allowReconnect: true,
                    reconnectTimeoutSeconds: 60,
                    shuffleQuestions: false,
                    shuffleOptions: false,
                };
            }

            // Create room object
            const room: GameRoom = {
                id: roomId,
                code: meta.code.toUpperCase(),
                adminId: meta.adminId,
                settings,
                stateMachine: new GameStateMachine('WAITING'),
                questionStateMachine: new QuestionStateMachine(),
                timer: this.timerManager.getTimer(roomId, {
                    duration: settings.questionTimeSeconds * 1000,
                }),
                questions: [],
                players: new Map(),
                teams: new Map(),
                createdAt: meta.createdAt ? new Date(meta.createdAt) : new Date(),
            };

            // Setup timer events
            this.setupTimerEvents(room);

            // Store in memory
            this.rooms.set(roomId, room);

            return room;
        } catch (error) {
            console.error('Failed to load room from Redis:', error);
            return null;
        }
    }

    /**
     * Get room by invite token
     */
    async getRoomByInviteToken(token: string): Promise<GameRoom | null> {
        const roomId = await this.redis.get(`inviteToken:${token}`);
        if (!roomId) return null;
        return this.rooms.get(roomId) ?? null;
    }

    // ═══════════════════════════════════════════════════════════
    // PLAYER MANAGEMENT
    // ═══════════════════════════════════════════════════════════

    /**
     * Add player to room
     */
    async joinRoom(
        roomId: string,
        userId: string,
        displayName: string,
        socket: Socket,
        teamId?: string
    ): Promise<{ success: boolean; player?: Player; error?: string }> {
        const room = this.rooms.get(roomId);
        if (!room) {
            return { success: false, error: 'Room not found' };
        }

        // Check if room accepts new players
        if (!room.stateMachine.isInAny('WAITING', 'CREATED')) {
            // Check reconnection
            const existingPlayer = room.players.get(userId);
            if (existingPlayer && room.settings.allowReconnect) {
                return this.handleReconnection(room, existingPlayer, socket);
            }
            return { success: false, error: 'Room is not accepting new players' };
        }

        // Check team capacity
        if (teamId) {
            const team = room.teams.get(teamId);
            if (!team) {
                return { success: false, error: 'Team not found' };
            }
            if (team.memberIds.length >= room.settings.maxPlayersPerTeam) {
                return { success: false, error: 'Team is full' };
            }
        }

        // Create player
        const player: Player = {
            id: userId,
            displayName,
            teamId,
            role: userId === room.adminId ? 'ADMIN' : 'PLAYER',
            score: 0,
            correctAnswers: 0,
            totalAnswers: 0,
            answerStatus: 'PENDING',
            connectionStatus: 'CONNECTED',
            socketId: socket.id,
            joinedAt: new Date(),
            lastActivity: new Date(),
        };

        // Add to room
        room.players.set(userId, player);

        // Add to team
        if (teamId) {
            const team = room.teams.get(teamId);
            if (team) {
                team.memberIds.push(userId);
            }
        }

        // Socket operations
        socket.join(roomId);
        socket.data.roomId = roomId;
        socket.data.userId = userId;

        // Persist
        await this.redis.sadd(`room:${roomId}:players`, userId);
        await this.redis.hset(`room:${roomId}:playerInfo`, userId, JSON.stringify(player));

        // Broadcast to room
        this.io.to(roomId).emit('room:player_joined', {
            player,
            totalPlayers: room.players.size,
        });

        return { success: true, player };
    }

    /**
     * Handle player reconnection
     */
    private async handleReconnection(
        room: GameRoom,
        player: Player,
        socket: Socket
    ): Promise<{ success: boolean; player?: Player; error?: string }> {
        // Update player connection
        player.connectionStatus = 'CONNECTED';
        player.socketId = socket.id;
        player.lastActivity = new Date();

        // Socket operations
        socket.join(room.id);
        socket.data.roomId = room.id;
        socket.data.userId = player.id;

        // Get current game state
        const state = this.getRoomState(room);
        const leaderboard = await this.scoreCalculator.getLeaderboard(room.id);

        // Send reconnection state
        socket.emit('connection:reconnected', {
            roomState: state,
            currentQuestion: room.questionStateMachine.isAcceptingAnswers()
                ? this.getCurrentQuestionPayload(room)
                : undefined,
            remainingMs: room.timer.getRemainingMs(),
            leaderboard,
        });

        // Broadcast reconnection
        this.io.to(room.id).emit('room:player_reconnected', {
            playerId: player.id,
            playerName: player.displayName,
        });

        return { success: true, player };
    }

    /**
     * Remove player from room
     */
    async leaveRoom(
        roomId: string,
        userId: string,
        reason: string = 'Left voluntarily'
    ): Promise<void> {
        const room = this.rooms.get(roomId);
        if (!room) return;

        const player = room.players.get(userId);
        if (!player) return;

        // Remove from team
        if (player.teamId) {
            const team = room.teams.get(player.teamId);
            if (team) {
                team.memberIds = team.memberIds.filter(id => id !== userId);
            }
        }

        // Remove from room
        room.players.delete(userId);

        // Redis cleanup
        await this.redis.srem(`room:${roomId}:players`, userId);
        await this.redis.hdel(`room:${roomId}:playerInfo`, userId);

        // Broadcast
        this.io.to(roomId).emit('room:player_left', {
            playerId: userId,
            playerName: player.displayName,
            reason,
            totalPlayers: room.players.size,
        });
    }

    /**
     * Handle player disconnect
     */
    async handleDisconnect(socket: Socket): Promise<void> {
        const { roomId, userId } = socket.data;
        if (!roomId || !userId) return;

        const room = this.rooms.get(roomId);
        if (!room) return;

        const player = room.players.get(userId);
        if (!player) return;

        player.connectionStatus = 'DISCONNECTED';
        player.lastActivity = new Date();

        // Notify room
        this.io.to(roomId).emit('room:player_disconnected', {
            playerId: userId,
            playerName: player.displayName,
            canReconnect: room.settings.allowReconnect,
            timeoutMs: room.settings.reconnectTimeoutSeconds * 1000,
        });

        // Schedule removal if no reconnection
        if (!room.settings.allowReconnect) {
            await this.leaveRoom(roomId, userId, 'Disconnected');
        } else {
            // Set timeout for permanent removal
            setTimeout(async () => {
                const currentPlayer = room.players.get(userId);
                if (currentPlayer && currentPlayer.connectionStatus === 'DISCONNECTED') {
                    await this.leaveRoom(roomId, userId, 'Reconnection timeout');
                }
            }, room.settings.reconnectTimeoutSeconds * 1000);
        }
    }

    // ═══════════════════════════════════════════════════════════
    // TEAM MANAGEMENT
    // ═══════════════════════════════════════════════════════════

    /**
     * Create a team
     */
    async createTeam(
        roomId: string,
        name: string,
        color: string = '#6366F1'
    ): Promise<Team | null> {
        const room = this.rooms.get(roomId);
        if (!room) return null;

        if (room.teams.size >= room.settings.maxTeams) {
            return null;
        }

        const team: Team = {
            id: uuidv4(),
            roomId,
            name,
            color,
            memberIds: [],
            score: 0,
            createdAt: new Date(),
        };

        room.teams.set(team.id, team);

        // Persist
        await this.redis.hset(`room:${roomId}:teams`, team.id, JSON.stringify(team));

        // Broadcast
        this.io.to(roomId).emit('room:team_updated', { team });

        return team;
    }

    // ═══════════════════════════════════════════════════════════
    // QUESTION MANAGEMENT
    // ═══════════════════════════════════════════════════════════

    /**
     * Add questions to room
     */
    async addQuestions(roomId: string, questions: Omit<Question, 'id' | 'roomId'>[]): Promise<void> {
        const room = this.rooms.get(roomId);
        if (!room) return;

        const pipeline = this.redis.pipeline();

        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            const question: Question = {
                id: uuidv4(),
                roomId,
                orderIndex: room.questions.length + i,
                articleHtml: q.articleHtml,
                questionText: q.questionText,
                options: q.options,
                correctOption: q.correctOption,
                timeLimitSeconds: q.timeLimitSeconds ?? room.settings.questionTimeSeconds,
                createdAt: new Date(),
            };

            room.questions.push(question);

            // Persist
            pipeline.hset(`room:${roomId}:questions:${question.orderIndex}`, {
                id: question.id,
                orderIndex: question.orderIndex.toString(),
                articleHtml: question.articleHtml ?? '',
                questionText: question.questionText,
                options: JSON.stringify(question.options),
                correctOption: question.correctOption,
                timeLimitSeconds: question.timeLimitSeconds.toString(),
            });
        }

        // Update total questions
        await this.redis.hset(`room:${roomId}:state`, 'totalQuestions', room.questions.length.toString());
        await pipeline.exec();
    }

    /**
     * Load questions from Redis into memory
     * Used when questions are added externally (e.g., via demo API)
     */
    async loadQuestionsFromRedis(roomId: string): Promise<number> {
        const room = this.rooms.get(roomId);
        if (!room) return 0;

        // Get total questions count from state
        const totalStr = await this.redis.hget(`room:${roomId}:state`, 'totalQuestions');
        const totalQuestions = parseInt(totalStr || '0', 10);

        if (totalQuestions === 0) return 0;

        // Clear existing questions in memory
        room.questions = [];

        // Load each question
        for (let i = 0; i < totalQuestions; i++) {
            const qData = await this.redis.hgetall(`room:${roomId}:questions:${i}`);
            if (qData && qData.id) {
                const question: Question = {
                    id: qData.id,
                    roomId,
                    orderIndex: parseInt(qData.orderIndex) || i,
                    articleHtml: qData.articleHtml || undefined,
                    questionText: qData.questionText,
                    options: qData.options ? JSON.parse(qData.options) : [],
                    correctOption: qData.correctOption,
                    timeLimitSeconds: parseInt(qData.timeLimitSeconds) || room.settings.questionTimeSeconds,
                    createdAt: qData.createdAt ? new Date(qData.createdAt) : new Date(),
                };
                room.questions.push(question);
            }
        }

        return room.questions.length;
    }

    // ═══════════════════════════════════════════════════════════
    // GAME FLOW CONTROL
    // ═══════════════════════════════════════════════════════════

    /**
     * Start the game (Admin only)
     */
    async startGame(roomId: string, adminId: string): Promise<{ success: boolean; error?: string }> {
        const room = this.rooms.get(roomId);
        if (!room) {
            return { success: false, error: 'Room not found' };
        }

        // Verify admin
        if (room.adminId !== adminId) {
            return { success: false, error: 'Not authorized' };
        }

        // Check state
        if (!room.stateMachine.canTransitionTo('STARTING')) {
            return { success: false, error: `Cannot start game from ${room.stateMachine.getState()} state` };
        }

        // Check minimum requirements
        if (room.players.size < 1) {
            return { success: false, error: 'Need at least 1 player to start' };
        }

        // Load questions from Redis (in case they were added externally via API)
        await this.loadQuestionsFromRedis(roomId);

        // Auto-load questions from local database if none exist
        if (room.questions.length < 1) {
            console.log(`[GameEngine] No questions found for room ${roomId}, auto-loading from database...`);
            await this.autoLoadQuestions(room);
        }

        if (room.questions.length < 1) {
            return { success: false, error: 'No questions available. Please add questions to the database.' };
        }

        // Shuffle questions for random order
        this.shuffleArray(room.questions);

        // Update order indices after shuffle
        for (let i = 0; i < room.questions.length; i++) {
            room.questions[i].orderIndex = i;
        }

        // Re-persist shuffled questions to Redis so answer validator can find them
        await this.persistQuestionsToRedis(room);

        console.log(`[GameEngine] Loaded and shuffled ${room.questions.length} questions for room ${roomId}`);

        // Transition to STARTING
        room.stateMachine.transition('STARTING', {
            roomId,
            initiatedBy: adminId,
            reason: 'Admin started game',
        });

        room.startedAt = new Date();
        await this.persistRoomState(room);

        // Broadcast game starting
        console.log(`[GameEngine] Broadcasting game:starting for room ${roomId}`);
        this.io.to(roomId).emit('game:starting', {
            countdownSeconds: room.settings.countdownSeconds,
            totalQuestions: room.questions.length,
        });

        // Countdown
        console.log(`[GameEngine] Starting countdown for room ${roomId}`);
        await this.runCountdown(room);

        // Transition to ACTIVE
        room.stateMachine.transition('ACTIVE', {
            roomId,
            initiatedBy: 'SYSTEM',
            reason: 'Countdown complete',
        });

        // Start first question
        console.log(`[GameEngine] Starting first question for room ${roomId}`);
        await this.startNextQuestion(room);

        return { success: true };
    }

    /**
     * Run countdown before game starts
     */
    private async runCountdown(room: GameRoom): Promise<void> {
        const seconds = room.settings.countdownSeconds;

        for (let i = seconds; i > 0; i--) {
            console.log(`[GameEngine] Countdown: ${i} for room ${room.id}`);
            this.io.to(room.id).emit('game:countdown', { remaining: i });
            await this.delay(1000);
        }
        console.log(`[GameEngine] Countdown complete for room ${room.id}`);
    }

    /**
     * Start next question (wrapper for backward compatibility)
     */
    private async startNextQuestion(room: GameRoom): Promise<void> {
        const nextIndex = room.questionStateMachine.getCurrentQuestionIndex() + 1;
        await this.startNextQuestionAtIndex(room, nextIndex);
    }

    /**
     * Start question at specific index
     */
    private async startNextQuestionAtIndex(room: GameRoom, nextIndex: number): Promise<void> {
        console.log(`[GameEngine] startNextQuestionAtIndex called with index ${nextIndex} (total questions: ${room.questions.length})`);

        if (nextIndex >= room.questions.length) {
            // No more questions - end game
            console.log(`[GameEngine] No more questions, ending game`);
            await this.endGame(room, 'All questions completed');
            return;
        }

        const question = room.questions[nextIndex];
        if (!question) {
            console.log(`[GameEngine] Question not found at index ${nextIndex}`);
            await this.endGame(room, 'Question not found');
            return;
        }

        // Start question
        room.questionStateMachine.startQuestion(question.id, nextIndex);
        room.questionStateMachine.activateQuestion();

        // Transition room state
        room.stateMachine.transition('QUESTION_ACTIVE', {
            roomId: room.id,
            initiatedBy: 'SYSTEM',
            reason: `Starting question ${nextIndex + 1}`,
        });

        // Reset player statuses
        await this.answerStore.resetPlayerStatuses(room.id);
        for (const player of room.players.values()) {
            player.answerStatus = 'PENDING';
            player.currentAnswer = undefined;
            player.currentAnswerTime = undefined;
        }

        // Update state
        const now = Date.now();
        await this.redis.hset(`room:${room.id}:state`, {
            status: 'QUESTION_ACTIVE',
            currentQuestionIndex: nextIndex.toString(),
            questionStartTime: now.toString(),
            questionEndTime: (now + question.timeLimitSeconds * 1000).toString(),
        });

        // Start timer
        room.timer.setDuration(question.timeLimitSeconds * 1000);
        await room.timer.start();

        // Build payload (WITHOUT correct answer)
        const payload: QuestionStartPayload = {
            question: {
                id: question.id,
                orderIndex: nextIndex,
                totalQuestions: room.questions.length,
                articleHtml: question.articleHtml,
                questionText: question.questionText,
                options: question.options,
                timeLimitMs: question.timeLimitSeconds * 1000,
            },
            serverTimestamp: now,
            remainingMs: question.timeLimitSeconds * 1000,
        };

        // Broadcast to all players
        console.log(`[GameEngine] Broadcasting game:question_start for room ${room.id}, question ${nextIndex + 1}/${room.questions.length}`);
        this.io.to(room.id).emit('game:question_start', payload);
    }

    /**
     * Close current question and calculate results
     */
    private async closeQuestion(room: GameRoom): Promise<void> {
        const questionIndex = room.questionStateMachine.getCurrentQuestionIndex();
        const question = room.questions[questionIndex];

        if (!question) return;

        // Close question state
        room.questionStateMachine.closeQuestion();

        // Transition
        room.stateMachine.transition('QUESTION_CLOSED', {
            roomId: room.id,
            initiatedBy: 'SYSTEM',
            reason: 'Timer expired',
        });

        // Notify clients
        this.io.to(room.id).emit('game:question_closed', {
            questionId: question.id,
            questionIndex,
            serverTime: Date.now(),
        });

        // Mark unanswered players as skipped
        for (const player of room.players.values()) {
            if (player.answerStatus === 'PENDING') {
                player.answerStatus = 'SKIPPED';
                await this.answerStore.updatePlayerStatus(room.id, player.id, 'SKIPPED');
            }
        }

        // Calculate results
        const results = await this.scoreCalculator.calculateQuestionResults(
            room.id,
            questionIndex,
            question.correctOption
        );

        // Update player scores in memory
        for (const result of results.playerResults) {
            const player = room.players.get(result.playerId);
            if (player) {
                player.score = result.totalScore;
                if (result.result === 'CORRECT') {
                    player.correctAnswers++;
                }
                player.totalAnswers++;
            }
        }

        // Show results
        room.questionStateMachine.showResults();
        room.stateMachine.transition('SHOWING_RESULTS', {
            roomId: room.id,
            initiatedBy: 'SYSTEM',
            reason: 'Showing results',
        });

        // Broadcast results
        this.io.to(room.id).emit('game:question_results', results);

        // Wait for results display time
        await this.delay(room.settings.showResultsSeconds * 1000);

        // Save the current question index BEFORE reset
        const currentIndex = questionIndex;

        // Reset question state (this sets questionIndex to -1)
        room.questionStateMachine.reset();

        // Check if more questions - use saved currentIndex
        if (currentIndex + 1 < room.questions.length) {
            // Start next question with explicit index
            await this.startNextQuestionAtIndex(room, currentIndex + 1);
        } else {
            // End game - all questions completed
            console.log(`[GameEngine] All ${room.questions.length} questions completed, ending game...`);
            await this.endGame(room, 'All questions completed');
        }
    }

    /**
     * End the game
     */
    private async endGame(room: GameRoom, reason: string): Promise<void> {
        // Stop timer
        await room.timer.stop();

        // Transition
        room.stateMachine.transition('ENDED', {
            roomId: room.id,
            initiatedBy: 'SYSTEM',
            reason,
        });

        room.endedAt = new Date();
        await this.persistRoomState(room);

        // Calculate final results
        const finalResults = await this.resultsCalculator.calculateFinalResults(room.id);

        // Broadcast game ended
        const payload: GameEndedPayload = {
            results: {
                roomId: room.id,
                totalQuestions: room.questions.length,
                duration: room.endedAt.getTime() - (room.startedAt?.getTime() ?? 0),
                winner: finalResults.winner ? {
                    player: finalResults.winner,
                    team: finalResults.winningTeam ?? undefined,
                } : undefined,
                leaderboard: finalResults.leaderboard,
                statistics: finalResults.statistics,
            },
        };

        this.io.to(room.id).emit('game:ended', payload);

        // Log event
        this.emit('game:ended', { roomId: room.id, results: finalResults });
    }

    // ═══════════════════════════════════════════════════════════
    // ANSWER HANDLING
    // ═══════════════════════════════════════════════════════════

    /**
     * Process answer submission (Server-Authoritative)
     */
    async submitAnswer(
        roomId: string,
        playerId: string,
        submission: AnswerSubmission
    ): Promise<{ success: boolean; serverTime: number; timeTakenMs?: number; error?: string }> {
        const room = this.rooms.get(roomId);
        const serverTime = Date.now();

        if (!room) {
            return { success: false, serverTime, error: 'Room not found' };
        }

        // Validate answer
        const validation = await this.answerValidator.validate(
            playerId,
            roomId,
            submission,
            room.timer
        );

        if (!validation.valid) {
            return { success: false, serverTime, error: validation.reason };
        }

        // Calculate time taken
        const questionStartTime = parseInt(
            await this.redis.hget(`room:${roomId}:state`, 'questionStartTime') ?? '0'
        );
        const timeTakenMs = serverTime - questionStartTime;

        // Store answer
        const stored = await this.answerStore.storeAnswer(
            roomId,
            room.questionStateMachine.getCurrentQuestionIndex(),
            playerId,
            {
                answer: submission.answer,
                submittedAt: serverTime,
                clientTimestamp: submission.clientTimestamp,
                timeTakenMs,
            }
        );

        if (!stored) {
            return { success: false, serverTime, error: 'ALREADY_ANSWERED' };
        }

        // Update player status
        const player = room.players.get(playerId);
        if (player) {
            player.answerStatus = 'ANSWERED';
            player.currentAnswer = submission.answer;
            player.currentAnswerTime = timeTakenMs;
        }

        await this.answerStore.updatePlayerStatus(roomId, playerId, 'ANSWERED');
        await this.scoreCalculator.incrementAnsweredCount(roomId, playerId);

        // Notify admin (live monitoring)
        const adminSocket = await this.getAdminSocket(room);
        if (adminSocket) {
            adminSocket.emit('admin:player_answered', {
                playerId,
                playerName: player?.displayName ?? 'Unknown',
                teamId: player?.teamId,
                teamName: player?.teamId ? room.teams.get(player.teamId)?.name : undefined,
                answer: submission.answer,
                timeTakenMs,
                timestamp: serverTime,
                questionIndex: room.questionStateMachine.getCurrentQuestionIndex(),
            });
        }

        return { success: true, serverTime, timeTakenMs };
    }

    // ═══════════════════════════════════════════════════════════
    // ADMIN CONTROLS
    // ═══════════════════════════════════════════════════════════

    /**
     * Pause the game
     */
    async pauseGame(roomId: string, adminId: string): Promise<{ success: boolean; error?: string }> {
        const room = this.rooms.get(roomId);
        if (!room) return { success: false, error: 'Room not found' };
        if (room.adminId !== adminId) return { success: false, error: 'Not authorized' };

        if (!room.stateMachine.canTransitionTo('PAUSED')) {
            return { success: false, error: 'Cannot pause in current state' };
        }

        const remainingMs = await room.timer.pause();

        room.stateMachine.transition('PAUSED', {
            roomId,
            initiatedBy: adminId,
            reason: 'Admin paused',
        });

        this.io.to(roomId).emit('game:paused', {
            remainingMs,
            reason: 'Game paused by admin',
            pausedBy: 'Admin',
        });

        return { success: true };
    }

    /**
     * Resume the game
     */
    async resumeGame(roomId: string, adminId: string): Promise<{ success: boolean; error?: string }> {
        const room = this.rooms.get(roomId);
        if (!room) return { success: false, error: 'Room not found' };
        if (room.adminId !== adminId) return { success: false, error: 'Not authorized' };

        if (room.stateMachine.getState() !== 'PAUSED') {
            return { success: false, error: 'Game is not paused' };
        }

        const remainingMs = await room.timer.resume();

        room.stateMachine.transition('QUESTION_ACTIVE', {
            roomId,
            initiatedBy: adminId,
            reason: 'Admin resumed',
        });

        this.io.to(roomId).emit('game:resumed', {
            remainingMs,
            resumedBy: 'Admin',
        });

        return { success: true };
    }

    /**
     * Skip current question
     */
    async skipQuestion(roomId: string, adminId: string): Promise<{ success: boolean; error?: string }> {
        const room = this.rooms.get(roomId);
        if (!room) return { success: false, error: 'Room not found' };
        if (room.adminId !== adminId) return { success: false, error: 'Not authorized' };

        if (!room.stateMachine.isPlayable()) {
            return { success: false, error: 'No active question to skip' };
        }

        // Stop current timer
        await room.timer.stop();

        // Close and calculate results
        await this.closeQuestion(room);

        return { success: true };
    }

    /**
     * Restart current question
     */
    async restartQuestion(roomId: string, adminId: string): Promise<{ success: boolean; error?: string }> {
        const room = this.rooms.get(roomId);
        if (!room) return { success: false, error: 'Room not found' };
        if (room.adminId !== adminId) return { success: false, error: 'Not authorized' };

        const currentIndex = room.questionStateMachine.getCurrentQuestionIndex();
        if (currentIndex < 0) {
            return { success: false, error: 'No question to restart' };
        }

        // Stop timer
        await room.timer.stop();

        // Clear answers for current question
        await this.answerStore.clearAnswers(roomId, currentIndex);

        // Reset question state machine
        room.questionStateMachine.reset();

        // Decrement index to restart same question
        // (startNextQuestion will increment it)
        const question = room.questions[currentIndex];
        if (question) {
            room.questionStateMachine.startQuestion(question.id, currentIndex - 1);
        }

        // Start the question again
        await this.startNextQuestion(room);

        return { success: true };
    }

    /**
     * Kick a player
     */
    async kickPlayer(
        roomId: string,
        adminId: string,
        playerId: string,
        reason: string
    ): Promise<{ success: boolean; error?: string }> {
        const room = this.rooms.get(roomId);
        if (!room) return { success: false, error: 'Room not found' };
        if (room.adminId !== adminId) return { success: false, error: 'Not authorized' };
        if (playerId === adminId) return { success: false, error: 'Cannot kick yourself' };

        const player = room.players.get(playerId);
        if (!player) return { success: false, error: 'Player not found' };

        // Notify player
        if (player.socketId) {
            const socket = this.io.sockets.sockets.get(player.socketId);
            if (socket) {
                socket.emit('room:kicked', {
                    reason,
                    kickedBy: 'Admin',
                });
                socket.leave(roomId);
                socket.disconnect(true);
            }
        }

        // Remove from room
        await this.leaveRoom(roomId, playerId, `Kicked: ${reason}`);

        return { success: true };
    }

    /**
     * End game early
     */
    async endGameEarly(roomId: string, adminId: string): Promise<{ success: boolean; error?: string }> {
        const room = this.rooms.get(roomId);
        if (!room) return { success: false, error: 'Room not found' };
        if (room.adminId !== adminId) return { success: false, error: 'Not authorized' };

        await room.timer.stop();
        await this.endGame(room, 'Ended by admin');

        return { success: true };
    }

    // ═══════════════════════════════════════════════════════════
    // HELPER METHODS
    // ═══════════════════════════════════════════════════════════

    /**
     * Setup timer events
     */
    private setupTimerEvents(room: GameRoom): void {
        room.timer.on('tick', (remainingMs: number) => {
            this.io.to(room.id).emit('game:timer_sync', {
                remainingMs,
                serverTimestamp: Date.now(),
                questionIndex: room.questionStateMachine.getCurrentQuestionIndex(),
            });
        });

        room.timer.on('expired', async () => {
            await this.closeQuestion(room);
        });
    }

    /**
     * Persist room state to Redis
     */
    private async persistRoomState(room: GameRoom): Promise<void> {
        const state: Record<string, string> = {
            roomId: room.id,
            status: room.stateMachine.getState(),
            currentQuestionIndex: room.questionStateMachine.getCurrentQuestionIndex().toString(),
            totalQuestions: room.questions.length.toString(),
            adminId: room.adminId,
            settings: JSON.stringify(room.settings),
        };

        if (room.startedAt) state.startedAt = room.startedAt.getTime().toString();
        if (room.endedAt) state.endedAt = room.endedAt.getTime().toString();

        await this.redis.hset(`room:${room.id}:state`, state);
    }

    /**
     * Get room state for client
     */
    getRoomState(room: GameRoom): RoomState {
        return {
            roomId: room.id,
            status: room.stateMachine.getState(),
            currentQuestionIndex: room.questionStateMachine.getCurrentQuestionIndex(),
            totalQuestions: room.questions.length,
            adminId: room.adminId,
            settings: room.settings,
        };
    }

    /**
     * Get current question payload (without correct answer)
     */
    private getCurrentQuestionPayload(room: GameRoom): QuestionPayload | undefined {
        const index = room.questionStateMachine.getCurrentQuestionIndex();
        const question = room.questions[index];
        if (!question) return undefined;

        return {
            id: question.id,
            orderIndex: index,
            totalQuestions: room.questions.length,
            articleHtml: question.articleHtml,
            questionText: question.questionText,
            options: question.options,
            timeLimitMs: question.timeLimitSeconds * 1000,
        };
    }

    /**
     * Get admin socket
     */
    private async getAdminSocket(room: GameRoom): Promise<Socket | null> {
        const adminPlayer = room.players.get(room.adminId);
        if (!adminPlayer?.socketId) return null;
        return this.io.sockets.sockets.get(adminPlayer.socketId) ?? null;
    }

    /**
     * Generate room code
     */
    private generateRoomCode(): string {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars[Math.floor(Math.random() * chars.length)];
        }
        return code;
    }

    /**
     * Delay utility
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Cleanup room
     */
    async cleanupRoom(roomId: string): Promise<void> {
        const room = this.rooms.get(roomId);
        if (!room) return;

        await room.timer.stop();
        this.rooms.delete(roomId);
        await this.timerManager.removeTimer(roomId);

        // Redis cleanup would happen here (or via TTL)
    }

    /**
     * Shuffle array in place (Fisher-Yates algorithm)
     */
    private shuffleArray<T>(array: T[]): void {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    /**
     * Auto-load questions from local database
     */
    private async autoLoadQuestions(room: GameRoom): Promise<void> {
        try {
            console.log(`[GameEngine] Attempting to auto-load questions for room ${room.id}...`);

            // Import the questions from local database using relative path
            // (The @/lib alias doesn't work in the custom server context)
            const { getQuestions, GAME_QUESTIONS } = await import('../../game-questions');

            console.log(`[GameEngine] Database has ${GAME_QUESTIONS?.length || 0} total questions`);

            const questions = getQuestions({
                limit: 10,
                random: true,
            });

            console.log(`[GameEngine] Got ${questions.length} filtered questions`);

            if (questions.length === 0) {
                console.log(`[GameEngine] No questions found in database after filtering`);
                return;
            }

            // Add questions to room
            for (let i = 0; i < questions.length; i++) {
                const q = questions[i];
                const question: Question = {
                    id: `auto-${Date.now()}-${i}`,
                    roomId: room.id,
                    orderIndex: i,
                    articleHtml: q.articleHtml,
                    questionText: q.questionText,
                    options: q.options,
                    correctOption: q.correctOption,
                    timeLimitSeconds: q.timeLimitSeconds ?? room.settings.questionTimeSeconds,
                    createdAt: new Date(),
                };
                room.questions.push(question);
            }

            // IMPORTANT: Persist questions to Redis so answer validator can find them
            await this.persistQuestionsToRedis(room);

            console.log(`[GameEngine] Auto-loaded ${room.questions.length} questions for room ${room.id}`);
        } catch (error) {
            console.error('[GameEngine] Failed to auto-load questions. Error details:', error);
            console.error('[GameEngine] This may be a path resolution issue. Trying fallback...');

            // Fallback: Try to load questions directly
            try {
                const path = require('path');
                const questionsPath = path.resolve(__dirname, '../../game-questions');
                console.log(`[GameEngine] Fallback: trying to load from ${questionsPath}`);
                const { getQuestions: getFallbackQuestions } = require(questionsPath);

                const questions = getFallbackQuestions({
                    limit: 10,
                    random: true,
                });

                if (questions.length > 0) {
                    for (let i = 0; i < questions.length; i++) {
                        const q = questions[i];
                        const question: Question = {
                            id: `fallback-${Date.now()}-${i}`,
                            roomId: room.id,
                            orderIndex: i,
                            articleHtml: q.articleHtml,
                            questionText: q.questionText,
                            options: q.options,
                            correctOption: q.correctOption,
                            timeLimitSeconds: q.timeLimitSeconds ?? room.settings.questionTimeSeconds,
                            createdAt: new Date(),
                        };
                        room.questions.push(question);
                    }

                    // IMPORTANT: Persist questions to Redis so answer validator can find them
                    await this.persistQuestionsToRedis(room);

                    console.log(`[GameEngine] Fallback succeeded: loaded ${room.questions.length} questions`);
                }
            } catch (fallbackError) {
                console.error('[GameEngine] Fallback also failed:', fallbackError);
            }
        }
    }

    /**
     * Persist in-memory questions to Redis
     * This is needed so the answer validator can verify question IDs
     */
    private async persistQuestionsToRedis(room: GameRoom): Promise<void> {
        const pipeline = this.redis.pipeline();

        for (const question of room.questions) {
            pipeline.hset(`room:${room.id}:questions:${question.orderIndex}`, {
                id: question.id,
                orderIndex: question.orderIndex.toString(),
                articleHtml: question.articleHtml ?? '',
                questionText: question.questionText,
                options: JSON.stringify(question.options),
                correctOption: question.correctOption,
                timeLimitSeconds: question.timeLimitSeconds.toString(),
            });
        }

        // Update total questions count
        pipeline.hset(`room:${room.id}:state`, 'totalQuestions', room.questions.length.toString());

        await pipeline.exec();
        console.log(`[GameEngine] Persisted ${room.questions.length} questions to Redis for room ${room.id}`);
    }
}

