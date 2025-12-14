/**
 * WebSocket Event Type Definitions
 * Strongly typed Socket.io events for Server-Client communication
 */

import type {
    RoomState,
    Player,
    Team,
    QuestionPayload,
    QuestionResults,
    GameResults,
    Leaderboard,
    AntiCheatFlags,
    AntiCheatAlert,
    AnswerSubmission,
    AdminAction,
    AntiCheatReport,
} from './index';

// ============================================
// Server → Client Events
// ============================================

export interface ServerToClientEvents {
    // ─────────────────────────────────────────
    // Connection Events
    // ─────────────────────────────────────────

    'connection:established': (data: ConnectionEstablishedPayload) => void;

    'connection:error': (data: ConnectionErrorPayload) => void;

    'connection:reconnected': (data: ReconnectedPayload) => void;

    // ─────────────────────────────────────────
    // Room Events
    // ─────────────────────────────────────────

    'room:joined': (data: RoomJoinedPayload) => void;

    'room:player_joined': (data: PlayerJoinedPayload) => void;

    'room:player_left': (data: PlayerLeftPayload) => void;

    'room:player_disconnected': (data: PlayerDisconnectedPayload) => void;

    'room:player_reconnected': (data: PlayerReconnectedPayload) => void;

    'room:team_updated': (data: TeamUpdatedPayload) => void;

    'room:kicked': (data: KickedPayload) => void;

    'room:state_updated': (data: RoomStateUpdatedPayload) => void;

    // ─────────────────────────────────────────
    // Game Events
    // ─────────────────────────────────────────

    'game:starting': (data: GameStartingPayload) => void;

    'game:countdown': (data: CountdownPayload) => void;

    'game:question_start': (data: QuestionStartPayload) => void;

    'game:timer_sync': (data: TimerSyncPayload) => void;

    'game:answer_acknowledged': (data: AnswerAcknowledgedPayload) => void;

    'game:answer_rejected': (data: AnswerRejectedPayload) => void;

    'game:question_closed': (data: QuestionClosedPayload) => void;

    'game:question_results': (data: QuestionResultsPayload) => void;

    'game:paused': (data: GamePausedPayload) => void;

    'game:resumed': (data: GameResumedPayload) => void;

    'game:ended': (data: GameEndedPayload) => void;

    'game:leaderboard_updated': (data: LeaderboardUpdatedPayload) => void;

    // ─────────────────────────────────────────
    // Admin Events (Admin Dashboard Only)
    // ─────────────────────────────────────────

    'admin:player_answered': (data: AdminPlayerAnsweredPayload) => void;

    'admin:player_status': (data: AdminPlayerStatusPayload) => void;

    'admin:anticheat_alert': (data: AntiCheatAlert) => void;

    'admin:room_stats': (data: AdminRoomStatsPayload) => void;

    // ─────────────────────────────────────────
    // Message Events
    // ─────────────────────────────────────────

    'message:broadcast': (data: BroadcastMessagePayload) => void;

    'message:system': (data: SystemMessagePayload) => void;

    // ─────────────────────────────────────────
    // Voice Events
    // ─────────────────────────────────────────

    'voice:participants': (data: VoiceParticipantsPayload) => void;

    'voice:peer_joined': (data: VoicePeerJoinedPayload) => void;

    'voice:peer_left': (data: VoicePeerLeftPayload) => void;

    'voice:offer': (data: VoiceOfferPayload) => void;

    'voice:answer': (data: VoiceAnswerPayload) => void;

    'voice:ice_candidate': (data: VoiceIceCandidatePayload) => void;

    'voice:muted_by_admin': () => void;

    'voice:unmuted_by_admin': () => void;

    'voice:player_muted': (data: VoicePlayerMutedPayload) => void;

    'voice:player_unmuted': (data: VoicePlayerUnmutedPayload) => void;
}

// ============================================
// Client → Server Events
// ============================================

export interface ClientToServerEvents {
    // ─────────────────────────────────────────
    // Room Actions
    // ─────────────────────────────────────────

    'room:join': (
        data: RoomJoinRequest,
        callback: (response: RoomJoinResponse) => void
    ) => void;

    'room:leave': (callback?: (response: GenericResponse) => void) => void;

    'room:join_team': (
        data: JoinTeamRequest,
        callback: (response: GenericResponse) => void
    ) => void;

    // ─────────────────────────────────────────
    // Game Actions
    // ─────────────────────────────────────────

