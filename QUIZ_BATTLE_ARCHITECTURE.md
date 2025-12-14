# 🎮 Quiz Battle Platform - Complete Architecture

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Game Flow](#game-flow)
4. [Data Schema](#data-schema)
5. [Real-Time Communication](#real-time-communication)
6. [Security & Anti-Cheat](#security--anti-cheat)
7. [Timing Edge Cases](#timing-edge-cases)
8. [Performance Best Practices](#performance-best-practices)

---

## 🏗️ System Overview

### Core Principles
- **Server-Authoritative**: السيرفر هو الحكم الوحيد - لا يُنفذ أي منطق حسابي على الفرونت
- **Real-Time Synchronization**: جميع اللاعبين يرون نفس الحالة في نفس الوقت
- **Fault Tolerance**: النظام يتعامل مع الانقطاعات والتأخير بشكل ذكي
- **Scalability**: قابل للتوسع أفقياً (Horizontal Scaling)

### Technology Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│  Next.js 16  │  React 19  │  Socket.io-client  │  WebRTC       │
│  TailwindCSS │  Framer Motion │  Anti-Cheat Module              │
└─────────────────────────────────────────────────────────────────┘
                              │
                    WebSocket │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY / LOAD BALANCER                │
│                         (Nginx / Traefik)                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │ Auth Server │  │ Game Server │  │ Voice Signaling Server  │ │
│  │ (REST API)  │  │ (Socket.io) │  │ (WebRTC + TURN/STUN)   │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│          │              │                    │                  │
│          └──────────────┼────────────────────┘                  │
│                         │                                       │
│              ┌──────────▼──────────┐                           │
│              │    Game Engine      │                           │
│              │   (State Machine)   │                           │
│              └─────────────────────┘                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │     Redis       │  │   PostgreSQL    │  │    Firebase     │ │
│  │  (Game State)   │  │  (Persistent)   │  │  (Auth/Logs)    │ │
│  │  TTL: 24 hours  │  │                 │  │                 │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Game Flow (Timer-Based)

### State Machine Diagram

```
┌──────────────┐
│   CREATED    │ ◄── Room Created by Admin
└──────┬───────┘
       │ Admin starts game
       ▼
┌──────────────┐
│   WAITING    │ ◄── Waiting for players to join
└──────┬───────┘
       │ Min players reached + Admin starts
       ▼
┌──────────────┐
│   STARTING   │ ◄── Countdown (3...2...1)
└──────┬───────┘     Duration: 3 seconds
       │
       ▼
┌──────────────────────────────────────────────────────────────────┐
│                         GAME LOOP                                 │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────┐      ┌─────────────────┐                    │
│  │ QUESTION_ACTIVE │ ──── │ Timer: 10 sec   │                    │
│  │                 │      │ Accept answers  │                    │
│  └────────┬────────┘      └─────────────────┘                    │
│           │                                                       │
│           │ Timer expires OR Admin skips                         │
│           ▼                                                       │
│  ┌─────────────────┐      ┌─────────────────┐                    │
│  │ QUESTION_CLOSED │ ──── │ Lock answers    │                    │
│  │                 │      │ Calculate scores│                    │
│  └────────┬────────┘      └─────────────────┘                    │
│           │                                                       │
│           │ Results broadcast                                    │
│           ▼                                                       │
│  ┌─────────────────┐      ┌─────────────────┐                    │
│  │ SHOWING_RESULTS │ ──── │ Display: 5 sec  │                    │
│  │                 │      │ Show stats      │                    │
│  └────────┬────────┘      └─────────────────┘                    │
│           │                                                       │
│           │ More questions?                                      │
│           ├─── Yes ───► Loop back to QUESTION_ACTIVE             │
│           │                                                       │
│           └─── No ────► Exit loop                                │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────┐
│  GAME_ENDED  │ ◄── Final results + Winner announcement
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   ARCHIVED   │ ◄── Room archived for analytics
└──────────────┘
```

### Timeline of a Single Question

```
Time (seconds)
│
0 ──────────────────────────────────────────────────────────────►
│
│  SERVER broadcasts QUESTION_START
│  ├── questionId, content, options, articleHTML
│  ├── serverTimestamp
│  └── remainingMs: 10000
│
│  ┌────────────────────────────────────────────────────────────┐
│  │              QUESTION ACTIVE WINDOW (10 sec)              │
│  │                                                            │
│  │  • Players can submit ONE answer each                     │
│  │  • Server accepts: { playerId, answer, clientTimestamp }  │
│  │  • Server validates & stores answer                       │
│  │  • Admin sees live dashboard                              │
│  │                                                            │
│  └────────────────────────────────────────────────────────────┘
│
10 ─────────────────────────────────────────────────────────────►
│
│  SERVER broadcasts QUESTION_CLOSED
│  ├── No more answers accepted
│  ├── Late answers rejected with reason: "QUESTION_CLOSED"
│  └── Processing begins
│
│  SERVER calculates results:
│  ├── For each player: CORRECT / INCORRECT / SKIPPED
│  ├── Update player scores
│  └── Update team scores
│
│  SERVER broadcasts QUESTION_RESULTS
│  ├── correctAnswer
│  ├── playerResults: [{ playerId, answer, result, timeTakenMs }]
│  ├── teamScores: { teamId: totalScore }
│  └── leaderboard
│
15 ─────────────────────────────────────────────────────────────►
│  (5 seconds for viewing results)
│
│  SERVER broadcasts NEXT_QUESTION or GAME_ENDED
│
```

---

## 📊 Data Schema

### Redis Keys Structure (Real-Time State)

```typescript
// Room State
room:{roomId}:state → {
  status: 'CREATED' | 'WAITING' | 'STARTING' | 'ACTIVE' | 'PAUSED' | 'ENDED',
  currentQuestionIndex: number,
  questionStartTime: number, // Unix timestamp ms
  questionEndTime: number,
  adminId: string,
  createdAt: number,
  settings: RoomSettings
}

// Room Players
room:{roomId}:players → Set<playerId>

// Team Composition
room:{roomId}:team:{teamId} → Set<playerId>

// Current Question Answers (cleared each question)
room:{roomId}:q:{questionIndex}:answers → {
  [playerId]: {
    answer: string,
    submittedAt: number,
    serverReceivedAt: number
  }
}

// Player Scores
room:{roomId}:scores → {
  [playerId]: number
}

// Team Scores
room:{roomId}:teamScores → {
  [teamId]: number
}

// Anti-Cheat Flags
room:{roomId}:flags:{playerId} → {
  tabSwitches: number,
  focusLost: number,
  devToolsOpened: boolean,
  suspiciousPatterns: string[]
}

// Connection Tracking
room:{roomId}:connections → {
  [playerId]: {
    socketId: string,
    connectedAt: number,
    lastPing: number
  }
}
```

### PostgreSQL Schema (Persistent Storage)

```sql
-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    device_fingerprint VARCHAR(64),
    ip_hash VARCHAR(64), -- SHA256 of IP, not raw IP
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    is_banned BOOLEAN DEFAULT FALSE,
    ban_reason TEXT,
    
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Sessions Table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL,
    device_info JSONB,
    ip_hash VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    
    INDEX idx_sessions_user_id (user_id),
    INDEX idx_sessions_token_hash (token_hash)
);

-- Rooms Table
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(8) UNIQUE NOT NULL, -- Short code for joining
    admin_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'CREATED',
    settings JSONB NOT NULL DEFAULT '{
        "maxTeams": 10,
        "maxPlayersPerTeam": 5,
        "questionTimeSeconds": 10,
        "showResultsSeconds": 5,
        "allowReconnect": true,
        "reconnectTimeoutSeconds": 60
    }',
    invite_link_token VARCHAR(64) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    
    INDEX idx_rooms_code (code),
    INDEX idx_rooms_admin (admin_id),
    INDEX idx_rooms_status (status)
);

-- Teams Table
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7), -- Hex color
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_teams_room (room_id)
);

-- Room Participants
CREATE TABLE room_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    role VARCHAR(20) DEFAULT 'PLAYER', -- ADMIN, PLAYER, SPECTATOR
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    left_at TIMESTAMP WITH TIME ZONE,
    final_score INTEGER DEFAULT 0,
    
    UNIQUE (room_id, user_id),
    INDEX idx_participants_room (room_id),
    INDEX idx_participants_user (user_id)
);

-- Questions Table
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    article_html TEXT, -- Passage/Article shown above question
    question_text TEXT NOT NULL,
    options JSONB NOT NULL, -- Array of { id: "A", text: "..." }
    correct_option VARCHAR(5) NOT NULL,
    time_limit_seconds INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE (room_id, order_index),
    INDEX idx_questions_room (room_id)
);

-- Answers Table (Immutable Log)
CREATE TABLE answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    team_id UUID REFERENCES teams(id),
    submitted_answer VARCHAR(5), -- NULL if skipped
    is_correct BOOLEAN,
    result VARCHAR(20) NOT NULL, -- 'CORRECT', 'INCORRECT', 'SKIPPED'
    time_taken_ms INTEGER, -- NULL if skipped
    client_submitted_at BIGINT, -- Client timestamp
    server_received_at TIMESTAMP WITH TIME ZONE NOT NULL,
    question_started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    question_closed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE (question_id, user_id),
    INDEX idx_answers_room (room_id),
    INDEX idx_answers_user (user_id),
    INDEX idx_answers_question (question_id)
);

-- Event Logs Table (Audit Trail)
CREATE TABLE event_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB,
    ip_hash VARCHAR(64),
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_logs_room (room_id),
    INDEX idx_logs_user (user_id),
    INDEX idx_logs_type (event_type),
    INDEX idx_logs_timestamp (timestamp)
);

-- Anti-Cheat Alerts
CREATE TABLE anti_cheat_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL, -- LOW, MEDIUM, HIGH, CRITICAL
    details JSONB,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    action_taken VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_alerts_room (room_id),
    INDEX idx_alerts_user (user_id),
    INDEX idx_alerts_severity (severity)
);
```

### TypeScript Interfaces

```typescript
// Core Types
interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  deviceFingerprint: string;
  ipHash: string;
  createdAt: Date;
  isBanned: boolean;
}

interface Session {
  id: string;
  userId: string;
  tokenHash: string;
  deviceInfo: DeviceInfo;
  expiresAt: Date;
  isActive: boolean;
}

interface Room {
  id: string;
  code: string;
  adminId: string;
  title: string;
  status: RoomStatus;
  settings: RoomSettings;
  inviteLinkToken: string;
  createdAt: Date;
  startedAt?: Date;
  endedAt?: Date;
}

interface RoomSettings {
  maxTeams: number;
  maxPlayersPerTeam: number;
  questionTimeSeconds: number;
  showResultsSeconds: number;
  allowReconnect: boolean;
  reconnectTimeoutSeconds: number;
}

type RoomStatus = 
  | 'CREATED' 
  | 'WAITING' 
  | 'STARTING' 
  | 'ACTIVE' 
  | 'PAUSED' 
  | 'ENDED' 
  | 'ARCHIVED';

interface Team {
  id: string;
  roomId: string;
  name: string;
  color: string;
  memberIds: string[];
}

interface Question {
  id: string;
  roomId: string;
  orderIndex: number;
  articleHtml?: string;
  questionText: string;
  options: QuestionOption[];
  correctOption: string;
  timeLimitSeconds: number;
}

interface QuestionOption {
  id: string; // 'A', 'B', 'C', 'D'
  text: string;
}

interface Answer {
  id: string;
  questionId: string;
  userId: string;
  teamId?: string;
  submittedAnswer?: string;
  result: 'CORRECT' | 'INCORRECT' | 'SKIPPED';
  timeTakenMs?: number;
  serverReceivedAt: Date;
}

interface PlayerState {
  id: string;
  displayName: string;
  teamId?: string;
  score: number;
  currentAnswer?: string;
  answerStatus: 'PENDING' | 'ANSWERED' | 'SKIPPED';
  isConnected: boolean;
  flags: AntiCheatFlags;
}

interface AntiCheatFlags {
  tabSwitches: number;
  focusLostCount: number;
  devToolsOpened: boolean;
  suspiciousPatterns: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface GameState {
  roomId: string;
  status: RoomStatus;
  currentQuestionIndex: number;
  currentQuestion?: Question;
  questionStartTime?: number;
  questionEndTime?: number;
  remainingMs?: number;
  players: Map<string, PlayerState>;
  teams: Map<string, Team>;
  leaderboard: LeaderboardEntry[];
}

interface LeaderboardEntry {
  rank: number;
  playerId: string;
  playerName: string;
  teamId?: string;
  teamName?: string;
  score: number;
  correctAnswers: number;
  totalAnswers: number;
}

// WebSocket Events
interface ServerToClientEvents {
  // Connection
  'connection:established': (data: { playerId: string; roomState: GameState }) => void;
  'connection:error': (data: { code: string; message: string }) => void;
  
  // Room Events
  'room:player_joined': (data: { player: PlayerState }) => void;
  'room:player_left': (data: { playerId: string; reason: string }) => void;
  'room:team_updated': (data: { team: Team }) => void;
  
  // Game Events
  'game:starting': (data: { countdownSeconds: number }) => void;
  'game:question_start': (data: QuestionStartPayload) => void;
  'game:timer_sync': (data: { remainingMs: number }) => void;
  'game:question_closed': (data: { questionId: string }) => void;
  'game:question_results': (data: QuestionResultsPayload) => void;
  'game:ended': (data: GameEndedPayload) => void;
  'game:paused': (data: { reason: string }) => void;
  'game:resumed': (data: { remainingMs: number }) => void;
  
  // Admin Events
  'admin:player_answered': (data: AdminAnswerNotification) => void;
  'admin:alert': (data: AntiCheatAlert) => void;
  
  // Messages
  'message:broadcast': (data: { from: string; content: string; timestamp: number }) => void;
}

interface ClientToServerEvents {
  // Room Actions
  'room:join': (data: { roomCode: string; teamId?: string }) => void;
  'room:leave': () => void;
  
  // Game Actions
  'game:submit_answer': (data: AnswerSubmission) => void;
  
  // Admin Actions
  'admin:start_game': () => void;
  'admin:pause': () => void;
  'admin:resume': () => void;
  'admin:skip_question': () => void;
  'admin:restart_question': () => void;
  'admin:go_to_question': (data: { index: number }) => void;
  'admin:kick_player': (data: { playerId: string; reason: string }) => void;
  'admin:end_game': () => void;
  'admin:broadcast_message': (data: { content: string }) => void;
  
  // Anti-Cheat Reports
  'anticheat:report': (data: AntiCheatReport) => void;
}

interface AnswerSubmission {
  questionId: string;
  answer: string;
  clientTimestamp: number;
}

interface QuestionStartPayload {
  questionId: string;
  questionIndex: number;
  totalQuestions: number;
  articleHtml?: string;
  questionText: string;
  options: QuestionOption[];
  serverTimestamp: number;
  remainingMs: number;
}

interface QuestionResultsPayload {
  questionId: string;
  correctAnswer: string;
  playerResults: PlayerQuestionResult[];
  teamScores: Record<string, number>;
  leaderboard: LeaderboardEntry[];
}

interface PlayerQuestionResult {
  playerId: string;
  playerName: string;
  teamId?: string;
  answer?: string;
  result: 'CORRECT' | 'INCORRECT' | 'SKIPPED';
  timeTakenMs?: number;
  scoreEarned: number;
}
```

---

## 🔌 Real-Time Communication

### WebSocket Connection Flow

```
CLIENT                          SERVER
   │                               │
   │───── Connect (token) ────────►│
   │                               │ Validate token
   │                               │ Check session
   │                               │ Load player state
   │◄──── connection:established ──│
   │                               │
   │───── room:join ─────────────►│
   │                               │ Validate room
   │                               │ Add player to room
   │◄──── room:player_joined ─────│
   │                               │ Broadcast to others
   │                               │
   │            [GAME STARTS]      │
   │                               │
   │◄──── game:starting ──────────│
   │      (countdown: 3s)          │
   │                               │
   │◄──── game:question_start ────│
   │                               │
   │───── game:submit_answer ────►│
   │                               │ Validate:
   │                               │ - Question still open?
   │                               │ - First answer?
   │                               │ - Valid option?
   │◄──── (acknowledgment) ───────│
   │                               │
   │◄──── game:timer_sync ────────│ (every 1s)
   │                               │
   │◄──── game:question_closed ───│ (after 10s)
   │                               │
   │◄──── game:question_results ──│
   │                               │
   │        [LOOP OR END]          │
   │                               │
```

### Reconnection Handling

```typescript
// Server-side reconnection logic
class ReconnectionHandler {
  private readonly RECONNECT_WINDOW_MS = 60000; // 60 seconds
  private disconnectedPlayers: Map<string, DisconnectedPlayer> = new Map();

  handleDisconnect(playerId: string, roomId: string): void {
    const player = this.getPlayer(playerId);
    
    this.disconnectedPlayers.set(playerId, {
      playerId,
      roomId,
      disconnectedAt: Date.now(),
      lastKnownState: player.state
    });

    // Notify room but don't remove player yet
    this.broadcastToRoom(roomId, 'room:player_disconnected', {
      playerId,
      canReconnect: true,
      timeoutMs: this.RECONNECT_WINDOW_MS
    });

    // Schedule cleanup
    setTimeout(() => {
      if (this.disconnectedPlayers.has(playerId)) {
        this.finalizeDisconnect(playerId, roomId);
      }
    }, this.RECONNECT_WINDOW_MS);
  }

  handleReconnect(playerId: string, socket: Socket): boolean {
    const disconnected = this.disconnectedPlayers.get(playerId);
    
    if (!disconnected) {
      return false; // Cannot reconnect, was fully removed
    }

    if (Date.now() - disconnected.disconnectedAt > this.RECONNECT_WINDOW_MS) {
      return false; // Too late
    }

    // Restore player
    this.disconnectedPlayers.delete(playerId);
    this.restorePlayerState(playerId, disconnected.lastKnownState);
    
    // Send current game state
    socket.emit('connection:established', {
      playerId,
      roomState: this.getRoomState(disconnected.roomId),
      reconnected: true
    });

    this.broadcastToRoom(disconnected.roomId, 'room:player_reconnected', {
      playerId
    });

    return true;
  }
}
```

---

## 🛡️ Security & Anti-Cheat

### Frontend Anti-Cheat Module

```typescript
// Anti-cheat detection (Frontend - REPORTS ONLY, no enforcement)
class AntiCheatMonitor {
  private socket: Socket;
  private flags: AntiCheatFlags = {
    tabSwitches: 0,
    focusLostCount: 0,
    devToolsOpened: false,
    suspiciousPatterns: []
  };

  constructor(socket: Socket) {
    this.socket = socket;
    this.initializeMonitors();
  }

  private initializeMonitors(): void {
    // Tab visibility
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.flags.tabSwitches++;
        this.reportFlag('TAB_SWITCH');
      }
    });

    // Window focus
    window.addEventListener('blur', () => {
      this.flags.focusLostCount++;
      this.reportFlag('FOCUS_LOST');
    });

    // DevTools detection (heuristic)
    this.detectDevTools();

    // Disable actions (UI only - not security)
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('copy', (e) => e.preventDefault());
    document.addEventListener('paste', (e) => e.preventDefault());
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'v' || e.key === 'u')) {
        e.preventDefault();
      }
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
        e.preventDefault();
        this.flags.devToolsOpened = true;
        this.reportFlag('DEVTOOLS_SHORTCUT');
      }
    });
  }

  private detectDevTools(): void {
    const threshold = 160;
    const check = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      
      if (widthThreshold || heightThreshold) {
        if (!this.flags.devToolsOpened) {
          this.flags.devToolsOpened = true;
          this.reportFlag('DEVTOOLS_SIZE');
        }
      }
    };
    
    setInterval(check, 1000);
  }

  private reportFlag(type: string): void {
    this.socket.emit('anticheat:report', {
      type,
      flags: { ...this.flags },
      timestamp: Date.now()
    });
  }
}
```

### Backend Validation

```typescript
// Server-side answer validation
class AnswerValidator {
  async validateAnswer(
    playerId: string,
    roomId: string,
    submission: AnswerSubmission
  ): Promise<ValidationResult> {
    const checks: ValidationCheck[] = [];

    // 1. Room exists and is active
    const room = await this.redis.get(`room:${roomId}:state`);
    if (!room || room.status !== 'ACTIVE') {
      return { valid: false, reason: 'ROOM_NOT_ACTIVE', checks };
    }
    checks.push({ name: 'room_active', passed: true });

    // 2. Player is in room
    const isInRoom = await this.redis.sismember(`room:${roomId}:players`, playerId);
    if (!isInRoom) {
      return { valid: false, reason: 'PLAYER_NOT_IN_ROOM', checks };
    }
    checks.push({ name: 'player_in_room', passed: true });

    // 3. Question is still open
    const now = Date.now();
    const questionOpen = room.questionStartTime + (room.settings.questionTimeSeconds * 1000);
    if (now > questionOpen) {
      return { valid: false, reason: 'QUESTION_CLOSED', checks };
    }
    checks.push({ name: 'question_open', passed: true });

    // 4. Question ID matches current question
    const currentQuestion = await this.getQuestion(roomId, room.currentQuestionIndex);
    if (submission.questionId !== currentQuestion.id) {
      return { valid: false, reason: 'WRONG_QUESTION', checks };
    }
    checks.push({ name: 'correct_question', passed: true });

    // 5. No previous answer from this player
    const existingAnswer = await this.redis.hget(
      `room:${roomId}:q:${room.currentQuestionIndex}:answers`,
      playerId
    );
    if (existingAnswer) {
      return { valid: false, reason: 'ALREADY_ANSWERED', checks };
    }
    checks.push({ name: 'first_answer', passed: true });

    // 6. Valid option
    const validOptions = currentQuestion.options.map(o => o.id);
    if (!validOptions.includes(submission.answer)) {
      return { valid: false, reason: 'INVALID_OPTION', checks };
    }
    checks.push({ name: 'valid_option', passed: true });

    // 7. Rate limiting (max 1 answer per question, already checked above)
    // Additional: Check for suspiciously fast answers
    const timeTaken = now - room.questionStartTime;
    if (timeTaken < 500) { // Less than 0.5 seconds
      // Log but don't reject - might be legitimate
      await this.logSuspiciousPattern(playerId, roomId, 'VERY_FAST_ANSWER', { timeTaken });
    }
    checks.push({ name: 'timing_check', passed: true });

    return { valid: true, reason: null, checks };
  }
}
```

### Rate Limiting

```typescript
// Token bucket rate limiter per player
class RateLimiter {
  private buckets: Map<string, TokenBucket> = new Map();

  async checkLimit(playerId: string, action: string): Promise<boolean> {
    const key = `${playerId}:${action}`;
    const bucket = this.buckets.get(key) || this.createBucket(action);
    
    if (bucket.tokens > 0) {
      bucket.tokens--;
      bucket.lastUpdate = Date.now();
      return true;
    }
    
    return false;
  }

  private createBucket(action: string): TokenBucket {
    const config = this.getConfig(action);
    return {
      tokens: config.maxTokens,
      maxTokens: config.maxTokens,
      refillRate: config.refillRate,
      lastUpdate: Date.now()
    };
  }

  private getConfig(action: string): BucketConfig {
    switch (action) {
      case 'SUBMIT_ANSWER':
        return { maxTokens: 1, refillRate: 0 }; // 1 per question, no refill
      case 'JOIN_ROOM':
        return { maxTokens: 3, refillRate: 1 }; // 3 attempts, 1/sec refill
      case 'RECONNECT':
        return { maxTokens: 5, refillRate: 0.1 }; // 5 attempts, slow refill
      default:
        return { maxTokens: 10, refillRate: 1 };
    }
  }
}
```

---

## ⏱️ Timing Edge Cases

### Server Clock Synchronization

```typescript
// Server authoritative timer with client drift compensation
class GameTimer {
  private roomId: string;
  private startTime: number;
  private duration: number;
  private isPaused: boolean = false;
  private pausedAt?: number;
  private totalPausedTime: number = 0;

  constructor(roomId: string, durationMs: number) {
    this.roomId = roomId;
    this.duration = durationMs;
  }

  start(): void {
    this.startTime = Date.now();
    this.broadcastTimerSync();
    this.scheduleEnd();
  }

  getRemainingMs(): number {
    if (this.isPaused) {
      return this.duration - (this.pausedAt! - this.startTime - this.totalPausedTime);
    }
    return Math.max(0, this.duration - (Date.now() - this.startTime - this.totalPausedTime));
  }

  pause(): void {
    if (!this.isPaused) {
      this.isPaused = true;
      this.pausedAt = Date.now();
    }
  }

  resume(): void {
    if (this.isPaused) {
      this.totalPausedTime += Date.now() - this.pausedAt!;
      this.isPaused = false;
      this.pausedAt = undefined;
      this.broadcastTimerSync();
    }
  }

  private broadcastTimerSync(): void {
    // Broadcast every second for client sync
    const syncInterval = setInterval(() => {
      if (this.isPaused) return;
      
      const remaining = this.getRemainingMs();
      if (remaining <= 0) {
        clearInterval(syncInterval);
        return;
      }

      this.io.to(this.roomId).emit('game:timer_sync', {
        remainingMs: remaining,
        serverTimestamp: Date.now()
      });
    }, 1000);
  }

  private scheduleEnd(): void {
    // Use Redis or reliable scheduler for production
    // setTimeout alone is not reliable for long durations or server restarts
    
    const checkEnd = () => {
      if (this.isPaused) {
        setTimeout(checkEnd, 100);
        return;
      }
      
      if (this.getRemainingMs() <= 0) {
        this.onEnd();
      } else {
        setTimeout(checkEnd, 100);
      }
    };
    
    checkEnd();
  }

  private onEnd(): void {
    this.emit('timerEnd', { roomId: this.roomId });
  }
}
```

### Handling Late Answers

```typescript
// Answer submission with timing validation
class AnswerHandler {
  private readonly GRACE_PERIOD_MS = 200; // Account for network latency

  async handleAnswer(
    playerId: string,
    roomId: string,
    submission: AnswerSubmission
  ): Promise<AnswerResult> {
    const receivedAt = Date.now();
    const roomState = await this.getRoomState(roomId);
    
    // Calculate deadline with grace period
    const deadline = roomState.questionEndTime + this.GRACE_PERIOD_MS;
    
    if (receivedAt > deadline) {
      // Log for analytics
      await this.logLateSubmission(playerId, roomId, {
        receivedAt,
        deadline,
        lateBy: receivedAt - deadline
      });
      
      return {
        accepted: false,
        reason: 'QUESTION_CLOSED',
        serverTime: receivedAt
      };
    }

    // Even if within grace period, check if question is closed
    if (roomState.status !== 'QUESTION_ACTIVE') {
      return {
        accepted: false,
        reason: 'QUESTION_ALREADY_PROCESSED'
      };
    }

    // Process answer
    return this.processAnswer(playerId, roomId, submission, receivedAt);
  }
}
```

### Server Restart Recovery

```typescript
// Redis-based timer persistence for crash recovery
class PersistentTimer {
  async saveTimerState(roomId: string, timer: TimerState): Promise<void> {
    await this.redis.hset(`room:${roomId}:timer`, {
      startTime: timer.startTime,
      duration: timer.duration,
      pausedAt: timer.pausedAt || '',
      totalPausedTime: timer.totalPausedTime,
      status: timer.status
    });
    await this.redis.expire(`room:${roomId}:timer`, 86400); // 24 hour TTL
  }

  async recoverTimer(roomId: string): Promise<TimerState | null> {
    const data = await this.redis.hgetall(`room:${roomId}:timer`);
    if (!data || !data.startTime) return null;

    const timer: TimerState = {
      startTime: parseInt(data.startTime),
      duration: parseInt(data.duration),
      pausedAt: data.pausedAt ? parseInt(data.pausedAt) : undefined,
      totalPausedTime: parseInt(data.totalPausedTime) || 0,
      status: data.status as TimerStatus
    };

    // Calculate if timer should have ended during downtime
    const elapsed = Date.now() - timer.startTime - timer.totalPausedTime;
    if (elapsed >= timer.duration && timer.status === 'RUNNING') {
      // Timer expired during downtime
      return { ...timer, status: 'EXPIRED' };
    }

    return timer;
  }
}
```

---

## ⚡ Performance Best Practices

### Connection Management

```typescript
// Efficient room broadcast with batching
class RoomBroadcaster {
  private pendingMessages: Map<string, Message[]> = new Map();
  private flushInterval: NodeJS.Timer;

  constructor() {
    // Batch messages every 16ms (60fps)
    this.flushInterval = setInterval(() => this.flush(), 16);
  }

  broadcast(roomId: string, event: string, data: any): void {
    const messages = this.pendingMessages.get(roomId) || [];
    messages.push({ event, data, timestamp: Date.now() });
    this.pendingMessages.set(roomId, messages);
  }

  private flush(): void {
    for (const [roomId, messages] of this.pendingMessages) {
      if (messages.length === 0) continue;

      // Batch multiple messages into single transmission
      if (messages.length === 1) {
        this.io.to(roomId).emit(messages[0].event, messages[0].data);
      } else {
        this.io.to(roomId).emit('batch', { messages });
      }
      
      this.pendingMessages.set(roomId, []);
    }
  }
}
```

### Redis Optimization

```typescript
// Pipeline Redis operations for efficiency
class RedisOptimizer {
  async updateGameState(roomId: string, updates: GameStateUpdate): Promise<void> {
    const pipeline = this.redis.pipeline();
    
    // Update room state
    pipeline.hset(`room:${roomId}:state`, updates.state);
    
    // Update scores
    for (const [playerId, score] of Object.entries(updates.scores)) {
      pipeline.hincrby(`room:${roomId}:scores`, playerId, score);
    }
    
    // Update team scores
    for (const [teamId, score] of Object.entries(updates.teamScores)) {
      pipeline.hincrby(`room:${roomId}:teamScores`, teamId, score);
    }
    
    // Log event
    pipeline.xadd(`room:${roomId}:events`, '*', 'type', 'SCORE_UPDATE', 'data', JSON.stringify(updates));
    
    await pipeline.exec();
  }
}
```

### Memory Management

```typescript
// Efficient player state tracking with WeakRefs
class PlayerStateManager {
  private players: Map<string, PlayerState> = new Map();
  private readonly MAX_DISCONNECTED_CACHE = 1000;
  private disconnectedCache: LRUCache<string, PlayerState>;

  constructor() {
    this.disconnectedCache = new LRUCache({
      max: this.MAX_DISCONNECTED_CACHE,
      ttl: 1000 * 60 * 60, // 1 hour
      updateAgeOnGet: true
    });
  }

  cleanup(roomId: string): void {
    // Remove all state when room ends
    const roomPlayers = Array.from(this.players.entries())
      .filter(([_, p]) => p.roomId === roomId);
    
    for (const [playerId, _] of roomPlayers) {
      this.players.delete(playerId);
    }
  }
}
```

---

## 📝 Core Pseudocode

### Question Timer Management

```typescript
class QuestionTimerManager {
  async startQuestion(roomId: string, questionIndex: number): Promise<void> {
    // 1. Get question data
    const question = await this.getQuestion(roomId, questionIndex);
    const timeLimit = question.timeLimitSeconds * 1000;
    
    // 2. Update room state
    const now = Date.now();
    await this.redis.hset(`room:${roomId}:state`, {
      status: 'QUESTION_ACTIVE',
      currentQuestionIndex: questionIndex,
      questionStartTime: now,
      questionEndTime: now + timeLimit
    });
    
    // 3. Clear previous answers
    await this.redis.del(`room:${roomId}:q:${questionIndex}:answers`);
    
    // 4. Broadcast question to all players
    this.io.to(roomId).emit('game:question_start', {
      questionId: question.id,
      questionIndex,
      totalQuestions: await this.getTotalQuestions(roomId),
      articleHtml: question.articleHtml,
      questionText: question.questionText,
      options: question.options, // Without correct answer!
      serverTimestamp: now,
      remainingMs: timeLimit
    });
    
    // 5. Start timer
    this.startTimer(roomId, timeLimit, async () => {
      await this.closeQuestion(roomId, questionIndex);
    });
    
    // 6. Start sync broadcasts
    this.startTimerSync(roomId, timeLimit);
    
    // 7. Log event
    await this.logEvent(roomId, 'QUESTION_STARTED', { questionIndex });
  }

  private startTimer(roomId: string, duration: number, onEnd: () => void): void {
    const timerId = `timer:${roomId}`;
    
    // Use Redis-based timer for reliability
    this.scheduler.schedule(timerId, duration, async () => {
      // Verify room still needs processing
      const state = await this.redis.hget(`room:${roomId}:state`, 'status');
      if (state === 'QUESTION_ACTIVE') {
        await onEnd();
      }
    });
  }
}
```

### Answer Collection

```typescript
class AnswerCollector {
  async collectAnswer(
    playerId: string,
    roomId: string,
    submission: AnswerSubmission
  ): Promise<AnswerCollectionResult> {
    const receivedAt = Date.now();
    
    // 1. Validate
    const validation = await this.validator.validateAnswer(playerId, roomId, submission);
    if (!validation.valid) {
      return {
        success: false,
        reason: validation.reason,
        serverTime: receivedAt
      };
    }
    
    // 2. Get room state
    const state = await this.getRoomState(roomId);
    const timeTaken = receivedAt - state.questionStartTime;
    
    // 3. Store answer atomically
    const stored = await this.redis.hsetnx(
      `room:${roomId}:q:${state.currentQuestionIndex}:answers`,
      playerId,
      JSON.stringify({
        answer: submission.answer,
        submittedAt: receivedAt,
        clientTimestamp: submission.clientTimestamp,
        timeTakenMs: timeTaken
      })
    );
    
    if (!stored) {
      // Race condition - another answer came through
      return {
        success: false,
        reason: 'ALREADY_ANSWERED',
        serverTime: receivedAt
      };
    }
    
    // 4. Update player status
    await this.redis.hset(
      `room:${roomId}:playerStatus`,
      playerId,
      'ANSWERED'
    );
    
    // 5. Notify admin (live monitoring)
    const player = await this.getPlayer(playerId);
    const adminSocket = await this.getAdminSocket(roomId);
    if (adminSocket) {
      adminSocket.emit('admin:player_answered', {
        playerId,
        playerName: player.displayName,
        teamId: player.teamId,
        answer: submission.answer,
        timeTakenMs: timeTaken,
        timestamp: receivedAt
      });
    }
    
    // 6. Log event
    await this.logEvent(roomId, 'ANSWER_SUBMITTED', {
      playerId,
      questionIndex: state.currentQuestionIndex,
      timeTakenMs: timeTaken
    });
    
    return {
      success: true,
      serverTime: receivedAt
    };
  }
}
```

### Result Calculation

```typescript
class ResultCalculator {
  async calculateResults(roomId: string, questionIndex: number): Promise<QuestionResults> {
    // 1. Get question with correct answer
    const question = await this.getQuestion(roomId, questionIndex);
    const correctAnswer = question.correctOption;
    
    // 2. Get all players in room
    const playerIds = await this.redis.smembers(`room:${roomId}:players`);
    
    // 3. Get all submitted answers
    const answers = await this.redis.hgetall(
      `room:${roomId}:q:${questionIndex}:answers`
    );
    
    // 4. Calculate results for each player
    const playerResults: PlayerQuestionResult[] = [];
    const scoreUpdates: Record<string, number> = {};
    
    for (const playerId of playerIds) {
      const player = await this.getPlayer(playerId);
      const answerData = answers[playerId] ? JSON.parse(answers[playerId]) : null;
      
      let result: 'CORRECT' | 'INCORRECT' | 'SKIPPED';
      let scoreEarned = 0;
      
      if (!answerData) {
        result = 'SKIPPED';
      } else if (answerData.answer === correctAnswer) {
        result = 'CORRECT';
        scoreEarned = this.calculateScore(answerData.timeTakenMs);
      } else {
        result = 'INCORRECT';
      }
      
      playerResults.push({
        playerId,
        playerName: player.displayName,
        teamId: player.teamId,
        answer: answerData?.answer,
        result,
        timeTakenMs: answerData?.timeTakenMs,
        scoreEarned
      });
      
      if (scoreEarned > 0) {
        scoreUpdates[playerId] = scoreEarned;
      }
    }
    
    // 5. Update scores in Redis
    if (Object.keys(scoreUpdates).length > 0) {
      const pipeline = this.redis.pipeline();
      for (const [playerId, score] of Object.entries(scoreUpdates)) {
        pipeline.hincrby(`room:${roomId}:scores`, playerId, score);
        
        // Update team scores
        const teamId = await this.getPlayerTeam(playerId, roomId);
        if (teamId) {
          pipeline.hincrby(`room:${roomId}:teamScores`, teamId, score);
        }
      }
      await pipeline.exec();
    }
    
    // 6. Get updated leaderboard
    const leaderboard = await this.getLeaderboard(roomId);
    
    // 7. Persist to PostgreSQL
    await this.persistResults(roomId, questionIndex, playerResults);
    
    return {
      questionId: question.id,
      correctAnswer,
      playerResults,
      teamScores: await this.getTeamScores(roomId),
      leaderboard
    };
  }

  private calculateScore(timeTakenMs: number): number {
    // Base score + time bonus
    const BASE_SCORE = 100;
    const MAX_TIME_BONUS = 50;
    const QUESTION_TIME_MS = 10000;
    
    // Faster answers get more bonus
    const timeRatio = Math.max(0, 1 - (timeTakenMs / QUESTION_TIME_MS));
    const timeBonus = Math.round(MAX_TIME_BONUS * timeRatio);
    
    return BASE_SCORE + timeBonus;
  }
}
```

### Admin Controls

```typescript
class AdminController {
  async handleAdminAction(
    adminId: string,
    roomId: string,
    action: AdminAction
  ): Promise<AdminActionResult> {
    // 1. Verify admin
    const isAdmin = await this.verifyAdmin(adminId, roomId);
    if (!isAdmin) {
      return { success: false, reason: 'NOT_AUTHORIZED' };
    }
    
    // 2. Execute action
    switch (action.type) {
      case 'PAUSE':
        return this.pauseGame(roomId);
        
      case 'RESUME':
        return this.resumeGame(roomId);
        
      case 'SKIP_QUESTION':
        return this.skipQuestion(roomId);
        
      case 'RESTART_QUESTION':
        return this.restartQuestion(roomId);
        
      case 'GO_TO_QUESTION':
        return this.goToQuestion(roomId, action.questionIndex);
        
      case 'KICK_PLAYER':
        return this.kickPlayer(roomId, action.playerId, action.reason);
        
      case 'END_GAME':
        return this.endGame(roomId);
        
      case 'BROADCAST_MESSAGE':
        return this.broadcastMessage(roomId, adminId, action.content);
        
      default:
        return { success: false, reason: 'UNKNOWN_ACTION' };
    }
  }

  private async pauseGame(roomId: string): Promise<AdminActionResult> {
    const state = await this.getRoomState(roomId);
    
    if (state.status !== 'QUESTION_ACTIVE') {
      return { success: false, reason: 'CANNOT_PAUSE_IN_CURRENT_STATE' };
    }
    
    // Calculate remaining time
    const remaining = state.questionEndTime - Date.now();
    
    // Update state
    await this.redis.hset(`room:${roomId}:state`, {
      status: 'PAUSED',
      pausedAt: Date.now(),
      remainingWhenPaused: remaining
    });
    
    // Cancel timer
    await this.scheduler.cancel(`timer:${roomId}`);
    
    // Broadcast
    this.io.to(roomId).emit('game:paused', {
      remainingMs: remaining,
      reason: 'Admin paused the game'
    });
    
    await this.logEvent(roomId, 'GAME_PAUSED');
    
    return { success: true };
  }

  private async kickPlayer(
    roomId: string,
    playerId: string,
    reason: string
  ): Promise<AdminActionResult> {
    // Remove from room
    await this.redis.srem(`room:${roomId}:players`, playerId);
    
    // Disconnect socket
    const socket = await this.getPlayerSocket(playerId);
    if (socket) {
      socket.emit('room:kicked', { reason });
      socket.leave(roomId);
      socket.disconnect(true);
    }
    
    // Broadcast
    this.io.to(roomId).emit('room:player_left', {
      playerId,
      reason: 'Kicked by admin'
    });
    
    // Log
    await this.logEvent(roomId, 'PLAYER_KICKED', { playerId, reason });
    
    return { success: true };
  }
}
```

---

## 🎤 Voice Chat Integration

### WebRTC Signaling Server

```typescript
class VoiceSignalingServer {
  private rooms: Map<string, VoiceRoom> = new Map();

  handleJoinVoice(socket: Socket, roomId: string, playerId: string): void {
    let room = this.rooms.get(roomId);
    if (!room) {
      room = {
        id: roomId,
        participants: new Map(),
        adminMuted: new Set()
      };
      this.rooms.set(roomId, room);
    }

    room.participants.set(playerId, {
      socketId: socket.id,
      isMuted: false,
      joinedAt: Date.now()
    });

    // Notify existing participants
    for (const [pid, p] of room.participants) {
      if (pid !== playerId) {
        this.io.to(p.socketId).emit('voice:peer_joined', { playerId });
      }
    }

    // Send current participants to new joiner
    socket.emit('voice:participants', {
      participants: Array.from(room.participants.keys())
    });
  }

  handleOffer(socket: Socket, data: { to: string; offer: RTCSessionDescription }): void {
    const targetSocket = this.getSocketByPlayerId(data.to);
    if (targetSocket) {
      targetSocket.emit('voice:offer', {
        from: socket.data.playerId,
        offer: data.offer
      });
    }
  }

  handleAnswer(socket: Socket, data: { to: string; answer: RTCSessionDescription }): void {
    const targetSocket = this.getSocketByPlayerId(data.to);
    if (targetSocket) {
      targetSocket.emit('voice:answer', {
        from: socket.data.playerId,
        answer: data.answer
      });
    }
  }

  handleIceCandidate(socket: Socket, data: { to: string; candidate: RTCIceCandidate }): void {
    const targetSocket = this.getSocketByPlayerId(data.to);
    if (targetSocket) {
      targetSocket.emit('voice:ice_candidate', {
        from: socket.data.playerId,
        candidate: data.candidate
      });
    }
  }

  adminMutePlayer(roomId: string, playerId: string): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.adminMuted.add(playerId);
      this.io.to(room.participants.get(playerId)?.socketId || '').emit('voice:muted_by_admin');
      this.io.to(roomId).emit('voice:player_muted', { playerId });
    }
  }
}
```

---

## 🚀 Deployment Checklist

### Production Requirements

- [ ] Redis Cluster for high availability
- [ ] PostgreSQL with read replicas
- [ ] Load balancer with sticky sessions for WebSocket
- [ ] TURN/STUN servers for WebRTC
- [ ] SSL/TLS certificates
- [ ] Rate limiting at API gateway
- [ ] DDoS protection
- [ ] Monitoring and alerting (Prometheus/Grafana)
- [ ] Log aggregation (ELK Stack)
- [ ] Automated backups

### Performance Targets

- WebSocket message latency: < 50ms
- Timer accuracy: ± 100ms
- Maximum concurrent rooms: 1000
- Maximum players per room: 100
- System uptime: 99.9%

---

This architecture provides a complete, scalable, and secure Quiz Battle Platform with server-authoritative design.
