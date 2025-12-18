"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
    Swords,
    Users,
    ArrowLeft,
    Lock,
    Unlock,
    Timer,
    Loader2,
    Zap,
    Crown,
    Plus,
    Settings,
    HelpCircle,
    Sparkles,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { CreateRoomRequest, GameMode, Difficulty } from "@/lib/game/types";

const gameModes = [
    {
        id: 'ffa' as GameMode,
        name: 'Free For All',
        nameAr: 'كل واحد لنفسه',
        description: 'تنافس ضد الجميع! أول من يجاوب صح يفوز',
        icon: Zap,
        color: 'from-orange-500 to-red-500',
        borderColor: 'border-orange-500',
        bgGlow: 'shadow-orange-500/30',
        maxPlayers: 5,
    },
    {
        id: 'team' as GameMode,
        name: 'Team Battle',
        nameAr: 'فريق ضد فريق',
        description: 'انضم لفريق وتعاون مع زملائك! القائد يجاوب',
        icon: Crown,
        color: 'from-indigo-500 to-purple-500',
        borderColor: 'border-indigo-500',
        bgGlow: 'shadow-indigo-500/30',
        maxPlayers: 10,
    },
];

const difficulties: { id: Difficulty; name: string; color: string }[] = [
    { id: 'easy', name: 'سهل', color: 'from-green-500 to-emerald-500' },
    { id: 'medium', name: 'متوسط', color: 'from-yellow-500 to-orange-500' },
    { id: 'hard', name: 'صعب', color: 'from-red-500 to-pink-500' },
    { id: 'mixed', name: 'مختلط', color: 'from-purple-500 to-indigo-500' },
];

