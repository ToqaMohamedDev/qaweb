/**
 * Quiz Battle Platform - Core Type Definitions
 * Server-Authoritative Architecture
 */

// ============================================
// User & Authentication Types
// ============================================

export interface User {
    id: string;
    email: string;
    displayName: string;
    avatarUrl?: string;
    passwordHash?: string;
    role: 'ADMIN' | 'PLAYER';
    stats: UserStats;
    deviceFingerprint?: string;
    ipHash?: string;
    createdAt: Date;
    updatedAt: Date;
    lastLogin?: Date;
    isBanned?: boolean;
    banReason?: string;
}

export interface UserStats {
    gamesPlayed: number;
    gamesWon: number;
    totalScore: number;
    correctAnswers: number;
    averageAccuracy: number;
}

export interface Session {
    id: string;
    userId: string;
    tokenHash?: string;
    deviceFingerprint?: string;
    ipHash?: string;
    deviceInfo?: DeviceInfo;
    isValid: boolean;
    isActive?: boolean;
    createdAt: Date;
    expiresAt: Date;
    lastActivity: Date;
}

export interface DeviceInfo {
    userAgent: string;
    platform: string;
    language: string;
    screenResolution?: string;
    timezone: string;
}

export interface AuthTokenPayload {
    userId: string;
    sessionId: string;
    role?: 'ADMIN' | 'PLAYER';
    deviceFingerprint?: string;
    iat?: number;
    exp?: number;
}

// ============================================
// Room Types
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
    | 'ENDED'
    | 'ARCHIVED';

export interface Room {
    id: string;
    code: string;
    adminId: string;
    title: string;
    description?: string;
    status: RoomStatus;
    settings: RoomSettings;
    inviteLinkToken: string;
    createdAt: Date;
    startedAt?: Date;
    endedAt?: Date;
}

export interface RoomSettings {
    maxTeams: number;
    maxPlayersPerTeam: number;
    questionTimeSeconds: number;
    showResultsSeconds: number;
    countdownSeconds: number;
    allowReconnect: boolean;
    reconnectTimeoutSeconds: number;
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
}

export const DEFAULT_ROOM_SETTINGS: RoomSettings = {
    maxTeams: 10,
    maxPlayersPerTeam: 5,
    questionTimeSeconds: 10,
    showResultsSeconds: 5,
    countdownSeconds: 3,
    allowReconnect: true,
    reconnectTimeoutSeconds: 60,
    shuffleQuestions: false,
    shuffleOptions: false,
};

export interface RoomState {
    roomId: string;
    status: RoomStatus;
    currentQuestionIndex: number;
    totalQuestions: number;
    questionStartTime?: number;
    questionEndTime?: number;
    pausedAt?: number;
    remainingWhenPaused?: number;
    adminId: string;
    settings: RoomSettings;
}

// ============================================
// Team Types
// ============================================

export interface Team {
    id: string;
    roomId: string;
    name: string;
    color: string;
    memberIds: string[];
    score: number;
    createdAt: Date;
}

// ============================================
// Player Types
// ============================================

export type PlayerRole = 'ADMIN' | 'PLAYER' | 'SPECTATOR';
export type AnswerStatus = 'PENDING' | 'ANSWERED' | 'SKIPPED';
export type ConnectionStatus = 'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING';

export interface Player {
    id: string;
    displayName: string;
    avatarUrl?: string;
    teamId?: string;
    role: PlayerRole;
    score: number;
    correctAnswers: number;
    totalAnswers: number;
    answerStatus: AnswerStatus;
    currentAnswer?: string;
    currentAnswerTime?: number;
    connectionStatus: ConnectionStatus;
    socketId?: string;
    joinedAt: Date;
    lastActivity: Date;
}

export interface DisconnectedPlayer {
    playerId: string;
    roomId: string;
    disconnectedAt: number;
    lastKnownState: Player;
    canReconnect: boolean;
}

// ============================================
// Question Types
// ============================================

export interface Question {
    id: string;
    roomId: string;
    orderIndex: number;
    articleHtml?: string;
    questionText: string;
    options: QuestionOption[];
    correctOption: string;
    timeLimitSeconds: number;
    createdAt: Date;
}

export interface QuestionOption {
    id: string; // 'A', 'B', 'C', 'D', etc.
    text: string;
}

// Question sent to players (without correct answer)
export interface QuestionPayload {
    id: string;
    orderIndex: number;
    totalQuestions: number;
    articleHtml?: string;
    questionText: string;
    options: QuestionOption[];
    timeLimitMs: number;
}

// ============================================
// Answer Types
// ============================================

export type AnswerResult = 'CORRECT' | 'INCORRECT' | 'SKIPPED';

export interface Answer {
    id: string;
    roomId: string;
    questionId: string;
    questionIndex: number;
    userId: string;
    teamId?: string;
    submittedAnswer?: string;
    result: AnswerResult;
    isCorrect: boolean;
    timeTakenMs?: number;
    clientSubmittedAt?: number;
    serverReceivedAt: number;
    questionStartedAt: number;
    questionClosedAt?: number;
}

export interface AnswerSubmission {
    questionId: string;
    answer: string;
    clientTimestamp: number;
}

export interface StoredAnswer {
    answer: string;
    submittedAt: number;
    clientTimestamp: number;
    timeTakenMs: number;
}

// ============================================
// Score & Leaderboard Types
// ============================================

export interface PlayerScore {
    playerId: string;
    playerName: string;
    teamId?: string;
    teamName?: string;
    score: number;
    correctAnswers: number;
    totalAnswers: number;
}

