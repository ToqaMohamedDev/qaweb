'use client';

// =============================================
// Empty State Component
// =============================================

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface EmptyStateProps {
    icon?: ReactNode;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    className?: string;
}

export function EmptyState({
    icon,
    title,
    description,
    action,
    className,
}: EmptyStateProps) {
    return (
        <div className={cn(
            'flex flex-col items-center justify-center py-12 px-4 text-center',
            className
        )}>
            {/* Icon */}
            {icon && (
                <div className="w-20 h-20 mb-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-400">
                    {icon}
                </div>
            )}

            {/* Default Icon */}
            {!icon && (
                <div className="w-20 h-20 mb-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <svg
                        className="w-10 h-10 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                        />
                    </svg>
                </div>
            )}

            {/* Title */}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {title}
            </h3>

            {/* Description */}
            {description && (
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
                    {description}
                </p>
            )}

            {/* Action Button */}
            {action && (
                <button
                    onClick={action.onClick}
                    className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl transition-colors"
                >
                    {action.label}
                </button>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// SPECIALIZED EMPTY STATES
// ═══════════════════════════════════════════════════════════════════════════

export function NoExamsFound({ onCreateExam }: { onCreateExam?: () => void }) {
    return (
        <EmptyState
            icon={
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            }
            title="لا توجد امتحانات"
            description="لم يتم العثور على أي امتحانات. يمكنك إنشاء امتحان جديد للبدء."
            action={onCreateExam ? { label: 'إنشاء امتحان', onClick: onCreateExam } : undefined}
        />
    );
}

export function NoQuestionsFound({ onCreateQuestion }: { onCreateQuestion?: () => void }) {
    return (
        <EmptyState
            icon={
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            }
            title="لا توجد أسئلة"
            description="لم يتم العثور على أي أسئلة. أضف أسئلة جديدة للبدء."
            action={onCreateQuestion ? { label: 'إضافة سؤال', onClick: onCreateQuestion } : undefined}
        />
    );
}

export function NoResultsFound({ searchTerm }: { searchTerm?: string }) {
    return (
        <EmptyState
            icon={
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            }
            title="لا توجد نتائج"
            description={searchTerm
                ? `لم يتم العثور على نتائج لـ "${searchTerm}". جرب البحث بكلمات مختلفة.`
                : 'لم يتم العثور على أي نتائج. جرب تغيير معايير البحث.'
            }
        />
    );
}

export default EmptyState;
