'use client';

/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                    QUESTION CARD - بطاقة السؤال                          ║
 * ║                                                                          ║
 * ║  مكون قابل لإعادة الاستخدام لعرض سؤال واحد                               ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
    CheckCircle,
    XCircle,
    Edit,
    Trash2,
    Copy,
    MoreVertical,
    HelpCircle,
    MessageSquare,
    ListOrdered,
    Type,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface QuestionCardProps {
    id: string;
    type: 'mcq' | 'essay' | 'maqali' | 'true_false' | 'fill_blank' | string;
    text: string;
    textAr?: string;
    textEn?: string;
    options?: string[] | { id: string; text: string }[];
    correctAnswer?: string | number;
    points?: number;
    difficulty?: 'easy' | 'medium' | 'hard';

    // State
    userAnswer?: any;
    showCorrectAnswer?: boolean;
    isCorrect?: boolean | null;

    // Actions
    onAnswer?: (answer: any) => void;
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
    onDuplicate?: (id: string) => void;

    // Display
    language?: 'arabic' | 'english';
    index?: number;
    variant?: 'default' | 'quiz' | 'admin' | 'preview';
    className?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function QuestionCard({
    id,
    type,
    text,
    textAr,
    textEn,
    options,
    correctAnswer,
    points = 1,
    difficulty = 'medium',
    userAnswer,
    showCorrectAnswer = false,
    isCorrect,
    onAnswer,
    onEdit,
    onDelete,
    onDuplicate,
    language = 'arabic',
    index,
    variant = 'default',
    className = '',
}: QuestionCardProps) {
    const isRTL = language === 'arabic';
    const questionText = text || (isRTL ? textAr : textEn) || '';

    const typeIcons = {
        mcq: ListOrdered,
        multiple_choice: ListOrdered,
        essay: MessageSquare,
        maqali: MessageSquare,
        true_false: CheckCircle,
        fill_blank: Type,
    };

    const typeLabels = {
        mcq: isRTL ? 'اختيار من متعدد' : 'Multiple Choice',
        multiple_choice: isRTL ? 'اختيار من متعدد' : 'Multiple Choice',
        essay: isRTL ? 'مقالي' : 'Essay',
        maqali: isRTL ? 'مقالي' : 'Essay',
        true_false: isRTL ? 'صح/خطأ' : 'True/False',
        fill_blank: isRTL ? 'ملء الفراغ' : 'Fill Blank',
    };

    const difficultyColors = {
        easy: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
        hard: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };

    const difficultyLabels = {
        easy: isRTL ? 'سهل' : 'Easy',
        medium: isRTL ? 'متوسط' : 'Medium',
        hard: isRTL ? 'صعب' : 'Hard',
    };

    const TypeIcon = typeIcons[type as keyof typeof typeIcons] || HelpCircle;

    const handleOptionSelect = (optionIndex: number | string) => {
        if (onAnswer && !showCorrectAnswer) {
            onAnswer(optionIndex);
        }
    };

    // Admin Preview
    if (variant === 'admin' || variant === 'preview') {
        return (
            <div
                className={`bg-white dark:bg-[#1c1c24] rounded-xl border border-gray-200 dark:border-[#2e2e3a] overflow-hidden ${className}`}
                dir={isRTL ? 'rtl' : 'ltr'}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-[#2e2e3a]">
                    <div className="flex items-center gap-3">
                        {index !== undefined && (
                            <span className="w-8 h-8 flex items-center justify-center bg-primary-100 dark:bg-primary-900/30 text-primary-600 rounded-lg text-sm font-bold">
                                {index + 1}
                            </span>
                        )}
                        <div className="flex items-center gap-2">
                            <TypeIcon className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-500">{typeLabels[type as keyof typeof typeLabels] || type}</span>
                        </div>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${difficultyColors[difficulty]}`}>
                            {difficultyLabels[difficulty]}
                        </span>
                        <span className="text-sm text-gray-500">{points} {isRTL ? 'درجة' : 'pts'}</span>
                    </div>

                    {variant === 'admin' && (
                        <div className="flex items-center gap-1">
                            {onDuplicate && (
                                <button
                                    onClick={() => onDuplicate(id)}
                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-[#2e2e3a] rounded-lg transition-colors"
                                >
                                    <Copy className="w-4 h-4" />
                                </button>
                            )}
                            {onEdit && (
                                <button
                                    onClick={() => onEdit(id)}
                                    className="p-2 text-gray-400 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-[#2e2e3a] rounded-lg transition-colors"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                            )}
                            {onDelete && (
                                <button
                                    onClick={() => onDelete(id)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-[#2e2e3a] rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-4">
                    <p className="text-gray-900 dark:text-white mb-4">{questionText}</p>

                    {/* MCQ Options Preview */}
                    {options && options.length > 0 && (
                        <div className="space-y-2">
                            {options.map((option, idx) => {
                                const optionText = typeof option === 'string' ? option : option.text;
                                const isCorrectOption = correctAnswer === idx || correctAnswer === (typeof option === 'object' ? option.id : undefined);

                                return (
                                    <div
                                        key={idx}
                                        className={`flex items-center gap-3 p-3 rounded-lg border ${isCorrectOption
                                                ? 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20'
                                                : 'border-gray-200 dark:border-[#2e2e3a]'
                                            }`}
                                    >
                                        <span className="w-6 h-6 flex items-center justify-center bg-gray-100 dark:bg-[#2e2e3a] rounded text-xs font-medium">
                                            {String.fromCharCode(65 + idx)}
                                        </span>
                                        <span className="flex-1 text-gray-700 dark:text-gray-300">{optionText}</span>
                                        {isCorrectOption && (
                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Quiz Mode
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200 dark:border-[#2e2e3a] p-6 ${className}`}
            dir={isRTL ? 'rtl' : 'ltr'}
        >
            {/* Question Header */}
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                    {index !== undefined && (
                        <span className="w-10 h-10 flex items-center justify-center bg-primary-500 text-white rounded-xl text-lg font-bold">
                            {index + 1}
                        </span>
                    )}
                    <span className="text-sm text-gray-500">{points} {isRTL ? 'درجة' : 'pts'}</span>
                </div>

                {showCorrectAnswer && isCorrect !== null && (
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${isCorrect
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                        {isCorrect ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        <span className="text-sm font-medium">
                            {isCorrect ? (isRTL ? 'صحيح' : 'Correct') : (isRTL ? 'خطأ' : 'Wrong')}
                        </span>
                    </div>
                )}
            </div>

            {/* Question Text */}
            <p className="text-lg text-gray-900 dark:text-white mb-6">{questionText}</p>

            {/* Options */}
            {options && options.length > 0 && (
                <div className="space-y-3">
                    {options.map((option, idx) => {
                        const optionText = typeof option === 'string' ? option : option.text;
                        const optionValue = typeof option === 'string' ? idx : option.id;
                        const isSelected = userAnswer === optionValue || userAnswer === idx;
                        const isCorrectOption = correctAnswer === idx || correctAnswer === optionValue;

                        let optionClass = 'border-gray-200 dark:border-[#2e2e3a] hover:border-primary-300';
                        if (showCorrectAnswer) {
                            if (isCorrectOption) {
                                optionClass = 'border-green-500 bg-green-50 dark:bg-green-900/20';
                            } else if (isSelected && !isCorrectOption) {
                                optionClass = 'border-red-500 bg-red-50 dark:bg-red-900/20';
                            }
                        } else if (isSelected) {
                            optionClass = 'border-primary-500 bg-primary-50 dark:bg-primary-900/20';
                        }

                        return (
                            <button
                                key={idx}
                                onClick={() => handleOptionSelect(idx)}
                                disabled={showCorrectAnswer}
                                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-start ${optionClass}`}
                            >
                                <span className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium ${isSelected
                                        ? 'bg-primary-500 text-white'
                                        : 'bg-gray-100 dark:bg-[#2e2e3a] text-gray-600 dark:text-gray-400'
                                    }`}>
                                    {String.fromCharCode(65 + idx)}
                                </span>
                                <span className="flex-1 text-gray-700 dark:text-gray-300">{optionText}</span>
                                {showCorrectAnswer && isCorrectOption && (
                                    <CheckCircle className="w-6 h-6 text-green-500" />
                                )}
                                {showCorrectAnswer && isSelected && !isCorrectOption && (
                                    <XCircle className="w-6 h-6 text-red-500" />
                                )}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Essay Input */}
            {(type === 'essay' || type === 'maqali') && (
                <textarea
                    value={userAnswer || ''}
                    onChange={(e) => onAnswer?.(e.target.value)}
                    disabled={showCorrectAnswer}
                    placeholder={isRTL ? 'اكتب إجابتك هنا...' : 'Write your answer here...'}
                    className="w-full h-40 p-4 bg-gray-50 dark:bg-[#0f0f12] border border-gray-200 dark:border-[#2e2e3a] rounded-xl resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50"
                />
            )}
        </motion.div>
    );
}

export default QuestionCard;
