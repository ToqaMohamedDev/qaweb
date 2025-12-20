/**
 * Socket.IO Server with Redis Integration
 * Real-time game engine with proper timer management
 * 
 * Run: node server.js
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const Redis = require('@upstash/redis').Redis;

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

// Initialize Redis
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Initialize Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Active room timers (in-memory for this server instance)
const roomTimers = new Map();

// Room timer polling interval
const TIMER_POLL_INTERVAL = 100; // Check every 100ms for precise timing

/**
 * Get API base URL (works in different environments)
 */
function getApiBaseUrl() {
    if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`;
    }
    if (process.env.NEXT_PUBLIC_APP_URL) {
        return process.env.NEXT_PUBLIC_APP_URL;
    }
    return `http://localhost:${port}`;
}

/**
 * Redis Keys
 */
const REDIS_KEYS = {
    room: (code) => `room:${code}`,
    roomTimer: (code) => `room:${code}:timer`,
    roomEventsQueue: (code) => `room:${code}:events:queue`,
};

/**
 * Get timer state from Redis
 */
async function getTimerState(code) {
    try {
        const data = await redis.hgetall(REDIS_KEYS.roomTimer(code));
        if (!data || Object.keys(data).length === 0) return null;

        return {
            roomCode: data.roomCode,
            questionNumber: Number(data.questionNumber),
            startedAt: Number(data.startedAt),
            endsAt: Number(data.endsAt),
            timeLimit: Number(data.timeLimit),
            isPaused: data.isPaused === 'true',
        };
    } catch (error) {
        console.error('Error getting timer state:', error);
        return null;
    }
}

/**
 * Set timer state in Redis
 */
async function setTimerState(state) {
    try {
        await redis.hset(REDIS_KEYS.roomTimer(state.roomCode), {
            ...state,
            isPaused: String(state.isPaused),
        });
        await redis.expire(REDIS_KEYS.roomTimer(state.roomCode), 7200);
    } catch (error) {
        console.error('Error setting timer state:', error);
    }
}

/**
 * Clear timer state from Redis
 */
async function clearTimerState(code) {
    try {
        await redis.del(REDIS_KEYS.roomTimer(code));
    } catch (error) {
        console.error('Error clearing timer state:', error);
    }
}

/**
 * Get room state from Redis
 */
async function getRoom(code) {
    try {
        const data = await redis.hgetall(REDIS_KEYS.room(code));
        if (!data || Object.keys(data).length === 0) return null;
        return data;
    } catch (error) {
        console.error('Error getting room:', error);
        return null;
    }
}

