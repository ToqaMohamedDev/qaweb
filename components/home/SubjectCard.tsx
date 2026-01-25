'use client';

// =============================================
// SubjectCard Component - بطاقة المادة الدراسية (تصميم 2025 Premium)
// =============================================

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    BookOpen,
    FileText,
    Calculator,
    Atom,
    FlaskConical,
    Dna,
    Globe,
    History,
    Languages,
    Palette,
    Music,
    Cpu,
    Brain,
    Microscope,
    PenTool,
    GraduationCap,
    ChevronLeft,
    LucideIcon,
    Sparkles
} from 'lucide-react';

// خريطة الأيقونات الموسعة
const iconMap: Record<string, LucideIcon> = {
    'book-open': BookOpen,
    'file-text': FileText,
    'calculator': Calculator,
    'atom': Atom,
    'flask-conical': FlaskConical,
    'dna': Dna,
    'globe': Globe,
    'history': History,
    'languages': Languages,
    'palette': Palette,
    'music': Music,
    'cpu': Cpu,
    'brain': Brain,
    'microscope': Microscope,
    'pen-tool': PenTool,
    'graduation-cap': GraduationCap,
};

// الألوان الافتراضية للمواد (محسنة مع gradients)
const defaultColors: Record<string, { primary: string; secondary: string }> = {
    arabic: { primary: '#8B5CF6', secondary: '#A78BFA' },
    english: { primary: '#3B82F6', secondary: '#60A5FA' },
    math: { primary: '#10B981', secondary: '#34D399' },
    mathematics: { primary: '#10B981', secondary: '#34D399' },
    chemistry: { primary: '#F59E0B', secondary: '#FBBF24' },
    biology: { primary: '#06B6D4', secondary: '#22D3EE' },
    physics: { primary: '#EF4444', secondary: '#F87171' },
    history: { primary: '#A855F7', secondary: '#C084FC' },
    geography: { primary: '#059669', secondary: '#10B981' },
    philosophy: { primary: '#6366F1', secondary: '#818CF8' },
    french: { primary: '#EC4899', secondary: '#F472B6' },
    german: { primary: '#F97316', secondary: '#FB923C' },
    italian: { primary: '#14B8A6', secondary: '#2DD4BF' },
    psychology: { primary: '#8B5CF6', secondary: '#A78BFA' },
    sociology: { primary: '#0EA5E9', secondary: '#38BDF8' },
    economics: { primary: '#84CC16', secondary: '#A3E635' },
    statistics: { primary: '#6366F1', secondary: '#818CF8' },
    geology: { primary: '#78716C', secondary: '#A8A29E' },
};

// الأيقونات الافتراضية للمواد (موسعة)
const defaultIcons: Record<string, string> = {
    arabic: 'file-text',
    english: 'book-open',
    math: 'calculator',
    mathematics: 'calculator',
    chemistry: 'flask-conical',
    biology: 'dna',
    physics: 'atom',
    history: 'history',
    geography: 'globe',
    french: 'languages',
    german: 'languages',
    italian: 'languages',
    philosophy: 'brain',
    psychology: 'brain',
    sociology: 'graduation-cap',
    economics: 'calculator',
    statistics: 'calculator',
    geology: 'microscope',
};

export interface SubjectCardProps {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
    color: string | null;
    lessonsCount: number;
    description?: string | null;
    imageUrl?: string | null;
    index?: number;
}

