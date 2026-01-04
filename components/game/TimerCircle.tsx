// =============================================
// TimerCircle Component - مؤقت دائري
// =============================================

'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';

interface TimerCircleProps {
    timeLeft: number;
    totalTime: number;
    size?: number;
    strokeWidth?: number;
}

function TimerCircleComponent({
    timeLeft,
    totalTime,
    size = 80,
    strokeWidth = 6,
}: TimerCircleProps) {
    const percentage = (timeLeft / totalTime) * 100;
    const radius = 35;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (circumference * percentage) / 100;

    const getColor = () => {
        if (timeLeft <= 5) return '#ef4444'; // red
        if (timeLeft <= 10) return '#f97316'; // orange
        return '#8b5cf6'; // purple
    };

    const getTextColorClass = () => {
        if (timeLeft <= 5) return 'text-red-500';
        if (timeLeft <= 10) return 'text-orange-500';
        return 'text-white';
    };

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg className="transform -rotate-90" width={size} height={size}>
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth={strokeWidth}
                    fill="none"
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={getColor()}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-300"
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <motion.span
                    key={timeLeft}
                    initial={{ scale: 1.3 }}
                    animate={{ scale: 1 }}
                    className={`text-2xl font-black ${getTextColorClass()}`}
                >
                    {timeLeft}
                </motion.span>
            </div>
        </div>
    );
}

export const TimerCircle = memo(TimerCircleComponent);
