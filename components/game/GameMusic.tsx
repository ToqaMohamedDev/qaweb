// =============================================
// GameMusic Component - موسيقى خلفية اللعبة
// =============================================

'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { Volume2, VolumeX, Music2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface GameMusicProps {
    isPlaying: boolean;
    onToggle: () => void;
    volume?: number; // 0-1
    showVolumeControl?: boolean;
}

// رابط موسيقى مجانية للألعاب - من مصادر متعددة
// Using reliable CDN sources for game music
const MUSIC_URLS = [
    // Fesliyan Studios - Game Show Theme (Royalty Free)
    'https://www.fesliyanstudios.com/musicfiles/2019-04-23_-_Game_Show_Theme_-_David_Fesliyan.mp3',
    // Archive.org - Royalty Free Game Music
    'https://archive.org/download/8-bit-game-music/8bit-music.mp3',
    // SoundHelix - Sample Music (fallback)
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
];

export function GameMusic({
    isPlaying,
    onToggle,
    volume = 0.3,
    showVolumeControl = false
}: GameMusicProps) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [currentVolume, setCurrentVolume] = useState(volume);
    const [showVolume, setShowVolume] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const urlIndexRef = useRef(0);

    // Initialize audio
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const audio = new Audio();
        audio.loop = true;
        audio.volume = currentVolume;
        audio.preload = 'auto';

        audio.addEventListener('canplaythrough', () => {
            setIsLoaded(true);
            setHasError(false);
        });

        audio.addEventListener('error', () => {
            // Try next URL in the list
            urlIndexRef.current++;
            if (urlIndexRef.current < MUSIC_URLS.length) {
                audio.src = MUSIC_URLS[urlIndexRef.current];
                audio.load();
            } else {
                setHasError(true);
            }
        });

        // Start with first URL
        audio.src = MUSIC_URLS[0];
        audioRef.current = audio;

        return () => {
            audio.pause();
            audio.src = '';
        };
    }, []);

    // Handle play/pause
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying && isLoaded) {
            audio.play().catch(() => {
                // Auto-play was blocked, user needs to interact first
            });
        } else {
            audio.pause();
        }
    }, [isPlaying, isLoaded]);

    // Handle volume change
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = currentVolume;
        }
    }, [currentVolume]);

    const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        setCurrentVolume(newVolume);
    }, []);

    if (hasError) {
        return null; // Don't show button if audio failed to load
    }

    return (
        <div className="fixed bottom-6 left-6 z-50">
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={onToggle}
                onMouseEnter={() => showVolumeControl && setShowVolume(true)}
                onMouseLeave={() => setShowVolume(false)}
                className={`relative p-3.5 rounded-2xl border-2 shadow-2xl backdrop-blur-xl transition-all ${isPlaying
                    ? 'bg-gradient-to-br from-purple-500/30 to-pink-500/30 border-purple-500/60 text-purple-300 hover:from-purple-500/40 hover:to-pink-500/40 shadow-purple-500/20'
                    : 'bg-black/60 border-white/20 text-gray-400 hover:text-white hover:bg-black/80 hover:border-white/40'
                    }`}
            >
                {isPlaying ? (
                    <>
                        <Volume2 className="h-6 w-6" />
                        {/* Animated music waves */}
                        <motion.div
                            className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-purple-500"
                            animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                        />
                        {/* Sound waves animation */}
                        <motion.div
                            className="absolute inset-0 rounded-2xl border-2 border-purple-500/50"
                            animate={{ scale: [1, 1.2], opacity: [0.5, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        />
                    </>
                ) : (
                    <VolumeX className="h-6 w-6" />
                )}
            </motion.button>

            {/* Volume Slider (optional) */}
            <AnimatePresence>
                {showVolumeControl && showVolume && (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="absolute bottom-0 left-full ml-3 p-4 rounded-2xl bg-black/90 border border-white/10 backdrop-blur-xl shadow-2xl"
                        onMouseEnter={() => setShowVolume(true)}
                        onMouseLeave={() => setShowVolume(false)}
                    >
                        <div className="flex items-center gap-3">
                            <Music2 className="h-4 w-4 text-purple-400" />
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={currentVolume}
                                onChange={handleVolumeChange}
                                className="w-28 h-2 bg-gray-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-purple-500 [&::-webkit-slider-thumb]:to-pink-500 [&::-webkit-slider-thumb]:shadow-lg"
                            />
                            <span className="text-sm text-white font-bold min-w-[36px]">
                                {Math.round(currentVolume * 100)}%
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Hook for managing game music state
// الموسيقى تشتغل تلقائياً بمجرد دخول الصفحة (بعد أول تفاعل بسبب قيود المتصفح)
export function useGameMusic() {
    // الـ default هو ON - الموسيقى مفعلة
    const [isMusicPlaying, setIsMusicPlaying] = useState(true);
    const [hasTriedAutoplay, setHasTriedAutoplay] = useState(false);

    // محاولة تشغيل الموسيقى فور تحميل الصفحة
    // لكن المتصفحات تحتاج تفاعل من المستخدم أولاً
    useEffect(() => {
        if (hasTriedAutoplay) return;

        // Try to play immediately (will work if user already interacted)
        setHasTriedAutoplay(true);

        // Listen for first user interaction to enable audio
        const enableAudio = () => {
            setIsMusicPlaying(true);
            // Remove listeners after first interaction
            document.removeEventListener('click', enableAudio);
            document.removeEventListener('keydown', enableAudio);
            document.removeEventListener('touchstart', enableAudio);
            document.removeEventListener('scroll', enableAudio);
        };

        document.addEventListener('click', enableAudio);
        document.addEventListener('keydown', enableAudio);
        document.addEventListener('touchstart', enableAudio);
        document.addEventListener('scroll', enableAudio);

        return () => {
            document.removeEventListener('click', enableAudio);
            document.removeEventListener('keydown', enableAudio);
            document.removeEventListener('touchstart', enableAudio);
            document.removeEventListener('scroll', enableAudio);
        };
    }, [hasTriedAutoplay]);

    const toggleMusic = useCallback(() => {
        setIsMusicPlaying(prev => !prev);
    }, []);

    return {
        isMusicPlaying,
        toggleMusic,
    };
}
