"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
    Swords,
    Users,
    Plus,
    Search,
    ArrowRight,
    Crown,
    Zap,
    Shield,
    Flame,
    Trophy,
    Target,
    Lock,
    Unlock,
    RefreshCw,
    Home,
    Loader2,
    UserPlus,
    Gamepad2,
    Volume2,
    VolumeX,
    Settings,
    LogOut,
    Sparkles,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { RoomSummary } from "@/lib/game/types";

export default function GameLobbyPage() {
    const router = useRouter();
    const [publicRooms, setPublicRooms] = useState<RoomSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [joinCode, setJoinCode] = useState("");
    const [isJoining, setIsJoining] = useState(false);
    const [error, setError] = useState("");
    const [user, setUser] = useState<any>(null);
    const [soundOn, setSoundOn] = useState(true);

    // Check auth
    useEffect(() => {
        const checkAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        checkAuth();
    }, []);

    // Fetch public rooms
    const fetchRooms = async () => {
        try {
            setIsLoading(true);
            const res = await fetch("/api/game/rooms");
            const data = await res.json();
            if (data.success) {
                setPublicRooms(data.rooms || []);
            }
        } catch (err) {
            console.error("Error fetching rooms:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRooms();
        const interval = setInterval(fetchRooms, 10000);
        return () => clearInterval(interval);
    }, []);

    // Join room by code
    const handleJoinByCode = async () => {
        if (!joinCode.trim() || joinCode.length !== 6) {
            setError("أدخل كود مكون من 6 أحرف");
            return;
        }

        if (!user) {
            router.push("/login");
            return;
        }

        setIsJoining(true);
        setError("");

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(`/api/game/rooms/${joinCode.toUpperCase()}/join`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${session?.access_token}`,
                    "Content-Type": "application/json",
                },
            });

            const data = await res.json();
            if (data.success) {
                router.push(`/game/room/${joinCode.toUpperCase()}`);
            } else {
                setError(data.error || "خطأ في الانضمام");
            }
        } catch (err) {
            setError("خطأ في الاتصال");
        } finally {
            setIsJoining(false);
        }
    };

    // Quick join public room
    const handleQuickJoin = async (code: string) => {
        if (!user) {
            router.push("/login");
            return;
        }

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(`/api/game/rooms/${code}/join`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${session?.access_token}`,
                },
            });

            const data = await res.json();
            if (data.success) {
                router.push(`/game/room/${code}`);
            }
        } catch (err) {
            console.error("Error joining room:", err);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a1a] relative overflow-hidden" dir="rtl">
            {/* Animated Background */}
            <div className="fixed inset-0 pointer-events-none">
                {/* Grid Pattern */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzFhMWEzYSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />

                {/* Glowing Orbs */}
                <div className="absolute top-20 left-20 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-orange-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px]" />

                {/* Floating Particles - Using fixed positions to avoid hydration mismatch */}
                {[
                    { left: 5, top: 10, duration: 3.2, delay: 0.5 },
                    { left: 15, top: 25, duration: 4.1, delay: 1.2 },
                    { left: 25, top: 5, duration: 3.8, delay: 0.3 },
                    { left: 35, top: 45, duration: 4.5, delay: 1.8 },
                    { left: 45, top: 15, duration: 3.4, delay: 0.7 },
                    { left: 55, top: 65, duration: 4.2, delay: 1.5 },
                    { left: 65, top: 35, duration: 3.6, delay: 0.9 },
                    { left: 75, top: 85, duration: 4.8, delay: 1.1 },
                    { left: 85, top: 55, duration: 3.3, delay: 1.6 },
                    { left: 95, top: 20, duration: 4.4, delay: 0.4 },
                    { left: 10, top: 70, duration: 3.9, delay: 1.3 },
                    { left: 20, top: 90, duration: 4.0, delay: 0.6 },
                    { left: 30, top: 60, duration: 3.5, delay: 1.9 },
                    { left: 40, top: 30, duration: 4.3, delay: 0.8 },
                    { left: 50, top: 80, duration: 3.7, delay: 1.4 },
                    { left: 60, top: 50, duration: 4.6, delay: 0.2 },
                    { left: 70, top: 75, duration: 3.1, delay: 1.7 },
                    { left: 80, top: 40, duration: 4.7, delay: 1.0 },
                    { left: 90, top: 95, duration: 3.0, delay: 0.1 },
                    { left: 12, top: 42, duration: 4.9, delay: 2.0 },
                ].map((particle, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-white/30 rounded-full"
                        style={{
                            left: `${particle.left}%`,
                            top: `${particle.top}%`,
                        }}
                        animate={{
                            y: [0, -30, 0],
                            opacity: [0.3, 0.8, 0.3],
                        }}
                        transition={{
                            duration: particle.duration,
                            repeat: Infinity,
                            delay: particle.delay,
                        }}
                    />
                ))}
            </div>

            {/* Top Bar */}
            <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/30 backdrop-blur-xl">
                <div className="flex items-center gap-4">
                    <motion.div
                        whileHover={{ rotate: 15 }}
                        className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 flex items-center justify-center shadow-lg shadow-orange-500/30"
                    >
                        <Swords className="h-6 w-6 text-white" />
                    </motion.div>
                    <div>
                        <h1 className="text-xl font-black text-white tracking-tight">QUIZ BATTLE</h1>
                        <p className="text-xs text-gray-500">تحدى • تنافس • انتصر</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setSoundOn(!soundOn)}
                        className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-all"
                    >
                        {soundOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                    </button>

                    {user && (
                        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                                {user.user_metadata?.name?.charAt(0) || user.email?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <span className="text-white font-medium text-sm hidden sm:block">
                                {user.user_metadata?.name || user.email?.split('@')[0]}
                            </span>
                        </div>
                    )}

                    <Link
                        href="/"
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-all"
                    >
                        <LogOut className="h-4 w-4" />
                        <span className="hidden sm:block text-sm">خروج</span>
                    </Link>
                </div>
            </header>

            <main className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <motion.div
                        initial={{ scale: 0.5, rotate: -10 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 200 }}
                        className="relative w-32 h-32 mx-auto mb-6"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 rounded-3xl blur-xl opacity-50 animate-pulse" />
                        <div className="relative w-full h-full rounded-3xl bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 flex items-center justify-center shadow-2xl">
                            <Swords className="h-16 w-16 text-white drop-shadow-lg" />
                        </div>
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            className="absolute -inset-4 border-2 border-dashed border-orange-500/30 rounded-full"
                        />
                    </motion.div>

                    <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 mb-4">
                        QUIZ BATTLE
                    </h1>
                    <p className="text-gray-400 text-lg max-w-xl mx-auto">
                        ادخل عالم التحدي! تنافس مع أصدقائك واثبت أنك الأفضل
                    </p>

                    {/* Animated Stats */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center justify-center gap-8 mt-8"
                    >
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-2 text-amber-400">
                                <Flame className="h-5 w-5" />
                                <span className="text-3xl font-black">1,234</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">مباراة اليوم</p>
                        </div>
                        <div className="w-px h-12 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-2 text-green-400">
                                <Users className="h-5 w-5" />
                                <span className="text-3xl font-black">{publicRooms.length}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">غرفة متاحة</p>
                        </div>
                        <div className="w-px h-12 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-2 text-purple-400">
                                <Sparkles className="h-5 w-5" />
                                <span className="text-3xl font-black">56</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">لاعب الآن</p>
                        </div>
                    </motion.div>
                </motion.div>

                {/* Action Cards */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="grid md:grid-cols-2 gap-6 mb-10"
                >
                    {/* Create Room Card */}
                    <Link href="/game/create">
                        <motion.div
                            whileHover={{ scale: 1.02, y: -4 }}
                            whileTap={{ scale: 0.98 }}
                            className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-orange-600 via-red-600 to-pink-600 shadow-2xl shadow-orange-500/25 cursor-pointer group h-full"
                        >
                            {/* Animated Shine Effect */}
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                                animate={{ x: ['-200%', '200%'] }}
                                transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                            />

                            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMyIgZmlsbD0id2hpdGUiIGZpbGwtb3BhY2l0eT0iMC4xIi8+PC9zdmc+')] opacity-50" />

                            <div className="relative flex items-center gap-4">
                                <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-sm group-hover:scale-110 transition-transform">
                                    <Plus className="h-8 w-8 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-2xl font-black text-white mb-1">إنشاء غرفة</h3>
                                    <p className="text-white/80 text-sm">أنشئ غرفتك وادعُ أصدقاءك للتحدي</p>
                                </div>
                                <ArrowRight className="h-6 w-6 text-white/60 group-hover:translate-x-2 transition-transform" />
                            </div>
                        </motion.div>
                    </Link>

                    {/* Join by Code Card */}
                    <motion.div
                        whileHover={{ scale: 1.02, y: -4 }}
                        className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-indigo-500/30 backdrop-blur-xl"
                    >
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMyIgZmlsbD0id2hpdGUiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] opacity-50" />

                        <div className="relative">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-4 rounded-2xl bg-indigo-500/20">
                                    <UserPlus className="h-8 w-8 text-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white mb-1">انضم بالكود</h3>
                                    <p className="text-gray-400 text-sm">أدخل كود الغرفة للانضمام</p>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={joinCode}
                                    onChange={(e) => {
                                        setJoinCode(e.target.value.toUpperCase().slice(0, 6));
                                        setError("");
                                    }}
                                    placeholder="XXXXXX"
                                    className="flex-1 px-4 py-3.5 rounded-xl bg-black/50 border border-indigo-500/30 text-white text-center font-mono text-xl uppercase tracking-[0.3em] placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    maxLength={6}
                                />
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleJoinByCode}
                                    disabled={isJoining || joinCode.length !== 6}
                                    className="px-6 py-3.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-indigo-500/30"
                                >
                                    {isJoining ? <Loader2 className="h-5 w-5 animate-spin" /> : "انضم"}
                                </motion.button>
                            </div>
                            {error && <p className="text-red-400 text-sm mt-2 text-center">{error}</p>}
                        </div>
                    </motion.div>
                </motion.div>

                {/* Public Rooms Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-black text-white flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-500/20">
                                <Gamepad2 className="h-5 w-5 text-green-400" />
                            </div>
                            الغرف المتاحة
                        </h2>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={fetchRooms}
                            disabled={isLoading}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10 transition-all"
                        >
                            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                            تحديث
                        </motion.button>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="relative">
                                <div className="w-16 h-16 border-4 border-purple-500/30 rounded-full" />
                                <div className="absolute top-0 left-0 w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        </div>
                    ) : publicRooms.length === 0 ? (
                        <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
                            <div className="relative w-20 h-20 mx-auto mb-6">
                                <div className="absolute inset-0 bg-gray-500/20 rounded-full blur-xl" />
                                <div className="relative w-full h-full rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                                    <Users className="h-10 w-10 text-gray-500" />
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">لا توجد غرف متاحة</h3>
                            <p className="text-gray-500 mb-6">كن أول من ينشئ غرفة!</p>
                            <Link
                                href="/game/create"
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold shadow-lg shadow-orange-500/30"
                            >
                                <Plus className="h-5 w-5" />
                                إنشاء غرفة
                            </Link>
                        </div>
                    ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <AnimatePresence>
                                {publicRooms.map((room, index) => (
                                    <motion.div
                                        key={room.code}
                                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ delay: index * 0.05 }}
                                        whileHover={{ y: -4, scale: 1.02 }}
                                        className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 hover:border-white/30 transition-all"
                                    >
                                        {/* Glow effect on hover */}
                                        <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br ${room.gameMode === 'ffa' ? 'from-orange-500/10 to-transparent' : 'from-indigo-500/10 to-transparent'
                                            }`} />

                                        <div className="relative p-5">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <h3 className="font-bold text-white text-lg">{room.name}</h3>
                                                    <p className="font-mono text-xs text-gray-500 tracking-widest">{room.code}</p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-lg text-xs font-bold ${room.gameMode === 'ffa'
                                                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                                    : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                                                    }`}>
                                                    {room.gameMode === 'ffa' ? 'FFA' : 'TEAMS'}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-4 mb-4 text-sm text-gray-400">
                                                <span className="flex items-center gap-1.5">
                                                    <Users className="h-4 w-4" />
                                                    <span className="font-mono">{room.currentPlayers}/{room.maxPlayers}</span>
                                                </span>
                                                <span className={`flex items-center gap-1.5 ${room.status === 'waiting' ? 'text-green-400' : 'text-yellow-400'
                                                    }`}>
                                                    <div className={`w-2 h-2 rounded-full animate-pulse ${room.status === 'waiting' ? 'bg-green-400' : 'bg-yellow-400'
                                                        }`} />
                                                    {room.status === 'waiting' ? 'متاحة' : 'جارية'}
                                                </span>
                                            </div>

                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => handleQuickJoin(room.code)}
                                                disabled={room.status !== 'waiting' || room.currentPlayers >= room.maxPlayers}
                                                className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all border border-white/10 hover:border-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                انضم الآن
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </motion.div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 mt-16 py-6 border-t border-white/10 bg-black/30 backdrop-blur-xl">
                <div className="container mx-auto px-4 flex items-center justify-center gap-4 text-sm text-gray-500">
                    <span>Quiz Battle</span>
                    <span>•</span>
                    <span>v1.0</span>
                </div>
            </footer>
        </div>
    );
}
