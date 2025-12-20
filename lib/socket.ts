/**
 * Socket.IO Client for Real-time Game Events
 * Provides instant updates for game state, questions, and timer
 */

import { io, Socket } from 'socket.io-client';

// Socket events
export interface ServerToClientEvents {
  // Connection
  connected: { roomCode: string };
  error: { message: string };

  // Room events
  player_joined: { odUserId: string; odDisplayName: string; team?: string | null };
  player_left: { odUserId: string; odDisplayName: string };
  player_ready: { odUserId: string; isReady: boolean };

  // Game flow
  game_starting: { countdown: number };
  game_started: Record<string, never>;
  game_state_sync: { room: unknown; players: unknown[]; currentQuestion?: unknown };

  // Question events
  question_start: {
    questionNumber: number;
    question: string;
    options: string[];
    timeLimit: number;
    endsAt: number;
  };
  timer_tick: { timeRemaining: number; questionNumber: number; endsAt: number };
  timer_sync: { timeRemaining: number; questionNumber: number; endsAt: number; serverTime: number };
  timer_warning: { timeRemaining: number };
  show_result: { duration: number };
  player_answered: { odUserId: string; odDisplayName: string };
  answer_result: { isCorrect: boolean; points: number };
  question_result: {
    questionNumber: number;
    correctAnswer: number;
    winnerId?: string;
    winnerName?: string;
    scores: { odUserId: string; odDisplayName?: string; score: number; delta: number }[];
  };

  // Team mode
  answer_suggestion: {
    suggesterId: string;
    suggesterName: string;
    suggestedAnswer: number;
    team: 'A' | 'B';
  };

  // Chat
  chat_message: {
    senderId: string;
    senderName: string;
    message: string;
    team: 'A' | 'B';
    timestamp: number;
  };

  // End game
  game_ended: {
    rankings?: { odUserId: string; odDisplayName: string; score: number; rank: number }[];
  };
}

export interface ClientToServerEvents {
  join_room: {
    roomCode: string;
    odUserId: string;
    odDisplayName: string;
    team?: 'A' | 'B' | null;
  };
  leave_room: { roomCode: string; odUserId: string };
  player_ready: { roomCode: string; odUserId: string; isReady: boolean };
  start_game: { roomCode: string; token: string };
  request_timer_sync: { roomCode: string };
  submit_answer: {
    roomCode: string;
    odUserId: string;
    odDisplayName: string;
    answer: number;
    questionNumber: number;
    token: string;
  };
  suggest_answer: {
    roomCode: string;
    team: 'A' | 'B';
    suggesterId: string;
    suggesterName: string;
    answer: number;
  };
  chat_message: {
    roomCode: string;
    team: 'A' | 'B';
    senderId: string;
    senderName: string;
    message: string;
  };
}

// Typed socket
export type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

// Socket singleton
let socket: GameSocket | null = null;

/**
 * Get or create socket connection
 */
export function getSocket(): GameSocket {
  if (!socket) {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL ||
      (typeof window !== 'undefined' ? window.location.origin : '');

    socket = io(socketUrl, {
      path: '/api/socketio',
      transports: ['websocket', 'polling'],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 3000,
      timeout: 20000,
      // Upgrade to websocket quickly
      upgrade: true,
      rememberUpgrade: true,
    }) as GameSocket;

    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      socket.on('connect', () => {
        console.log('🔌 Socket connected:', socket?.id);
      });

      socket.on('disconnect', (reason) => {
        console.log('🔌 Socket disconnected:', reason);
      });

      socket.on('connect_error', (error) => {
        console.error('🔌 Socket error:', error.message);
      });
    }
  }

  return socket;
}

/**
 * Connect socket
 */
export function connectSocket(): GameSocket {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
  return s;
}

/**
 * Disconnect socket
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Join a game room
 */
export function joinGameRoom(
  roomCode: string,
  odUserId: string,
  odDisplayName: string,
  team?: 'A' | 'B' | null
): void {
  const s = connectSocket() as any;
  s.emit('join_room', { roomCode, odUserId, odDisplayName, team });
}

/**
 * Leave a game room
 */
export function leaveGameRoom(roomCode: string, odUserId: string): void {
  const s = getSocket() as any;
  s.emit('leave_room', { roomCode, odUserId });
}

/**
 * Request timer synchronization
 */
export function requestTimerSync(roomCode: string): void {
  const s = getSocket() as any;
  s.emit('request_timer_sync', { roomCode });
}

/**
 * Set player ready status
 */
export function setPlayerReady(roomCode: string, odUserId: string, isReady: boolean): void {
  const s = getSocket() as any;
  s.emit('player_ready', { roomCode, odUserId, isReady });
}

/**
 * Start the game (creator only)
 */
export function startGame(roomCode: string, token: string): void {
  const s = getSocket() as any;
  s.emit('start_game', { roomCode, token });
}

/**
 * Submit an answer
 */
export function submitAnswer(
  roomCode: string,
  odUserId: string,
  odDisplayName: string,
  answer: number,
  questionNumber: number,
  token: string
): void {
  const s = getSocket() as any;
  s.emit('submit_answer', { roomCode, odUserId, odDisplayName, answer, questionNumber, token });
}

/**
 * Suggest an answer (team mode, non-captains)
 */
export function suggestAnswer(
  roomCode: string,
  team: 'A' | 'B',
  suggesterId: string,
  suggesterName: string,
  answer: number
): void {
  const s = getSocket() as any;
  s.emit('suggest_answer', { roomCode, team, suggesterId, suggesterName, answer });
}

/**
 * Send chat message
 */
export function sendChatMessage(
  roomCode: string,
  team: 'A' | 'B',
  senderId: string,
  senderName: string,
  message: string
): void {
  const s = getSocket() as any;
  s.emit('chat_message', { roomCode, team, senderId, senderName, message });
}

/**
 * Check if using Socket.IO (vs SSE fallback)
 */
export const USING_SOCKET_IO = true;
