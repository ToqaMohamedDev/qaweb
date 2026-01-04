'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/lib/stores';

interface LikeButtonProps {
    lessonId: string;
    initialLikesCount?: number;
    size?: 'sm' | 'md' | 'lg';
    showCount?: boolean;
    className?: string;
}

export function LikeButton({
    lessonId,
    initialLikesCount = 0,
    size = 'md',
    showCount = true,
    className = '',
}: LikeButtonProps) {
    const { user } = useAuth();
    const { addToast } = useUIStore();
    const [liked, setLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(initialLikesCount);
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);

    // Check if user already liked
    useEffect(() => {
        if (!user) {
            setChecking(false);
            return;
        }

        const checkLike = async () => {
            try {
                const res = await fetch(`/api/lessons/${lessonId}/like`);
                const data = await res.json();
                setLiked(data.liked);
            } catch (error) {
                console.error('Error checking like:', error);
            } finally {
                setChecking(false);
            }
        };

        checkLike();
    }, [lessonId, user]);

    const handleLike = async () => {
        if (!user) {
            addToast({ type: 'warning', message: 'يجب تسجيل الدخول للإعجاب' });
            return;
        }

        setLoading(true);
        const wasLiked = liked;

        // Optimistic update
        setLiked(!liked);
        setLikesCount(prev => liked ? Math.max(0, prev - 1) : prev + 1);

        try {
            const res = await fetch(`/api/lessons/${lessonId}/like`, {
                method: 'POST',
            });

            if (!res.ok) {
                // Revert on error
                setLiked(wasLiked);
                setLikesCount(prev => wasLiked ? prev + 1 : prev - 1);
                const data = await res.json();
                addToast({ type: 'error', message: data.error || 'حدث خطأ' });
            }
        } catch (error) {
            // Revert on error
            setLiked(wasLiked);
            setLikesCount(prev => wasLiked ? prev + 1 : prev - 1);
            addToast({ type: 'error', message: 'فشل في تحديث الإعجاب' });
        } finally {
            setLoading(false);
        }
    };

    const sizeClasses = {
        sm: 'p-1.5 text-xs gap-1',
        md: 'p-2 text-sm gap-1.5',
        lg: 'p-2.5 text-base gap-2',
    };

    const iconSizes = {
        sm: 'h-4 w-4',
        md: 'h-5 w-5',
        lg: 'h-6 w-6',
    };

    if (checking) {
        return (
            <div className={`inline-flex items-center ${sizeClasses[size]} ${className}`}>
                <Loader2 className={`${iconSizes[size]} animate-spin text-gray-400`} />
            </div>
        );
    }

    return (
        <motion.button
            onClick={handleLike}
            disabled={loading}
            whileTap={{ scale: 0.9 }}
            className={`
                inline-flex items-center rounded-xl font-medium transition-all duration-200
                ${sizeClasses[size]}
                ${liked
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }
                ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                ${className}
            `}
        >
            <motion.div
                animate={liked ? { scale: [1, 1.3, 1] } : {}}
                transition={{ duration: 0.3 }}
            >
                <Heart
                    className={`${iconSizes[size]} ${liked ? 'fill-current' : ''}`}
                />
            </motion.div>
            {showCount && (
                <span className="font-semibold">{likesCount}</span>
            )}
        </motion.button>
    );
}

export default LikeButton;