app.prepare().then(() => {
    const server = createServer((req, res) => {
        const parsedUrl = parse(req.url, true);
        handle(req, res, parsedUrl);
    });

    // Initialize Socket.IO
    const io = new Server(server, {
        path: '/api/socketio',
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
        transports: ['websocket', 'polling'],
        pingTimeout: 60000,
        pingInterval: 25000,
    });

    const apiBaseUrl = getApiBaseUrl();

    /**
     * Start timer for a room
     */
    function startRoomTimer(roomCode, questionNumber, timeLimit) {
        // Clear any existing timer
        stopRoomTimer(roomCode);

        const now = Date.now();
        const endsAt = now + (timeLimit * 1000);
        let lastEmittedSecond = timeLimit;

        console.log(`⏰ Starting timer for ${roomCode}, Q${questionNumber}, ${timeLimit}s`);

        // Save to Redis for sync across instances
        setTimerState({
            roomCode,
            questionNumber,
            startedAt: now,
            endsAt,
            timeLimit,
            isPaused: false,
        });

        // High-precision polling interval
        const interval = setInterval(async () => {
            const currentTime = Date.now();
            const remaining = Math.ceil((endsAt - currentTime) / 1000);

            // Only emit when second changes
            if (remaining !== lastEmittedSecond && remaining >= 0) {
                lastEmittedSecond = remaining;

                io.to(roomCode).emit('timer_tick', {
                    timeRemaining: remaining,
                    questionNumber,
                    endsAt,
                });

                // Warning at 5 seconds
                if (remaining === 5) {
                    io.to(roomCode).emit('timer_warning', { timeRemaining: 5 });
                }
            }

            // Timer expired
            if (remaining <= 0) {
                clearInterval(interval);
                roomTimers.delete(roomCode);
                await handleTimerExpired(roomCode, questionNumber);
            }
        }, TIMER_POLL_INTERVAL);

        roomTimers.set(roomCode, { interval, questionNumber, endsAt });
    }

    /**
     * Stop timer for a room
     */
    function stopRoomTimer(roomCode) {
        const timer = roomTimers.get(roomCode);
        if (timer) {
            clearInterval(timer.interval);
            roomTimers.delete(roomCode);
            console.log(`⏰ Timer stopped for ${roomCode}`);
        }
    }

    /**
     * Handle timer expiration
     */
    async function handleTimerExpired(roomCode, questionNumber) {
        console.log(`⏰ Timer expired for ${roomCode}, Q${questionNumber}`);

        try {
            // End the question via API
            const response = await fetch(`${apiBaseUrl}/api/game/rooms/${roomCode}/end-question`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ questionNumber }),
            });

            const data = await response.json();

            if (data.success) {
                // Clear timer state in Redis
                await clearTimerState(roomCode);

                // Emit question result
                io.to(roomCode).emit('question_result', {
                    questionNumber,
                    correctAnswer: data.correctAnswer,
                    winnerId: data.winnerId,
                    winnerName: data.winnerName,
                    scores: data.scores || [],
                });

                if (data.shouldEndGame) {
                    // Game finished
                    io.to(roomCode).emit('game_ended', {
                        rankings: data.rankings,
                    });
                } else {
                    // Show result for 3 seconds, then next question
                    io.to(roomCode).emit('show_result', { duration: 3000 });

                    setTimeout(async () => {
                        await startNextQuestion(roomCode);
                    }, 3000);
                }
            }
        } catch (error) {
            console.error('Error handling timer expiration:', error);
            // Retry once
            setTimeout(() => handleTimerExpired(roomCode, questionNumber), 1000);
        }
    }

    /**
     * Start next question
     */
    async function startNextQuestion(roomCode) {
        try {
            const response = await fetch(`${apiBaseUrl}/api/game/rooms/${roomCode}/next-question`, {
                method: 'POST',
            });

            const data = await response.json();

            if (data.success && data.question) {
                io.to(roomCode).emit('question_start', {
                    questionNumber: data.questionNumber,
                    question: data.question.question,
                    options: data.question.options,
                    timeLimit: data.timeLimit,
                    endsAt: Date.now() + (data.timeLimit * 1000),
                });

                startRoomTimer(roomCode, data.questionNumber, data.timeLimit);
            }
        } catch (error) {
            console.error('Error starting next question:', error);
        }
    }

    /**
     * Handle correct answer (ends question immediately)
     */
    async function handleCorrectAnswer(roomCode, userId, displayName, questionNumber, points, scores) {
        console.log(`✓ Correct answer in ${roomCode} by ${displayName}`);

        // Stop the timer
        stopRoomTimer(roomCode);
        await clearTimerState(roomCode);

        // Get room to check if this ends the game
        const room = await getRoom(roomCode);
        if (!room) return;

        const isLastQuestion = Number(room.currentQuestion) >= Number(room.questionCount) - 1;

        if (isLastQuestion) {
            // Fetch final rankings
            const response = await fetch(`${apiBaseUrl}/api/game/rooms/${roomCode}`);
            const data = await response.json();

            if (data.success) {
                const rankings = data.players
                    .sort((a, b) => b.score - a.score)
                    .map((p, i) => ({
                        odUserId: p.odUserId,
                        odDisplayName: p.odDisplayName,
                        score: p.score,
                        rank: i + 1,
                    }));

                io.to(roomCode).emit('game_ended', { rankings });
            }
        } else {
            // Show result for 3 seconds, then next question
            io.to(roomCode).emit('show_result', { duration: 3000 });

            setTimeout(async () => {
                await startNextQuestion(roomCode);
            }, 3000);
        }
    }

    /**
     * Sync timer state on reconnection
     */
    async function syncTimerState(socket, roomCode) {
        const timerState = await getTimerState(roomCode);
        if (timerState && !timerState.isPaused) {
            const now = Date.now();
            const remaining = Math.ceil((timerState.endsAt - now) / 1000);

            if (remaining > 0) {
                socket.emit('timer_sync', {
                    timeRemaining: remaining,
                    questionNumber: timerState.questionNumber,
                    endsAt: timerState.endsAt,
                    serverTime: now,
                });
            }
        }
    }

    // Socket.IO connection handler
    io.on('connection', (socket) => {
        console.log(`🔌 Client connected: ${socket.id}`);

        socket.data.rooms = new Set();
        socket.data.userId = null;
        socket.data.displayName = null;

        // Join Room
        socket.on('join_room', async (data) => {
            const { roomCode, odUserId, odDisplayName, team } = data;

            // Leave previous rooms
            for (const room of socket.data.rooms) {
                socket.leave(room);
            }
            socket.data.rooms.clear();

            // Join new room
            socket.join(roomCode);
            socket.data.rooms.add(roomCode);
            socket.data.userId = odUserId;
            socket.data.displayName = odDisplayName;
            socket.data.team = team;

            console.log(`👤 ${odDisplayName} joined room ${roomCode}`);

            // Notify others
            socket.to(roomCode).emit('player_joined', {
                odUserId,
                odDisplayName,
                team,
            });

            // Sync timer if game is in progress
            const room = await getRoom(roomCode);
            if (room && room.status === 'playing') {
                await syncTimerState(socket, roomCode);

                // Also send current game state
                try {
                    const response = await fetch(`${apiBaseUrl}/api/game/rooms/${roomCode}`);
                    const state = await response.json();

                    if (state.success) {
                        socket.emit('game_state_sync', {
                            room: state.room,
                            players: state.players,
                            currentQuestion: state.currentQuestion,
                        });
                    }
                } catch (error) {
                    console.error('Error syncing game state:', error);
                }
            }
        });

        // Request Timer Sync (client can request this anytime)
        socket.on('request_timer_sync', async (data) => {
            const { roomCode } = data;
            await syncTimerState(socket, roomCode);
        });

        // Leave Room
        socket.on('leave_room', (data) => {
            const { roomCode, odUserId } = data;

            socket.leave(roomCode);
            socket.data.rooms.delete(roomCode);

            socket.to(roomCode).emit('player_left', {
                odUserId,
                odDisplayName: socket.data.displayName,
            });
        });

        // Player Ready
        socket.on('player_ready', async (data) => {
            const { roomCode, odUserId, isReady } = data;

            io.to(roomCode).emit('player_ready', {
                odUserId,
                isReady,
            });
        });

        // Start Game
        socket.on('start_game', async (data) => {
            const { roomCode, token } = data;

            try {
                const response = await fetch(`${apiBaseUrl}/api/game/rooms/${roomCode}/start`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                });

                const result = await response.json();

                if (result.success) {
                    // Emit countdown
                    io.to(roomCode).emit('game_starting', { countdown: 3 });

                    // After countdown, start first question
                    setTimeout(async () => {
                        io.to(roomCode).emit('game_started', {});
                        await startNextQuestion(roomCode);
                    }, 3000);
                } else {
                    socket.emit('error', { message: result.error });
                }
            } catch (error) {
                console.error('Error starting game:', error);
                socket.emit('error', { message: 'فشل في بدء اللعبة' });
            }
        });

        // Submit Answer
        socket.on('submit_answer', async (data) => {
            const { roomCode, odUserId, odDisplayName, answer, questionNumber, token } = data;

            try {
                const response = await fetch(`${apiBaseUrl}/api/game/rooms/${roomCode}/answer`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ answer, questionNumber }),
                });

                const result = await response.json();

                // Notify player of their result
                socket.emit('answer_result', {
                    isCorrect: result.isCorrect,
                    points: result.points || 0,
                });

                // Notify room that someone answered
                socket.to(roomCode).emit('player_answered', {
                    odUserId,
                    odDisplayName,
                });

                // If correct answer, stop timer and handle FFA win
                if (result.isCorrect) {
                    // Emit question result to everyone
                    io.to(roomCode).emit('question_result', {
                        questionNumber,
                        correctAnswer: result.correctAnswer !== undefined ? result.correctAnswer : answer,
                        winnerId: odUserId,
                        winnerName: odDisplayName,
                        scores: result.scores || [],
                    });

                    await handleCorrectAnswer(
                        roomCode,
                        odUserId,
                        odDisplayName,
                        questionNumber,
                        result.points,
                        result.scores
                    );
                }
            } catch (error) {
                console.error('Error submitting answer:', error);
                socket.emit('error', { message: 'فشل في إرسال الإجابة' });
            }
        });

        // Suggest Answer (Team mode)
        socket.on('suggest_answer', (data) => {
            const { roomCode, team, suggesterId, suggesterName, answer } = data;

            io.to(roomCode).emit('answer_suggestion', {
                suggesterId,
                suggesterName,
                suggestedAnswer: answer,
                team,
            });
        });

        // Chat Message
        socket.on('chat_message', (data) => {
            const { roomCode, team, senderId, senderName, message } = data;

            io.to(roomCode).emit('chat_message', {
                senderId,
                senderName,
                message,
                team,
                timestamp: Date.now(),
            });
        });

        // Disconnect
        socket.on('disconnect', (reason) => {
            console.log(`🔌 Disconnected: ${socket.id} (${reason})`);

            for (const roomCode of socket.data.rooms) {
                socket.to(roomCode).emit('player_left', {
                    odUserId: socket.data.userId,
                    odDisplayName: socket.data.displayName,
                });
            }
        });
    });

    // Export for API routes
    global.socketIO = io;
    global.startRoomTimer = startRoomTimer;
    global.stopRoomTimer = stopRoomTimer;
    global.roomTimers = roomTimers;

    server.listen(port, () => {
        console.log(`
🚀 Qazzzzzzz Game Server Ready!
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🌐 Local:     http://${hostname}:${port}
   🔌 Socket.IO: ws://${hostname}:${port}/api/socketio
   📦 Mode:      ${dev ? 'Development' : 'Production'}
   ⚡ Redis:     Connected via Upstash
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);
    });
});
