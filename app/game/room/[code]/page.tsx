"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
    Users,
    Crown,
    Check,
    X,
    Copy,
    ArrowLeft,
    Play,
    Loader2,
    Shield,
    Zap,
    UserPlus,
    Share2,
    Swords,
    Volume2,
    Star,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { RoomConfig, RoomPlayer } from "@/lib/game/types";

export default function WaitingRoomPage() {
    const params = useParams();
    const router = useRouter();
    const code = params.code as string;

    const [room, setRoom] = useState<RoomConfig | null>(null);
    const [players, setPlayers] = useState<RoomPlayer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [isReady, setIsReady] = useState(false);
    const [isStarting, setIsStarting] = useState(false);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState("");
    const [countdown, setCountdown] = useState<number | null>(null);

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);
            if (!user) router.push("/login");
        };
        checkAuth();
    }, [router]);

    const fetchRoom = useCallback(async () => {
        try {
            const res = await fetch(`/api/game/rooms/${code}`);
            const data = await res.json();

            if (data.success) {
                setRoom(data.room);
                setPlayers(data.players);

                if (data.room.status === 'playing' || data.room.status === 'starting') {
                    router.push(`/game/room/${code}/play`);
                }

                const me = data.players.find((p: RoomPlayer) => p.odUserId === currentUser?.id);
                if (me) setIsReady(me.isReady);
            } else {
                setError(data.error || "الغرفة غير موجودة");
            }
        } catch (err) {
            console.error("Error fetching room:", err);
        } finally {
            setIsLoading(false);
        }
    }, [code, currentUser?.id, router]);

    useEffect(() => {
        if (currentUser) {
            fetchRoom();
            const interval = setInterval(fetchRoom, 2000);
            return () => clearInterval(interval);
        }
    }, [currentUser, fetchRoom]);

    const handleReady = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(`/api/game/rooms/${code}/ready`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${session?.access_token}` },
            });
            const data = await res.json();
            if (data.success) setIsReady(data.isReady);
        } catch (err) {
            console.error("Error toggling ready:", err);
        }
    };

    const handleLeave = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            await fetch(`/api/game/rooms/${code}/leave`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${session?.access_token}` },
            });
            router.push("/game");
        } catch (err) {
            console.error("Error leaving room:", err);
        }
    };

    const handleStart = async () => {
        setIsStarting(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(`/api/game/rooms/${code}/start`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${session?.access_token}` },
            });
            const data = await res.json();
            if (!data.success) {
                setError(data.error || "خطأ في بدء اللعبة");
                setIsStarting(false);
            }
        } catch (err) {
            console.error("Error starting game:", err);
            setIsStarting(false);
        }
    };

    const copyCode = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const isCreator = room?.creatorId === currentUser?.id;
    const allReady = players.length >= 2 && players.every(p => p.isReady);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
                <div className="text-center">
                    <div className="relative w-16 h-16 mx-auto mb-4">
                        <div className="absolute inset-0 border-4 border-purple-500/30 rounded-full" />
                        <div className="absolute inset-0 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                    <p className="text-gray-500">جاري التحميل...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center" dir="rtl">
                <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                        <X className="h-10 w-10 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">{error}</h1>
                    <Link href="/game" className="text-orange-400 hover:underline">العودة للوبي</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a1a] relative overflow-hidden" dir="rtl">
            {/* Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzFhMWEzYSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[150px]" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-[150px]" />
            </div>

            {/* Top Bar */}
            <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/30 backdrop-blur-xl">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center">
                        <Swords className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <span className="text-lg font-black text-white block">{room?.name}</span>
                        <span className="text-xs text-gray-500">غرفة الانتظار</span>
                    </div>
                </div>
                <button
                    onClick={handleLeave}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all"
                >
                    <ArrowLeft className="h-4 w-4" />
                    مغادرة
                </button>
            </header>

            <main className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
                {/* Room Code Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-10"
                >
                    <p className="text-gray-500 mb-3">شارك الكود مع أصدقائك</p>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={copyCode}
                        className="inline-flex items-center gap-4 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-pink-600/20 border border-indigo-500/30 backdrop-blur-xl hover:border-indigo-500/50 transition-all"
                    >
                        <span className="font-mono text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 tracking-[0.2em]">
                            {code}
                        </span>
                        {copied ? (
                            <Check className="h-6 w-6 text-green-400" />
                        ) : (
                            <Copy className="h-6 w-6 text-gray-400" />
                        )}
                    </motion.button>

                    <div className="flex items-center justify-center gap-4 mt-6 text-sm">
                        <span className={`px-4 py-1.5 rounded-full font-bold ${room?.gameMode === 'ffa'
                            ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                            : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                            }`}>
                            {room?.gameMode === 'ffa' ? '⚡ FFA' : '👑 TEAMS'}
                        </span>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-400">{room?.questionCount} سؤال</span>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-400">{room?.timePerQuestion} ثانية</span>
                    </div>
                </motion.div>

                {/* Players Section */}
                {room?.gameMode === 'ffa' ? (
                    // FFA Layout
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10 mb-8"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-black text-white flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-green-500/20">
                                    <Users className="h-5 w-5 text-green-400" />
                                </div>
                                اللاعبون
                                <span className="text-gray-500 font-normal">({players.length}/{room?.maxPlayers})</span>
                            </h2>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                            {players.map((player, i) => (
                                <motion.div
                                    key={player.odUserId}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className={`relative p-4 rounded-2xl border-2 transition-all ${player.isReady ? 'bg-green-500/10 border-green-500/50' : 'bg-white/5 border-white/10'
                                        }`}
                                >
                                    {player.odUserId === room?.creatorId && (
                                        <div className="absolute -top-2 -right-2 p-1.5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg">
                                            <Crown className="h-3 w-3 text-white" />
                                        </div>
                                    )}
                                    <div className={`w-14 h-14 mx-auto mb-3 rounded-xl flex items-center justify-center text-white font-black text-lg ${player.team === 'A' ? 'bg-gradient-to-br from-blue-500 to-cyan-500' :
                                        player.team === 'B' ? 'bg-gradient-to-br from-red-500 to-pink-500' :
                                            'bg-gradient-to-br from-indigo-500 to-purple-500'
                                        }`}>
                                        {player.avatar ? <img src={player.avatar} alt="" className="w-full h-full rounded-xl object-cover" /> : player.odDisplayName.charAt(0).toUpperCase()}
                                    </div>
                                    <p className="text-white font-bold text-center text-sm truncate">{player.odDisplayName}</p>
                                    <div className={`mt-3 py-1.5 rounded-full text-xs text-center font-bold ${player.isReady ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-500'}`}>
                                        {player.isReady ? '✓ جاهز' : 'ينتظر...'}
                                    </div>
                                </motion.div>
                            ))}
                            {Array.from({ length: (room?.maxPlayers || 5) - players.length }).map((_, i) => (
                                <div key={`empty-${i}`} className="p-4 rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center opacity-50">
                                    <UserPlus className="h-8 w-8 text-gray-600 mb-2" />
                                </div>
                            ))}
                        </div>
                    </motion.div>
                ) : (
                    // Team Layout
                    <div className="grid md:grid-cols-2 gap-6 mb-8">
                        {/* Team A */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-indigo-900/10 backdrop-blur-xl rounded-3xl p-6 border border-indigo-500/30"
                        >
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-indigo-500/20">
                                <h2 className="text-xl font-black text-indigo-400">الفريق الأزرق (A)</h2>
                                <span className="bg-indigo-500/20 px-3 py-1 rounded-lg text-indigo-300 text-sm font-bold">
                                    {players.filter(p => p.team === 'A').length} / {Math.floor((room?.maxPlayers || 10) / 2)}
                                </span>
                            </div>

                            <div className="space-y-3 min-h-[200px]">
                                {players.filter(p => p.team === 'A').map((player) => (
                                    <div key={player.odUserId} className="flex items-center gap-3 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                                        <div className="relative">
                                            <div className="w-10 h-10 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-bold">
                                                {player.odDisplayName.charAt(0)}
                                            </div>
                                            {player.isCaptain && (
                                                <div className="absolute -top-2 -right-2 p-1 rounded-full bg-yellow-500 text-white shadow-sm" title="Captain">
                                                    <Crown className="h-3 w-3" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-indigo-100 font-bold text-sm">{player.odDisplayName}</p>
                                            {player.isReady && <span className="text-green-400 text-xs">✓ جاهز</span>}
                                        </div>
                                    </div>
                                ))}

                                {players.find(p => p.odUserId === currentUser?.id)?.team !== 'A' && (
                                    <button
                                        onClick={async () => {
                                            const { data: { session } } = await supabase.auth.getSession();
                                            await fetch(`/api/game/rooms/${code}/team`, {
                                                method: 'POST',
                                                headers: {
                                                    'Authorization': `Bearer ${session?.access_token}`,
                                                    'Content-Type': 'application/json'
                                                },
                                                body: JSON.stringify({ team: 'A' })
                                            });
                                            fetchRoom();
                                        }}
                                        className="w-full py-3 mt-4 rounded-xl border-2 border-dashed border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 hover:border-indigo-500/50 transition-all font-bold flex items-center justify-center gap-2"
                                    >
                                        <UserPlus className="h-4 w-4" />
                                        انضم للفريق الأزرق
                                    </button>
                                )}
                            </div>
                        </motion.div>

                        {/* Team B */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-red-900/10 backdrop-blur-xl rounded-3xl p-6 border border-red-500/30"
                        >
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-red-500/20">
                                <h2 className="text-xl font-black text-red-400">الفريق الأحمر (B)</h2>
                                <span className="bg-red-500/20 px-3 py-1 rounded-lg text-red-300 text-sm font-bold">
                                    {players.filter(p => p.team === 'B').length} / {Math.floor((room?.maxPlayers || 10) / 2)}
                                </span>
                            </div>

                            <div className="space-y-3 min-h-[200px]">
                                {players.filter(p => p.team === 'B').map((player) => (
                                    <div key={player.odUserId} className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                                        <div className="relative">
                                            <div className="w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center text-white font-bold">
                                                {player.odDisplayName.charAt(0)}
                                            </div>
                                            {player.isCaptain && (
                                                <div className="absolute -top-2 -right-2 p-1 rounded-full bg-yellow-500 text-white shadow-sm" title="Captain">
                                                    <Crown className="h-3 w-3" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-red-100 font-bold text-sm">{player.odDisplayName}</p>
                                            {player.isReady && <span className="text-green-400 text-xs">✓ جاهز</span>}
                                        </div>
                                    </div>
                                ))}

                                {players.find(p => p.odUserId === currentUser?.id)?.team !== 'B' && (
                                    <button
                                        onClick={async () => {
                                            const { data: { session } } = await supabase.auth.getSession();
                                            await fetch(`/api/game/rooms/${code}/team`, {
                                                method: 'POST',
                                                headers: {
                                                    'Authorization': `Bearer ${session?.access_token}`,
                                                    'Content-Type': 'application/json'
                                                },
                                                body: JSON.stringify({ team: 'B' })
                                            });
                                            fetchRoom();
                                        }}
                                        className="w-full py-3 mt-4 rounded-xl border-2 border-dashed border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 transition-all font-bold flex items-center justify-center gap-2"
                                    >
                                        <UserPlus className="h-4 w-4" />
                                        انضم للفريق الأحمر
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex gap-4"
                >
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleReady}
                        className={`flex-1 py-5 rounded-2xl font-black text-lg transition-all ${isReady
                            ? 'bg-green-500/20 border-2 border-green-500 text-green-400 shadow-lg shadow-green-500/20'
                            : 'bg-white/10 border-2 border-white/20 text-white hover:bg-white/20'
                            }`}
                    >
                        {isReady ? (
                            <span className="flex items-center justify-center gap-2">
                                <Check className="h-6 w-6" />
                                جاهز!
                            </span>
                        ) : (
                            'اضغط عندما تكون جاهزًا'
                        )}
                    </motion.button>

                    {isCreator && (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleStart}
                            disabled={!allReady || isStarting}
                            className="flex-1 py-5 rounded-2xl bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white font-black text-lg shadow-2xl shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all"
                        >
                            {isStarting ? (
                                <Loader2 className="h-7 w-7 animate-spin mx-auto" />
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    <Play className="h-6 w-6" />
                                    ابدأ المعركة!
                                </span>
                            )}
                        </motion.button>
                    )}
                </motion.div>

                {/* Status Messages */}
                <div className="text-center mt-6">
                    {!allReady && players.length >= 2 && (
                        <p className="text-gray-500 animate-pulse">⏳ في انتظار أن يكون الجميع جاهزين...</p>
                    )}
                    {players.length < 2 && (
                        <p className="text-gray-500">👥 يجب أن يكون هناك لاعبان على الأقل</p>
                    )}
                </div>
            </main>
        </div>
    );
}
