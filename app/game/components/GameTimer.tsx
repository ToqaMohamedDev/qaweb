/**
 * Game Timer Component
 * Enhanced visual countdown timer with exciting effects
 */

'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface GameTimerProps {
    remainingMs: number;
    totalMs: number;
    onTimeUp?: () => void;
    isPaused?: boolean;
    showWarning?: boolean;
    warningThreshold?: number;
    size?: 'small' | 'medium' | 'large';
}

export function GameTimer({
    remainingMs,
    totalMs,
    onTimeUp,
    isPaused = false,
    showWarning = true,
    warningThreshold = 5000,
    size = 'large',
}: GameTimerProps) {
    const [displayTime, setDisplayTime] = useState(remainingMs);
    const lastUpdateRef = useRef(Date.now());
    const animationRef = useRef<number | null>(null);

    // Sync with server time
    useEffect(() => {
        setDisplayTime(remainingMs);
        lastUpdateRef.current = Date.now();
    }, [remainingMs]);

    // Local countdown animation
    useEffect(() => {
        if (isPaused) return;

        const animate = () => {
            const elapsed = Date.now() - lastUpdateRef.current;
            const newTime = Math.max(0, remainingMs - elapsed);
            setDisplayTime(newTime);

            if (newTime > 0) {
                animationRef.current = requestAnimationFrame(animate);
            } else {
                onTimeUp?.();
            }
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [remainingMs, isPaused, onTimeUp]);

    const seconds = Math.ceil(displayTime / 1000);
    const progress = displayTime / totalMs;
    const isWarning = showWarning && displayTime <= warningThreshold && displayTime > 0;
    const isCritical = displayTime <= 3000 && displayTime > 0;
    const isUrgent = displayTime <= 1000 && displayTime > 0;

    // Size configurations
    const sizes = {
        small: { width: 80, strokeWidth: 6, fontSize: 'text-2xl', radius: 32 },
        medium: { width: 120, strokeWidth: 8, fontSize: 'text-4xl', radius: 48 },
        large: { width: 160, strokeWidth: 10, fontSize: 'text-6xl', radius: 64 },
    };

    const config = sizes[size];
    const circumference = 2 * Math.PI * config.radius;
    const strokeDashoffset = circumference * (1 - progress);

    // Dynamic colors based on time
    const getColors = () => {
        if (isCritical) return { stroke: '#EF4444', glow: 'rgba(239, 68, 68, 0.5)', text: 'text-red-400' };
        if (isWarning) return { stroke: '#F59E0B', glow: 'rgba(245, 158, 11, 0.4)', text: 'text-amber-400' };
        return { stroke: '#6366F1', glow: 'rgba(99, 102, 241, 0.3)', text: 'text-white' };
    };

    const colors = getColors();

    return (
        <div className="relative flex flex-col items-center justify-center">
            {/* Timer Label */}
            <div className="mb-2 flex items-center gap-2">
                <span className="text-2xl">⏱️</span>
                <span className="text-white/60 font-medium">الوقت المتبقي</span>
            </div>

            <div className="relative" style={{ width: config.width, height: config.width }}>
                {/* Outer glow effect */}
                <motion.div
                    className="absolute inset-0 rounded-full"
                    animate={{
                        boxShadow: isWarning
                            ? [
                                `0 0 20px ${colors.glow}`,
                                `0 0 50px ${colors.glow}`,
                                `0 0 20px ${colors.glow}`,
                            ]
                            : `0 0 30px ${colors.glow}`,
                    }}
                    transition={{
                        duration: isCritical ? 0.3 : 0.8,
                        repeat: isWarning ? Infinity : 0,
                    }}
                />

                {/* Background gradient circle */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-white/10" />

                {/* SVG Timer */}
                <svg
                    width={config.width}
                    height={config.width}
                    viewBox={`0 0 ${config.width} ${config.width}`}
                    className="transform -rotate-90"
                >
                    {/* Track circle */}
                    <circle
                        cx={config.width / 2}
                        cy={config.width / 2}
                        r={config.radius}
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.1)"
                        strokeWidth={config.strokeWidth}
                    />

                    {/* Progress circle */}
                    <motion.circle
                        cx={config.width / 2}
                        cy={config.width / 2}
                        r={config.radius}
                        fill="none"
                        stroke={colors.stroke}
                        strokeWidth={config.strokeWidth}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        style={{
                            transition: 'stroke-dashoffset 0.1s linear',
                            filter: `drop-shadow(0 0 8px ${colors.glow})`,
                        }}
                    />
                </svg>

                {/* Timer text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={seconds}
                            initial={{ scale: 1.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="text-center"
                        >
                            {isPaused ? (
                                <span className="text-4xl">⏸️</span>
                            ) : (
                                <>
                                    <span className={`${config.fontSize} font-bold ${colors.text}`}>
                                        {seconds}
                                    </span>
                                    <span className="block text-sm text-white/40 mt-1">ثانية</span>
                                </>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Pulse effect on warning */}
                {isWarning && (
                    <motion.div
                        className="absolute inset-0 rounded-full"
                        style={{ border: `2px solid ${colors.stroke}` }}
                        animate={{
                            scale: [1, 1.15],
                            opacity: [0.6, 0],
                        }}
                        transition={{
                            duration: isCritical ? 0.4 : 0.6,
                            repeat: Infinity,
                        }}
                    />
                )}

                {/* Shake effect when urgent */}
                {isUrgent && (
                    <motion.div
                        className="absolute inset-0"
                        animate={{ x: [-2, 2, -2, 2, 0] }}
                        transition={{ duration: 0.3, repeat: Infinity }}
                    />
                )}
            </div>
        </div>
    );
}

/**
 * Timer Bar - Enhanced horizontal progress bar
 */
interface TimerBarProps {
    remainingMs: number;
    totalMs: number;
    isPaused?: boolean;
    showLabel?: boolean;
}

export function TimerBar({
    remainingMs,
    totalMs,
    isPaused = false,
    showLabel = true,
}: TimerBarProps) {
    const [displayTime, setDisplayTime] = useState(remainingMs);
    const lastUpdateRef = useRef(Date.now());
    const animationRef = useRef<number | null>(null);

    useEffect(() => {
        setDisplayTime(remainingMs);
        lastUpdateRef.current = Date.now();
    }, [remainingMs]);

    useEffect(() => {
        if (isPaused) return;

        const animate = () => {
            const elapsed = Date.now() - lastUpdateRef.current;
            const newTime = Math.max(0, remainingMs - elapsed);
            setDisplayTime(newTime);

            if (newTime > 0) {
                animationRef.current = requestAnimationFrame(animate);
            }
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [remainingMs, isPaused]);

    const seconds = Math.ceil(displayTime / 1000);
    const progress = (displayTime / totalMs) * 100;
    const isWarning = displayTime <= 5000 && displayTime > 0;
    const isCritical = displayTime <= 3000 && displayTime > 0;

    const getGradient = () => {
        if (isCritical) return 'from-red-500 to-rose-600';
        if (isWarning) return 'from-amber-500 to-orange-600';
        return 'from-indigo-500 to-purple-600';
    };

    return (
        <div className="w-full space-y-2">
            {showLabel && (
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                        <span>⏱️</span>
                        <span className="text-white/60">الوقت</span>
                    </div>
                    <motion.span
                        key={seconds}
                        initial={{ scale: 1.2 }}
                        animate={{ scale: 1 }}
                        className={`font-bold ${isCritical ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-white'}`}
                    >
                        {seconds} ثانية
                    </motion.span>
                </div>
            )}

            <div className="relative h-3 rounded-full overflow-hidden bg-white/10">
                {/* Animated background */}
                <motion.div
                    className={`h-full rounded-full bg-gradient-to-r ${getGradient()}`}
                    style={{ width: `${progress}%` }}
                    animate={isWarning ? { opacity: [1, 0.7, 1] } : {}}
                    transition={{ duration: 0.4, repeat: Infinity }}
                />

                {/* Glow effect */}
                <motion.div
                    className="absolute top-0 h-full rounded-full"
                    style={{
                        width: `${progress}%`,
                        boxShadow: isCritical
                            ? '0 0 20px rgba(239, 68, 68, 0.5)'
                            : isWarning
                                ? '0 0 15px rgba(245, 158, 11, 0.4)'
                                : '0 0 10px rgba(99, 102, 241, 0.3)'
                    }}
                />
            </div>
        </div>
    );
}

/**
 * Compact Timer for header
 */
export function CompactTimer({
    remainingMs,
    totalMs,
    isPaused = false,
}: TimerBarProps) {
    const [displayTime, setDisplayTime] = useState(remainingMs);
    const lastUpdateRef = useRef(Date.now());
    const animationRef = useRef<number | null>(null);

    useEffect(() => {
        setDisplayTime(remainingMs);
        lastUpdateRef.current = Date.now();
    }, [remainingMs]);

    useEffect(() => {
        if (isPaused) return;

        const animate = () => {
            const elapsed = Date.now() - lastUpdateRef.current;
            const newTime = Math.max(0, remainingMs - elapsed);
            setDisplayTime(newTime);

            if (newTime > 0) {
                animationRef.current = requestAnimationFrame(animate);
            }
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [remainingMs, isPaused]);

    const seconds = Math.ceil(displayTime / 1000);
    const isWarning = displayTime <= 5000 && displayTime > 0;
    const isCritical = displayTime <= 3000 && displayTime > 0;

    return (
        <motion.div
            className={`
                px-4 py-2 rounded-xl font-bold text-lg flex items-center gap-2
                ${isCritical
                    ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                    : isWarning
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                        : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/50'
                }
            `}
            animate={isWarning ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 0.5, repeat: Infinity }}
        >
            <span>⏱️</span>
            <span>{isPaused ? '⏸️' : `${seconds}s`}</span>
        </motion.div>
    );
}
