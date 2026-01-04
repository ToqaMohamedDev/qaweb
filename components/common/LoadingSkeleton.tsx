// =============================================
// LoadingSkeleton Component - عنصر التحميل
// =============================================

'use client';

import { motion } from 'framer-motion';

export interface SkeletonProps {
    className?: string;
    animate?: boolean;
}

/**
 * Basic skeleton element with shimmer animation
 */
export function Skeleton({ className = '', animate = true }: SkeletonProps) {
    return (
        <div className={`bg-gray-200 dark:bg-[#272727] rounded-lg ${animate ? 'animate-pulse' : ''} relative overflow-hidden ${className}`}>
            {animate && (
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent" />
            )}
        </div>
    );
}

/**
 * Teacher Card Skeleton
 */
export function TeacherCardSkeleton() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group"
        >
            <div className="relative">
                {/* Thumbnail Skeleton - 16:9 */}
                <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-200 dark:bg-[#272727]">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent" />
                    <div className="absolute bottom-2 left-2">
                        <div className="w-16 h-5 rounded-md bg-gray-300/50 dark:bg-[#3a3a3a]" />
                    </div>
                </div>

                {/* Info Section Skeleton */}
                <div className="flex gap-3 mt-3 px-1">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-[#272727] animate-pulse flex-shrink-0 relative overflow-hidden">
                        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/30 dark:via-white/5 to-transparent" />
                    </div>

                    {/* Title & Meta */}
                    <div className="flex-1 min-w-0 space-y-2">
                        <div className="h-4 w-3/4 rounded-md bg-gray-200 dark:bg-[#272727] animate-pulse relative overflow-hidden">
                            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/30 dark:via-white/5 to-transparent" />
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-16 rounded-md bg-gray-100 dark:bg-[#1f1f1f] animate-pulse" />
                            <div className="h-3 w-3 rounded-full bg-gray-100 dark:bg-[#1f1f1f]" />
                            <div className="h-3 w-20 rounded-md bg-gray-100 dark:bg-[#1f1f1f] animate-pulse" />
                        </div>
                        <div className="h-7 w-20 rounded-full bg-gray-200 dark:bg-[#272727] animate-pulse relative overflow-hidden">
                            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/30 dark:via-white/5 to-transparent" />
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

/**
 * Grid of Teacher Card Skeletons
 */
export interface TeacherGridSkeletonProps {
    count?: number;
}

export function TeacherGridSkeleton({ count = 8 }: TeacherGridSkeletonProps) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            {/* Skeleton Header */}
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 rounded-2xl bg-gray-200 dark:bg-[#272727] animate-pulse">
                    <div className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                    <div className="h-6 w-32 rounded-lg bg-gray-200 dark:bg-[#272727] animate-pulse" />
                    <div className="h-4 w-48 rounded-lg bg-gray-100 dark:bg-[#1f1f1f] animate-pulse" />
                </div>
            </div>

            {/* Skeleton Grid */}
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
                {Array.from({ length: count }).map((_, index) => (
                    <TeacherCardSkeleton key={index} />
                ))}
            </div>
        </motion.div>
    );
}

/**
 * Simple text skeleton
 */
export function TextSkeleton({ width = 'w-full', height = 'h-4' }: { width?: string; height?: string }) {
    return <Skeleton className={`${width} ${height}`} />;
}

/**
 * Avatar skeleton
 */
export function AvatarSkeleton({ size = 'w-10 h-10' }: { size?: string }) {
    return <Skeleton className={`${size} rounded-full`} />;
}

/**
 * Button skeleton
 */
export function ButtonSkeleton({ width = 'w-24', height = 'h-10' }: { width?: string; height?: string }) {
    return <Skeleton className={`${width} ${height} rounded-lg`} />;
}

export default {
    Skeleton,
    TeacherCardSkeleton,
    TeacherGridSkeleton,
    TextSkeleton,
    AvatarSkeleton,
    ButtonSkeleton,
};
