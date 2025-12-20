import { redis, REDIS_KEYS, ROOM_TTL, generateRoomCode } from '../redis';
import {
    RoomConfig,
    RoomPlayer,
    RoomSummary,
    CreateRoomRequest,
    GameMode,
    RoomStatus,
} from './types';

/**
 * Room Manager - Handles all room CRUD operations
 */

// Create a new room
export async function createRoom(
    creatorId: string,
    creatorName: string,
    config: CreateRoomRequest
): Promise<RoomConfig> {
    // Generate unique code
    let code = generateRoomCode();
    let attempts = 0;
    while (await redis.exists(REDIS_KEYS.room(code)) && attempts < 10) {
        code = generateRoomCode();
        attempts++;
    }

    const now = Date.now();
    const room: RoomConfig = {
        id: `room_${now}_${code}`,
        code,
        name: config.name,
        isPrivate: config.isPrivate,
        password: config.password, // Should be hashed in the API layer
        gameMode: config.gameMode,
        maxPlayers: config.maxPlayers || (config.gameMode === 'ffa' ? 5 : 10),
        questionCount: config.questionCount || 10,
        timePerQuestion: config.timePerQuestion || 15,
        category: config.category || 'general',
        difficulty: config.difficulty || 'mixed',
        creatorId,
        status: 'waiting',
        currentQuestion: 0,
        questionIds: [],
        createdAt: now,
    };

    // Store room data - convert to flat record with string values for Redis
    const roomForRedis: Record<string, string | number | boolean> = {
        id: room.id,
        code: room.code,
        name: room.name,
        isPrivate: String(room.isPrivate),
        password: room.password || '',
        gameMode: room.gameMode,
        maxPlayers: room.maxPlayers,
        questionCount: room.questionCount,
        timePerQuestion: room.timePerQuestion,
        category: room.category,
        difficulty: room.difficulty,
        creatorId: room.creatorId,
        status: room.status,
        currentQuestion: room.currentQuestion,
        questionIds: JSON.stringify(room.questionIds),
        createdAt: room.createdAt,
    };

    await redis.hset(REDIS_KEYS.room(code), roomForRedis);
    await redis.expire(REDIS_KEYS.room(code), ROOM_TTL);

    // Add to active rooms
    await redis.zadd(REDIS_KEYS.activeRooms, { score: now, member: code });

    // Add to public rooms if not private
    if (!config.isPrivate) {
        await redis.sadd(REDIS_KEYS.publicRooms, code);
    }

    // Add creator as first player
    await addPlayerToRoom(code, creatorId, creatorName, undefined, config.gameMode === 'team' ? 'A' : null);

    return room;
}

// Get room by code
export async function getRoom(code: string): Promise<RoomConfig | null> {
    const data = await redis.hgetall(REDIS_KEYS.room(code));
    if (!data || Object.keys(data).length === 0) return null;

    return {
        ...data,
        isPrivate: data.isPrivate === 'true' || data.isPrivate === true,
        maxPlayers: Number(data.maxPlayers),
        questionCount: Number(data.questionCount),
        timePerQuestion: Number(data.timePerQuestion),
        currentQuestion: Number(data.currentQuestion),
        createdAt: Number(data.createdAt),
        startedAt: data.startedAt ? Number(data.startedAt) : undefined,
        questionIds: typeof data.questionIds === 'string'
            ? JSON.parse(data.questionIds)
            : data.questionIds || [],
    } as RoomConfig;
}

// Update room status
export async function updateRoomStatus(code: string, status: RoomStatus): Promise<void> {
    await redis.hset(REDIS_KEYS.room(code), { status });
    if (status === 'playing') {
        await redis.hset(REDIS_KEYS.room(code), { startedAt: Date.now() });
    }
}

// Delete room
export async function deleteRoom(code: string): Promise<void> {
    // Get all players to clean up their sessions
    const playerIds = await redis.smembers(REDIS_KEYS.roomPlayers(code));

    // Clean up player data
    for (const odUserId of playerIds) {
        await redis.del(REDIS_KEYS.roomPlayer(code, odUserId));
        await redis.hdel(REDIS_KEYS.userSession(odUserId), 'currentRoom');
    }

    // Clean up room data
    await redis.del(REDIS_KEYS.room(code));
    await redis.del(REDIS_KEYS.roomPlayers(code));
    await redis.zrem(REDIS_KEYS.activeRooms, code);
    await redis.srem(REDIS_KEYS.publicRooms, code);
}