export interface TeamScore {
    teamId: string;
    teamName: string;
    teamColor: string;
    score: number;
    memberCount: number;
}

export interface LeaderboardEntry extends PlayerScore {
    rank: number;
    previousRank?: number;
    rankChange: number;
}

export interface Leaderboard {
    players: LeaderboardEntry[];
    teams: TeamScore[];
    lastUpdated: number;
}

// ============================================
// Game Result Types
// ============================================

export interface PlayerQuestionResult {
    playerId: string;
    playerName: string;
    teamId?: string;
    answer?: string;
    result: AnswerResult;
    timeTakenMs?: number;
    scoreEarned: number;
    totalScore: number;
}

export interface QuestionResults {
    questionId: string;
    questionIndex: number;
    correctAnswer: string;
    playerResults: PlayerQuestionResult[];
    teamScores: Record<string, number>;
    leaderboard: Leaderboard;
    statistics: QuestionStatistics;
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

// ============================================
// Anti-Cheat Types
// ============================================

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AlertSeverity = 'INFO' | 'WARNING' | 'ALERT' | 'CRITICAL';

export interface AntiCheatFlags {
    tabSwitches: number;
    focusLostCount: number;
    devToolsOpened: boolean;
    copyAttempts: number;
    pasteAttempts: number;
    rightClickAttempts: number;
    suspiciousPatterns: string[];
    riskLevel: RiskLevel;
    lastUpdated: number;
}

export interface AntiCheatReport {
    type: string;
    flags: AntiCheatFlags;
    timestamp: number;
    metadata?: Record<string, unknown>;
}

export interface AntiCheatAlert {
    id: string;
    roomId: string;
    playerId: string;
    playerName: string;
    alertType: string;
    severity: AlertSeverity;
    details: string;
    flags: AntiCheatFlags;
    timestamp: number;
    reviewed: boolean;
    reviewedBy?: string;
    actionTaken?: string;
}

// ============================================
// Validation Types
// ============================================

export type ValidationReason =
    | 'ROOM_NOT_FOUND'
    | 'ROOM_NOT_ACTIVE'
    | 'PLAYER_NOT_IN_ROOM'
    | 'QUESTION_CLOSED'
    | 'WRONG_QUESTION'
    | 'ALREADY_ANSWERED'
    | 'INVALID_OPTION'
    | 'RATE_LIMITED'
    | 'UNAUTHORIZED'
    | 'BANNED';

export interface ValidationCheck {
    name: string;
    passed: boolean;
    details?: string;
}

export interface ValidationResult {
    valid: boolean;
    reason?: ValidationReason;
    checks: ValidationCheck[];
}

export interface AnswerCollectionResult {
    success: boolean;
    reason?: ValidationReason;
    serverTime: number;
    timeTakenMs?: number;
}

// ============================================
// Admin Action Types
// ============================================

export type AdminActionType =
    | 'PAUSE'
    | 'RESUME'
    | 'SKIP_QUESTION'
    | 'RESTART_QUESTION'
    | 'GO_TO_QUESTION'
    | 'KICK_PLAYER'
    | 'MUTE_PLAYER'
    | 'UNMUTE_PLAYER'
    | 'END_GAME'
    | 'BROADCAST_MESSAGE';

export interface AdminAction {
    type: AdminActionType;
    playerId?: string;
    questionIndex?: number;
    reason?: string;
    content?: string;
}

export interface AdminActionResult {
    success: boolean;
    reason?: string;
    data?: Record<string, unknown>;
}

// ============================================
// Event Log Types
// ============================================

export type EventType =
    | 'ROOM_CREATED'
    | 'ROOM_STARTED'
    | 'ROOM_ENDED'
    | 'PLAYER_JOINED'
    | 'PLAYER_LEFT'
    | 'PLAYER_KICKED'
    | 'PLAYER_DISCONNECTED'
    | 'PLAYER_RECONNECTED'
    | 'QUESTION_STARTED'
    | 'QUESTION_CLOSED'
    | 'ANSWER_SUBMITTED'
    | 'GAME_PAUSED'
    | 'GAME_RESUMED'
    | 'ADMIN_ACTION'
    | 'ANTICHEAT_FLAG'
    | 'ANTICHEAT_ALERT';

export interface EventLog {
    id: string;
    roomId?: string;
    userId?: string;
    eventType: EventType;
    eventData: Record<string, unknown>;
    ipHash?: string;
    userAgent?: string;
    timestamp: Date;
}

// ============================================
// Timer Types
// ============================================

export type TimerStatus = 'IDLE' | 'RUNNING' | 'PAUSED' | 'EXPIRED';

export interface TimerState {
    roomId: string;
    status: TimerStatus;
    startTime: number;
    duration: number;
    pausedAt?: number;
    totalPausedTime: number;
    endTime: number;
}

// ============================================
// Voice Chat Types
// ============================================

export interface VoiceParticipant {
    playerId: string;
    socketId: string;
    isMuted: boolean;
    isDeafened: boolean;
    isSpeaking: boolean;
    joinedAt: number;
}

export interface VoiceRoom {
    id: string;
    roomId: string;
    participants: Map<string, VoiceParticipant>;
    adminMutedPlayers: Set<string>;
    createdAt: number;
}

// ============================================
// Utility Types
// ============================================

export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type WithTimestamps<T> = T & {
    createdAt: Date;
    updatedAt: Date;
};

export type Nullable<T> = T | null;
