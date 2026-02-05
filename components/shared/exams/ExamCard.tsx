'use client';

// ═══════════════════════════════════════════════════════════════════════════
// ExamCard - بطاقة امتحان مشتركة لـ Admin و Teacher
// ═══════════════════════════════════════════════════════════════════════════

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
    FileText, Edit3, Trash2, CheckCircle2, Clock, Calendar,
    MoreVertical, Layers, Eye,
} from 'lucide-react';
import type { ExamCardProps, ExamData } from './types';

// ═══════════════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════════════

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function getBlocksCount(exam: ExamData): number {
    const blocks = exam.blocks || exam.sections || [];
    return blocks.length || 0;
}

function getQuestionsCount(exam: ExamData): number {
    const blocks = exam.blocks || exam.sections || [];
    return blocks.reduce((total: number, block: any) => {
        const subsections = block.subsections || [];
        const directQuestions = block.questions?.length || 0;
        const subsectionQuestions = subsections.reduce(
            (sum: number, sub: any) => sum + (sub.questions?.length || 0),
            0
        );
        return total + directQuestions + subsectionQuestions;
    }, 0);
}

// ═══════════════════════════════════════════════════════════════════════════
// Sub Components
// ═══════════════════════════════════════════════════════════════════════════

function LanguageBadge({ language }: { language: string }) {
    const isArabic = language === 'arabic';
    return (
        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
            isArabic
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400'
        }`}>
            {isArabic ? 'عربي' : 'English'}
        </span>
    );
}

function StatusBadge({ isPublished }: { isPublished: boolean | null }) {
    return (
        <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
            isPublished
                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
        }`}>
            {isPublished ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
            {isPublished ? 'منشور' : 'مسودة'}
        </span>
    );
}

function ExamInfo({ exam }: { exam: ExamData }) {
    return (
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" />
                <span>{getBlocksCount(exam)} قسم</span>
            </div>
            <div className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                <span>{getQuestionsCount(exam)} سؤال</span>
            </div>
            {exam.duration_minutes && (
                <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{exam.duration_minutes} دقيقة</span>
                </div>
            )}
            <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>{formatDate(exam.created_at || '')}</span>
            </div>
        </div>
    );
}

function DropdownMenu({
    examId,
    examLink,
    editLink,
    onDelete,
}: {
    examId: string;
    examLink: string;
    editLink: string;
    onDelete?: () => void;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute left-0 top-full mt-1 w-40 bg-white dark:bg-[#252530] rounded-xl shadow-xl border border-gray-200 dark:border-[#2e2e3a] py-1 z-20"
        >
            <Link
                href={editLink}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
                <Edit3 className="h-4 w-4" />
                تعديل
            </Link>
            <Link
                href={examLink}
                target="_blank"
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
                <Eye className="h-4 w-4" />
                عرض
            </Link>
            {onDelete && (
                <button
                    onClick={onDelete}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                    <Trash2 className="h-4 w-4" />
                    حذف
                </button>
            )}
        </motion.div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════

export function ExamCard({
    exam,
    index = 0,
    variant = 'admin',
    showDropdown = true,
    isDropdownActive = false,
    onToggleDropdown,
    onDelete,
    onTogglePublish,
}: ExamCardProps) {
    const examLink = exam.language === 'english'
        ? `/english/exam/${exam.id}`
        : `/arabic/exam/${exam.id}`;

    const editLink = variant === 'admin'
        ? `/admin/exams/create?id=${exam.id}`
        : `/teacher/exams/${exam.id}/edit`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            className="group bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200 dark:border-[#2e2e3a] hover:border-primary-300 dark:hover:border-primary-700 overflow-hidden transition-all duration-300 hover:shadow-lg"
        >
            {/* Card Header Line */}
            <div className={`h-1 ${exam.is_published ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-700'}`} />

            <div className="p-5">
                {/* Badges & Menu */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                        <LanguageBadge language={exam.language} />
                        <StatusBadge isPublished={exam.is_published} />
                    </div>

                    {/* Dropdown Menu */}
                    {showDropdown && onToggleDropdown && (
                        <div className="relative" data-dropdown-container>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleDropdown();
                                }}
                                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <MoreVertical className="h-4 w-4 text-gray-400" />
                            </button>

                            <AnimatePresence>
                                {isDropdownActive && (
                                    <DropdownMenu
                                        examId={exam.id}
                                        examLink={examLink}
                                        editLink={editLink}
                                        onDelete={onDelete}
                                    />
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>

                {/* Title */}
                <h3 className="font-bold text-gray-900 dark:text-white text-base line-clamp-2 mb-3 min-h-[48px] group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {exam.exam_title}
                </h3>

                {/* Info */}
                <ExamInfo exam={exam} />

                {/* Actions */}
                <div className="space-y-2 mt-4">
                    {onTogglePublish && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onTogglePublish();
                            }}
                            className={`w-full py-2 text-center rounded-xl text-sm font-medium transition-colors ${
                                exam.is_published
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200'
                                    : 'bg-gray-100 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                            }`}
                        >
                            {exam.is_published ? '✓ منشور' : 'مسودة - اضغط للنشر'}
                        </button>
                    )}

                    <Link
                        href={editLink}
                        className="block w-full py-2.5 text-center rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium text-sm hover:bg-primary-100 dark:hover:bg-primary-900/30 hover:text-primary-700 dark:hover:text-primary-400 transition-colors"
                    >
                        <span className="flex items-center justify-center gap-2">
                            <Edit3 className="h-4 w-4" />
                            تعديل الامتحان
                        </span>
                    </Link>
                </div>
            </div>
        </motion.div>
    );
}
