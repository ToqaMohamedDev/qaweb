/**
 * Socket Event Types for Frontend
 * Mirrors server types for type safety
 */

// ============================================
// Server → Client Events
// ============================================

export interface ServerToClientEvents {
    // Connection
    'connection:established': (data: ConnectionEstablishedPayload) => void;
    'connection:error': (data: { code: string; message: string }) => void;
    'connection:reconnected': (data: ReconnectedPayload) => void;

    // Room
    'room:joined': (data: RoomJoinedPayload) => void;
    'room:player_joined': (data: { player: Player; totalPlayers: number }) => void;
    'room:player_left': (data: { playerId: string; playerName: string; reason: string; totalPlayers: number }) => void;
    'room:player_disconnected': (data: { playerId: string; playerName: string; canReconnect: boolean; timeoutMs: number }) => void;
    'room:player_reconnected': (data: { playerId: string; playerName: string }) => void;
    'room:kicked': (data: { reason: string; kickedBy: string }) => void;
    'room:state_updated': (data: { state: RoomState }) => void;
    'room:team_updated': (data: { team: Team }) => void;

    // Game
    'game:starting': (data: { countdownSeconds: number; totalQuestions: number }) => void;
    'game:countdown': (data: { remaining: number }) => void;
    'game:question_start': (data: QuestionStartPayload) => void;
    'game:timer_sync': (data: { remainingMs: number; serverTimestamp: number; questionIndex: number }) => void;
    'game:answer_acknowledged': (data: { questionId: string; serverTime: number; timeTakenMs: number }) => void;
    'game:answer_rejected': (data: { questionId: string; reason: string; serverTime: number }) => void;
    'game:question_closed': (data: { questionId: string; questionIndex: number; serverTime: number }) => void;
    'game:question_results': (data: QuestionResultsPayload) => void;
    'game:paused': (data: { remainingMs: number; reason: string; pausedBy: string }) => void;
    'game:resumed': (data: { remainingMs: number; resumedBy: string }) => void;
    'game:ended': (data: GameEndedPayload) => void;
    'game:leaderboard_updated': (data: { leaderboard: Leaderboard; questionIndex: number }) => void;

    // Admin
    'admin:player_answered': (data: AdminPlayerAnsweredPayload) => void;
    'admin:anticheat_alert': (data: AntiCheatAlert) => void;

    // Messages
    'message:broadcast': (data: BroadcastMessagePayload) => void;
    'message:system': (data: SystemMessagePayload) => void;

    // Voice
    'voice:participants': (data: { participants: string[] }) => void;
    'voice:peer_joined': (data: { playerId: string; playerName: string }) => void;
    'voice:peer_left': (data: { playerId: string }) => void;
    'voice:offer': (data: { from: string; offer: RTCSessionDescriptionInit }) => void;
    'voice:answer': (data: { from: string; answer: RTCSessionDescriptionInit }) => void;
    'voice:ice_candidate': (data: { from: string; candidate: RTCIceCandidateInit }) => void;
    'voice:muted_by_admin': () => void;
    'voice:player_muted': (data: { playerId: string; mutedBy: string }) => void;
    'voice:player_unmuted': (data: { playerId: string; unmutedBy: string }) => void;
}

// ============================================
// Client → Server Events
// ============================================

export interface ClientToServerEvents {
    // Room
    'room:join': (data: { roomCode?: string; inviteToken?: string; teamId?: string }, callback: (response: { success: boolean; error?: string; roomId?: string }) => void) => void;
    'room:leave': (callback?: (response: { success: boolean; error?: string }) => void) => void;
    'room:join_team': (data: { teamId: string }, callback: (response: { success: boolean; error?: string }) => void) => void;

    // Game
    'game:submit_answer': (data: { questionId: string; answer: string; clientTimestamp: number }, callback: (response: { success: boolean; serverTime: number; timeTakenMs?: number; error?: string }) => void) => void;

    // Admin
    'admin:start_game': (callback: (response: { success: boolean; error?: string }) => void) => void;
    'admin:pause': (callback: (response: { success: boolean; error?: string }) => void) => void;
    'admin:resume': (callback: (response: { success: boolean; error?: string }) => void) => void;
    'admin:skip_question': (callback: (response: { success: boolean; error?: string }) => void) => void;
    'admin:restart_question': (callback: (response: { success: boolean; error?: string }) => void) => void;
    'admin:go_to_question': (data: { questionIndex: number }, callback: (response: { success: boolean; error?: string }) => void) => void;
    'admin:kick_player': (data: { playerId: string; reason: string }, callback: (response: { success: boolean; error?: string }) => void) => void;
    'admin:end_game': (callback: (response: { success: boolean; error?: string }) => void) => void;
    'admin:broadcast_message': (data: { content: string }, callback: (response: { success: boolean; error?: string }) => void) => void;
    'admin:mute_player': (data: { playerId: string }, callback: (response: { success: boolean; error?: string }) => void) => void;
    'admin:unmute_player': (data: { playerId: string }, callback: (response: { success: boolean; error?: string }) => void) => void;

    // Anti-cheat
    'anticheat:report': (data: { type: string; flags: AntiCheatFlags; timestamp: number }) => void;

