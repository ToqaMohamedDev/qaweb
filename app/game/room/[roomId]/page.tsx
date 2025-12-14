/**
 * Game Room Page
 * Main game interface with real-time quiz functionality
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket, useRoomSocket } from '../../hooks/useSocket';
import { useAntiCheat } from '../../hooks/useAntiCheat';
import { GameTimer, TimerBar } from '../../components/GameTimer';
import { QuestionCard } from '../../components/QuestionCard';
import { Leaderboard, SidebarLeaderboard } from '../../components/Leaderboard';
import { AdminDashboard } from '../../components/AdminDashboard';

export default function GameRoomPage() {
    const params = useParams();
    const router = useRouter();
    const roomId = params.roomId as string;

    // Auth token - would come from auth context in production
    const [token, setToken] = useState<string>('');
    const [connectionAttempts, setConnectionAttempts] = useState(0);
    const [connectionTimeout, setConnectionTimeout] = useState(false);

    // Socket connection
    const { socket, connected, error: socketError, connect } = useSocket({
        token,
        autoConnect: false,
    });

    // Room state
    const {
        roomState,
        players,
        currentQuestion,
        remainingTime,
        leaderboard,
        messages,
        isAdmin,
        totalQuestions,
        myPlayerId,
    } = useRoomSocket(socket, roomId);

    // Anti-cheat (only when game is active)
    useAntiCheat(socket, roomState?.status === 'QUESTION_ACTIVE');

    // Local state
    const [hasAnswered, setHasAnswered] = useState(false);
    const [selectedAnswer, setSelectedAnswer] = useState<string>();
    const [showResults, setShowResults] = useState(false);
    const [questionResults, setQuestionResults] = useState<any>(null);
    const [kicked, setKicked] = useState(false);
    const [kickReason, setKickReason] = useState('');
    const [loadingDemo, setLoadingDemo] = useState(false);
    const [isStartingGame, setIsStartingGame] = useState(false);


    // Join room on mount
    useEffect(() => {
        const initAuth = async () => {
            // TEMPORARY FIX: Clear old data to ensure fresh start
            // You can remove these lines after first successful login
            const needsReset = !localStorage.getItem('auth_fixed_v1');
            if (needsReset) {
                localStorage.removeItem('game_token');
                localStorage.removeItem('game_user_id');
                localStorage.setItem('auth_fixed_v1', 'true');
            }

            // Get stored userId to maintain admin status across refreshes
            let storedUserId = localStorage.getItem('game_user_id');

            try {
                // Always create a fresh session with the stored userId
                // This ensures the userId remains consistent
                const response = await fetch('/api/auth/guest', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        existingUserId: storedUserId || undefined
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.token) {
                        localStorage.setItem('game_token', data.token);
                        // Store the userId for future refreshes
                        if (data.user?.id) {
                            localStorage.setItem('game_user_id', data.user.id);
                        }
                        setToken(data.token);
                    }
                } else {
                    console.error('Guest auth failed:', response.statusText);
                }
            } catch (error) {
                console.error('Failed to initialize guest session:', error);
            }
        };

        initAuth();
    }, []);

    useEffect(() => {
        if (token && !connected && !connectionTimeout) {
            connect();
            setConnectionAttempts(prev => prev + 1);
        }
    }, [token, connected, connect, connectionTimeout]);

    // Connection timeout
    useEffect(() => {
        if (!connected && connectionAttempts > 0) {
            const timeout = setTimeout(() => {
                setConnectionTimeout(true);
            }, 15000); // 15 seconds timeout

            return () => clearTimeout(timeout);
        }
    }, [connected, connectionAttempts]);

    useEffect(() => {
        if (!socket || !connected) return;

        // Join room
        socket.emit('room:join', { roomCode: roomId }, (response: { success: boolean; error?: string }) => {
            if (!response.success) {
                alert(response.error || 'Failed to join room');
                router.push('/game');
            }
        });

        // Listen for kick
        socket.on('room:kicked', (data: { reason: string }) => {
            setKicked(true);
            setKickReason(data.reason);
        });

        // Listen for results
        socket.on('game:question_results', (results: { playerResults: Array<{ playerId: string; answer?: string }>; correctAnswer: string }) => {
            setShowResults(true);
            setQuestionResults(results);

            // Check my result
            const myResult = results.playerResults.find(
                (r: any) => r.playerId === socket.id // Would use actual player ID
            );
            if (myResult) {
                setSelectedAnswer(myResult.answer);
            }
        });

        // Reset on new question
        socket.on('game:question_start', () => {
            setHasAnswered(false);
            setSelectedAnswer(undefined);
            setShowResults(false);
            setQuestionResults(null);
        });

        return () => {
            socket.off('room:kicked');
            socket.off('game:question_results');
            socket.off('game:question_start');
        };
    }, [socket, connected, roomId, router]);

    // Handle answer submission
    const handleAnswer = useCallback((optionId: string) => {
        if (!socket || hasAnswered || !currentQuestion) return;

        socket.emit('game:submit_answer', {
            questionId: currentQuestion.id,
            answer: optionId,
            clientTimestamp: Date.now(),
        }, (response: { success: boolean; error?: string }) => {
            if (response.success) {
                setHasAnswered(true);
                setSelectedAnswer(optionId);
            } else {
                console.error('Answer rejected:', response.error);
            }
        });
    }, [socket, hasAnswered, currentQuestion]);

    // Handle admin actions
    const handleAdminAction = useCallback((action: string, data?: any) => {
        if (!socket) return;

        const eventMap: Record<string, string> = {
            'start': 'admin:start_game',
            'pause': 'admin:pause',
            'resume': 'admin:resume',
            'skip': 'admin:skip_question',
            'restart': 'admin:restart_question',
            'end': 'admin:end_game',
            'kick': 'admin:kick_player',
            'mute': 'admin:mute_player',
            'broadcast': 'admin:broadcast_message',
        };

        const event = eventMap[action];
        if (!event) return;

        // Events that only take a callback (no data parameter)
        const callbackOnlyEvents = ['admin:start_game', 'admin:pause', 'admin:resume',
            'admin:skip_question', 'admin:restart_question', 'admin:end_game'];

        if (callbackOnlyEvents.includes(event)) {
            // Set loading state for start action
            if (action === 'start') {
                setIsStartingGame(true);
            }

            // Emit with just callback, no data parameter
            socket.emit(event as any, (response: any) => {
                if (!response.success) {
                    console.error(`${action} failed:`, response.error);
                    // Reset loading state on error
                    if (action === 'start') {
                        setIsStartingGame(false);
                    }
                }
                // Note: On success for 'start', the room state will change to STARTING/ACTIVE
                // which will automatically hide this waiting screen, so no need to reset isStartingGame
            });
        } else {
            // Emit with data + callback
            socket.emit(event as any, data || {}, (response: any) => {
                if (!response.success) {
                    // Use warn instead of error for non-critical actions like mute
                    console.warn(`${action} action:`, response.error || 'Action not available');
                }
            });
        }
    }, [socket]);

    // Handle retry connection
    const handleRetry = useCallback(() => {
        setConnectionTimeout(false);
        setConnectionAttempts(0);
        connect();
    }, [connect]);

    // Render loading state
    if (!connected) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-gray-900 
                      flex items-center justify-center p-4">
                <div className="text-center max-w-md">
                    {connectionTimeout ? (
                        <>
                            <div className="text-6xl mb-4">⚠️</div>
                            <h2 className="text-xl font-bold text-white mb-2">
                                لا يمكن الاتصال بالخادم
                            </h2>
                            <p className="text-white/60 mb-4">
                                تأكد من أن خادم اللعبة يعمل على المنفذ 3001
                            </p>
                            <div className="bg-gray-800/50 rounded-xl p-4 mb-6 text-left">
                                <p className="text-white/80 text-sm font-mono mb-2">لتشغيل الخادم:</p>
                                <code className="text-green-400 text-sm">
                                    cd server && npm run dev
                                </code>
                            </div>
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={handleRetry}
                                    className="px-6 py-3 bg-indigo-500 hover:bg-indigo-400 
                                             rounded-xl text-white font-medium transition-colors"
                                >
                                    إعادة المحاولة
                                </button>
                                <button
                                    onClick={() => router.push('/game')}
                                    className="px-6 py-3 bg-white/10 hover:bg-white/20 
                                             rounded-xl text-white font-medium transition-colors"
                                >
                                    العودة
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="w-16 h-16 border-4 border-indigo-400 border-t-transparent 
                                 rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-white/60">جاري الاتصال بخادم اللعبة...</p>
                            {socketError && (
                                <p className="text-red-400 mt-2 text-sm">{socketError}</p>
                            )}
                            {connectionAttempts > 1 && (
                                <p className="text-yellow-400/60 mt-2 text-sm">
                                    محاولة الاتصال {connectionAttempts}...
                                </p>
                            )}
                        </>
                    )}
                </div>
            </div>
        );
    }


    // Render kicked state
    if (kicked) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 
                      flex items-center justify-center p-4">
                <div className="text-center max-w-md">
                    <div className="text-6xl mb-4">⛔</div>
                    <h1 className="text-2xl font-bold text-white mb-2">You've Been Removed</h1>
                    <p className="text-white/60 mb-6">{kickReason}</p>
                    <button
                        onClick={() => router.push('/game')}
                        className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl 
                       text-white font-medium transition-colors"
                    >
                        Back to Lobby
                    </button>
                </div>
            </div>
        );
    }

    // Render waiting state
    if (roomState?.status === 'WAITING' || roomState?.status === 'CREATED' || !roomState) {
        // Load demo questions function
        const handleLoadDemoQuestions = async () => {
            setLoadingDemo(true);
            try {
                const authToken = localStorage.getItem('game_token');

                // First get the real room ID from the code
                const roomInfoResponse = await fetch(`/api/game/rooms/by-code/${roomId}`);
                const roomInfo = await roomInfoResponse.json();

                if (!roomInfo.success) {
                    alert(`❌ فشل: ${roomInfo.error || 'Room not found'}`);
                    return;
                }

                const actualRoomId = roomInfo.room.id;

                // Now load questions from Firestore
                const response = await fetch(`/api/game/rooms/${actualRoomId}/demo`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`,
                    },
                    body: JSON.stringify({
                        category: 'all', // يمكن تغييره لاحقاً من UI
                        difficulty: 'all', // يمكن تغييره لاحقاً من UI
                        limit: 10, // عدد الأسئلة
                    }),
                });

                const data = await response.json();
                if (data.success) {
                    alert(`✅ تم تحميل ${data.total} أسئلة بنجاح!`);
                    // Refresh the page to get updated state
                    window.location.reload();
                } else {
                    alert(`❌ فشل: ${data.error}`);
                }
            } catch (error) {
                console.error('Failed to load questions:', error);
                alert('❌ حدث خطأ في تحميل الأسئلة');
            } finally {
                setLoadingDemo(false);
            }
        };

        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-gray-900 p-6">
                <div className="max-w-4xl mx-auto">
                    {/* Room info */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">
                            🎮 غرفة Quiz Battle
                        </h1>
                        <p className="text-white/60">
                            شارك رمز الغرفة لدعوة اللاعبين
                        </p>
                        <div className="mt-4 inline-block px-8 py-4 bg-indigo-500/20 rounded-2xl 
                           border border-indigo-400/30 cursor-pointer hover:bg-indigo-500/30 transition-colors"
                            onClick={() => {
                                navigator.clipboard.writeText(roomId);
                                alert('تم نسخ رمز الغرفة!');
                            }}>
                            <div className="text-4xl font-mono font-bold text-indigo-300 tracking-wider">
                                {roomId}
                            </div>
                            <div className="text-sm text-white/40 mt-1">اضغط للنسخ</div>
                        </div>
                    </div>

                    {/* Status Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-white/5 rounded-xl border border-white/10 p-4 text-center">
                            <div className="text-3xl font-bold text-indigo-400">{players.length}</div>
                            <div className="text-sm text-white/60">لاعبين</div>
                        </div>
                        <div className="bg-white/5 rounded-xl border border-white/10 p-4 text-center">
                            <div className="text-3xl font-bold text-green-400">{totalQuestions}</div>
                            <div className="text-sm text-white/60">أسئلة</div>
                        </div>
                        <div className="bg-white/5 rounded-xl border border-white/10 p-4 text-center">
                            <div className="text-3xl font-bold text-yellow-400">{isAdmin ? '👑' : '👤'}</div>
                            <div className="text-sm text-white/60">{isAdmin ? 'المشرف' : 'لاعب'}</div>
                        </div>
                    </div>

                    {/* Players list */}
                    <div className="bg-white/5 rounded-2xl border border-white/10 p-6 mb-6">
                        <h2 className="text-lg font-semibold text-white mb-4">
                            اللاعبين ({players.length})
                        </h2>
                        {players.length === 0 ? (
                            <div className="text-center py-8 text-white/40">
                                <div className="text-4xl mb-2">👥</div>
                                <p>في انتظار اللاعبين...</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {players.map((player: any, index: number) => (
                                    <div
                                        key={player.id || `player-${index}`}
                                        className="flex items-center gap-3 p-3 bg-white/5 rounded-xl"
                                    >
                                        <div className="w-10 h-10 bg-indigo-500/30 rounded-full 
                                             flex items-center justify-center text-lg">
                                            {player.displayName?.[0]?.toUpperCase() || '?'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-white truncate">
                                                {player.displayName}
                                            </div>
                                            {player.role === 'ADMIN' && (
                                                <div className="text-xs text-yellow-400">👑 المشرف</div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Admin controls */}
                    {isAdmin && (
                        <div className="bg-yellow-500/10 rounded-2xl border border-yellow-400/30 p-6 mb-6">
                            <h2 className="text-lg font-semibold text-yellow-400 mb-4">
                                👑 لوحة التحكم
                            </h2>

                            <div className="space-y-4">
                                {/* Info message */}
                                <div className="p-4 bg-indigo-500/10 rounded-xl border border-indigo-400/20">
                                    <p className="text-indigo-300 text-sm">
                                        💡 سيتم تحميل الأسئلة تلقائياً عند بدء اللعبة (10 أسئلة عشوائية)
                                    </p>
                                </div>

                                {/* Start button */}
                                <button
                                    onClick={() => handleAdminAction('start')}
                                    disabled={players.length < 1 || isStartingGame}
                                    className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-500 
                                             rounded-xl text-white font-bold text-lg
                                             hover:from-indigo-400 hover:to-purple-400
                                             disabled:opacity-50 disabled:cursor-not-allowed
                                             transition-all transform hover:scale-[1.02]"
                                >
                                    {isStartingGame
                                        ? '⏳ جاري التحميل والبدء...'
                                        : players.length < 1
                                            ? '⚠️ في انتظار اللاعبين'
                                            : '🚀 بدء اللعبة'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Waiting message for non-admins */}
                    {!isAdmin && (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 border-4 border-indigo-400 border-t-transparent 
                                          rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-white/60">في انتظار المشرف لبدء اللعبة...</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Render game starting / countdown state
    if (roomState?.status === 'STARTING') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 
                          flex items-center justify-center p-4">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center"
                >
                    <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="text-9xl mb-8"
                    >
                        {roomState.countdown || '🎮'}
                    </motion.div>
                    <h1 className="text-4xl font-bold text-white mb-4">
                        اللعبة تبدأ الآن!
                    </h1>
                    <p className="text-white/60 text-xl">
                        استعد للسؤال الأول...
                    </p>
                </motion.div>
            </div>
        );
    }

    // Render game ended state
    if (roomState?.status === 'ENDED') {
        const winner = leaderboard?.players?.[0];

        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-gray-900 p-6 relative overflow-hidden">
                {/* Confetti Effect */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {[...Array(30)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{
                                x: Math.random() * window.innerWidth,
                                y: -20,
                                rotate: 0,
                                scale: Math.random() * 0.5 + 0.5
                            }}
                            animate={{
                                y: window.innerHeight + 20,
                                rotate: Math.random() * 360,
                            }}
                            transition={{
                                duration: Math.random() * 3 + 2,
                                repeat: Infinity,
                                delay: Math.random() * 2
                            }}
                            className="absolute text-2xl"
                        >
                            {['🎉', '🏆', '⭐', '✨', '🎊'][i % 5]}
                        </motion.div>
                    ))}
                </div>

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', damping: 10 }}
                        className="text-9xl mb-8"
                    >
                        🏆
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-5xl font-bold text-white mb-4"
                    >
                        انتهت اللعبة!
                    </motion.h1>

                    {winner && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5 }}
                            className="mb-8"
                        >
                            <p className="text-white/60 text-xl mb-2">الفائز</p>
                            <div className="inline-flex items-center gap-4 px-8 py-4 bg-gradient-to-r from-amber-500/30 to-yellow-500/30 
                                           rounded-2xl border-2 border-amber-400/50">
                                <span className="text-4xl">👑</span>
                                <div className="text-right">
                                    <p className="text-3xl font-bold text-amber-300">{winner.name}</p>
                                    <p className="text-amber-400/70">{winner.score} نقطة</p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {leaderboard && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 }}
                            className="mt-8 max-w-xl mx-auto"
                        >
                            <h2 className="text-xl font-bold text-white/80 mb-4">🏅 الترتيب النهائي</h2>
                            <Leaderboard
                                players={leaderboard.players || []}
                                teams={leaderboard.teams}
                            />
                        </motion.div>
                    )}

                    <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                        onClick={() => router.push('/game')}
                        className="mt-10 px-10 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 
                                   hover:from-indigo-400 hover:to-purple-400
                                   rounded-xl text-white font-bold text-lg transition-all
                                   shadow-lg shadow-indigo-500/30"
                    >
                        🎮 العودة للوبي
                    </motion.button>
                </div>
            </div>
        );
    }

    // Main game view
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900 relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            {/* Header */}
            <header className="sticky top-0 z-40 bg-gray-900/80 backdrop-blur-xl border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                    {/* Room info */}
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🎮</span>
                        <div>
                            <span className="px-3 py-1 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 
                                           rounded-lg text-indigo-300 font-mono font-bold">
                                {roomId}
                            </span>
                        </div>
                        {roomState?.status === 'PAUSED' && (
                            <span className="px-3 py-1.5 bg-amber-500/20 rounded-full text-amber-300 text-sm font-medium animate-pulse">
                                ⏸️ متوقف مؤقتاً
                            </span>
                        )}
                    </div>

                    {/* Players count */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full text-white/70">
                            <span>👥</span>
                            <span className="font-medium">{players.length} لاعب</span>
                        </div>
                        {isAdmin && (
                            <span className="px-3 py-1.5 bg-amber-500/20 rounded-full text-amber-400 text-sm font-medium">
                                👑 مشرف
                            </span>
                        )}
                    </div>
                </div>

                {/* Timer bar */}
                {currentQuestion && (
                    <div className="px-4 pb-3">
                        <TimerBar
                            remainingMs={remainingTime}
                            totalMs={currentQuestion.timeLimitMs}
                            isPaused={roomState?.status === 'PAUSED'}
                        />
                    </div>
                )}
            </header>

            {/* Main content */}
            <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
                {/* Timer - Always visible when game is active (OUTSIDE AnimatePresence to prevent flickering) */}
                {/* Show timer during QUESTION_ACTIVE, PAUSED, QUESTION_CLOSED, and SHOWING_RESULTS */}
                {['QUESTION_ACTIVE', 'PAUSED', 'QUESTION_CLOSED', 'SHOWING_RESULTS'].includes(roomState?.status) && (
                    <div className="flex justify-center mb-8" key="stable-timer-container">
                        <GameTimer
                            remainingMs={remainingTime}
                            totalMs={currentQuestion?.timeLimitMs || 15000}
                            isPaused={roomState?.status === 'PAUSED' || roomState?.status === 'SHOWING_RESULTS'}
                            size="large"
                        />
                    </div>
                )}

                <AnimatePresence mode="wait">
                    {currentQuestion ? (
                        <motion.div
                            key={`question-${currentQuestion.id}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-6"
                        >
                            {/* Question Card - No timer here anymore */}
                            <QuestionCard
                                key={currentQuestion.id}
                                question={currentQuestion}
                                onAnswer={handleAnswer}
                                hasAnswered={hasAnswered}
                                selectedAnswer={selectedAnswer}
                                correctAnswer={questionResults?.correctAnswer}
                                showResults={showResults}
                                disabled={roomState?.status === 'PAUSED'}
                            />
                        </motion.div>
                    ) : showResults && questionResults ? (
                        <motion.div
                            key="results"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-16"
                        >
                            <motion.div
                                className="text-8xl mb-6"
                                animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                📊
                            </motion.div>
                            <h2 className="text-3xl font-bold text-white mb-3">
                                نتائج السؤال
                            </h2>
                            <p className="text-white/60 mb-8 text-lg">
                                استعد للسؤال التالي...
                            </p>
                            <div className="max-w-xl mx-auto">
                                <Leaderboard
                                    players={questionResults.leaderboard?.players || []}
                                    compact
                                    maxDisplay={5}
                                />
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="waiting"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center py-24"
                        >
                            <motion.div
                                className="w-24 h-24 border-4 border-indigo-400 border-t-transparent rounded-full mb-8"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            />
                            <p className="text-white/60 text-xl">جاري التحميل...</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Admin Dashboard - Fixed Position */}
            {isAdmin && (
                <div className="fixed top-20 right-4 z-50 w-80">
                    <AdminDashboard
                        socket={socket}
                        roomId={roomId}
                        roomState={roomState}
                        players={players.map((p: any) => ({
                            playerId: p.id,
                            playerName: p.displayName,
                            teamId: p.teamId,
                            status: p.answerStatus || 'PENDING',
                            answer: p.currentAnswer,
                            timeTakenMs: p.currentAnswerTime,
                            flags: p.flags,
                        }))}
                        onAction={handleAdminAction}
                    />
                </div>
            )}

            {/* Leaderboard - Fixed Position on left for non-admins */}
            {!isAdmin && leaderboard && (
                <div className="fixed top-20 left-4 z-40 w-64 hidden lg:block">
                    <SidebarLeaderboard
                        players={leaderboard.players || []}
                        currentPlayerId={myPlayerId || socket?.id}
                    />
                </div>
            )}

            {/* Messages toast */}
            <AnimatePresence>
                {messages.slice(-1).map((msg: any) => (
                    <motion.div
                        key={msg.timestamp}
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -50, scale: 0.9 }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50
                                   px-6 py-4 bg-gradient-to-r from-indigo-500/90 to-purple-500/90 
                                   backdrop-blur-xl rounded-2xl text-white shadow-2xl shadow-indigo-500/30
                                   border border-white/20"
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">📢</span>
                            <div>
                                <strong className="block text-sm text-white/70">{msg.fromName}</strong>
                                <span className="text-lg">{msg.content}</span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}