    'game:submit_answer': (
        data: AnswerSubmission,
        callback: (response: SubmitAnswerResponse) => void
    ) => void;

    // ─────────────────────────────────────────
    // Admin Actions
    // ─────────────────────────────────────────

    'admin:start_game': (callback: (response: GenericResponse) => void) => void;

    'admin:pause': (callback: (response: GenericResponse) => void) => void;

    'admin:resume': (callback: (response: GenericResponse) => void) => void;

    'admin:skip_question': (callback: (response: GenericResponse) => void) => void;

    'admin:restart_question': (callback: (response: GenericResponse) => void) => void;

    'admin:go_to_question': (
        data: GoToQuestionRequest,
        callback: (response: GenericResponse) => void
    ) => void;

    'admin:kick_player': (
        data: KickPlayerRequest,
        callback: (response: GenericResponse) => void
    ) => void;

    'admin:end_game': (callback: (response: GenericResponse) => void) => void;

    'admin:broadcast_message': (
        data: BroadcastMessageRequest,
        callback: (response: GenericResponse) => void
    ) => void;

    'admin:mute_player': (
        data: MutePlayerRequest,
        callback: (response: GenericResponse) => void
    ) => void;

    'admin:unmute_player': (
        data: UnmutePlayerRequest,
        callback: (response: GenericResponse) => void
    ) => void;

    // ─────────────────────────────────────────
    // Anti-Cheat Reports
    // ─────────────────────────────────────────

    'anticheat:report': (data: AntiCheatReport) => void;

    // ─────────────────────────────────────────
    // Voice Actions
    // ─────────────────────────────────────────

    'voice:join': (callback: (response: VoiceJoinResponse) => void) => void;

    'voice:leave': () => void;

    'voice:offer': (data: VoiceOfferRequest) => void;

    'voice:answer': (data: VoiceAnswerRequest) => void;

    'voice:ice_candidate': (data: VoiceIceCandidateRequest) => void;

    'voice:toggle_mute': (data: ToggleMuteRequest) => void;

    // ─────────────────────────────────────────
    // Utility
    // ─────────────────────────────────────────

    'ping': (callback: (response: PongResponse) => void) => void;
}

// ============================================
// Inter-Server Events (for scaling)
// ============================================

export interface InterServerEvents {
    'sync:room_state': (data: RoomState) => void;
    'sync:player_joined': (data: { roomId: string; player: Player }) => void;
    'sync:player_left': (data: { roomId: string; playerId: string }) => void;
}

// ============================================
// Socket Data (attached to each socket)
// ============================================

export interface SocketData {
    userId: string;
    sessionId: string;
    roomId?: string;
    isAdmin: boolean;
    deviceFingerprint: string;
    ipHash: string;
    authenticatedAt: number;
}

// ============================================
// Payload Types - Connection
// ============================================

export interface ConnectionEstablishedPayload {
    playerId: string;
    serverTime: number;
    roomState?: RoomState;
    players?: Player[];
    teams?: Team[];
    reconnected?: boolean;
}

export interface ConnectionErrorPayload {
    code: string;
    message: string;
}

export interface ReconnectedPayload {
    roomState: RoomState;
    currentQuestion?: QuestionPayload;
    remainingMs?: number;
    leaderboard: Leaderboard;
}

// ============================================
// Payload Types - Room
// ============================================

export interface RoomJoinedPayload {
    roomId: string;
    roomState: RoomState;
    players: Player[];
    teams: Team[];
    yourPlayer: Player;
    leaderboard: Leaderboard;
}

export interface PlayerJoinedPayload {
    player: Player;
    totalPlayers: number;
}

export interface PlayerLeftPayload {
    playerId: string;
    playerName: string;
    reason: string;
    totalPlayers: number;
}

export interface PlayerDisconnectedPayload {
    playerId: string;
    playerName: string;
    canReconnect: boolean;
    timeoutMs: number;
}

export interface PlayerReconnectedPayload {
    playerId: string;
    playerName: string;
}

export interface TeamUpdatedPayload {
    team: Team;
}

export interface KickedPayload {
    reason: string;
    kickedBy: string;
}

export interface RoomStateUpdatedPayload {
    state: RoomState;
}

// ============================================
// Payload Types - Game
// ============================================

export interface GameStartingPayload {
    countdownSeconds: number;
    totalQuestions: number;
}

export interface CountdownPayload {
    remaining: number;
}

export interface QuestionStartPayload {
    question: QuestionPayload;
    serverTimestamp: number;
    remainingMs: number;
}