    // Voice
    'voice:join': (callback: (response: { success: boolean; participants?: string[]; error?: string }) => void) => void;
    'voice:leave': () => void;
    'voice:offer': (data: { to: string; offer: RTCSessionDescriptionInit }) => void;
    'voice:answer': (data: { to: string; answer: RTCSessionDescriptionInit }) => void;
    'voice:ice_candidate': (data: { to: string; candidate: RTCIceCandidateInit }) => void;
    'voice:toggle_mute': (data: { muted: boolean }) => void;

    // Utility
    'ping': (callback: (response: { serverTime: number; latency: number }) => void) => void;
}

// ============================================
// Payload Types
// ============================================

export interface ConnectionEstablishedPayload {
    playerId: string;
    serverTime: number;
    roomState?: RoomState;
    players?: Player[];
    teams?: Team[];
    reconnected?: boolean;
}

export interface ReconnectedPayload {
    roomState: RoomState;
    currentQuestion?: QuestionPayload;
    remainingMs?: number;
    leaderboard: Leaderboard;
}

export interface RoomJoinedPayload {
    roomId: string;
    roomState: RoomState;
    players: Player[];
    teams: Team[];
    yourPlayer: Player;
    leaderboard: Leaderboard;
}

export interface QuestionStartPayload {
    question: QuestionPayload;
    serverTimestamp: number;
    remainingMs: number;
}

export interface QuestionResultsPayload {
    questionId: string;
    questionIndex: number;
    correctAnswer: string;
    playerResults: PlayerQuestionResult[];
    teamScores: Record<string, number>;
    leaderboard: Leaderboard;
    statistics: QuestionStatistics;
}

export interface GameEndedPayload {
    results: GameResults;
}

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
// Core Types
// ============================================

export type RoomStatus =
    | 'CREATED'
    | 'WAITING'
    | 'STARTING'
    | 'ACTIVE'
    | 'PAUSED'
    | 'QUESTION_ACTIVE'
    | 'QUESTION_CLOSED'
    | 'SHOWING_RESULTS'
    | 'ENDED';

export interface RoomState {
    roomId: string;
    status: RoomStatus;
    currentQuestionIndex: number;
    totalQuestions: number;
    adminId: string;
    settings: RoomSettings;
}

export interface RoomSettings {
    maxTeams: number;
    maxPlayersPerTeam: number;
    questionTimeSeconds: number;
    showResultsSeconds: number;
    countdownSeconds: number;
    allowReconnect: boolean;
    reconnectTimeoutSeconds: number;
}

export interface Player {
    id: string;
    displayName: string;
    avatarUrl?: string;
    teamId?: string;
    role: 'ADMIN' | 'PLAYER' | 'SPECTATOR';
    score: number;
    correctAnswers: number;
    totalAnswers: number;
    answerStatus: 'PENDING' | 'ANSWERED' | 'SKIPPED';
    currentAnswer?: string;
    currentAnswerTime?: number;
    connectionStatus: 'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING';
}

export interface Team {
    id: string;
    roomId: string;
    name: string;
    color: string;
    memberIds: string[];
    score: number;
}

export interface QuestionPayload {
    id: string;
    orderIndex: number;
    totalQuestions: number;
    articleHtml?: string;
    questionText: string;
    options: QuestionOption[];
    timeLimitMs: number;
}

export interface QuestionOption {
    id: string;
    text: string;
}

export interface PlayerQuestionResult {
    playerId: string;
    playerName: string;
    teamId?: string;
    answer?: string;
    result: 'CORRECT' | 'INCORRECT' | 'SKIPPED';
    timeTakenMs?: number;
    scoreEarned: number;
    totalScore: number;
}

export interface QuestionStatistics {
    totalPlayers: number;
    answered: number;
    skipped: number;
    correct: number;
    incorrect: number;
    averageTimeMs: number;
    fastestTimeMs?: number;
    fastestPlayerId?: string;
    optionDistribution: Record<string, number>;
}

export interface Leaderboard {
    players: LeaderboardEntry[];
    teams: TeamScore[];
    lastUpdated: number;
}

export interface LeaderboardEntry {
    rank: number;
    playerId: string;
    playerName: string;
    teamId?: string;
    teamName?: string;
    score: number;
    correctAnswers: number;
    totalAnswers: number;
    previousRank?: number;
    rankChange: number;
}

export interface TeamScore {
    teamId: string;
    teamName: string;
    teamColor: string;
    score: number;
    memberCount: number;
}

export interface GameResults {
    roomId: string;
    totalQuestions: number;
    duration: number;
    winner?: {
        player: LeaderboardEntry;
        team?: TeamScore;
    };
    leaderboard: Leaderboard;
    statistics: GameStatistics;
}

export interface GameStatistics {
    totalPlayers: number;
    totalAnswers: number;
    totalCorrect: number;
    totalIncorrect: number;
    totalSkipped: number;
    averageAccuracy: number;
    averageTimeMs: number;
}

export interface AntiCheatFlags {
    tabSwitches: number;
    focusLostCount: number;
    devToolsOpened: boolean;
    copyAttempts: number;
    pasteAttempts: number;
    rightClickAttempts: number;
    suspiciousPatterns: string[];
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    lastUpdated: number;
}

export interface AntiCheatAlert {
    id: string;
    roomId: string;
    playerId: string;
    playerName: string;
    alertType: string;
    severity: 'INFO' | 'WARNING' | 'ALERT' | 'CRITICAL';
    details: string;
    flags: AntiCheatFlags;
    timestamp: number;
    reviewed: boolean;
}