export default function CreateRoomPage() {
    const router = useRouter();
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState("");

    const [config, setConfig] = useState<CreateRoomRequest>({
        name: "",
        gameMode: "ffa",
        isPrivate: false,
        password: "",
        questionCount: 10,
        timePerQuestion: 15,
        difficulty: "mixed",
        category: "general",
    });

    const selectedMode = gameModes.find(m => m.id === config.gameMode)!;

    const handleCreate = async () => {
        if (!config.name.trim()) {
            setError("أدخل اسم الغرفة");
            return;
        }

        if (config.isPrivate && !config.password?.trim()) {
            setError("أدخل كلمة المرور للغرفة السرية");
            return;
        }

        setIsCreating(true);
        setError("");

        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                router.push("/login");
                return;
            }

            const res = await fetch("/api/game/rooms", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${session.access_token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(config),
            });

            const data = await res.json();

            if (data.success) {
                router.push(`/game/room/${data.room.code}`);
            } else {
                setError(data.error || "خطأ في إنشاء الغرفة");
            }
        } catch (err) {
            setError("خطأ في الاتصال");
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a1a] relative overflow-hidden" dir="rtl">
            {/* Animated Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzFhMWEzYSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
                <div className="absolute top-20 right-20 w-96 h-96 bg-orange-600/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-20 left-20 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px]" />
            </div>

            {/* Top Bar */}
            <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/30 backdrop-blur-xl">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center">
                        <Swords className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-lg font-black text-white">QUIZ BATTLE</span>
                </div>
                <Link
                    href="/game"
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    العودة
                </Link>
            </header>

            <main className="relative z-10 container mx-auto px-4 py-8 max-w-2xl">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-10"
                >
                    <motion.div
                        initial={{ scale: 0.5 }}
                        animate={{ scale: 1 }}
                        className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-orange-500/30"
                    >
                        <Plus className="h-10 w-10 text-white" />
                    </motion.div>
                    <h1 className="text-3xl font-black text-white mb-2">إنشاء غرفة جديدة</h1>
                    <p className="text-gray-500">اختر إعداداتك وابدأ المعركة!</p>
                </motion.div>

                {/* Form */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-6"
                >
                    {/* Room Name */}
                    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                        <label className="block text-white font-bold mb-3 flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-amber-400" />
                            اسم الغرفة
                        </label>
                        <input
                            type="text"
                            value={config.name}
                            onChange={(e) => setConfig({ ...config, name: e.target.value })}
                            placeholder="أدخل اسم مميز لغرفتك..."
                            className="w-full px-5 py-4 rounded-xl bg-black/50 border border-white/10 text-white text-lg placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                            maxLength={30}
                        />
                    </div>

                    {/* Game Mode */}
                    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                        <label className="block text-white font-bold mb-4 flex items-center gap-2">
                            <Settings className="h-4 w-4 text-purple-400" />
                            وضع اللعب
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            {gameModes.map((mode) => (
                                <motion.button
                                    key={mode.id}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setConfig({ ...config, gameMode: mode.id })}
                                    className={`relative overflow-hidden rounded-xl p-5 border-2 transition-all ${config.gameMode === mode.id
                                            ? `${mode.borderColor} shadow-lg ${mode.bgGlow}`
                                            : 'border-white/10 hover:border-white/30'
                                        }`}
                                >
                                    <div className={`absolute inset-0 bg-gradient-to-br ${mode.color} opacity-10`} />
                                    <div className="relative">
                                        <mode.icon className={`h-10 w-10 mb-3 ${config.gameMode === mode.id ? 'text-white' : 'text-gray-500'
                                            }`} />
                                        <h3 className="text-white font-black text-lg">{mode.nameAr}</h3>
                                        <p className="text-xs text-gray-400 mt-1 leading-relaxed">{mode.description}</p>
                                        <p className="text-xs text-gray-600 mt-3">👥 حتى {mode.maxPlayers} لاعبين</p>
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    {/* Privacy */}
                    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                        <label className="block text-white font-bold mb-4 flex items-center gap-2">
                            <Lock className="h-4 w-4 text-blue-400" />
                            الخصوصية
                        </label>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <button
                                onClick={() => setConfig({ ...config, isPrivate: false, password: "" })}
                                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${!config.isPrivate
                                        ? 'border-green-500 bg-green-500/10 shadow-lg shadow-green-500/20'
                                        : 'border-white/10 hover:border-white/30'
                                    }`}
                            >
                                <Unlock className={`h-6 w-6 ${!config.isPrivate ? 'text-green-400' : 'text-gray-500'}`} />
                                <div className="text-right">
                                    <p className="text-white font-bold">عامة</p>
                                    <p className="text-xs text-gray-500">يمكن للجميع الانضمام</p>
                                </div>
                            </button>
                            <button
                                onClick={() => setConfig({ ...config, isPrivate: true })}
                                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${config.isPrivate
                                        ? 'border-orange-500 bg-orange-500/10 shadow-lg shadow-orange-500/20'
                                        : 'border-white/10 hover:border-white/30'
                                    }`}
                            >
                                <Lock className={`h-6 w-6 ${config.isPrivate ? 'text-orange-400' : 'text-gray-500'}`} />
                                <div className="text-right">
                                    <p className="text-white font-bold">سرية</p>
                                    <p className="text-xs text-gray-500">تحتاج كلمة مرور</p>
                                </div>
                            </button>
                        </div>

                        {config.isPrivate && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                            >
                                <input
                                    type="text"
                                    value={config.password}
                                    onChange={(e) => setConfig({ ...config, password: e.target.value })}
                                    placeholder="أدخل كلمة المرور..."
                                    className="w-full px-5 py-4 rounded-xl bg-black/50 border border-orange-500/30 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                                    maxLength={20}
                                />
                            </motion.div>
                        )}
                    </div>

                    {/* Game Settings */}
                    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                        <label className="block text-white font-bold mb-4 flex items-center gap-2">
                            <Timer className="h-4 w-4 text-cyan-400" />
                            إعدادات اللعبة
                        </label>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-gray-400 text-sm mb-2">عدد الأسئلة</label>
                                <select
                                    value={config.questionCount}
                                    onChange={(e) => setConfig({ ...config, questionCount: Number(e.target.value) })}
                                    className="w-full px-4 py-3.5 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                                >
                                    <option value={5}>5 أسئلة</option>
                                    <option value={10}>10 أسئلة</option>
                                    <option value={15}>15 سؤال</option>
                                    <option value={20}>20 سؤال</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-gray-400 text-sm mb-2">الوقت لكل سؤال</label>
                                <select
                                    value={config.timePerQuestion}
                                    onChange={(e) => setConfig({ ...config, timePerQuestion: Number(e.target.value) })}
                                    className="w-full px-4 py-3.5 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                                >
                                    <option value={10}>10 ثواني ⚡</option>
                                    <option value={15}>15 ثانية</option>
                                    <option value={20}>20 ثانية</option>
                                    <option value={30}>30 ثانية 🐢</option>
                                </select>
                            </div>
                        </div>

                        {/* Difficulty */}
                        <div>
                            <label className="block text-gray-400 text-sm mb-3">الصعوبة</label>
                            <div className="flex gap-2">
                                {difficulties.map((diff) => (
                                    <motion.button
                                        key={diff.id}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setConfig({ ...config, difficulty: diff.id })}
                                        className={`flex-1 py-3 rounded-xl border-2 font-bold transition-all ${config.difficulty === diff.id
                                                ? `bg-gradient-to-r ${diff.color} border-transparent text-white shadow-lg`
                                                : 'border-white/10 text-gray-500 hover:border-white/30 hover:text-white'
                                            }`}
                                    >
                                        {diff.name}
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-center"
                        >
                            {error}
                        </motion.div>
                    )}

                    {/* Create Button */}
                    <motion.button
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleCreate}
                        disabled={isCreating}
                        className="w-full py-5 rounded-2xl bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white font-black text-xl shadow-2xl shadow-orange-500/30 hover:shadow-orange-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {isCreating ? (
                            <Loader2 className="h-7 w-7 animate-spin mx-auto" />
                        ) : (
                            <span className="flex items-center justify-center gap-3">
                                <Swords className="h-7 w-7" />
                                إنشاء الغرفة
                            </span>
                        )}
                    </motion.button>
                </motion.div>
            </main>
        </div>
    );
}