// Add player to room
export async function addPlayerToRoom(
    code: string,
    odUserId: string,
    displayName: string,
    avatar?: string,
    team: 'A' | 'B' | null = null
): Promise<RoomPlayer | null> {
    const room = await getRoom(code);
    if (!room) return null;

    // Check if room is full
    const currentPlayers = await redis.scard(REDIS_KEYS.roomPlayers(code));
    if (currentPlayers >= room.maxPlayers) return null;

    // Check if room is still waiting
    if (room.status !== 'waiting') return null;

    const now = Date.now();
    const isFirstPlayer = currentPlayers === 0;

    const player: RoomPlayer = {
        odUserId,
        odDisplayName: displayName,
        avatar,
        team,
        isCaptain: isFirstPlayer && room.gameMode === 'team', // First player is captain in team mode
        isReady: false,
        score: 0,
        correctAnswers: 0,
        wrongAnswers: 0,
        streak: 0,
        joinedAt: now,
        lastActive: now,
    };

    // Store player data - convert to flat record for Redis
    const playerForRedis: Record<string, string | number> = {
        odUserId: player.odUserId,
        odDisplayName: player.odDisplayName,
        avatar: player.avatar || '',
        team: player.team || '',
        isCaptain: String(player.isCaptain),
        isReady: String(player.isReady),
        score: player.score,
        correctAnswers: player.correctAnswers,
        wrongAnswers: player.wrongAnswers,
        streak: player.streak,
        joinedAt: player.joinedAt,
        lastActive: player.lastActive,
    };

    await redis.sadd(REDIS_KEYS.roomPlayers(code), odUserId);
    await redis.hset(REDIS_KEYS.roomPlayer(code, odUserId), playerForRedis);
    await redis.expire(REDIS_KEYS.roomPlayer(code, odUserId), ROOM_TTL);

    // Update user session
    await redis.hset(REDIS_KEYS.userSession(odUserId), { currentRoom: code, lastActivity: now });

    return player;
}

// Remove player from room
export async function removePlayerFromRoom(code: string, odUserId: string): Promise<void> {
    const room = await getRoom(code);
    if (!room) return;

    const player = await getPlayer(code, odUserId);

    // Remove player data
    await redis.srem(REDIS_KEYS.roomPlayers(code), odUserId);
    await redis.del(REDIS_KEYS.roomPlayer(code, odUserId));
    await redis.hdel(REDIS_KEYS.userSession(odUserId), 'currentRoom');

    // Check remaining players
    const remainingPlayers = await redis.scard(REDIS_KEYS.roomPlayers(code));

    if (remainingPlayers === 0) {
        // Delete room if empty
        await deleteRoom(code);
    } else if (player?.isCaptain && room.gameMode === 'team') {
        // Transfer captain if captain left
        await transferCaptainToNextPlayer(code, player.team!);
    }
}

// Get player in room
export async function getPlayer(code: string, odUserId: string): Promise<RoomPlayer | null> {
    const data = await redis.hgetall(REDIS_KEYS.roomPlayer(code, odUserId));
    if (!data || Object.keys(data).length === 0) return null;

    return {
        ...data,
        isCaptain: data.isCaptain === 'true' || data.isCaptain === true,
        isReady: data.isReady === 'true' || data.isReady === true,
        score: Number(data.score),
        correctAnswers: Number(data.correctAnswers),
        wrongAnswers: Number(data.wrongAnswers),
        streak: Number(data.streak),
        joinedAt: Number(data.joinedAt),
        lastActive: Number(data.lastActive),
    } as RoomPlayer;
}

// Get all players in room
export async function getPlayersInRoom(code: string): Promise<RoomPlayer[]> {
    const playerIds = await redis.smembers(REDIS_KEYS.roomPlayers(code));
    const players: RoomPlayer[] = [];

    for (const odUserId of playerIds) {
        const player = await getPlayer(code, odUserId);
        if (player) players.push(player);
    }

    return players.sort((a, b) => a.joinedAt - b.joinedAt);
}

// Update player ready status
export async function setPlayerReady(code: string, odUserId: string, isReady: boolean): Promise<void> {
    await redis.hset(REDIS_KEYS.roomPlayer(code, odUserId), { isReady, lastActive: Date.now() });
}

// Check if all players are ready
export async function areAllPlayersReady(code: string): Promise<boolean> {
    const players = await getPlayersInRoom(code);
    return players.length >= 2 && players.every(p => p.isReady);
}

// Transfer captain to next player
async function transferCaptainToNextPlayer(code: string, team: 'A' | 'B'): Promise<void> {
    const players = await getPlayersInRoom(code);
    const teamPlayers = players.filter(p => p.team === team && !p.isCaptain);

    if (teamPlayers.length > 0) {
        const nextCaptain = teamPlayers[0];
        await redis.hset(REDIS_KEYS.roomPlayer(code, nextCaptain.odUserId), { isCaptain: true });
    }
}

