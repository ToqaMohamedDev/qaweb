/**
 * Voice Chat Signaling Server
 * WebRTC signaling for peer-to-peer voice communication
 */

import type { Server as SocketIOServer, Socket } from 'socket.io';
import type Redis from 'ioredis';
import { EventEmitter } from 'events';
import type { VoiceParticipant, VoiceRoom } from '../types/index';

export interface VoiceConfig {
    maxParticipantsPerRoom: number;
    iceServers: RTCIceServer[];
}

interface RTCIceServer {
    urls: string | string[];
    username?: string;
    credential?: string;
}

const DEFAULT_CONFIG: VoiceConfig = {
    maxParticipantsPerRoom: 20,
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ],
};

export class VoiceSignalingServer extends EventEmitter {
    private io: SocketIOServer;
    private redis: Redis;
    private config: VoiceConfig;
    private rooms: Map<string, VoiceRoom> = new Map();
    private socketToPlayer: Map<string, { roomId: string; playerId: string }> = new Map();

    constructor(io: SocketIOServer, redis: Redis, config: Partial<VoiceConfig> = {}) {
        super();
        this.io = io;
        this.redis = redis;
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * Handle player joining voice chat
     */
    async handleJoinVoice(
        socket: Socket,
        roomId: string,
        playerId: string,
        playerName: string
    ): Promise<{ success: boolean; participants?: string[]; iceServers?: RTCIceServer[]; error?: string }> {
        // Get or create voice room
        let room = this.rooms.get(roomId);

        if (!room) {
            room = {
                id: `voice:${roomId}`,
                roomId,
                participants: new Map(),
                adminMutedPlayers: new Set(),
                createdAt: Date.now(),
            };
            this.rooms.set(roomId, room);
        }

        // Check capacity
        if (room.participants.size >= this.config.maxParticipantsPerRoom) {
            return { success: false, error: 'Voice room is full' };
        }

        // Check if already in room
        if (room.participants.has(playerId)) {
            // Already in room - just update socket
            const participant = room.participants.get(playerId)!;
            participant.socketId = socket.id;
        } else {
            // Add new participant
            const participant: VoiceParticipant = {
                playerId,
                socketId: socket.id,
                isMuted: false,
                isDeafened: false,
                isSpeaking: false,
                joinedAt: Date.now(),
            };
            room.participants.set(playerId, participant);
        }

        // Track socket
        this.socketToPlayer.set(socket.id, { roomId, playerId });

        // Join voice room socket.io room
        socket.join(`voice:${roomId}`);

        // Notify existing participants
        socket.to(`voice:${roomId}`).emit('voice:peer_joined', {
            playerId,
            playerName,
        });

        // Return current participants and ICE servers
        const participants = Array.from(room.participants.keys()).filter(id => id !== playerId);

        // Persist to Redis
        await this.redis.sadd(`room:${roomId}:voice:participants`, playerId);

        return {
            success: true,
            participants,
            iceServers: this.config.iceServers,
        };
    }

    /**
     * Handle player leaving voice chat
     */
    async handleLeaveVoice(socket: Socket): Promise<void> {
        const playerInfo = this.socketToPlayer.get(socket.id);
        if (!playerInfo) return;

        const { roomId, playerId } = playerInfo;
        const room = this.rooms.get(roomId);
        if (!room) return;

        // Remove participant
        room.participants.delete(playerId);
        this.socketToPlayer.delete(socket.id);

        // Leave socket.io room
        socket.leave(`voice:${roomId}`);

        // Notify others
        this.io.to(`voice:${roomId}`).emit('voice:peer_left', { playerId });

        // Cleanup empty room
        if (room.participants.size === 0) {
            this.rooms.delete(roomId);
        }

        // Update Redis
        await this.redis.srem(`room:${roomId}:voice:participants`, playerId);
    }

    /**
     * Forward WebRTC offer
     */
    handleOffer(
        socket: Socket,
        data: { to: string; offer: RTCSessionDescriptionInit }
    ): void {
        const playerInfo = this.socketToPlayer.get(socket.id);
        if (!playerInfo) return;

        const room = this.rooms.get(playerInfo.roomId);
        if (!room) return;

        const targetParticipant = room.participants.get(data.to);
        if (!targetParticipant) return;

        // Forward offer to target
        this.io.to(targetParticipant.socketId).emit('voice:offer', {
            from: playerInfo.playerId,
            offer: data.offer,
        });
    }

    /**
     * Forward WebRTC answer
     */
    handleAnswer(
        socket: Socket,
        data: { to: string; answer: RTCSessionDescriptionInit }
    ): void {
        const playerInfo = this.socketToPlayer.get(socket.id);
        if (!playerInfo) return;

        const room = this.rooms.get(playerInfo.roomId);
        if (!room) return;

        const targetParticipant = room.participants.get(data.to);
        if (!targetParticipant) return;

        // Forward answer to target
        this.io.to(targetParticipant.socketId).emit('voice:answer', {
            from: playerInfo.playerId,
            answer: data.answer,
        });
    }

    /**
     * Forward ICE candidate
     */
    handleIceCandidate(
        socket: Socket,
        data: { to: string; candidate: RTCIceCandidateInit }
    ): void {
        const playerInfo = this.socketToPlayer.get(socket.id);
        if (!playerInfo) return;

        const room = this.rooms.get(playerInfo.roomId);
        if (!room) return;

        const targetParticipant = room.participants.get(data.to);
        if (!targetParticipant) return;

        // Forward ICE candidate to target
        this.io.to(targetParticipant.socketId).emit('voice:ice_candidate', {
            from: playerInfo.playerId,
            candidate: data.candidate,
        });
    }

    /**
     * Handle mute toggle
     */
    handleToggleMute(socket: Socket, muted: boolean): void {
        const playerInfo = this.socketToPlayer.get(socket.id);
        if (!playerInfo) return;

        const room = this.rooms.get(playerInfo.roomId);
        if (!room) return;

        const participant = room.participants.get(playerInfo.playerId);
        if (!participant) return;

        participant.isMuted = muted;

        // Notify others
        this.io.to(`voice:${playerInfo.roomId}`).emit(
            muted ? 'voice:player_muted' : 'voice:player_unmuted',
            { playerId: playerInfo.playerId }
        );
    }

    // ═══════════════════════════════════════════════════════════
    // ADMIN CONTROLS
    // ═══════════════════════════════════════════════════════════

    /**
     * Admin mutes a player
     */
    adminMutePlayer(roomId: string, playerId: string, adminName: string): boolean {
        const room = this.rooms.get(roomId);
        if (!room) return false;

        const participant = room.participants.get(playerId);
        if (!participant) return false;

        // Add to admin muted set
        room.adminMutedPlayers.add(playerId);
        participant.isMuted = true;

        // Notify the muted player
        this.io.to(participant.socketId).emit('voice:muted_by_admin');

        // Notify others
        this.io.to(`voice:${roomId}`).emit('voice:player_muted', {
            playerId,
            mutedBy: adminName,
        });

        return true;
    }

    /**
     * Admin unmutes a player
     */
    adminUnmutePlayer(roomId: string, playerId: string, adminName: string): boolean {
        const room = this.rooms.get(roomId);
        if (!room) return false;

        const participant = room.participants.get(playerId);
        if (!participant) return false;

        // Remove from admin muted set
        room.adminMutedPlayers.delete(playerId);
        participant.isMuted = false;

        // Notify the unmuted player
        this.io.to(participant.socketId).emit('voice:unmuted_by_admin');

        // Notify others
        this.io.to(`voice:${roomId}`).emit('voice:player_unmuted', {
            playerId,
            unmutedBy: adminName,
        });

        return true;
    }

    /**
     * Admin kicks player from voice
     */
    async adminKickFromVoice(roomId: string, playerId: string): Promise<boolean> {
        const room = this.rooms.get(roomId);
        if (!room) return false;

        const participant = room.participants.get(playerId);
        if (!participant) return false;

        // Remove participant
        room.participants.delete(playerId);
        room.adminMutedPlayers.delete(playerId);

        // Get socket
        const socket = this.io.sockets.sockets.get(participant.socketId);
        if (socket) {
            socket.emit('voice:kicked');
            socket.leave(`voice:${roomId}`);
            this.socketToPlayer.delete(participant.socketId);
        }

        // Notify others
        this.io.to(`voice:${roomId}`).emit('voice:peer_left', { playerId });

        // Update Redis
        await this.redis.srem(`room:${roomId}:voice:participants`, playerId);

        return true;
    }

    /**
     * End voice chat for entire room
     */
    async endVoiceChat(roomId: string): Promise<void> {
        const room = this.rooms.get(roomId);
        if (!room) return;

        // Notify all participants
        this.io.to(`voice:${roomId}`).emit('voice:ended');

        // Disconnect all
        for (const participant of room.participants.values()) {
            const socket = this.io.sockets.sockets.get(participant.socketId);
            if (socket) {
                socket.leave(`voice:${roomId}`);
                this.socketToPlayer.delete(participant.socketId);
            }
        }

        // Cleanup
        this.rooms.delete(roomId);
        await this.redis.del(`room:${roomId}:voice:participants`);
    }

    /**
     * Get voice participants
     */
    getParticipants(roomId: string): VoiceParticipant[] {
        const room = this.rooms.get(roomId);
        if (!room) return [];
        return Array.from(room.participants.values());
    }

    /**
     * Handle socket disconnect
     */
    async handleDisconnect(socket: Socket): Promise<void> {
        await this.handleLeaveVoice(socket);
    }

    /**
     * Cleanup room
     */
    async cleanupRoom(roomId: string): Promise<void> {
        await this.endVoiceChat(roomId);
    }
}

// WebRTC type definitions for TypeScript
interface RTCSessionDescriptionInit {
    type: 'offer' | 'answer' | 'pranswer' | 'rollback';
    sdp?: string;
}

interface RTCIceCandidateInit {
    candidate?: string;
    sdpMid?: string | null;
    sdpMLineIndex?: number | null;
    usernameFragment?: string | null;
}
