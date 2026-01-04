/**
 * useGameRoom - Custom hook for game room management
 * 
 * This hook provides a unified interface for:
 * - Room state management
 * - SSE connection handling
 * - Answer submission
 * - Reconnection logic
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/utils/logger';
import {
    RoomConfig,
    RoomPlayer,
    GameQuestion,
    GameUser,
    extractGameUser,
    ScoreUpdate
} from '@/lib/game/types';

// ============================================================================
// Types
// ============================================================================

export interface GameState {
    room: RoomConfig | null;
    players: RoomPlayer[];
    currentUser: GameUser | null;
    question: GameQuestion | null;
    questionNumber: number;
    timeLeft: number;
    serverEndsAt: number | null;
    showResult: boolean;
    correctAnswer: number | null;
    selectedAnswer: number | null;
    hasAnswered: boolean;
    isCorrect: boolean | null;
    pointsEarned: number;
    streak: number;
    suggestions: Record<number, string[]>;
    isLoading: boolean;
    connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
    error: string | null;
}

export interface GameActions {
    submitAnswer: (answerIndex: number) => Promise<void>;
    suggestAnswer: (answerIndex: number) => Promise<void>;
    reconnect: () => void;
    fetchState: () => Promise<void>;
}

const INITIAL_STATE: GameState = {
    room: null,
    players: [],
    currentUser: null,
    question: null,
    questionNumber: 0,
    timeLeft: 15,
    serverEndsAt: null,
    showResult: false,
    correctAnswer: null,
    selectedAnswer: null,
    hasAnswered: false,
    isCorrect: null,
    pointsEarned: 0,
    streak: 0,
    suggestions: {},
    isLoading: true,
    connectionStatus: 'connecting',
    error: null,
};

// ============================================================================
// Hook Implementation
// ============================================================================

export function useGameRoom(roomCode: string): [GameState, GameActions] {
    const [state, setState] = useState<GameState>(INITIAL_STATE);
    const eventSourceRef = useRef<EventSource | null>(null);
    const retryCountRef = useRef(0);
    const maxRetries = 5;

    // ========================================
    // AUTH
    // ========================================
    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setState(prev => ({ ...prev, currentUser: extractGameUser(user) }));
        };
        getUser();
    }, []);

    // ========================================
    // FETCH GAME STATE
    // ========================================
    const fetchState = useCallback(async () => {
        try {
            const res = await fetch(`/api/game/rooms/${roomCode}`);
            const data = await res.json();

            if (data.success) {
                setState(prev => {
                    const newState = { ...prev };
                    newState.room = data.room;
                    newState.players = data.players.sort((a: RoomPlayer, b: RoomPlayer) => b.score - a.score);
                    newState.isLoading = false;
                    newState.error = null;

                    if (data.currentQuestion && data.room.status === 'playing') {
                        // Only update if we don't have a question or it's different
                        if (!prev.question || prev.question.id !== data.currentQuestion.id) {
                            newState.question = {
                                id: data.currentQuestion.id,
                                question: data.currentQuestion.question,
                                options: data.currentQuestion.options,
                                correctAnswer: -1,
                                category: data.currentQuestion.category || '',
                                difficulty: data.currentQuestion.difficulty || 'medium',
                            };
                            newState.questionNumber = data.currentQuestion.questionNumber;
                            newState.timeLeft = data.currentQuestion.timeRemaining;
                            // Reset answer state for new question
                            newState.selectedAnswer = null;
                            newState.hasAnswered = false;
                            newState.showResult = false;
                            newState.correctAnswer = null;
                            newState.isCorrect = null;
                            newState.pointsEarned = 0;
                            newState.suggestions = {};
                        }
                    }

                    return newState;
                });
            } else {
                setState(prev => ({ ...prev, error: data.error, isLoading: false }));
            }
        } catch (err) {
            logger.error('Error fetching game state', { context: 'useGameRoom', data: err });
            setState(prev => ({ ...prev, error: 'فشل في تحميل بيانات اللعبة', isLoading: false }));
        }
    }, [roomCode]);

    // ========================================
    // SSE CONNECTION
    // ========================================
    const connectSSE = useCallback(() => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }

        setState(prev => ({ ...prev, connectionStatus: 'connecting' }));

        const eventSource = new EventSource(`/api/game/rooms/${roomCode}/events`);
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
            setState(prev => ({ ...prev, connectionStatus: 'connected' }));
            retryCountRef.current = 0;
        };

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                handleSSEEvent(data);
            } catch (e) {
                // Ignore parse errors (heartbeats)
            }
        };

        eventSource.onerror = () => {
            eventSource.close();
            setState(prev => ({ ...prev, connectionStatus: 'disconnected' }));

            if (retryCountRef.current < maxRetries) {
                retryCountRef.current++;
                setTimeout(connectSSE, 2000 * retryCountRef.current);
            } else {
                setState(prev => ({ ...prev, connectionStatus: 'error' }));
            }
        };
    }, [roomCode]);

    // ========================================
    // SSE EVENT HANDLER
    // ========================================
    const handleSSEEvent = useCallback((data: any) => {
        setState(prev => {
            const newState = { ...prev };

            switch (data.type) {
                case 'timer_sync':
                    if (!prev.showResult && data.data.questionNumber === prev.questionNumber) {
                        newState.timeLeft = data.data.timeRemaining;
                        newState.serverEndsAt = data.data.endsAt;
                    }
                    break;

                case 'question_start':
                    newState.questionNumber = data.data.questionNumber;
                    newState.question = {
                        id: `q_${data.data.questionNumber}`,
                        question: data.data.question,
                        options: data.data.options,
                        correctAnswer: -1,
                        category: '',
                        difficulty: 'medium',
                    };
                    newState.timeLeft = data.data.timeLimit || 15;
                    newState.serverEndsAt = data.data.endsAt;
                    newState.selectedAnswer = null;
                    newState.hasAnswered = false;
                    newState.showResult = false;
                    newState.correctAnswer = null;
                    newState.isCorrect = null;
                    newState.pointsEarned = 0;
                    newState.suggestions = {};
                    break;

                case 'question_result':
                    newState.correctAnswer = data.data.correctAnswer;
                    newState.showResult = true;
                    newState.timeLeft = 0;

                    const myScore = data.data.scores?.find(
                        (s: ScoreUpdate) => s.odUserId === prev.currentUser?.id
                    );
                    if (myScore?.delta > 0) {
                        newState.pointsEarned = myScore.delta;
                        newState.isCorrect = true;
                    } else if (prev.selectedAnswer !== null) {
                        newState.isCorrect = prev.selectedAnswer === data.data.correctAnswer;
                    }

                    if (data.data.scores) {
                        newState.players = prev.players.map(p => {
                            const update = data.data.scores.find((s: ScoreUpdate) => s.odUserId === p.odUserId);
                            return update ? { ...p, score: update.score } : p;
                        }).sort((a, b) => b.score - a.score);
                    }
                    break;

                case 'answer_suggestion':
                    const myTeam = prev.players.find(p => p.odUserId === prev.currentUser?.id)?.team;
                    if (data.data.team === myTeam) {
                        const idx = data.data.suggestedAnswer;
                        const current = prev.suggestions[idx] || [];
                        if (!current.includes(data.data.suggesterName)) {
                            newState.suggestions = {
                                ...prev.suggestions,
                                [idx]: [...current, data.data.suggesterName],
                            };
                        }
                    }
                    break;

                case 'player_answered':
                    // Could show notification
                    break;

                case 'game_ended':
                    // Will be handled by router in component
                    break;
            }

            return newState;
        });
    }, []);

    // ========================================
    // TIMER DISPLAY SYNC
    // ========================================
    useEffect(() => {
        if (state.showResult || !state.question || !state.serverEndsAt) return;

        const updateTimer = () => {
            const remaining = Math.max(0, Math.ceil((state.serverEndsAt! - Date.now()) / 1000));
            setState(prev => ({ ...prev, timeLeft: remaining }));
        };

        updateTimer();
        const timer = setInterval(updateTimer, 100);

        return () => clearInterval(timer);
    }, [state.showResult, state.question?.id, state.serverEndsAt]);

    // ========================================
    // INITIALIZATION
    // ========================================
    useEffect(() => {
        if (state.currentUser) {
            fetchState();
            connectSSE();
        }

        return () => {
            eventSourceRef.current?.close();
        };
    }, [state.currentUser, fetchState, connectSSE]);

    // ========================================
    // ACTIONS
    // ========================================
    const submitAnswer = useCallback(async (answerIndex: number) => {
        if (state.showResult || state.hasAnswered) return;

        setState(prev => ({ ...prev, selectedAnswer: answerIndex, hasAnswered: true }));

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(`/api/game/rooms/${roomCode}/answer`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    answer: answerIndex,
                    questionNumber: state.room?.currentQuestion ?? state.questionNumber,
                }),
            });

            const data = await res.json();

            if (data.success) {
                setState(prev => {
                    const newState = { ...prev };
                    if (data.isCorrect !== undefined) {
                        newState.isCorrect = data.isCorrect;
                        newState.streak = data.isCorrect ? prev.streak + 1 : 0;
                    }
                    if (data.points) {
                        newState.pointsEarned = data.points;
                    }
                    if (data.alreadyWon) {
                        newState.showResult = true;
                    }
                    return newState;
                });
            }
        } catch (err) {
            logger.error('Error submitting answer', { context: 'useGameRoom', data: err });
            setState(prev => ({ ...prev, hasAnswered: false }));
        }
    }, [roomCode, state.showResult, state.hasAnswered, state.room?.currentQuestion, state.questionNumber]);

    const suggestAnswer = useCallback(async (answerIndex: number) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            await fetch(`/api/game/rooms/${roomCode}/suggest`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ answer: answerIndex }),
            });
        } catch (err) {
            logger.error('Error suggesting answer', { context: 'useGameRoom', data: err });
        }
    }, [roomCode]);

    const reconnect = useCallback(() => {
        retryCountRef.current = 0;
        connectSSE();
    }, [connectSSE]);

    const actions: GameActions = {
        submitAnswer,
        suggestAnswer,
        reconnect,
        fetchState,
    };

    return [state, actions];
}
