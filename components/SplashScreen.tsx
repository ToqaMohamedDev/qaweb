'use client';

// =============================================
// Splash Screen - شاشة التحميل الرئيسية
// =============================================

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashScreenProps {
    onComplete: () => void;
    minDuration?: number; // مدة العرض الأدنى بالملي ثانية
}

export function SplashScreen({ onComplete, minDuration = 3000 }: SplashScreenProps) {
    const [progress, setProgress] = useState(0);
    const [loadingText, setLoadingText] = useState('جاري التحميل');

    useEffect(() => {
        const loadingMessages = [
            'جاري التحميل',
            'تحضير المحتوى',
            'جاري الاتصال',
            'تجهيز الواجهة',
        ];

        let messageIndex = 0;
        const messageInterval = setInterval(() => {
            messageIndex = (messageIndex + 1) % loadingMessages.length;
            setLoadingText(loadingMessages[messageIndex]);
        }, 500);

        // Progress animation
        const progressInterval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(progressInterval);
                    return 100;
                }
                return prev + Math.random() * 15;
            });
        }, 200);

        // Complete after minimum duration
        const timer = setTimeout(() => {
            setProgress(100);
            setTimeout(onComplete, 500);
        }, minDuration);

        return () => {
            clearInterval(messageInterval);
            clearInterval(progressInterval);
            clearTimeout(timer);
        };
    }, [onComplete, minDuration]);

    return (
        <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-[#0d0d14] via-[#13131a] to-[#1a1a24]"
        >
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-[100px]"
                />
                <motion.div
                    animate={{
                        scale: [1.2, 1, 1.2],
                        opacity: [0.2, 0.4, 0.2],
                    }}
                    transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
                    className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-500/20 rounded-full blur-[80px]"
                />
            </div>

            <div className="relative flex flex-col items-center gap-8" dir="rtl">
                {/* Logo / Brand */}
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, type: 'spring' }}
                    className="relative"
                >
                    {/* Main Logo Circle */}
                    <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-primary-500 via-primary-600 to-pink-500 p-1 shadow-2xl shadow-primary-500/30">
                        <div className="w-full h-full rounded-[22px] bg-[#1a1a24] flex items-center justify-center">
                            <motion.span
                                animate={{
                                    rotateY: [0, 360],
                                }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                className="text-5xl"
                            >
                                🎯
                            </motion.span>
                        </div>
                    </div>

                    {/* Rotating Ring */}
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                        className="absolute -inset-3 rounded-[32px] border-2 border-dashed border-primary-500/30"
                    />
                </motion.div>

                {/* Brand Name */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-center"
                >
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-400 via-pink-400 to-primary-400 bg-clip-text text-transparent">
                        منصة كويز
                    </h1>
                    <p className="text-gray-400 text-sm mt-2">تعلّم بذكاء، نجح بتميّز</p>
                </motion.div>

                {/* Progress Bar */}
                <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 200, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="relative"
                >
                    <div className="w-[200px] h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(progress, 100)}%` }}
                            transition={{ duration: 0.3 }}
                            className="h-full bg-gradient-to-r from-primary-500 to-pink-500 rounded-full"
                        />
                    </div>
                    <p className="text-center text-gray-500 text-xs mt-3">
                        {loadingText}
                        <motion.span
                            animate={{ opacity: [1, 0, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                        >
                            ...
                        </motion.span>
                    </p>
                </motion.div>

                {/* Loading Dots */}
                <div className="flex gap-2">
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            animate={{
                                y: [-3, 3, -3],
                                opacity: [0.5, 1, 0.5],
                            }}
                            transition={{
                                duration: 0.6,
                                repeat: Infinity,
                                delay: i * 0.1,
                            }}
                            className="w-2 h-2 rounded-full bg-primary-500"
                        />
                    ))}
                </div>
            </div>
        </motion.div>
    );
}

// Wrapper Component
export function SplashScreenWrapper({ children }: { children: React.ReactNode }) {
    const [showSplash, setShowSplash] = useState(true);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        // Splash screen will show on every page load/refresh
    }, []);

    const handleComplete = () => {
        setShowSplash(false);
    };

    // Don't render splash on server
    if (!isClient) {
        return <>{children}</>;
    }

    return (
        <>
            <AnimatePresence mode="wait">
                {showSplash && (
                    <SplashScreen onComplete={handleComplete} minDuration={1000} />
                )}
            </AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: showSplash ? 0 : 1 }}
                transition={{ duration: 0.3 }}
            >
                {children}
            </motion.div>
        </>
    );
}
