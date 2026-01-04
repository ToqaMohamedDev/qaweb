// =============================================
// StreakBadge Component - شارة السلسلة
// =============================================

'use client';

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame } from 'lucide-react';

interface StreakBadgeProps {
    streak: number;
    show?: boolean;
}

function StreakBadgeComponent({ streak, show = true }: StreakBadgeProps) {
    if (streak < 2) return null;

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center justify-center gap-3 py-2 px-4 rounded-full bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 mx-auto"
                >
                    <Flame className="h-5 w-5 text-orange-400 animate-pulse" />
                    <span className="text-orange-400 font-black">سلسلة {streak}x 🔥</span>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export const StreakBadge = memo(StreakBadgeComponent);
