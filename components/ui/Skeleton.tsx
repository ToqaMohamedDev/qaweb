"use client";

import { motion } from "framer-motion";

// Skeleton Base Component
export function Skeleton({ className = "" }: { className?: string }) {
    return (
        <div
            className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 bg-[length:200%_100%] rounded-lg ${className}`}
            style={{
                animation: "shimmer 1.5s infinite",
            }}
        />
    );
}

// Card Skeleton
export function CardSkeleton() {
    return (
        <div className="bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200/60 dark:border-gray-800 overflow-hidden">
            {/* Header Image */}
            <Skeleton className="h-32 w-full rounded-none" />

            {/* Content */}
            <div className="p-5 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex justify-between pt-3">
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                </div>
            </div>
        </div>
    );
}

// Lesson Card Skeleton - Compact Version
export function LessonCardSkeleton() {
    return (
        <div className="bg-white dark:bg-[#1c1c24] rounded-xl border border-gray-200/60 dark:border-gray-800 overflow-hidden p-4">
            {/* Title + Status */}
            <div className="flex items-start justify-between gap-2 mb-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-2 w-2 rounded-full shrink-0 mt-1.5" />
            </div>

            {/* Tags */}
            <div className="flex gap-1.5 mb-3">
                <Skeleton className="h-4 w-16 rounded" />
                <Skeleton className="h-4 w-20 rounded" />
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-800">
                <Skeleton className="h-4 w-12" />
                <div className="flex gap-1">
                    <Skeleton className="h-6 w-6 rounded-lg" />
                    <Skeleton className="h-6 w-6 rounded-lg" />
                    <Skeleton className="h-6 w-6 rounded-lg" />
                </div>
            </div>
        </div>
    );
}

// Subject Card Skeleton
export function SubjectCardSkeleton() {
    return (
        <div className="bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200/60 dark:border-gray-800 overflow-hidden">
            {/* Header */}
            <Skeleton className="h-24 w-full rounded-none" />

            {/* Content */}
            <div className="p-4 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <div className="space-y-2">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                </div>
                <div className="flex justify-between pt-2">
                    <Skeleton className="h-5 w-16 rounded-lg" />
                    <Skeleton className="h-5 w-12 rounded-lg" />
                </div>
            </div>
        </div>
    );
}

// Stage Card Skeleton
export function StageCardSkeleton() {
    return (
        <div className="bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200/60 dark:border-gray-800 overflow-hidden">
            {/* Header */}
            <Skeleton className="h-32 w-full rounded-none" />

            {/* Content */}
            <div className="p-5 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                </div>
                <div className="flex justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-5 w-16" />
                </div>
            </div>
        </div>
    );
}

// Stats Card Skeleton
export function StatsCardSkeleton() {
    return (
        <div className="relative overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-800/50 p-5 border border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-16" />
                </div>
                <Skeleton className="h-12 w-12 rounded-xl" />
            </div>
        </div>
    );
}

// Table Row Skeleton
export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
    return (
        <tr className="border-b border-gray-100 dark:border-gray-800">
            {Array.from({ length: columns }).map((_, i) => (
                <td key={i} className="px-5 py-4">
                    <Skeleton className="h-5 w-full" />
                </td>
            ))}
        </tr>
    );
}

// Table Skeleton
export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
    return (
        <div className="bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200/60 dark:border-gray-800 overflow-hidden">
            {/* Header */}
            <div className="bg-gray-50 dark:bg-gray-800/50 px-5 py-3 flex gap-4">
                {Array.from({ length: columns }).map((_, i) => (
                    <Skeleton key={i} className="h-4 flex-1" />
                ))}
            </div>

            {/* Rows */}
            <table className="w-full">
                <tbody>
                    {Array.from({ length: rows }).map((_, i) => (
                        <TableRowSkeleton key={i} columns={columns} />
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// Grid Skeleton
export function GridSkeleton({
    count = 6,
    type = "card"
}: {
    count?: number;
    type?: "card" | "lesson" | "subject" | "stage"
}) {
    const SkeletonComponent = {
        card: CardSkeleton,
        lesson: LessonCardSkeleton,
        subject: SubjectCardSkeleton,
        stage: StageCardSkeleton,
    }[type];

    const gridClass = type === "lesson"
        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6";

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={gridClass}
        >
            {Array.from({ length: count }).map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                >
                    <SkeletonComponent />
                </motion.div>
            ))}
        </motion.div>
    );
}

// Page Header Skeleton
export function PageHeaderSkeleton() {
    return (
        <div className="relative overflow-hidden rounded-3xl bg-gray-200 dark:bg-gray-800 p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="w-16 h-16 rounded-2xl" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                </div>
                <Skeleton className="h-12 w-40 rounded-xl" />
            </div>
        </div>
    );
}

// Full Page Loading Skeleton
export function PageSkeleton() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <PageHeaderSkeleton />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatsCardSkeleton />
                <StatsCardSkeleton />
                <StatsCardSkeleton />
            </div>

            <Skeleton className="h-14 w-full rounded-2xl" />

            <GridSkeleton count={6} type="card" />
        </div>
    );
}

// Home Page Lesson Card Skeleton
export function HomePageLessonSkeleton() {
    return (
        <div className="bg-white dark:bg-[#1c1c24] rounded-lg sm:rounded-xl p-2.5 sm:p-3.5 border border-gray-200/60 dark:border-[#2e2e3a]">
            <div className="flex items-start gap-2 sm:gap-3">
                {/* Icon */}
                <Skeleton className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg shrink-0" />
                {/* Text */}
                <div className="flex-1 min-w-0 space-y-1.5">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full hidden sm:block" />
                </div>
            </div>
        </div>
    );
}

// Home Page Lessons Grid Skeleton
export function HomePageLessonsGridSkeleton({ count = 8 }: { count?: number }) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
            {Array.from({ length: count }).map((_, i) => (
                <HomePageLessonSkeleton key={i} />
            ))}
        </div>
    );
}
