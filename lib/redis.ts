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

    // Indexes
    activeRooms: 'rooms:active',
    publicRooms: 'rooms:public',

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
