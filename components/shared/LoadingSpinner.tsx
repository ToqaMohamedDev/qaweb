'use client';

// =============================================
// Loading Spinner Component
// =============================================

import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    variant?: 'primary' | 'secondary' | 'white';
    className?: string;
    text?: string;
}

const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
};

const variantClasses = {
    primary: 'border-violet-600 border-t-transparent',
    secondary: 'border-gray-400 border-t-transparent',
    white: 'border-white border-t-transparent',
};

export function LoadingSpinner({
    size = 'md',
    variant = 'primary',
    className,
    text,
}: LoadingSpinnerProps) {
    return (
        <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
            <div
                className={cn(
                    'animate-spin rounded-full border-4',
                    sizeClasses[size],
                    variantClasses[variant]
                )}
                role="status"
                aria-label="جاري التحميل"
            />
            {text && (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                    {text}
                </span>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE LOADING
// ═══════════════════════════════════════════════════════════════════════════

interface PageLoadingProps {
    text?: string;
}

export function PageLoading({ text = 'جاري التحميل...' }: PageLoadingProps) {
    return (
        <div className="min-h-[400px] flex items-center justify-center">
            <LoadingSpinner size="lg" text={text} />
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// SKELETON LOADERS
// ═══════════════════════════════════════════════════════════════════════════

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
    return (
        <div
            className={cn(
                'animate-pulse bg-gray-200 dark:bg-gray-700 rounded',
                className
            )}
        />
    );
}

export function CardSkeleton() {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <Skeleton className="h-6 w-3/4 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3 mb-4" />
            <div className="flex gap-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
            </div>
        </div>
    );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm">
            {/* Header */}
            <div className="border-b border-gray-200 dark:border-gray-700 p-4">
                <div className="flex gap-4">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-4 w-1/4" />
                </div>
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="border-b border-gray-100 dark:border-gray-700/50 p-4">
                    <div className="flex gap-4">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-4 w-1/4" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export default LoadingSpinner;
