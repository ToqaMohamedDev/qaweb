'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Clock, HelpCircle, ChevronLeft, Award, Zap, BookOpen, Play } from 'lucide-react';

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

// Subject color configurations
const SUBJECT_THEMES: Record<string, { bg: string; text: string; icon: string; gradient: string }> = {
    arabic: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400', icon: '📚', gradient: 'from-emerald-500 to-green-600' },
    math: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', icon: '📐', gradient: 'from-blue-500 to-indigo-600' },
    physics: { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600 dark:text-orange-400', icon: '⚡', gradient: 'from-orange-500 to-red-600' },
    chemistry: { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400', icon: '🧪', gradient: 'from-purple-500 to-violet-600' },
    biology: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-600 dark:text-green-400', icon: '🧬', gradient: 'from-green-500 to-teal-600' },
    english: { bg: 'bg-sky-50 dark:bg-sky-900/20', text: 'text-sky-600 dark:text-sky-400', icon: '🌍', gradient: 'from-sky-500 to-blue-600' },
    default: { bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-600 dark:text-indigo-400', icon: '📝', gradient: 'from-indigo-500 to-purple-600' },
};

function getSubjectTheme(name: string | null) {
    if (!name) return SUBJECT_THEMES.default;
    const lowerName = name.toLowerCase();
    if (lowerName.includes('عربي') || lowerName.includes('arabic')) return SUBJECT_THEMES.arabic;
    if (lowerName.includes('رياضي') || lowerName.includes('math')) return SUBJECT_THEMES.math;
    if (lowerName.includes('فيزي') || lowerName.includes('physics')) return SUBJECT_THEMES.physics;
    if (lowerName.includes('كيمي') || lowerName.includes('chemistry')) return SUBJECT_THEMES.chemistry;
    if (lowerName.includes('أحياء') || lowerName.includes('biology')) return SUBJECT_THEMES.biology;
    if (lowerName.includes('انجليز') || lowerName.includes('english')) return SUBJECT_THEMES.english;
    return SUBJECT_THEMES.default;
}

export function HomeExamCard({
    id,
    examTitle,
    subjectName,
    subjectSlug,
    questionsCount,
    duration,
    index = 0
}: ExamCardProps) {
    const theme = getSubjectTheme(subjectName);
    const examUrl = subjectSlug ? `/${subjectSlug}/exam/${id}` : `/arabic/exam/${id}`;

    return (
        <motion.div
            variants={fadeInUp}
            transition={{ delay: index * 0.05 }}
            className="group h-full"
        >
            <Link href={examUrl} className="block h-full">
                <div className="relative h-full overflow-hidden rounded-2xl bg-white dark:bg-[#16161d] border border-gray-100 dark:border-gray-800/50 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 hover:-translate-y-2">
                    {/* Decorative Background */}
                    <div className="absolute top-0 left-0 w-full h-32 opacity-50 dark:opacity-30">
                        <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} opacity-10`} />
                        <div className="absolute top-4 right-4 text-4xl opacity-20 group-hover:scale-110 transition-transform duration-500">
                            {theme.icon}
                        </div>
                    </div>
                    
                    <div className="relative p-5">
                        {/* Top Row: Subject & Duration */}
                        <div className="flex items-center justify-between mb-4">
                            {subjectName && (
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${theme.bg} ${theme.text}`}>
                                    <BookOpen className="w-3.5 h-3.5" />
                                    {subjectName}
                                </span>
                            )}
                            {duration && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800/70 text-xs text-gray-600 dark:text-gray-400">
                                    <Clock className="w-3.5 h-3.5" />
                                    {duration} د
                                </span>
                            )}
                        </div>
                        
                        {/* Exam Title */}
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 line-clamp-2 min-h-[3.5rem] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {examTitle}
                        </h3>
                        
                        {/* Stats Row */}
                        <div className="flex items-center gap-4 mb-5">
                            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                                <HelpCircle className="w-4 h-4 text-indigo-500" />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{questionsCount}</span>
                                <span className="text-xs text-gray-500">سؤال</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                                <Award className="w-4 h-4 text-amber-500" />
                                <span className="text-xs text-gray-500">اختبر نفسك</span>
                            </div>
                        </div>
                        
                        {/* CTA Button */}
                        <div className={`flex items-center justify-between px-4 py-3 rounded-xl bg-gradient-to-r ${theme.gradient} group-hover:shadow-lg group-hover:shadow-indigo-500/25 transition-all duration-300`}>
                            <div className="flex items-center gap-2 text-white">
                                <Play className="w-4 h-4" />
                                <span className="text-sm font-bold">ابدأ الامتحان</span>
                            </div>
                            <div className="flex items-center gap-1 text-white/80">
                                <Zap className="w-4 h-4" />
                                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform rtl:rotate-180" />
                            </div>
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
