// =============================================
// GameHeader Component - هيدر اللعبة
// =============================================

'use client';

import { memo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Swords, ArrowLeft, LogOut, Volume2, VolumeX } from 'lucide-react';

interface GameHeaderProps {
    title?: string;
    subtitle?: string;
    showBack?: boolean;
    backHref?: string;
    backLabel?: string;
    showLogout?: boolean;
    showSound?: boolean;
    soundOn?: boolean;
    onSoundToggle?: () => void;
    onLeave?: () => void;
    userName?: string;
    userInitial?: string;
}

function GameHeaderComponent({
    title = 'QUIZ BATTLE',
    subtitle,
    showBack = false,
    backHref = '/game',
    backLabel = 'العودة',
    showLogout = false,
    showSound = false,
    soundOn = true,
    onSoundToggle,
    onLeave,
    userName,
    userInitial,
}: GameHeaderProps) {
    return (
        <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/30 backdrop-blur-xl">
            <div className="flex items-center gap-4">
                <motion.div
                    whileHover={{ rotate: 15 }}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 flex items-center justify-center shadow-lg shadow-orange-500/30"
                >
                    <Swords className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </motion.div>
                <div>
                    <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">{title}</h1>
                    {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
                </div>
            </div>

            <div className="flex items-center gap-3">
                {showSound && (
                    <button
                        onClick={onSoundToggle}
                        className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-all"
                    >
                        {soundOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                    </button>
                )}

                {userName && (
                    <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                            {userInitial || userName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-white font-medium text-sm hidden sm:block">
                            {userName}
                        </span>
                    </div>
                )}

                {showBack && (
                    <Link
                        href={backHref}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span className="hidden sm:block">{backLabel}</span>
                    </Link>
                )}

                {showLogout && (
                    <Link
                        href="/"
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-all"
                    >
                        <LogOut className="h-4 w-4" />
                        <span className="hidden sm:block text-sm">خروج</span>
                    </Link>
                )}

                {onLeave && (
                    <button
                        onClick={onLeave}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        مغادرة
                    </button>
                )}
            </div>
        </header>
    );
}

export const GameHeader = memo(GameHeaderComponent);
