'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { logger } from '@/lib/utils/logger';

export interface GameEvent {
    type: string;
    data: Record<string, unknown>;
    timestamp: number;
    roomCode: string;
}

interface UseGameSocketOptions {
    roomCode: string;
    odUserId: string | null;
    odDisplayName: string | null;
    team?: 'A' | 'B' | null;
    token?: string | null;
    onEvent?: (event: GameEvent) => void;
    enabled?: boolean;
}

interface GameState {
    questionNumber: number;
    question: {
        id: string;
        question: string;
        options: string[];
    } | null;
    timeRemaining: number;
    endsAt: number | null;
    status: 'waiting' | 'playing' | 'showing_result' | 'finished';
    correctAnswer: number | null;
}

/**
 * Simplified Game Socket Hook - SSE Only
 * Single source of truth: Server state via API polling + SSE for events
 */
export function useGameSocket({
    roomCode,
    odUserId,
    odDisplayName,
    team,
    token,
    onEvent,
    enabled = true,
}: UseGameSocketOptions) {
    // Connection state
    const [isConnected, setIsConnected] = useState(false);

    // Game state - synced from server
    const [gameState, setGameState] = useState<GameState>({
        questionNumber: 0,
        question: null,
        timeRemaining: 0,
        endsAt: null,
        status: 'waiting',
        correctAnswer: null,
    });

    // Refs to avoid stale closures
    const eventSourceRef = useRef<EventSource | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const lastEventTimestampRef = useRef<number>(0);
    const isProcessingRef = useRef(false);
    const lastProcessedQuestionRef = useRef<number>(-1); // Track last processed question to prevent duplicates

    // =============================================
    // TIMER MANAGEMENT
    // =============================================
    const updateTimeRemaining = useCallback(() => {
        if (gameState.endsAt && gameState.status === 'playing') {
            const remaining = Math.max(0, Math.ceil((gameState.endsAt - Date.now()) / 1000));
            setGameState(prev => ({ ...prev, timeRemaining: remaining }));
            return remaining;
        }
        return 0;
    }, [gameState.endsAt, gameState.status]);

    // Start timer countdown
    const startTimer = useCallback((endsAt: number) => {
        // Clear existing timer
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        const remaining = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
        setGameState(prev => ({
            ...prev,
            endsAt,
            timeRemaining: remaining,
            status: 'playing',
        }));

        logger.game('Timer started', { data: { seconds: remaining } });

        // Update every 100ms for smooth countdown
        timerRef.current = setInterval(() => {
            const newRemaining = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
            setGameState(prev => ({ ...prev, timeRemaining: newRemaining }));

            if (newRemaining <= 0) {
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }
                // Don't auto-end here - wait for server event or sync
            }
        }, 100);
    }, []);

    // Stop timer
    const stopTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        setGameState(prev => ({
            ...prev,
            endsAt: null,
            timeRemaining: 0,
        }));
    }, []);

    // =============================================
    // SERVER SYNC
    // =============================================
    const syncFromServer = useCallback(async () => {
        if (!roomCode || isProcessingRef.current) return;

        try {
            // Fetch current game state
            const res = await fetch(`/api/game/rooms/${roomCode}`);
            const data = await res.json();

            if (!data.success) return;

            const room = data.room;
            const currentQuestion = data.currentQuestion;

            // Update game state based on room status
            if (room.status === 'finished') {
                stopTimer();
                setGameState(prev => ({
                    ...prev,
                    status: 'finished',
                }));
                onEvent?.({
                    type: 'game_ended',
                    data: {},
                    timestamp: Date.now(),
                    roomCode,
                });
                return;
            }

            if (room.status === 'playing' && currentQuestion) {
                const questionNumber = currentQuestion.questionNumber;

                // Check if this is a new question (not already processed)
                if (questionNumber !== lastProcessedQuestionRef.current) {
                    lastProcessedQuestionRef.current = questionNumber;
                    logger.game('Syncing question', { data: { questionNumber: questionNumber + 1 } });

                    // Fetch timer state
                    const timerRes = await fetch(`/api/game/rooms/${roomCode}/timer`);
                    const timerData = await timerRes.json();

                    const endsAt = timerData.timer?.endsAt || (Date.now() + room.timePerQuestion * 1000);
                    const timeRemaining = timerData.timer?.timeRemaining || room.timePerQuestion;

                    setGameState({
                        questionNumber,
                        question: {
                            id: currentQuestion.id,
                            question: currentQuestion.question,
                            options: currentQuestion.options,
                        },
                        timeRemaining,
                        endsAt,
                        status: 'playing',
                        correctAnswer: null,
                    });

                    // Only start timer if there's time remaining
                    if (timeRemaining > 0) {
                        startTimer(endsAt);
                    }

                    // Emit question_start event
                    onEvent?.({
                        type: 'question_start',
                        data: {
                            questionNumber,
                            question: currentQuestion.question,
                            options: currentQuestion.options,
                            timeLimit: room.timePerQuestion,
                            endsAt,
                        },
                        timestamp: Date.now(),
                        roomCode,
                    });
                }
            }

            // Update players
            if (data.players) {
                onEvent?.({
                    type: 'players_update',
                    data: { players: data.players },
                    timestamp: Date.now(),
                    roomCode,
                });
            }
        } catch (error) {
            logger.error('Error syncing from server', { context: 'GameSocket', data: error });
        }
    }, [roomCode, gameState.questionNumber, gameState.question, startTimer, stopTimer, onEvent]);

    // =============================================
    // SSE CONNECTION
    // =============================================
    const connectSSE = useCallback(() => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }

        logger.socket('Connecting to SSE');
        const eventSource = new EventSource(`/api/game/rooms/${roomCode}/events`);
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
            logger.socket('SSE connected');
            setIsConnected(true);
            // Initial sync
            syncFromServer();
        };

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                // Skip if already processed (dedup by timestamp)
                if (data.timestamp && data.timestamp <= lastEventTimestampRef.current) {
                    return;
                }
                lastEventTimestampRef.current = data.timestamp || Date.now();

                // Handle connected event
                if (data.type === 'connected') {
                    logger.socket('SSE handshake complete');
                    return;
                }

                logger.socket('SSE Event received', { data: { type: data.type } });

                // Handle question_start
                if (data.type === 'question_start') {
                    const eventData = data.data || data;
                    const questionNumber = eventData.questionNumber ?? 0;

                    // Skip if already processed this question
                    if (questionNumber === lastProcessedQuestionRef.current) {
                        logger.game('Skipping duplicate question_start');
                        return;
                    }
                    lastProcessedQuestionRef.current = questionNumber;

                    const endsAt = eventData.endsAt || (Date.now() + (eventData.timeLimit || 15) * 1000);

                    setGameState({
                        questionNumber,
                        question: {
                            id: `q_${questionNumber}`,
                            question: eventData.question,
                            options: eventData.options || [],
                        },
                        timeRemaining: eventData.timeLimit || 15,
                        endsAt,
                        status: 'playing',
                        correctAnswer: null,
                    });

                    startTimer(endsAt);

                    onEvent?.({
                        type: 'question_start',
                        data: eventData,
                        timestamp: data.timestamp,
                        roomCode,
                    });
                }

                // Handle question_result
                else if (data.type === 'question_result') {
                    const eventData = data.data || data;
                    stopTimer();

                    setGameState(prev => ({
                        ...prev,
                        status: 'showing_result',
                        correctAnswer: eventData.correctAnswer,
                        timeRemaining: 0,
                    }));

                    onEvent?.({
                        type: 'question_result',
                        data: eventData,
                        timestamp: data.timestamp,
                        roomCode,
                    });

                    // Check if game should end, otherwise fetch next question after 3s
                    if (!eventData.shouldEndGame) {
                        logger.game('Waiting before next question', { data: { seconds: 3 } });
                        setTimeout(() => {
                            // Reset lastProcessedQuestionRef to allow next question
                            lastProcessedQuestionRef.current = -1;
                            isProcessingRef.current = false;
                            // Trigger sync to get next question
                            syncFromServer();
                        }, 3000);
                    }

                    // Safety sync to ensure scores are perfect
                    setTimeout(() => {
                        syncFromServer();
                    }, 500);
                }

                // Handle game_ended
                else if (data.type === 'game_ended') {
                    stopTimer();
                    setGameState(prev => ({
                        ...prev,
                        status: 'finished',
                    }));

                    onEvent?.({
                        type: 'game_ended',
                        data: data.data || data,
                        timestamp: data.timestamp,
                        roomCode,
                    });
                }

                // Forward other events
                else {
                    onEvent?.({
                        type: data.type,
                        data: data.data || data,
                        timestamp: data.timestamp || Date.now(),
                        roomCode,
                    });
                }
            } catch (err) {
                // Ignore parse errors (heartbeats)
            }
        };

        eventSource.onerror = () => {
            logger.socket('SSE error, reconnecting');
            setIsConnected(false);
            eventSource.close();

            // Reconnect after 2 seconds
            setTimeout(() => {
                if (enabled && roomCode) {
                    connectSSE();
                }
            }, 2000);
        };

        return eventSource;
    }, [roomCode, enabled, startTimer, stopTimer, syncFromServer, onEvent]);

    // =============================================
    // ACTIONS
    // =============================================
    const submitAnswer = useCallback(async (answer: number, questionNumber: number) => {
        if (!roomCode || !token || isProcessingRef.current) return;

        isProcessingRef.current = true;

        try {
            const res = await fetch(`/api/game/rooms/${roomCode}/answer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ answer, questionNumber }),
            });
            const data = await res.json();

            if (data.success) {
                // Emit answer result with ALL data from server (including scores if FFA)
                onEvent?.({
                    type: 'answer_result',
                    data: {
                        isCorrect: data.isCorrect,
                        points: data.points,
                        scores: data.scores, // Pass authoritative scores
                        rankings: data.rankings, // Pass rankings if game ended
                        winnerId: data.winnerId,
                        winnerName: data.winnerName,
                        correctAnswer: data.correctAnswer,
                    },
                    timestamp: Date.now(),
                    roomCode,
                });

                // If FFA mode and correct, the server will have ended the question
                // SSE will receive the question_result event
                // We don't need to do anything else here
            }
        } catch (error) {
            logger.error('Error submitting answer', { context: 'GameSocket', data: error });
        } finally {
            isProcessingRef.current = false;
        }
    }, [roomCode, token, onEvent]);

    const suggestAnswer = useCallback(async (answer: number) => {
        if (!roomCode || !odUserId || !odDisplayName || !team) return;

        try {
            await fetch(`/api/game/rooms/${roomCode}/suggest`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    suggesterId: odUserId,
                    suggesterName: odDisplayName,
                    answer,
                    team,
                }),
            });
        } catch (error) {
            logger.error('Error suggesting answer', { context: 'GameSocket', data: error });
        }
    }, [roomCode, odUserId, odDisplayName, team]);

    const startGame = useCallback(async () => {
        if (!roomCode || !token) return;

        try {
            const res = await fetch(`/api/game/rooms/${roomCode}/start`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            const data = await res.json();

            if (data.success) {
                onEvent?.({
                    type: 'game_starting',
                    data: { countdown: 3 },
                    timestamp: Date.now(),
                    roomCode,
                });
            }
        } catch (error) {
            logger.error('Error starting game', { context: 'GameSocket', data: error });
        }
    }, [roomCode, token, onEvent]);

    const setReady = useCallback(async (isReady: boolean) => {
        if (!roomCode || !odUserId) return;

        try {
            await fetch(`/api/game/rooms/${roomCode}/ready`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ odUserId, isReady }),
            });
        } catch (error) {
            logger.error('Error setting ready', { context: 'GameSocket', data: error });
        }
    }, [roomCode, odUserId]);

    const requestSync = useCallback(() => {
        syncFromServer();
    }, [syncFromServer]);

    const disconnect = useCallback(() => {
        stopTimer();
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }
        if (syncIntervalRef.current) {
            clearInterval(syncIntervalRef.current);
        }
        setIsConnected(false);
    }, [stopTimer]);

    // =============================================
    // EFFECTS
    // =============================================

    // Main connection effect
    useEffect(() => {
        if (!enabled || !roomCode || !odUserId || !odDisplayName) {
            return;
        }

        connectSSE();

        // Periodic sync every 10 seconds as backup
        syncIntervalRef.current = setInterval(() => {
            if (gameState.status === 'playing' && gameState.timeRemaining <= 0) {
                // Timer ended but no result yet - sync to check
                syncFromServer();
            }
        }, 10000);

        return () => {
            disconnect();
        };
    }, [enabled, roomCode, odUserId, odDisplayName]);

    // Handle timer expiration - trigger end question
    useEffect(() => {
        if (gameState.status === 'playing' && gameState.timeRemaining <= 0 && gameState.endsAt) {
            // Timer just hit zero - try to end the question
            const endQuestion = async () => {
                if (isProcessingRef.current) return;
                isProcessingRef.current = true;

                try {
                    logger.game('Timer expired, ending question');
                    const res = await fetch(`/api/game/rooms/${roomCode}/end-question`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ questionNumber: gameState.questionNumber }),
                    });
                    const data = await res.json();

                    if (data.success) {
                        // The SSE will receive the events, but also handle locally
                        stopTimer();
                        setGameState(prev => ({
                            ...prev,
                            status: 'showing_result',
                            correctAnswer: data.correctAnswer,
                        }));

                        onEvent?.({
                            type: 'question_result',
                            data: {
                                questionNumber: gameState.questionNumber,
                                correctAnswer: data.correctAnswer,
                                winnerId: data.winnerId,
                                winnerName: data.winnerName,
                                scores: data.scores || [],
                            },
                            timestamp: Date.now(),
                            roomCode,
                        });

                        if (data.shouldEndGame) {
                            setGameState(prev => ({ ...prev, status: 'finished' }));
                            onEvent?.({
                                type: 'game_ended',
                                data: { rankings: data.rankings },
                                timestamp: Date.now(),
                                roomCode,
                            });
                        } else {
                            // Wait 3 seconds then fetch next question
                            setTimeout(async () => {
                                isProcessingRef.current = false;
                                await fetchNextQuestion();
                            }, 3000);
                            return; // Don't reset isProcessingRef yet
                        }
                    }
                } catch (error) {
                    logger.error('Error ending question', { context: 'GameSocket', data: error });
                } finally {
                    isProcessingRef.current = false;
                }
            };

            endQuestion();
        }
    }, [gameState.status, gameState.timeRemaining, gameState.endsAt, gameState.questionNumber, roomCode, stopTimer, onEvent]);

    // Fetch next question
    const fetchNextQuestion = useCallback(async () => {
        if (isProcessingRef.current) return;
        isProcessingRef.current = true;

        try {
            logger.game('Fetching next question');
            const res = await fetch(`/api/game/rooms/${roomCode}/next-question`, {
                method: 'POST',
            });
            const data = await res.json();

            if (data.success && data.question) {
                const questionNumber = data.questionNumber;

                // Skip if already processed this question
                if (questionNumber === lastProcessedQuestionRef.current) {
                    logger.game('fetchNextQuestion: Skipping duplicate');
                    return;
                }
                lastProcessedQuestionRef.current = questionNumber;

                const endsAt = data.endsAt || (Date.now() + data.timeLimit * 1000);

                setGameState({
                    questionNumber,
                    question: {
                        id: data.question.id || `q_${questionNumber}`,
                        question: data.question.question,
                        options: data.question.options,
                    },
                    timeRemaining: data.timeLimit,
                    endsAt,
                    status: 'playing',
                    correctAnswer: null,
                });

                startTimer(endsAt);

                onEvent?.({
                    type: 'question_start',
                    data: {
                        questionNumber,
                        question: data.question.question,
                        options: data.question.options,
                        timeLimit: data.timeLimit,
                        endsAt,
                    },
                    timestamp: Date.now(),
                    roomCode,
                });
            }
        } catch (error) {
            logger.error('Error fetching next question', { context: 'GameSocket', data: error });
        } finally {
            isProcessingRef.current = false;
        }
    }, [roomCode, startTimer, onEvent]);

    return {
        isConnected,
        timeRemaining: gameState.timeRemaining,
        currentQuestionNumber: gameState.questionNumber,
        gameStatus: gameState.status,
        submitAnswer,
        suggestAnswer,
        startGame,
        setReady,
        requestSync,
        disconnect,
        useSSE: true,
    };
}

// Export for compatibility
export const USING_SOCKET_IO = false;
