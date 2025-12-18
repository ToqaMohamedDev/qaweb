"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Flame,
    Clock,
    CheckCircle2,
    XCircle,
    Trophy,
    Zap,
    Crown,
    Users,
    Loader2,
    Swords,
    Target,
    Star,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { RoomConfig, RoomPlayer, GameQuestion } from "@/lib/game/types";

export default function PlayGamePage() {
    const params = useParams();
    const router = useRouter();
    const code = params.code as string;

    const [room, setRoom] = useState<RoomConfig | null>(null);
    const [players, setPlayers] = useState<RoomPlayer[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [question, setQuestion] = useState<GameQuestion | null>(null);
    const [questionNumber, setQuestionNumber] = useState(0);
    const [timeLeft, setTimeLeft] = useState(15);
    const [suggestions, setSuggestions] = useState<{ [key: number]: string[] }>({});
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [streak, setStreak] = useState(0);
    const [pointsEarned, setPointsEarned] = useState(0);

    const myPlayer = players.find(p => p.odUserId === currentUser?.id);

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);
        };
        checkAuth();
    }, []);

    const fetchGameState = useCallback(async () => {
        try {
            const res = await fetch(`/api/game/rooms/${code}`);
            const data = await res.json();

            if (data.success) {
                setRoom(data.room);
                setPlayers(data.players.sort((a: RoomPlayer, b: RoomPlayer) => b.score - a.score));

                if (data.currentQuestion /* && !question */) {
                    // Check if question changed to update state
                    if (!question || question.id !== data.currentQuestion.id) {
                        setQuestionNumber(data.currentQuestion.questionNumber);
                        setQuestion({
                            id: data.currentQuestion.id,
                            question: data.currentQuestion.question,
                            options: data.currentQuestion.options,
                            correctAnswer: -1,
                            category: data.currentQuestion.category,
                            difficulty: data.currentQuestion.difficulty
                        });
                        setTimeLeft(data.currentQuestion.timeRemaining);
                    }
                }

                if (data.room.status === 'finished') {
                    router.push(`/game/room/${code}/results`);
                }
            }
        } catch (err) {
            console.error("Error fetching game state:", err);
        } finally {
            setIsLoading(false);
        }
    }, [code, router]);

    useEffect(() => {
        if (currentUser) {
            fetchGameState();
            const interval = setInterval(fetchGameState, 3000);
            return () => clearInterval(interval);
        }
    }, [currentUser, fetchGameState]);

    // SSE Connection
    useEffect(() => {
        if (!room) return;

        const eventSource = new EventSource(`/api/game/rooms/${code}/events`);

        eventSource.onopen = () => {
            console.log("Connected to game events");
        };

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                // Filter events by team if needed (client-side filtering)
                // For suggestions, strictly filter
                if (data.type === 'answer_suggestion') {
                    if (data.data.team === myPlayer?.team) {
                        setSuggestions(prev => {
                            const newSuggestions = { ...prev };
                            if (!newSuggestions[data.data.suggestedAnswer]) {
                                newSuggestions[data.data.suggestedAnswer] = [];
                            }
                            if (!newSuggestions[data.data.suggestedAnswer].includes(data.data.suggesterName)) {
                                newSuggestions[data.data.suggestedAnswer].push(data.data.suggesterName);
                            }
                            return newSuggestions;
                        });
                    }
                } else if (data.type === 'player_answered') {
                    // Show that someone answered? 
                    // Maybe show "Captain answered" notification
                } else if (data.type === 'question_start') {
                    // Reset state for new question
                    setQuestionNumber(data.data.questionNumber);
                    setQuestion({
                        id: `q_${data.data.questionNumber}`,
                        question: data.data.question,
                        options: data.data.options,
                        correctAnswer: -1, // Hidden
                        category: '',
                        difficulty: 'medium',
                    });
                    setTimeLeft(data.data.timeLimit || 15);
                    setSelectedAnswer(null);
                    setShowResult(false);
                    setIsCorrect(null);
                    setSuggestions({});
                    setPointsEarned(0);
                } else if (data.type === 'question_result') {
                    // Show result
                    const isMyTeamWinner = data.data.scores.find((s: any) => s.odUserId === currentUser?.id)?.delta > 0;
                    if (isMyTeamWinner) {
                        setPointsEarned(data.data.scores.find((s: any) => s.odUserId === currentUser?.id)?.delta);
                        setIsCorrect(true);
                    } else {
                        setIsCorrect(false);
                    }
                    setShowResult(true);

                    // Update players scores
                    setPlayers(currentPlayers => {
                        return currentPlayers.map(p => {
                            const scoreUpdate = data.data.scores.find((s: any) => s.odUserId === p.odUserId);
                            if (scoreUpdate) {
                                return { ...p, score: scoreUpdate.score };
                            }
                            return p;
                        }).sort((a, b) => b.score - a.score);
                    });
                } else if (data.type === 'game_ended') {
                    router.push(`/game/room/${code}/results`);
                }

            } catch (e) {
                // Ignore parsing errors for heartbeats
            }
        };

        return () => {
            eventSource.close();
        };
    }, [code, room?.id, myPlayer?.team, currentUser?.id, router]); // Re-connect if team changes (rare)

    // Timer
    useEffect(() => {
        if (showResult || !question || timeLeft <= 0) return;

        const timer = setInterval(() => {
            setTimeLeft(t => {
                if (t <= 1) {
                    handleTimeout();
                    return 0;
                }
                return t - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [showResult, question, timeLeft]);

    const handleTimeout = () => {
        if (!showResult) {
            setShowResult(true);
            setIsCorrect(false);
        }
    };

    const handleAnswer = async (answerIndex: number) => {
        if (showResult || selectedAnswer !== null) return;

        setSelectedAnswer(answerIndex);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(`/api/game/rooms/${code}/answer`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${session?.access_token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    answer: answerIndex,
                    questionNumber: room?.currentQuestion || 0,
                }),
            });

            const data = await res.json();

            if (data.success) {
                setIsCorrect(data.isCorrect);
                setPointsEarned(data.points || 0);
                setShowResult(true);

                if (data.isCorrect) {
                    setStreak(s => s + 1);
                } else {
                    setStreak(0);
                }
            }
        } catch (err) {
            console.error("Error submitting answer:", err);
        }
    };

    const handleSuggest = async (answerIndex: number) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            await fetch(`/api/game/rooms/${code}/suggest`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${session?.access_token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    answer: answerIndex,
                }),
            });
            // Optimistic UI? No, wait for event so we see our own name
        } catch (err) {
            console.error("Error suggesting:", err);
        }
    };

    const onOptionClick = (index: number) => {
        const isTeamMode = room?.gameMode === 'team';
        const isCaptain = myPlayer?.isCaptain;

        if (isTeamMode && !isCaptain) {
            handleSuggest(index);
        } else {
            handleAnswer(index);
        }
    };


    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
                <div className="text-center">
                    <div className="relative w-16 h-16 mx-auto mb-4">
                        <div className="absolute inset-0 border-4 border-orange-500/30 rounded-full" />
                        <div className="absolute inset-0 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                    <p className="text-gray-500">جاري تحميل اللعبة...</p>
                </div>
            </div>
        );
    }

    const timerPercentage = (timeLeft / (room?.timePerQuestion || 15)) * 100;

    return (
        <div className="min-h-screen bg-[#0a0a1a] relative overflow-hidden" dir="rtl">
            {/* Animated Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzFhMWEzYSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20" />

                {/* Dynamic Glow based on timer */}
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[200px] transition-colors duration-1000 ${timeLeft <= 5 ? 'bg-red-600/20' : timeLeft <= 10 ? 'bg-orange-600/15' : 'bg-indigo-600/10'
                    }`} />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto p-4 h-screen flex flex-col">
                {/* Top Bar - Scores */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between mb-6 py-4"
                >
                    {/* My Score / Team Score */}
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-500/30">
                                {myPlayer?.odDisplayName?.charAt(0) || 'أ'}
                            </div>
                            {streak >= 3 && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -top-1 -right-1 p-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500"
                                >
                                    <Flame className="h-3 w-3 text-white" />
                                </motion.div>
                            )}
                        </div>
                        <div>
                            <div className="text-3xl font-black text-white">{myPlayer?.score || 0}</div>
                            <div className="text-xs text-gray-500">{room?.gameMode === 'team' ? `نقاط فريقك (${myPlayer?.team})` : 'نقاطك'}</div>
                        </div>
                    </div>

                    {/* Timer */}
                    <div className="relative">
                        <svg className="w-20 h-20 transform -rotate-90">
                            <circle
                                cx="40"
                                cy="40"
                                r="35"
                                stroke="rgba(255,255,255,0.1)"
                                strokeWidth="6"
                                fill="none"
                            />
                            <circle
                                cx="40"
                                cy="40"
                                r="35"
                                stroke={timeLeft <= 5 ? '#ef4444' : timeLeft <= 10 ? '#f97316' : '#8b5cf6'}
                                strokeWidth="6"
                                fill="none"
                                strokeLinecap="round"
                                strokeDasharray={220}
                                strokeDashoffset={220 - (220 * timerPercentage) / 100}
                                className="transition-all duration-300"
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <motion.span
                                key={timeLeft}
                                initial={{ scale: 1.3 }}
                                animate={{ scale: 1 }}
                                className={`text-2xl font-black ${timeLeft <= 5 ? 'text-red-500' : timeLeft <= 10 ? 'text-orange-500' : 'text-white'
                                    }`}
                            >
                                {timeLeft}
                            </motion.span>
                        </div>
                    </div>

                    {/* Leader / Enemy Logic needs update for Team Mode but keeping simple for now */}
                    {players[0] && (
                        <div className="flex items-center gap-4 flex-row-reverse">
                            <div className="relative">
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                                    <Crown className="h-6 w-6 text-white" />
                                </div>
                            </div>
                            <div className="text-left">
                                <div className="text-3xl font-black text-white">{players[0].score}</div>
                                <div className="text-xs text-gray-500 truncate max-w-[80px]">{players[0].odUserId === currentUser?.id ? 'أنت!' : players[0].odDisplayName}</div>
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* Progress Bar */}
                <div className="flex gap-1.5 mb-6">
                    {Array.from({ length: room?.questionCount || 10 }).map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className={`flex-1 h-2 rounded-full ${i < (room?.currentQuestion || 0) ? 'bg-green-500' :
                                i === (room?.currentQuestion || 0) ? 'bg-gradient-to-r from-orange-500 to-pink-500' :
                                    'bg-white/10'
                                }`}
                        />
                    ))}
                </div>

                {/* Streak Banner */}
                <AnimatePresence>
                    {streak >= 2 && (
                        <motion.div
                            initial={{ opacity: 0, y: -20, scale: 0.8 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="flex items-center justify-center gap-3 mb-4 py-2 px-4 rounded-full bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 mx-auto"
                        >
                            <Flame className="h-5 w-5 text-orange-400 animate-pulse" />
                            <span className="text-orange-400 font-black">سلسلة {streak}x 🔥</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Question Card */}
                <motion.div
                    key={questionNumber}
                    initial={{ x: 100, opacity: 0, scale: 0.95 }}
                    animate={{ x: 0, opacity: 1, scale: 1 }}
                    className="flex-1 flex flex-col"
                >
                    <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 flex-1 flex flex-col">
                        {/* Question Header */}
                        <div className="flex items-center justify-between mb-6">
                            <span className="px-4 py-1.5 rounded-full bg-white/10 text-gray-400 text-sm font-bold">
                                السؤال {(room?.currentQuestion || 0) + 1} / {room?.questionCount || 10}
                            </span>
                            <AnimatePresence>
                                {pointsEarned > 0 && showResult && (
                                    <motion.span
                                        initial={{ scale: 0, y: 20 }}
                                        animate={{ scale: 1, y: 0 }}
                                        className="text-green-400 font-black text-xl flex items-center gap-2"
                                    >
                                        <Star className="h-5 w-5" />
                                        +{pointsEarned}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Question Text */}
                        <h2 className="text-2xl md:text-3xl font-black text-white mb-8 leading-relaxed">
                            {question?.question || "جاري تحميل السؤال..."}
                        </h2>

                        {/* Answer Options */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                            {question?.options.map((option, index) => {
                                let bgClass = 'from-white/5 to-white/[0.02] border-white/10 hover:border-white/30 hover:from-white/10';
                                let iconClass = 'bg-white/10 text-white';

                                if (showResult) {
                                    if (index === question.correctAnswer) {
                                        bgClass = 'from-green-500/30 to-green-500/10 border-green-500';
                                        iconClass = 'bg-green-500 text-white';
                                    } else if (index === selectedAnswer && !isCorrect) {
                                        bgClass = 'from-red-500/30 to-red-500/10 border-red-500';
                                        iconClass = 'bg-red-500 text-white';
                                    }
                                } else if (selectedAnswer === index) {
                                    bgClass = 'from-orange-500/30 to-orange-500/10 border-orange-500';
                                    iconClass = 'bg-orange-500 text-white';
                                }

                                const isTeamMode = room?.gameMode === 'team';
                                const isCaptain = myPlayer?.isCaptain;
                                const canInteract = !showResult; // Non-captains can always suggest if not showResult

                                const suggestionCount = suggestions[index]?.length || 0;

                                return (
                                    <motion.button
                                        key={index}
                                        whileHover={canInteract ? { scale: 1.02, y: -2 } : {}}
                                        whileTap={canInteract ? { scale: 0.98 } : {}}
                                        onClick={() => onOptionClick(index)}
                                        disabled={!canInteract}
                                        className={`relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br ${bgClass} border-2 transition-all text-right ${!canInteract ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <span className={`w-12 h-12 rounded-xl ${iconClass} flex items-center justify-center font-black text-lg shrink-0`}>
                                                {String.fromCharCode(65 + index)}
                                            </span>
                                            <div className="flex-1">
                                                <span className="text-white text-lg font-bold block">
                                                    {option}
                                                </span>
                                                {isTeamMode && !isCaptain && !showResult && (
                                                    <span className="text-xs text-indigo-300 block mt-1">
                                                        اضغط للاقتراح
                                                    </span>
                                                )}
                                                {/* Suggestions Display */}
                                                {suggestionCount > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {suggestions[index].map((name, i) => (
                                                            <motion.span
                                                                key={i}
                                                                initial={{ scale: 0 }}
                                                                animate={{ scale: 1 }}
                                                                className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-500/30 border border-indigo-500/50 text-[10px] text-indigo-200"
                                                            >
                                                                {name}
                                                            </motion.span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            {/* (Icons Check/X) */}
                                            {showResult && index === question.correctAnswer && (
                                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                                    <CheckCircle2 className="h-7 w-7 text-green-400" />
                                                </motion.div>
                                            )}
                                            {showResult && index === selectedAnswer && !isCorrect && (
                                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                                    <XCircle className="h-7 w-7 text-red-400" />
                                                </motion.div>
                                            )}
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>
                </motion.div>

                {/* Bottom Leaderboard */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-4 py-4 px-6 rounded-2xl bg-black/50 backdrop-blur-xl border border-white/10"
                >
                    <div className="flex items-center justify-between gap-4 overflow-x-auto">
                        {players.slice(0, 5).map((player, i) => (
                            <div
                                key={player.odUserId}
                                className={`flex items-center gap-3 shrink-0 ${player.odUserId === currentUser?.id ? 'text-orange-400' : 'text-gray-400'}`}
                            >
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${i === 0 ? 'bg-amber-500 text-white' :
                                    i === 1 ? 'bg-gray-500 text-white' :
                                        i === 2 ? 'bg-amber-700 text-white' :
                                            'bg-white/10 text-gray-500'
                                    }`}>
                                    {i + 1}
                                </span>
                                <span className="font-bold text-sm truncate max-w-[60px]">
                                    {player.odUserId === currentUser?.id ? 'أنت' : player.odDisplayName}
                                </span>
                                <span className="font-black">{player.score}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