export function SubjectCard({
    name,
    slug,
    icon,
    color,
    lessonsCount,
    index = 0
}: SubjectCardProps) {
    // تحديد اللون والأيقونة
    const colors = defaultColors[slug] || { primary: color || '#8B5CF6', secondary: color ? `${color}99` : '#A78BFA' };
    const subjectColor = color || colors.primary;
    const iconName = icon || defaultIcons[slug] || 'book-open';
    const IconComponent = iconMap[iconName] || BookOpen;

    // تحديد اتجاه النص بناءً على محتوى الاسم
    const isArabicName = /[\u0600-\u06FF]/.test(name);
    const lessonsText = isArabicName
        ? `${lessonsCount} ${lessonsCount === 1 ? 'درس' : lessonsCount <= 10 ? 'دروس' : 'درس'}`
        : `${lessonsCount} ${lessonsCount === 1 ? 'Lesson' : 'Lessons'}`;

    return (
        <Link href={`/${slug}`} className="block group">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.06, ease: [0.25, 0.1, 0.25, 1] }}
                whileHover={{ y: -6 }}
                whileTap={{ scale: 0.98 }}
                className="relative overflow-hidden rounded-2xl cursor-pointer h-full"
            >
                {/* Background with gradient border effect */}
                <div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                        background: `linear-gradient(135deg, ${colors.primary}30, ${colors.secondary}30)`,
                    }}
                />

                {/* Card Background */}
                <div className="absolute inset-px rounded-[15px] bg-white dark:bg-[#14141c] transition-colors duration-300 border-2 border-gray-200/80 dark:border-gray-800/50" />

                {/* Glow Effect on Hover */}
                <div
                    className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-30 transition-opacity duration-500"
                    style={{ backgroundColor: subjectColor }}
                />

                {/* Content */}
                <div className="relative p-4 sm:p-5">
                    <div className="flex items-start gap-4">
                        {/* أيقونة المادة */}
                        <div className="relative">
                            <div
                                className="w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
                                style={{
                                    background: `linear-gradient(135deg, ${colors.primary}15, ${colors.secondary}25)`,
                                    boxShadow: `0 4px 20px ${subjectColor}20`
                                }}
                            >
                                <IconComponent className="w-7 h-7" style={{ color: subjectColor }} />
                            </div>
                            {/* Sparkle badge */}
                            <div
                                className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-0 group-hover:scale-100"
                                style={{ backgroundColor: subjectColor }}
                            >
                                <Sparkles className="w-3 h-3 text-white" />
                            </div>
                        </div>

                        {/* المحتوى */}
                        <div className="flex-1 min-w-0 pt-1">
                            <h3
                                className="text-base font-bold text-gray-900 dark:text-white truncate mb-1.5 transition-colors duration-300"
                                dir={isArabicName ? 'rtl' : 'ltr'}
                                style={{
                                    color: undefined
                                }}
                            >
                                <span className="group-hover:bg-gradient-to-r group-hover:from-gray-900 group-hover:to-gray-700 dark:group-hover:from-white dark:group-hover:to-gray-300 group-hover:bg-clip-text transition-all duration-300">
                                    {name}
                                </span>
                            </h3>
                            <div className="flex items-center gap-2">
                                <div
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-300"
                                    style={{
                                        backgroundColor: `${subjectColor}10`,
                                        color: subjectColor
                                    }}
                                >
                                    <BookOpen className="w-3.5 h-3.5" />
                                    {lessonsText}
                                </div>
                            </div>
                        </div>

                        {/* سهم */}
                        <div
                            className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:-translate-x-1.5 rtl:group-hover:translate-x-1.5 mt-1"
                            style={{
                                backgroundColor: `${subjectColor}08`,
                            }}
                        >
                            <ChevronLeft
                                className="w-5 h-5 rtl:rotate-180 transition-colors duration-300"
                                style={{ color: subjectColor }}
                            />
                        </div>
                    </div>
                </div>

                {/* Bottom Border Gradient */}
                <div
                    className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                        background: `linear-gradient(90deg, transparent, ${subjectColor}, transparent)`
                    }}
                />
            </motion.div>
        </Link>
    );
}

// Skeleton Premium للتحميل
export function SubjectCardSkeleton() {
    return (
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#14141c] border border-gray-100 dark:border-gray-800/50">
            <div className="p-4 sm:p-5">
                <div className="flex items-start gap-4 animate-pulse">
                    <div className="shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-gray-200 to-gray-100 dark:from-gray-700 dark:to-gray-800" />
                    <div className="flex-1 pt-1">
                        <div className="h-5 bg-gradient-to-r from-gray-200 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-lg w-28 mb-2.5" />
                        <div className="h-6 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-800/50 rounded-full w-20" />
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800/50 mt-1" />
                </div>
            </div>
        </div>
    );
}
