/**
 * WebSocket Handler
 * Central handler for all WebSocket connections and events
 */

import type { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import type Redis from 'ioredis';
import jwt from 'jsonwebtoken';

import { GameEngine } from '../game-engine/index';
import { AntiCheatSystem } from '../anti-cheat/index';
import { VoiceSignalingServer } from '../voice/index';
import { Logger } from '../utils/logger';

import type {
    ServerToClientEvents,
    ClientToServerEvents,
    InterServerEvents,
    SocketData,
} from '../types/socket-events';
import type { AuthTokenPayload } from '../types/index';

export interface WebSocketConfig {
    jwtSecret: string;
    corsOrigin: string | string[];
    pingTimeout: number;
    pingInterval: number;
}

const DEFAULT_CONFIG: WebSocketConfig = {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    pingTimeout: 60000,
    pingInterval: 25000,
};

export class WebSocketHandler {
    private io: SocketIOServer<
        ClientToServerEvents,
        ServerToClientEvents,
        InterServerEvents,
        SocketData
    >;
    private redis: Redis;
    private config: WebSocketConfig;
    private gameEngine: GameEngine;
    private antiCheat: AntiCheatSystem;
    private voiceServer: VoiceSignalingServer;
    private logger: Logger;

    constructor(
        server: HTTPServer,
        redis: Redis,
        config: Partial<WebSocketConfig> = {}
    ) {
        this.redis = redis;
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.logger = new Logger('WebSocket');

        // Initialize Socket.IO
        this.io = new SocketIOServer(server, {
            cors: {
                origin: this.config.corsOrigin,
                methods: ['GET', 'POST'],
                credentials: true,
            },
            pingTimeout: this.config.pingTimeout,
            pingInterval: this.config.pingInterval,
        });

        // Initialize game components
        this.gameEngine = new GameEngine(redis, this.io);
        this.antiCheat = new AntiCheatSystem(redis);
        this.voiceServer = new VoiceSignalingServer(this.io, redis);

        // Setup event handlers
        this.setupMiddleware();
        this.setupEventHandlers();
        this.setupAntiCheatEvents();
    }

    /**
     * Setup authentication middleware
     */
    private setupMiddleware(): void {
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

                if (!token) {
                    return next(new Error('Authentication required'));
                }

                // Verify JWT
                const decoded = jwt.verify(token, this.config.jwtSecret) as AuthTokenPayload;

                // Attach user data to socket
                socket.data = {
                    userId: decoded.userId,
                    sessionId: decoded.sessionId,
                    deviceFingerprint: decoded.deviceFingerprint || '',
                    isAdmin: false,
                    ipHash: this.hashIP(socket.handshake.address),
                    authenticatedAt: Date.now(),
                };

                // Check if session is valid
                const sessionValid = await this.validateSession(decoded.sessionId, decoded.userId);
                if (!sessionValid) {
                    return next(new Error('Session expired'));
                }

                next();
            } catch (error) {
                this.logger.error('Authentication failed', error instanceof Error ? error : undefined);
                next(new Error('Authentication failed'));
            }
        });
    }

    /**
     * Setup all event handlers
     */
    private setupEventHandlers(): void {
        this.io.on('connection', (socket) => {
            this.handleConnection(socket);

            // Room events
            socket.on('room:join', (data, callback) => this.handleRoomJoin(socket, data, callback));
            socket.on('room:leave', (callback) => this.handleRoomLeave(socket, callback));
            socket.on('room:join_team', (data, callback) => this.handleJoinTeam(socket, data, callback));

            // Game events
            socket.on('game:submit_answer', (data, callback) => this.handleSubmitAnswer(socket, data, callback));

            // Admin events
            socket.on('admin:start_game', (callback) => this.handleAdminStartGame(socket, callback));
            socket.on('admin:pause', (callback) => this.handleAdminPause(socket, callback));
            socket.on('admin:resume', (callback) => this.handleAdminResume(socket, callback));
            socket.on('admin:skip_question', (callback) => this.handleAdminSkipQuestion(socket, callback));
            socket.on('admin:restart_question', (callback) => this.handleAdminRestartQuestion(socket, callback));
            socket.on('admin:go_to_question', (data, callback) => this.handleAdminGoToQuestion(socket, data, callback));
            socket.on('admin:kick_player', (data, callback) => this.handleAdminKickPlayer(socket, data, callback));
            socket.on('admin:end_game', (callback) => this.handleAdminEndGame(socket, callback));
            socket.on('admin:broadcast_message', (data, callback) => this.handleAdminBroadcast(socket, data, callback));
            socket.on('admin:mute_player', (data, callback) => this.handleAdminMutePlayer(socket, data, callback));
            socket.on('admin:unmute_player', (data, callback) => this.handleAdminUnmutePlayer(socket, data, callback));

            // Anti-cheat events
            socket.on('anticheat:report', (data) => this.handleAntiCheatReport(socket, data));

            // Voice events
            socket.on('voice:join', (callback) => this.handleVoiceJoin(socket, callback));
            socket.on('voice:leave', () => this.handleVoiceLeave(socket));
            socket.on('voice:offer', (data) => this.voiceServer.handleOffer(socket, data));
            socket.on('voice:answer', (data) => this.voiceServer.handleAnswer(socket, data));
            socket.on('voice:ice_candidate', (data) => this.voiceServer.handleIceCandidate(socket, data));
            socket.on('voice:toggle_mute', (data) => this.voiceServer.handleToggleMute(socket, data.muted));

            // Utility events
            socket.on('ping', (callback) => this.handlePing(socket, callback));

            // Disconnect
            socket.on('disconnect', (reason) => this.handleDisconnect(socket, reason));
        });
    }

    /**
     * Setup anti-cheat event forwarding
     */
    private setupAntiCheatEvents(): void {
        this.antiCheat.on('alert', (alert) => {
            // Forward alert to admin
            const roomId = alert.roomId;
            const room = this.gameEngine.getRoom(roomId);
            if (room) {
                const adminPlayer = room.players.get(room.adminId);
                if (adminPlayer?.socketId) {
                    this.io.to(adminPlayer.socketId).emit('admin:anticheat_alert', alert);
                }
            }
        });
    }

    // ═══════════════════════════════════════════════════════════
    // CONNECTION HANDLERS
    // ═══════════════════════════════════════════════════════════

    private handleConnection(socket: Socket): void {
        this.logger.info(`Client connected: ${socket.id} (User: ${socket.data.userId})`);

        socket.emit('connection:established', {
            playerId: socket.data.userId,
            serverTime: Date.now(),
        });
    }

    private async handleDisconnect(socket: Socket, reason: string): Promise<void> {
        this.logger.info(`Client disconnected: ${socket.id} (Reason: ${reason})`);

        // Handle game disconnect
        if (socket.data.roomId) {
            await this.gameEngine.handleDisconnect(socket);
        }

        // Handle voice disconnect
        await this.voiceServer.handleDisconnect(socket);
    }

    // ═══════════════════════════════════════════════════════════
    // ROOM HANDLERS
    // ═══════════════════════════════════════════════════════════

    private async handleRoomJoin(
        socket: Socket,
        data: { roomCode?: string; inviteToken?: string; teamId?: string },
        callback: (response: { success: boolean; error?: string; roomId?: string }) => void
    ): Promise<void> {
        try {
            // Find room
            let room = null;
            if (data.roomCode) {
                room = await this.gameEngine.getRoomByCode(data.roomCode);

                // Auto-create room if it doesn't exist (for development/testing)
                if (!room && data.roomCode && data.roomCode.length === 6) {
                    try {
                        const createResult = await this.gameEngine.createRoomWithCode(
                            socket.data.userId,
                            data.roomCode.toUpperCase(),
                            `Room ${data.roomCode}`
                        );
                        room = createResult.room;
                        this.logger.info(`Auto-created room with code: ${data.roomCode.toUpperCase()}`);
                    } catch (error) {
                        this.logger.error('Failed to auto-create room', error instanceof Error ? error : undefined);
                        callback({ success: false, error: 'Room not found and could not be created' });
                        return;
                    }
                }
            } else if (data.inviteToken) {
                room = await this.gameEngine.getRoomByInviteToken(data.inviteToken);
            }

            if (!room) {
                callback({ success: false, error: 'Room not found' });
                return;
            }

            // Get player name (would come from user database in production)
            const playerName = await this.getPlayerName(socket.data.userId);

            // Join room
            const result = await this.gameEngine.joinRoom(
                room.id,
                socket.data.userId,
                playerName,
                socket,
                data.teamId
            );

            if (result.success && result.player) {
                socket.data.roomId = room.id;
                socket.data.isAdmin = result.player.role === 'ADMIN';

                // Initialize anti-cheat
                this.antiCheat.initializePlayer(room.id, socket.data.userId);

                // Load questions from Redis (in case they were added externally via API)
                await this.gameEngine.loadQuestionsFromRedis(room.id);

                // Get room state and players for the client
                const roomState = this.gameEngine.getRoomState(room);
                const allPlayers = Array.from(room.players.values());
                const totalQuestions = room.questions?.length || 0;

                // Emit room:joined to the client
                socket.emit('room:joined', {
                    roomState,
                    players: allPlayers,
                    leaderboard: null,
                    isAdmin: result.player.role === 'ADMIN',
                    totalQuestions,
                    playerId: socket.data.userId,
                });

                callback({ success: true, roomId: room.id });
            } else {
                callback({ success: false, error: result.error });
            }
        } catch (error) {
            this.logger.error('Error joining room', error instanceof Error ? error : undefined);
            callback({ success: false, error: 'Internal server error' });
        }
    }

    private async handleRoomLeave(
        socket: Socket,
        callback?: (response: { success: boolean; error?: string }) => void
    ): Promise<void> {
        try {
            if (socket.data.roomId) {
                await this.gameEngine.leaveRoom(socket.data.roomId, socket.data.userId);
                socket.leave(socket.data.roomId);
                socket.data.roomId = undefined;
            }
            callback?.({ success: true });
        } catch (error) {
            this.logger.error('Error leaving room', error instanceof Error ? error : undefined);
            callback?.({ success: false, error: 'Internal server error' });
        }
    }

    private async handleJoinTeam(
        socket: Socket,
        data: { teamId: string },
        callback: (response: { success: boolean; error?: string }) => void
    ): Promise<void> {
        // Implementation for joining a team
        callback({ success: true });
    }

    // ═══════════════════════════════════════════════════════════
    // GAME HANDLERS
    // ═══════════════════════════════════════════════════════════

    private async handleSubmitAnswer(
        socket: Socket,
        data: { questionId: string; answer: string; clientTimestamp: number },
        callback: (response: { success: boolean; serverTime: number; timeTakenMs?: number; error?: string }) => void
    ): Promise<void> {
        const { roomId, userId } = socket.data;

        if (!roomId) {
            callback({ success: false, serverTime: Date.now(), error: 'Not in a room' });
            return;
        }

        const result = await this.gameEngine.submitAnswer(roomId, userId, data);

        // Check answer timing for anti-cheat
        if (result.success && result.timeTakenMs) {
            const playerName = await this.getPlayerName(userId);
            const room = this.gameEngine.getRoom(roomId);
            const questionIndex = room?.questionStateMachine?.getCurrentQuestionIndex() ?? 0;

            await this.antiCheat.checkAnswerTiming(
                roomId,
                userId,
                playerName,
                result.timeTakenMs,
                questionIndex
            );
        }

        callback(result);
    }

    // ═══════════════════════════════════════════════════════════
    // ADMIN HANDLERS
    // ═══════════════════════════════════════════════════════════

    private async handleAdminStartGame(
        socket: Socket,
        callback: (response: { success: boolean; error?: string }) => void
    ): Promise<void> {
        const { roomId, userId, isAdmin } = socket.data;

        this.logger.info(`admin:start_game received`, { roomId, userId, isAdmin });

        if (!roomId || !isAdmin) {
            this.logger.warn(`admin:start_game rejected - not authorized`, { roomId, isAdmin });
            callback({ success: false, error: 'Not authorized' });
            return;
        }

        try {
            this.logger.info(`Starting game for room ${roomId}`);
            const result = await this.gameEngine.startGame(roomId, userId);
            this.logger.info(`startGame result:`, result);
            callback(result);
        } catch (error) {
            this.logger.error(`Error starting game:`, error instanceof Error ? error : undefined);
            callback({ success: false, error: 'Internal server error' });
        }
    }

    private async handleAdminPause(
        socket: Socket,
        callback: (response: { success: boolean; error?: string }) => void
    ): Promise<void> {
        const { roomId, userId, isAdmin } = socket.data;

        if (!roomId || !isAdmin) {
            callback({ success: false, error: 'Not authorized' });
            return;
        }

        const result = await this.gameEngine.pauseGame(roomId, userId);
        callback(result);
    }

    private async handleAdminResume(
        socket: Socket,
        callback: (response: { success: boolean; error?: string }) => void
    ): Promise<void> {
        const { roomId, userId, isAdmin } = socket.data;

        if (!roomId || !isAdmin) {
            callback({ success: false, error: 'Not authorized' });
            return;
        }

        const result = await this.gameEngine.resumeGame(roomId, userId);
        callback(result);
    }

    private async handleAdminSkipQuestion(
        socket: Socket,
        callback: (response: { success: boolean; error?: string }) => void
    ): Promise<void> {
        const { roomId, userId, isAdmin } = socket.data;

        if (!roomId || !isAdmin) {
            callback({ success: false, error: 'Not authorized' });
            return;
        }

        const result = await this.gameEngine.skipQuestion(roomId, userId);
        callback(result);
    }

    private async handleAdminRestartQuestion(
        socket: Socket,
        callback: (response: { success: boolean; error?: string }) => void
    ): Promise<void> {
        const { roomId, userId, isAdmin } = socket.data;

        if (!roomId || !isAdmin) {
            callback({ success: false, error: 'Not authorized' });
            return;
        }

        const result = await this.gameEngine.restartQuestion(roomId, userId);
        callback(result);
    }

    private async handleAdminGoToQuestion(
        socket: Socket,
        data: { questionIndex: number },
        callback: (response: { success: boolean; error?: string }) => void
    ): Promise<void> {
        // Would need implementation in GameEngine
        callback({ success: false, error: 'Not implemented' });
    }

    private async handleAdminKickPlayer(
        socket: Socket,
        data: { playerId: string; reason: string },
        callback: (response: { success: boolean; error?: string }) => void
    ): Promise<void> {
        const { roomId, userId, isAdmin } = socket.data;

        if (!roomId || !isAdmin) {
            callback({ success: false, error: 'Not authorized' });
            return;
        }

        const result = await this.gameEngine.kickPlayer(roomId, userId, data.playerId, data.reason);
        callback(result);
    }

    private async handleAdminEndGame(
        socket: Socket,
        callback: (response: { success: boolean; error?: string }) => void
    ): Promise<void> {
        const { roomId, userId, isAdmin } = socket.data;

        if (!roomId || !isAdmin) {
            callback({ success: false, error: 'Not authorized' });
            return;
        }

        const result = await this.gameEngine.endGameEarly(roomId, userId);
        callback(result);
    }

    private async handleAdminBroadcast(
        socket: Socket,
        data: { content: string },
        callback: (response: { success: boolean; error?: string }) => void
    ): Promise<void> {
        const { roomId, userId, isAdmin } = socket.data;

        if (!roomId || !isAdmin) {
            callback({ success: false, error: 'Not authorized' });
            return;
        }

        const playerName = await this.getPlayerName(userId);

        this.io.to(roomId).emit('message:broadcast', {
            from: userId,
            fromName: playerName,
            content: data.content,
            timestamp: Date.now(),
            isAdmin: true,
        });

        callback({ success: true });
    }

    private async handleAdminMutePlayer(
        socket: Socket,
        data: { playerId: string },
        callback: (response: { success: boolean; error?: string }) => void
    ): Promise<void> {
        const { roomId, isAdmin } = socket.data;

        if (!roomId || !isAdmin) {
            callback({ success: false, error: 'Not authorized' });
            return;
        }

        if (!data?.playerId) {
            callback({ success: false, error: 'Player ID is required' });
            return;
        }

        const success = this.voiceServer.adminMutePlayer(roomId, data.playerId, 'Admin');
        if (success) {
            callback({ success: true });
        } else {
            callback({ success: false, error: 'Player not found in voice chat' });
        }
    }

    private async handleAdminUnmutePlayer(
        socket: Socket,
        data: { playerId: string },
        callback: (response: { success: boolean; error?: string }) => void
    ): Promise<void> {
        const { roomId, isAdmin } = socket.data;

        if (!roomId || !isAdmin) {
            callback({ success: false, error: 'Not authorized' });
            return;
        }

        if (!data?.playerId) {
            callback({ success: false, error: 'Player ID is required' });
            return;
        }

        const success = this.voiceServer.adminUnmutePlayer(roomId, data.playerId, 'Admin');
        if (success) {
            callback({ success: true });
        } else {
            callback({ success: false, error: 'Player not found in voice chat' });
        }
    }

    // ═══════════════════════════════════════════════════════════
    // ANTI-CHEAT HANDLERS
    // ═══════════════════════════════════════════════════════════

    private async handleAntiCheatReport(
        socket: Socket,
        data: { type: string; flags: any; timestamp: number }
    ): Promise<void> {
        const { roomId, userId } = socket.data;
        if (!roomId) return;

        const playerName = await this.getPlayerName(userId);
        await this.antiCheat.processReport(roomId, userId, playerName, data);
    }

    // ═══════════════════════════════════════════════════════════
    // VOICE HANDLERS
    // ═══════════════════════════════════════════════════════════

    private async handleVoiceJoin(
        socket: Socket,
        callback: (response: { success: boolean; participants?: string[]; error?: string }) => void
    ): Promise<void> {
        const { roomId, userId } = socket.data;
        if (!roomId) {
            callback({ success: false, error: 'Not in a room' });
            return;
        }

        const playerName = await this.getPlayerName(userId);
        const result = await this.voiceServer.handleJoinVoice(socket, roomId, userId, playerName);
        callback(result);
    }

    private async handleVoiceLeave(socket: Socket): Promise<void> {
        await this.voiceServer.handleLeaveVoice(socket);
    }

    // ═══════════════════════════════════════════════════════════
    // UTILITY HANDLERS
    // ═══════════════════════════════════════════════════════════

    private handlePing(
        socket: Socket,
        callback: (response: { serverTime: number; latency: number }) => void
    ): void {
        const serverTime = Date.now();
        callback({ serverTime, latency: 0 }); // Client can calculate actual latency
    }

    // ═══════════════════════════════════════════════════════════
    // HELPER METHODS
    // ═══════════════════════════════════════════════════════════

    private async validateSession(sessionId: string, userId: string): Promise<boolean> {
        // In production, check session in database
        const session = await this.redis.hget(`sessions:${userId}`, sessionId);
        return !!session;
    }

    private async getPlayerName(userId: string): Promise<string> {
        // In production, get from user database
        const name = await this.redis.hget(`users:${userId}`, 'displayName');
        return name || `Player_${userId.slice(0, 6)}`;
    }

    private hashIP(ip: string): string {
        // Simple hash - use crypto in production
        return Buffer.from(ip).toString('base64').slice(0, 16);
    }

    /**
     * Get the Socket.IO server instance
     */
    getIO(): SocketIOServer {
        return this.io;
    }

    /**
     * Get the game engine instance
     */
    getGameEngine(): GameEngine {
        return this.gameEngine;
    }
}
