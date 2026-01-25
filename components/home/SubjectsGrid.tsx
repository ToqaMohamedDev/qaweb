'use client';

// =============================================
// SubjectsGrid Component - شبكة المواد الدراسية المحسنة
// =============================================

import { motion } from 'framer-motion';
import { BookOpen, Loader2, GraduationCap, Sparkles, Search } from 'lucide-react';
import { SubjectCard, SubjectCardSkeleton } from './SubjectCard';
import type { SubjectWithLessons } from '@/lib/actions/dashboard';

export interface SubjectsGridProps {
    subjects: SubjectWithLessons[];
    isLoading: boolean;
    stageName?: string;
}

// Container animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08
        }
    }
};

export function SubjectsGrid({ subjects, isLoading, stageName }: SubjectsGridProps) {
    // Loading state with staggered skeletons
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <SubjectCardSkeleton />
                    </motion.div>
                ))}
            </div>
        );
    }

    // Empty state - تصميم أفضل
    if (!subjects || subjects.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-20 px-4"
            >
                <div className="relative mb-6">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center shadow-lg">
                        <Search className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-primary-500" />
                    </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 text-center">
                    لا توجد مواد متاحة حالياً
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm leading-relaxed">
                    {stageName 
                        ? `لم يتم إضافة مواد لـ "${stageName}" بعد. سيتم إضافة المواد قريباً.`
                        : 'لم يتم ربط أي مواد بالمرحلة الدراسية الخاصة بك حتى الآن.'
                    }
                </p>
            </motion.div>
        );
    }

    // Subjects grid with animations
    return (
        <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {subjects.map((subject, index) => (
                <SubjectCard
                    key={subject.id}
                    id={subject.id}
                    name={subject.name}
                    slug={subject.slug}
                    icon={subject.icon}
                    color={subject.color}
                    lessonsCount={subject.lessonsCount}
                    description={subject.description}
                    imageUrl={subject.imageUrl}
                    index={index}
                />
            ))}
        </motion.div>
    );
}

// قسم المواد الدراسية الكامل مع العنوان - محسن
export function SubjectsSection({ 
    subjects, 
    isLoading, 
    stageName,
    currentSemester 
}: SubjectsGridProps & { currentSemester?: string }) {
    // تحديد نص الترم
    const semesterText = currentSemester === 'first' 
        ? 'الترم الأول' 
        : currentSemester === 'second' 
            ? 'الترم الثاني' 
            : '';

    const subjectsCount = subjects?.length || 0;
    const subjectWord = subjectsCount === 1 ? 'مادة' : subjectsCount <= 10 ? 'مواد' : 'مادة';

    return (
        <section className="py-8 sm:py-12">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
                {/* Section Header - محسن */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8"
                >
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2.5 rounded-xl bg-primary-500 shadow-lg shadow-primary-500/30">
                                <GraduationCap className="h-5 w-5 text-white" />
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
                                المواد الدراسية
                            </h2>
                        </div>
                        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 flex items-center gap-2 flex-wrap">
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
                                    <span>جاري تحميل المواد...</span>
                                </span>
                            ) : (
                                <>
                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                        {subjectsCount} {subjectWord}
                                    </span>
                                    {semesterText && (
                                        <>
                                            <span className="text-gray-300 dark:text-gray-600">•</span>
                                            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                                                {semesterText}
                                            </span>
                                        </>
                                    )}
                                </>
                            )}
                        </p>
                    </div>

                    {/* Stage Badge - محسن */}
                    {stageName && !isLoading && (
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white dark:bg-[#1a1a23] border border-gray-200 dark:border-[#2a2a35] shadow-sm"
                        >
                            <BookOpen className="w-4 h-4 text-primary-500" />
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                {stageName}
                            </span>
                        </motion.div>
                    )}
                </motion.div>

                {/* Subjects Grid */}
                <SubjectsGrid 
                    subjects={subjects} 
                    isLoading={isLoading} 
                    stageName={stageName}
                />
            </div>
        </section>
    );
}
