// =============================================
// LessonsSection Component - قسم الدروس
// =============================================

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, ClipboardList, LucideIcon } from 'lucide-react';
import { LessonCard } from './LessonCard';
import { HomePageLessonsGridSkeleton } from '@/components/ui/Skeleton';
import type { Lesson } from '@/lib/types';

export interface LessonsSectionProps {
    id: string;
    title: string;
    lessonsCount: number;
    lessons: Lesson[];
    stageName?: string;
    isLoading: boolean;
    href: string;
    lessonHrefPrefix: string;
    icon: LucideIcon;
    examsLabel: string;
    viewAllLabel: string;
    emptyMessage: string;
    dir?: 'rtl' | 'ltr';
    skeletonCount?: number;
}

export function LessonsSection({
    id,
    title,
    lessonsCount,
    lessons,
    stageName,
    isLoading,
    href,
    lessonHrefPrefix,
    icon: Icon,
    examsLabel,
    viewAllLabel,
    emptyMessage,
    dir = 'rtl',
    skeletonCount = 8,
}: LessonsSectionProps) {
    const isRTL = dir === 'rtl';
    const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

    return (
        <section
            id={id}
            className={`py-6 sm:py-8 md:py-10 scroll-mt-16 sm:scroll-mt-20 ${id === 'arabic' ? 'bg-gray-50/80 dark:bg-[#0d0d12]/80' : ''
                }`}
        >
            <div className="container mx-auto px-3 sm:px-6 lg:px-8 max-w-6xl">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="flex items-center justify-between mb-4 sm:mb-5"
                >
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-md shadow-primary-500/25">
                            <Icon className="h-4 sm:h-5 w-4 sm:w-5 text-white" />
                        </div>
                        <div dir={dir}>
                            <h2 className="text-base sm:text-lg md:text-xl font-extrabold text-gray-900 dark:text-white">
                                {title}
                            </h2>
                            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 hidden xs:block">
                                {lessonsCount} {isRTL ? 'دروس' : 'lessons'}
                            </p>
                        </div>
                    </div>
                    <Link
                        href={href}
                        className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-semibold text-[10px] sm:text-xs hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors"
                        dir={dir}
                    >
                        <span>{viewAllLabel}</span>
                        <ArrowIcon className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
                    </Link>
                </motion.div>

                {/* Lessons Grid */}
                {isLoading ? (
                    <HomePageLessonsGridSkeleton count={skeletonCount} />
                ) : lessons.length === 0 ? (
                    <div className="text-center py-10">
                        <Icon className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
                    </div>
                ) : (
                    <div dir={dir} className={`grid ${id === 'english' ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'} gap-2 sm:gap-3`}>
                        {lessons.map((lesson, index) => (
                            <LessonCard
                                key={lesson.id}
                                id={lesson.id}
                                title={lesson.title}
                                stageName={stageName}
                                href={`${lessonHrefPrefix}/${lesson.id}`}
                                icon={Icon}
                                index={index}
                                dir={dir}
                            />
                        ))}
                    </div>
                )}

                {/* Exams Link */}
                <div dir={dir} className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-gray-200/60 dark:border-[#2e2e3a]">
                    <Link
                        href={href}
                        className="inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                        dir={dir}
                    >
                        <ClipboardList className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                        <span>{examsLabel}</span>
                        <ArrowIcon className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
                    </Link>
                </div>
            </div>
        </section>
    );
}

export default LessonsSection;
