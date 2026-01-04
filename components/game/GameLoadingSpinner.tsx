// =============================================
// GameLoadingSpinner Component - مؤشر التحميل
// =============================================

'use client';

import { memo } from 'react';

interface GameLoadingSpinnerProps {
    color?: 'purple' | 'orange' | 'amber' | 'green';
    message?: string;
    size?: 'sm' | 'md' | 'lg';
}

const COLOR_CLASSES = {
    purple: 'border-purple-500',
    orange: 'border-orange-500',
    amber: 'border-amber-500',
    green: 'border-green-500',
};

const SIZE_CLASSES = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
};

function GameLoadingSpinnerComponent({
    color = 'purple',
    message = 'جاري التحميل...',
    size = 'md'
}: GameLoadingSpinnerProps) {
    return (
        <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
            <div className="text-center">
                <div className={`relative ${SIZE_CLASSES[size]} mx-auto mb-4`}>
                    <div className={`absolute inset-0 border-4 ${COLOR_CLASSES[color]}/30 rounded-full`} />
                    <div className={`absolute inset-0 border-4 ${COLOR_CLASSES[color]} border-t-transparent rounded-full animate-spin`} />
                </div>
                <p className="text-gray-500">{message}</p>
            </div>
        </div>
    );
}

export const GameLoadingSpinner = memo(GameLoadingSpinnerComponent);
