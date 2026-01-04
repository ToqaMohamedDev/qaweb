// =============================================
// PlayerAvatar Component - صورة اللاعب
// =============================================

'use client';

import { memo, useState, useCallback } from 'react';
import { Crown, Flame } from 'lucide-react';
import { motion } from 'framer-motion';

interface PlayerAvatarProps {
    name: string;
    avatar?: string;
    team?: 'A' | 'B' | null;
    isCaptain?: boolean;
    isCreator?: boolean;
    hasStreak?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

const SIZE_CLASSES = {
    sm: { container: 'w-10 h-10', text: 'text-sm' },
    md: { container: 'w-12 h-12 sm:w-14 sm:h-14', text: 'text-lg' },
    lg: { container: 'w-16 h-16', text: 'text-xl' },
};

const TEAM_COLORS = {
    A: 'from-blue-500 to-cyan-500',
    B: 'from-red-500 to-pink-500',
    null: 'from-indigo-500 to-purple-500',
};

function PlayerAvatarComponent({
    name,
    avatar,
    team = null,
    isCaptain = false,
    isCreator = false,
    hasStreak = false,
    size = 'md',
}: PlayerAvatarProps) {
    const [imageError, setImageError] = useState(false);

    const handleImageError = useCallback(() => {
        console.warn('PlayerAvatar: Image failed to load:', avatar);
        setImageError(true);
    }, [avatar]);

    const { container, text } = SIZE_CLASSES[size];
    const teamColor = TEAM_COLORS[team ?? 'null'];
    const hasValidImage = avatar && !imageError;

    return (
        <div className="relative">
            <div
                className={`${container} bg-gradient-to-br ${teamColor} rounded-xl flex items-center justify-center text-white font-black shadow-lg overflow-hidden`}
            >
                {hasValidImage ? (
                    <img
                        src={avatar}
                        alt={name}
                        className="w-full h-full rounded-xl object-cover"
                        onError={handleImageError}
                        referrerPolicy="no-referrer"
                    />
                ) : (
                    <span className={text}>{name.charAt(0).toUpperCase()}</span>
                )}
            </div>

            {/* Creator/Captain Badge */}
            {(isCreator || isCaptain) && (
                <div className="absolute -top-2 -right-2 p-1 sm:p-1.5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg">
                    <Crown className="h-3 w-3 text-white" />
                </div>
            )}

            {/* Streak Badge */}
            {hasStreak && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 p-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500"
                >
                    <Flame className="h-3 w-3 text-white" />
                </motion.div>
            )}
        </div>
    );
}

export const PlayerAvatar = memo(PlayerAvatarComponent);

