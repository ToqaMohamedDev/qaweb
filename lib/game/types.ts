// Game Types for Quiz Battle

export type GameMode = 'ffa' | 'team';
export type RoomStatus = 'waiting' | 'starting' | 'playing' | 'finished';
export type TeamId = 'A' | 'B' | null;
export type Difficulty = 'easy' | 'medium' | 'hard' | 'mixed';

// Room Configuration
export interface RoomConfig {
    id: string;
    code: string;
    name: string;
    isPrivate: boolean;
    password?: string; // Hashed if set
    gameMode: GameMode;
    maxPlayers: number;
    questionCount: number;
    timePerQuestion: number;
    category: string;
    difficulty: Difficulty;
    creatorId: string;
    status: RoomStatus;
    currentQuestion: number;
    questionIds: string[];
    createdAt: number;
    startedAt?: number;
}

// Player in Room
export interface RoomPlayer {
    odUserId: string;
    odDisplayName: string;
    avatar?: string;
    team: TeamId;
    isCaptain: boolean;
    isReady: boolean;
    score: number;
    correctAnswers: number;
    wrongAnswers: number;
    streak: number;
    joinedAt: number;
    lastActive: number;
}

// Question State
export interface QuestionState {
    questionId: string;
    startedAt: number;
    endsAt: number;
    answeredBy?: string;
    answeredAt?: number;
    playerAnswers: Record<string, PlayerAnswer>;
    isComplete: boolean;
}

export interface PlayerAnswer {
    odUserId: string;
    answer: number;
    timestamp: number;
    isCorrect: boolean;
    responseTime: number;
}

// User Session
export interface UserSession {
    currentRoom?: string;
    lastActivity: number;
    connectionId?: string;
}

// API Request/Response Types
export interface CreateRoomRequest {
    name: string;
    gameMode: GameMode;
    isPrivate: boolean;
    password?: string;
    maxPlayers?: number;
    questionCount?: number;
    timePerQuestion?: number;
    category?: string;
    difficulty?: Difficulty;
}

export interface JoinRoomRequest {
    code: string;
    password?: string;
}

export interface AnswerRequest {
    questionNumber: number;
    answer: number;
}

// Real-time Events
export type GameEventType =
    | 'player_joined'
    | 'player_left'
    | 'player_ready'
    | 'game_starting'
    | 'game_started'
    | 'question_start'
    | 'player_answered'
    | 'question_result'
    | 'game_ended'
    | 'captain_changed'
    | 'chat_message'
    | 'answer_suggestion';

export interface GameEvent {
    type: GameEventType;
    roomCode: string;
    timestamp: number;
    data: Record<string, unknown>;
}

// Room Summary for Lobby
export interface RoomSummary {
    code: string;
    name: string;
    gameMode: GameMode;
    currentPlayers: number;
    maxPlayers: number;
    status: RoomStatus;
    creatorName?: string;
}

// Game Results
export interface GameResults {
    roomCode: string;
    gameMode: GameMode;
    players: PlayerResult[];
    winner?: PlayerResult | TeamResult;
    totalQuestions: number;
    gameDuration: number;
}

export interface PlayerResult {
    odUserId: string;
    odDisplayName: string;
    avatar?: string;
    score: number;
    correctAnswers: number;
    wrongAnswers: number;
    averageResponseTime: number;
    longestStreak: number;
    rank: number;
}

export interface TeamResult {
    team: TeamId;
    totalScore: number;
    players: PlayerResult[];
}

// Question from Database
export interface GameQuestion {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    category: string;
    difficulty: Difficulty;
}

// Re-export TimerState from redis module for backwards compatibility
export type { TimerState } from '../redis';

// Re-export user types for game context
export { extractGameUser } from './user-types';
export type { GameUser, ScoreUpdate } from './user-types';
