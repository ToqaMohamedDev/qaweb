/**
 * Socket.io Client Hook
 * Manages WebSocket connection with the game server
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type {
    ServerToClientEvents,
    ClientToServerEvents,
} from '../types/socket-events';

export interface UseSocketOptions {
    url?: string;
    token?: string;
    autoConnect?: boolean;
}

export interface SocketState {
    connected: boolean;
    error: string | null;
    latency: number;
}

export function useSocket(options: UseSocketOptions = {}) {
    const {
        url = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000',
        token,
        autoConnect = false,
    } = options;

    const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
    const [state, setState] = useState<SocketState>({
        connected: false,
        error: null,
        latency: 0,
    });

    // Initialize socket
    const connect = useCallback(() => {
        if (socketRef.current?.connected) return;

        const socket = io(url, {
            autoConnect: false,
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
        });

        // Connection events
        socket.on('connect', () => {
            setState(prev => ({ ...prev, connected: true, error: null }));
        });

        socket.on('disconnect', (reason) => {
            setState(prev => ({ ...prev, connected: false }));
            if (reason === 'io server disconnect') {
                // Server disconnected us, try to reconnect
                socket.connect();
            }
        });

        socket.on('connect_error', (error) => {
            setState(prev => ({ ...prev, error: error.message, connected: false }));
        });

        // Store reference and connect
        socketRef.current = socket;
        socket.connect();
    }, [url, token]);

    // Disconnect
    const disconnect = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
            setState({ connected: false, error: null, latency: 0 });
        }
    }, []);

    // Measure latency
    const measureLatency = useCallback(() => {
        if (!socketRef.current?.connected) return;

        const start = Date.now();
        socketRef.current.emit('ping', (response) => {
            const latency = Date.now() - start;
            setState(prev => ({ ...prev, latency }));
        });
    }, []);

    // Auto connect
    useEffect(() => {
        if (autoConnect && token) {
            connect();
        }

        return () => {
            disconnect();
        };
    }, [autoConnect, token, connect, disconnect]);

    // Latency measurement interval
    useEffect(() => {
        if (!state.connected) return;

        const interval = setInterval(measureLatency, 5000);
        return () => clearInterval(interval);
    }, [state.connected, measureLatency]);

    return {
        socket: socketRef.current,
        ...state,
        connect,
        disconnect,
        measureLatency,
    };
}

/**
 * Hook for room-specific socket events
 */
export function useRoomSocket(socket: Socket | null, roomId: string | null) {
    const [roomState, setRoomState] = useState<any>(null);
    const [players, setPlayers] = useState<any[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState<any>(null);
    const [remainingTime, setRemainingTime] = useState<number>(0);
    const [leaderboard, setLeaderboard] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [totalQuestions, setTotalQuestions] = useState<number>(0);
    const [myPlayerId, setMyPlayerId] = useState<string | null>(null);

    useEffect(() => {
        if (!socket || !roomId) return;

        // Room events
        socket.on('room:joined', (data) => {
            setRoomState(data.roomState);
            // Deduplicate players by ID
            const uniquePlayers = data.players.filter(
                (player: any, index: number, self: any[]) =>
                    index === self.findIndex(p => p.id === player.id)
            );
            setPlayers(uniquePlayers);
            setLeaderboard(data.leaderboard);
            setIsAdmin(data.isAdmin || false);
            setTotalQuestions(data.totalQuestions || 0);
            setMyPlayerId(data.playerId || null);
        });

        socket.on('room:player_joined', (data) => {
            setPlayers(prev => {
                // Check if player already exists to prevent duplicates
                const exists = prev.some(p => p.id === data.player.id);
                if (exists) {
                    // Update existing player instead of adding duplicate
                    return prev.map(p => p.id === data.player.id ? data.player : p);
                }
                return [...prev, data.player];
            });
        });

        socket.on('room:player_left', (data) => {
            setPlayers(prev => prev.filter(p => p.id !== data.playerId));
        });

        socket.on('room:state_updated', (data) => {
            setRoomState(data.state);
        });

        // Game lifecycle events
        socket.on('game:starting', (data) => {
            // Update room state when game is starting
            setRoomState((prev: any) => ({ ...prev, status: 'STARTING' }));
            setTotalQuestions(data.totalQuestions);
        });

        socket.on('game:countdown', (data) => {
            // Keep status as STARTING during countdown
            setRoomState((prev: any) => ({ ...prev, status: 'STARTING', countdown: data.remaining }));
        });

        // Game events
        socket.on('game:question_start', (data) => {
            // Update room state to QUESTION_ACTIVE when a question starts
            setRoomState((prev: any) => ({ ...prev, status: 'QUESTION_ACTIVE' }));
            setCurrentQuestion(data.question);
            setRemainingTime(data.remainingMs);
        });

        socket.on('game:timer_sync', (data) => {
            setRemainingTime(data.remainingMs);
        });

        socket.on('game:question_closed', () => {
            // Question closed, waiting for results
            setRoomState((prev: any) => ({ ...prev, status: 'QUESTION_CLOSED' }));
        });

        socket.on('game:question_results', (data) => {
            setRoomState((prev: any) => ({ ...prev, status: 'SHOWING_RESULTS' }));
            setLeaderboard(data.leaderboard);
            // DON'T set currentQuestion to null - this causes timer flickering
            // The question will be replaced when the next question starts
        });

        socket.on('game:ended', (data) => {
            setRoomState((prev: any) => ({ ...prev, status: 'ENDED' }));
            // Save final leaderboard from the results
            if (data.results?.leaderboard) {
                setLeaderboard(data.results.leaderboard);
            }
            setCurrentQuestion(null);
        });

        socket.on('game:paused', (data) => {
            setRoomState((prev: any) => ({ ...prev, status: 'PAUSED' }));
            setRemainingTime(data.remainingMs);
        });

        socket.on('game:resumed', (data) => {
            setRoomState((prev: any) => ({ ...prev, status: 'QUESTION_ACTIVE' }));
            setRemainingTime(data.remainingMs);
        });

        socket.on('game:leaderboard_updated', (data) => {
            setLeaderboard(data.leaderboard);
        });

        // Messages
        socket.on('message:broadcast', (data) => {
            setMessages(prev => [...prev, data]);
        });

        socket.on('message:system', (data) => {
            setMessages(prev => [...prev, { ...data, isSystem: true }]);
        });

        return () => {
            socket.off('room:joined');
            socket.off('room:player_joined');
            socket.off('room:player_left');
            socket.off('room:state_updated');
            socket.off('game:starting');
            socket.off('game:countdown');
            socket.off('game:question_start');
            socket.off('game:timer_sync');
            socket.off('game:question_closed');
            socket.off('game:question_results');
            socket.off('game:ended');
            socket.off('game:paused');
            socket.off('game:resumed');
            socket.off('game:leaderboard_updated');
            socket.off('message:broadcast');
            socket.off('message:system');
        };
    }, [socket, roomId]);

    return {
        roomState,
        players,
        currentQuestion,
        remainingTime,
        leaderboard,
        messages,
        isAdmin,
        totalQuestions,
        myPlayerId,
    };
}
