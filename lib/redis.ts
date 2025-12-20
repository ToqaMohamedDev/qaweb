import { Redis } from '@upstash/redis';

// Initialize Redis client using environment variables
export const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Redis Key Prefixes
export const REDIS_KEYS = {
    // Room keys
    room: (code: string) => `room:${code}`,
    roomPlayers: (code: string) => `room:${code}:players`,
    roomPlayer: (code: string, odUserId: string) => `room:${code}:player:${odUserId}`,
    roomQuestion: (code: string, questionNum: number) => `room:${code}:question:${questionNum}`,
    roomTimer: (code: string) => `room:${code}:timer`,

    // Indexes
    activeRooms: 'rooms:active',
    publicRooms: 'rooms:public',
    activeTimers: 'rooms:activeTimers',

    // User session
    userSession: (odUserId: string) => `user:${odUserId}:session`,

    // Pub/Sub channels
    roomEvents: (code: string) => `room:${code}:events`,
    roomEventsQueue: (code: string) => `room:${code}:events:queue`,
    teamChat: (code: string, team: 'A' | 'B') => `room:${code}:team:${team}:chat`,
} as const;

// Room TTL - 2 hours
export const ROOM_TTL = 2 * 60 * 60;

// Helper to generate room code
export function generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded confusing chars like 0, O, 1, I
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Timer State interface
export interface TimerState {
    roomCode: string;
    questionNumber: number;
    startedAt: number;
    endsAt: number;
    timeLimit: number;
    isPaused: boolean;
    pausedAt?: number;
}

// Set timer state in Redis
export async function setTimerState(state: TimerState): Promise<void> {
    await redis.hset(REDIS_KEYS.roomTimer(state.roomCode), {
        ...state,
        isPaused: String(state.isPaused),
    });
    await redis.expire(REDIS_KEYS.roomTimer(state.roomCode), ROOM_TTL);

    // Add to active timers set
    await redis.zadd(REDIS_KEYS.activeTimers, {
        score: state.endsAt,
        member: state.roomCode,
    });
}

// Get timer state from Redis
export async function getTimerState(code: string): Promise<TimerState | null> {
    const data = await redis.hgetall(REDIS_KEYS.roomTimer(code));
    if (!data || Object.keys(data).length === 0) return null;

    return {
        roomCode: data.roomCode as string,
        questionNumber: Number(data.questionNumber),
        startedAt: Number(data.startedAt),
        endsAt: Number(data.endsAt),
        timeLimit: Number(data.timeLimit),
        isPaused: data.isPaused === 'true',
        pausedAt: data.pausedAt ? Number(data.pausedAt) : undefined,
    };
}

// Get time remaining for a room
export async function getTimeRemaining(code: string): Promise<number> {
    const state = await getTimerState(code);
    if (!state) return 0;

    const now = Date.now();
    const remaining = Math.max(0, Math.floor((state.endsAt - now) / 1000));
    return remaining;
}

// Clear timer state
export async function clearTimerState(code: string): Promise<void> {
    await redis.del(REDIS_KEYS.roomTimer(code));
    await redis.zrem(REDIS_KEYS.activeTimers, code);
}

// Get all expired timers
export async function getExpiredTimers(): Promise<string[]> {
    const now = Date.now();
    // Upstash Redis uses zrange with BYSCORE option
    const expired = await redis.zrange(REDIS_KEYS.activeTimers, 0, now, { byScore: true });
    return expired as string[];
}
