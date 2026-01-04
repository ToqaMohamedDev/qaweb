'use client';

/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                      EXAM CARD - بطاقة الامتحان                          ║
 * ║                                                                          ║
 * ║  مكون قابل لإعادة الاستخدام لعرض معلومات الامتحان                        ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Clock,
    BookOpen,
    Award,
    Users,
    ChevronRight,
    Edit,
    Trash2,
    Eye,
    MoreVertical
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface ExamCardProps {
    id: string;
    title: string;
    description?: string;
    language: 'arabic' | 'english';
    questionsCount?: number;
    totalMarks?: number;
    duration?: number; // in minutes
    status?: 'draft' | 'published' | 'archived';
    attemptCount?: number;
    isTeacherExam?: boolean;
    createdAt?: string;

    // Actions
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
    onView?: (id: string) => void;

    // Display options
    variant?: 'default' | 'compact' | 'admin';
    showActions?: boolean;
    className?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function ExamCard({
    id,
    title,
    description,
    language,
    questionsCount = 0,
    totalMarks = 0,
    duration = 0,
    status = 'draft',
    attemptCount = 0,
    isTeacherExam = false,
    createdAt,
    onEdit,
    onDelete,
    onView,
    variant = 'default',
    showActions = true,
    className = '',
}: ExamCardProps) {
    const isRTL = language === 'arabic';

    const statusColors = {
        draft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
        published: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        archived: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    };

    const statusLabels = {
        draft: isRTL ? 'مسودة' : 'Draft',
        published: isRTL ? 'منشور' : 'Published',
        archived: isRTL ? 'مؤرشف' : 'Archived',
    };

    const examLink = isTeacherExam
        ? `/${language}/teacher-exam/${id}`
        : `/${language}/exam/${id}`;

    if (variant === 'compact') {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-center justify-between p-4 bg-white dark:bg-[#1c1c24] rounded-xl border border-gray-200 dark:border-[#2e2e3a] hover:border-primary-500 transition-colors ${className}`}
                dir={isRTL ? 'rtl' : 'ltr'}
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
                        <p className="text-sm text-gray-500">{questionsCount} {isRTL ? 'سؤال' : 'questions'}</p>
                    </div>
                </div>
                <Link href={examLink}>
                    <ChevronRight className={`w-5 h-5 text-gray-400 ${isRTL ? 'rotate-180' : ''}`} />
                </Link>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            className={`bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200 dark:border-[#2e2e3a] overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 ${className}`}
            dir={isRTL ? 'rtl' : 'ltr'}
        >
            {/* Header */}
            <div className="p-6 border-b border-gray-100 dark:border-[#2e2e3a]">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${statusColors[status]}`}>
                                {statusLabels[status]}
                            </span>
                            {isTeacherExam && (
                                <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                                    {isRTL ? 'امتحان معلم' : 'Teacher Exam'}
                                </span>
                            )}
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                            {title}
                        </h3>
                        {description && (
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                                {description}
                            </p>
                        )}
                    </div>

                    {showActions && variant === 'admin' && (
                        <div className="flex items-center gap-1">
                            {onView && (
                                <button
                                    onClick={() => onView(id)}
                                    className="p-2 text-gray-400 hover:text-primary-500 hover:bg-gray-100 dark:hover:bg-[#2e2e3a] rounded-lg transition-colors"
                                    title={isRTL ? 'عرض' : 'View'}
                                >
                                    <Eye className="w-4 h-4" />
                                </button>
                            )}
                            {onEdit && (
                                <button
                                    onClick={() => onEdit(id)}
                                    className="p-2 text-gray-400 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-[#2e2e3a] rounded-lg transition-colors"
                                    title={isRTL ? 'تعديل' : 'Edit'}
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                            )}
                            {onDelete && (
                                <button
                                    onClick={() => onDelete(id)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-[#2e2e3a] rounded-lg transition-colors"
                                    title={isRTL ? 'حذف' : 'Delete'}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="p-6 grid grid-cols-3 gap-4">
                <div className="text-center">
                    <div className="flex items-center justify-center w-10 h-10 mx-auto mb-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                        <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{questionsCount}</p>
                    <p className="text-xs text-gray-500">{isRTL ? 'سؤال' : 'Questions'}</p>
                </div>

                <div className="text-center">
                    <div className="flex items-center justify-center w-10 h-10 mx-auto mb-2 rounded-full bg-green-100 dark:bg-green-900/30">
                        <Award className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{totalMarks}</p>
                    <p className="text-xs text-gray-500">{isRTL ? 'درجة' : 'Marks'}</p>
                </div>

                <div className="text-center">
                    <div className="flex items-center justify-center w-10 h-10 mx-auto mb-2 rounded-full bg-orange-100 dark:bg-orange-900/30">
                        <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{duration || '∞'}</p>
                    <p className="text-xs text-gray-500">{isRTL ? 'دقيقة' : 'Minutes'}</p>
                </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-[#16161c] flex items-center justify-between">
                {attemptCount > 0 && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Users className="w-4 h-4" />
                        <span>{attemptCount} {isRTL ? 'محاولة' : 'attempts'}</span>
                    </div>
                )}

                <Link
                    href={examLink}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-colors"
                >
                    {isRTL ? 'بدء الامتحان' : 'Start Exam'}
                    <ChevronRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
                </Link>
            </div>
        </motion.div>
    );
}

export default ExamCard;