// Transfer captain manually
export async function transferCaptain(
    code: string,
    fromUserId: string,
    toUserId: string
): Promise<boolean> {
    const fromPlayer = await getPlayer(code, fromUserId);
    const toPlayer = await getPlayer(code, toUserId);

    if (!fromPlayer?.isCaptain || !toPlayer || fromPlayer.team !== toPlayer.team) {
        return false;
    }

    await redis.hset(REDIS_KEYS.roomPlayer(code, fromUserId), { isCaptain: false });
    await redis.hset(REDIS_KEYS.roomPlayer(code, toUserId), { isCaptain: true });

    return true;
}

// Switch team
export async function switchTeam(code: string, odUserId: string, newTeam: 'A' | 'B'): Promise<{ success: boolean; error?: string }> {
    const room = await getRoom(code);
    if (!room || room.gameMode !== 'team') {
        return { success: false, error: 'غير متاح في هذا الوضع' };
    }

    if (room.status !== 'waiting') {
        return { success: false, error: 'اللعبة بدأت' };
    }

    const player = await getPlayer(code, odUserId);
    if (!player) {
        return { success: false, error: 'اللاعب غير موجود' };
    }

    if (player.team === newTeam) {
        return { success: false, error: 'أنت بالفعل في هذا الفريق' };
    }

    // Check balance logic (optional: explicit limit per team?)
    // For now, allow switch if max players not exceeded
    const players = await getPlayersInRoom(code);
    const newTeamCount = players.filter(p => p.team === newTeam).length;

    // Max 5 per team if total max is 10
    if (newTeamCount >= room.maxPlayers / 2) {
        return { success: false, error: 'الفريق ممتلئ' };
    }

    // Handle captaincy
    if (player.isCaptain) {
        await transferCaptainToNextPlayer(code, player.team!);
        // Become captain of new team if it has no captain (or no players)
        const newTeamHasCaptain = players.some(p => p.team === newTeam && p.isCaptain);
        if (!newTeamHasCaptain) {
            await redis.hset(REDIS_KEYS.roomPlayer(code, odUserId), { isCaptain: true });
        } else {
            await redis.hset(REDIS_KEYS.roomPlayer(code, odUserId), { isCaptain: false });
        }
    } else {
        // If joining a team with no players/captain, become captain
        const newTeamHasCaptain = players.some(p => p.team === newTeam && p.isCaptain);
        if (!newTeamHasCaptain) {
            await redis.hset(REDIS_KEYS.roomPlayer(code, odUserId), { isCaptain: true });
        }
    }

    await redis.hset(REDIS_KEYS.roomPlayer(code, odUserId), { team: newTeam });

    return { success: true };
}

// Get public rooms list
export async function getPublicRooms(): Promise<RoomSummary[]> {
    const codes = await redis.smembers(REDIS_KEYS.publicRooms);
    const rooms: RoomSummary[] = [];

    for (const code of codes) {
        const room = await getRoom(code);
        if (room && room.status === 'waiting') {
            const playerCount = await redis.scard(REDIS_KEYS.roomPlayers(code));
            rooms.push({
                code: room.code,
                name: room.name,
                gameMode: room.gameMode,
                currentPlayers: playerCount,
                maxPlayers: room.maxPlayers,
                status: room.status,
            });
        }
    }

    return rooms;
}

// Join room by code
export async function joinRoom(
    code: string,
    odUserId: string,
    displayName: string,
    avatar?: string,
    password?: string
): Promise<{ success: boolean; error?: string; player?: RoomPlayer }> {
    const room = await getRoom(code);

    if (!room) {
        return { success: false, error: 'الغرفة غير موجودة' };
    }

    if (room.status !== 'waiting') {
        return { success: false, error: 'اللعبة بدأت بالفعل' };
    }

    if (room.isPrivate && room.password !== password) {
        return { success: false, error: 'كلمة المرور غير صحيحة' };
    }

    const currentPlayers = await redis.scard(REDIS_KEYS.roomPlayers(code));
    if (currentPlayers >= room.maxPlayers) {
        return { success: false, error: 'الغرفة ممتلئة' };
    }

    // Check if already in room
    const existingPlayer = await getPlayer(code, odUserId);
    if (existingPlayer) {
        return { success: true, player: existingPlayer };
    }

    // Determine team for team mode
    let team: 'A' | 'B' | null = null;
    if (room.gameMode === 'team') {
        const players = await getPlayersInRoom(code);
        const teamACount = players.filter(p => p.team === 'A').length;
        const teamBCount = players.filter(p => p.team === 'B').length;
        team = teamACount <= teamBCount ? 'A' : 'B';
    }

    const player = await addPlayerToRoom(code, odUserId, displayName, avatar, team);

    if (!player) {
        return { success: false, error: 'فشل الانضمام للغرفة' };
    }

    return { success: true, player };
}
