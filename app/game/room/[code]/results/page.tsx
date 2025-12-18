"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import Confetti from "react-confetti";
import {
    Trophy,
    Crown,
    Medal,
    Star,
    Home,
    RotateCcw,
    Sparkles,
    Target,
    Flame,
    Swords,
    Zap,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { RoomPlayer } from "@/lib/game/types";

export default function ResultsPage() {
    const params = useParams();
    const router = useRouter();
    const code = params.code as string;

    const [players, setPlayers] = useState<RoomPlayer[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showConfetti, setShowConfetti] = useState(false);
    const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    }, []);

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);

            const res = await fetch(`/api/game/rooms/${code}`);
            const data = await res.json();

            if (data.success) {
                const sorted = data.players.sort((a: RoomPlayer, b: RoomPlayer) => b.score - a.score);
                setPlayers(sorted);

                // Show confetti if winner
                if (sorted[0]?.odUserId === user?.id) {
                    setShowConfetti(true);
                    setTimeout(() => setShowConfetti(false), 5000);
                }
            }
            setIsLoading(false);
        };
        init();
    }, [code]);

    const myPlayer = players.find(p => p.odUserId === currentUser?.id);
    const myRank = players.findIndex(p => p.odUserId === currentUser?.id) + 1;
    const winner = players[0];
    const isWinner = winner?.odUserId === currentUser?.id;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-4 border-amber-500/30 rounded-full" />
                    <div className="absolute inset-0 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a1a] relative overflow-hidden" dir="rtl">
            {/* Confetti */}
            {showConfetti && (
                <Confetti
                    width={windowSize.width}
                    height={windowSize.height}
                    recycle={false}
                    numberOfPieces={500}
                    gravity={0.2}
                />
            )}

            {/* Animated Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzFhMWEzYSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20" />
                <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[200px] ${isWinner ? 'bg-amber-500/20' : 'bg-indigo-500/15'
                    }`} />
            </div>

            <div className="relative z-10 container mx-auto px-4 py-8 max-w-2xl">
                {/* Winner Banner */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-10"
                >
                    {/* Trophy Animation */}
                    <motion.div
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                        className="relative w-32 h-32 mx-auto mb-6"
                    >
                        <div className={`absolute inset-0 rounded-full blur-2xl ${isWinner ? 'bg-amber-500/50' : 'bg-indigo-500/30'
                            }`} />
                        <div className={`relative w-full h-full rounded-3xl flex items-center justify-center ${isWinner
                                ? 'bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 shadow-2xl shadow-amber-500/50'
                                : 'bg-gradient-to-br from-indigo-500 to-purple-500 shadow-2xl shadow-indigo-500/30'
                            }`}>
                            {isWinner ? (
                                <Crown className="h-16 w-16 text-white drop-shadow-lg" />
                            ) : (
                                <Medal className="h-16 w-16 text-white drop-shadow-lg" />
                            )}
                        </div>

                        {/* Sparkles */}
                        {isWinner && (
                            <>
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                    className="absolute -inset-4 border-2 border-dashed border-amber-500/30 rounded-full"
                                />
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="absolute -top-2 -right-2"
                                >
                                    <Sparkles className="h-8 w-8 text-amber-400" />
                                </motion.div>
                            </>
                        )}
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        {isWinner ? (
                            <>
                                <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 mb-3">
                                    🎉 مبروك! أنت البطل!
                                </h1>
                                <p className="text-amber-400/80 text-lg">أداء أسطوري! استمر في التفوق</p>
                            </>
                        ) : (
                            <>
                                <h1 className="text-4xl font-black text-white mb-3">انتهت المعركة!</h1>
                                <p className="text-gray-400 text-lg">حصلت على المركز <span className="text-orange-400 font-black">{myRank}</span></p>
                            </>
                        )}
                    </motion.div>

                    {/* My Stats */}
                    {myPlayer && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="grid grid-cols-3 gap-4 mt-8"
                        >
                            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10">
                                <Star className="h-7 w-7 text-amber-400 mx-auto mb-2" />
                                <div className="text-3xl font-black text-white">{myPlayer.score}</div>
                                <div className="text-xs text-gray-500 mt-1">النقاط</div>
                            </div>
                            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10">
                                <Target className="h-7 w-7 text-green-400 mx-auto mb-2" />
                                <div className="text-3xl font-black text-white">{myPlayer.correctAnswers}</div>
                                <div className="text-xs text-gray-500 mt-1">صحيحة</div>
                            </div>
                            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10">
                                <Flame className="h-7 w-7 text-orange-400 mx-auto mb-2" />
                                <div className="text-3xl font-black text-white">{myPlayer.streak}</div>
                                <div className="text-xs text-gray-500 mt-1">أعلى سلسلة</div>
                            </div>
                        </motion.div>
                    )}
                </motion.div>

                {/* Leaderboard */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10 mb-8"
                >
                    <h2 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-500/20">
                            <Trophy className="h-5 w-5 text-amber-400" />
                        </div>
                        الترتيب النهائي
                    </h2>

                    <div className="space-y-3">
                        {players.map((player, index) => {
                            const isMe = player.odUserId === currentUser?.id;

                            return (
                                <motion.div
                                    key={player.odUserId}
                                    initial={{ opacity: 0, x: -30 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.7 + index * 0.1 }}
                                    className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${isMe
                                            ? 'bg-gradient-to-r from-orange-500/20 to-pink-500/10 border-2 border-orange-500/50'
                                            : 'bg-white/5 border border-white/5'
                                        }`}
                                >
                                    {/* Rank */}
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg ${index === 0 ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/30' :
                                            index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white' :
                                                index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white' :
                                                    'bg-white/10 text-gray-400'
                                        }`}>
                                        {index === 0 ? <Crown className="h-6 w-6" /> : index + 1}
                                    </div>

                                    {/* Avatar */}
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-black">
                                        {player.avatar ? (
                                            <img src={player.avatar} alt="" className="w-full h-full rounded-xl object-cover" />
                                        ) : (
                                            player.odDisplayName.charAt(0).toUpperCase()
                                        )}
                                    </div>

                                    {/* Name */}
                                    <div className="flex-1">
                                        <p className="font-black text-white flex items-center gap-2">
                                            {player.odDisplayName}
                                            {isMe && <span className="text-xs text-orange-400 font-normal">(أنت)</span>}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            ✓ {player.correctAnswers} صحيحة • ✗ {player.wrongAnswers} خاطئة
                                        </p>
                                    </div>

                                    {/* Score */}
                                    <div className="text-left">
                                        <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
                                            {player.score}
                                        </div>
                                        <div className="text-xs text-gray-600">نقطة</div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    className="flex gap-4"
                >
                    <Link href="/game" className="flex-1">
                        <motion.button
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white font-black text-lg shadow-2xl shadow-orange-500/30"
                        >
                            <Swords className="h-6 w-6" />
                            معركة جديدة
                        </motion.button>
                    </Link>
                    <Link href="/" className="flex-1">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl bg-white/10 text-white font-bold border border-white/20 hover:bg-white/20 transition-all"
                        >
                            <Home className="h-6 w-6" />
                            الخروج
                        </motion.button>
                    </Link>
                </motion.div>
            </div>
        </div>
    );
}