export interface TimerSyncPayload {
    remainingMs: number;
    serverTimestamp: number;
    questionIndex: number;
}

export interface AnswerAcknowledgedPayload {
    questionId: string;
    serverTime: number;
    timeTakenMs: number;
}

export interface AnswerRejectedPayload {
    questionId: string;
    reason: string;
    serverTime: number;
}

export interface QuestionClosedPayload {
    questionId: string;
    questionIndex: number;
    serverTime: number;
}

export interface QuestionResultsPayload extends QuestionResults { }

export interface GamePausedPayload {
    remainingMs: number;
    reason: string;
    pausedBy: string;
}

export interface GameResumedPayload {
    remainingMs: number;
    resumedBy: string;
}

export interface GameEndedPayload {
    results: GameResults;
}

export interface LeaderboardUpdatedPayload {
    leaderboard: Leaderboard;
    questionIndex: number;
}

// ============================================
// Payload Types - Admin
// ============================================

export interface AdminPlayerAnsweredPayload {
    playerId: string;
    playerName: string;
    teamId?: string;
    teamName?: string;
    answer: string;
    timeTakenMs: number;
    timestamp: number;
    questionIndex: number;
}

export interface AdminPlayerStatusPayload {
    players: Array<{
        playerId: string;
        playerName: string;
        teamId?: string;
        status: 'PENDING' | 'ANSWERED' | 'SKIPPED';
        answer?: string;
        timeTakenMs?: number;
        flags: AntiCheatFlags;
    }>;
}

export interface AdminRoomStatsPayload {
    totalPlayers: number;
    connectedPlayers: number;
    answeredCount: number;
    pendingCount: number;
    averageAnswerTime: number;
    flaggedPlayers: number;
}

// ============================================
// Payload Types - Messages
// ============================================

export interface BroadcastMessagePayload {
    from: string;
    fromName: string;
    content: string;
    timestamp: number;
    isAdmin: boolean;
}

export interface SystemMessagePayload {
    type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
    content: string;
    timestamp: number;
}

// ============================================
// Payload Types - Voice
// ============================================

export interface VoiceParticipantsPayload {
    participants: string[];
}

export interface VoicePeerJoinedPayload {
    playerId: string;
    playerName: string;
}

export interface VoicePeerLeftPayload {
    playerId: string;
}

export interface VoiceOfferPayload {
    from: string;
    offer: RTCSessionDescriptionInit;
}

export interface VoiceAnswerPayload {
    from: string;
    answer: RTCSessionDescriptionInit;
}

export interface VoiceIceCandidatePayload {
    from: string;
    candidate: RTCIceCandidateInit;
}

export interface VoicePlayerMutedPayload {
    playerId: string;
    mutedBy: string;
}

export interface VoicePlayerUnmutedPayload {
    playerId: string;
    unmutedBy: string;
}

// ============================================
// Request Types
// ============================================

export interface RoomJoinRequest {
    roomCode?: string;
    inviteToken?: string;
    teamId?: string;
}

export interface RoomJoinResponse {
    success: boolean;
    error?: string;
    roomId?: string;
}

export interface JoinTeamRequest {
    teamId: string;
}

export interface GoToQuestionRequest {
    questionIndex: number;
}

export interface KickPlayerRequest {
    playerId: string;
    reason: string;
}

export interface BroadcastMessageRequest {
    content: string;
}

export interface MutePlayerRequest {
    playerId: string;
}

export interface UnmutePlayerRequest {
    playerId: string;
}

export interface VoiceOfferRequest {
    to: string;
    offer: RTCSessionDescriptionInit;
}

export interface VoiceAnswerRequest {
    to: string;
    answer: RTCSessionDescriptionInit;
}

export interface VoiceIceCandidateRequest {
    to: string;
    candidate: RTCIceCandidateInit;
}

export interface ToggleMuteRequest {
    muted: boolean;
}

export interface VoiceJoinResponse {
    success: boolean;
    participants?: string[];
    error?: string;
}

// ============================================
// Response Types
// ============================================

export interface GenericResponse {
    success: boolean;
    error?: string;
    data?: Record<string, unknown>;
}

export interface SubmitAnswerResponse {
    success: boolean;
    serverTime: number;
    timeTakenMs?: number;
    error?: string;
}

export interface PongResponse {
    serverTime: number;
    latency: number;
}

// ============================================
// WebRTC Types (for voice chat)
// ============================================

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
