'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { FileText, Clock, HelpCircle, ChevronLeft, Sparkles } from 'lucide-react';

export interface ExamCardProps {
    id: string;
    examTitle: string;
    subjectName: string | null;
    subjectSlug?: string;
    questionsCount: number;
    duration: number | null;
    index?: number;
}

const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

export function HomeExamCard({
    id,
    examTitle,
    subjectName,
    subjectSlug,
    questionsCount,
    duration,
    index = 0
}: ExamCardProps) {
    // تحديد اللون بناءً على المادة
    const getSubjectColor = (name: string | null) => {
        if (!name) return 'from-primary-500 to-primary-600';
        const lowerName = name.toLowerCase();
        if (lowerName.includes('عربي') || lowerName.includes('arabic')) return 'from-emerald-500 to-green-600';
        if (lowerName.includes('رياضي') || lowerName.includes('math')) return 'from-blue-500 to-indigo-600';
        if (lowerName.includes('فيزي') || lowerName.includes('physics')) return 'from-orange-500 to-red-600';
        if (lowerName.includes('كيمي') || lowerName.includes('chemistry')) return 'from-purple-500 to-violet-600';
        if (lowerName.includes('أحياء') || lowerName.includes('biology')) return 'from-green-500 to-teal-600';
        if (lowerName.includes('انجليز') || lowerName.includes('english')) return 'from-sky-500 to-blue-600';
        return 'from-primary-500 to-primary-600';
    };

    const colorGradient = getSubjectColor(subjectName);
    const examUrl = subjectSlug ? `/${subjectSlug}/exam/${id}` : `/arabic/exam/${id}`;

    return (
        <motion.div
            variants={fadeInUp}
            transition={{ delay: index * 0.05 }}
            className="group"
        >
            <Link href={examUrl}>
                <div className="relative h-full overflow-hidden rounded-2xl bg-white dark:bg-[#1a1a22] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all duration-300 hover:border-primary-300 dark:hover:border-primary-700 hover:-translate-y-1">
                    {/* Header Gradient */}
                    <div className={`h-2 bg-gradient-to-r ${colorGradient}`} />
                    
                    <div className="p-4">
                        {/* Subject Badge */}
                        {subjectName && (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 mb-3">
                                <Sparkles className="w-3 h-3 text-primary-500" />
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{subjectName}</span>
                            </div>
                        )}
                        
                        {/* Exam Title */}
                        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                            {examTitle}
                        </h3>
                        
                        {/* Meta Info */}
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                            <div className="flex items-center gap-1.5">
                                <HelpCircle className="w-4 h-4" />
                                <span>{questionsCount} سؤال</span>
                            </div>
                            {duration && (
                                <div className="flex items-center gap-1.5">
                                    <Clock className="w-4 h-4" />
                                    <span>{duration} دقيقة</span>
                                </div>
                            )}
                        </div>
                        
                        {/* CTA */}
                        <div className={`flex items-center justify-between px-3 py-2 rounded-xl bg-gradient-to-r ${colorGradient} bg-opacity-10`}>
                            <div className="flex items-center gap-2 text-white">
                                <FileText className="w-4 h-4" />
                                <span className="text-sm font-semibold">ابدأ الامتحان</span>
                            </div>
                            <ChevronLeft className="w-4 h-4 text-white group-hover:-translate-x-1 transition-transform rtl:rotate-180" />
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}

export function HomeExamCardSkeleton() {
    return (
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#1a1a22] border border-gray-100 dark:border-gray-800">
            <div className="h-2 bg-gray-200 dark:bg-gray-700 animate-pulse" />
            <div className="p-4">
                <div className="w-20 h-6 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse mb-3" />
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
                <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-3" />
                <div className="flex gap-4 mb-4">
                    <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
            </div>
        </div>
    );
}
