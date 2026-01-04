'use client';

/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                    QUESTION LIST - قائمة الأسئلة                          ║
 * ║                                                                          ║
 * ║  مكون لعرض قائمة الأسئلة مع الفلترة والبحث                               ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
    Search,
    Filter,
    Plus,
    Trash2,
    GripVertical,
    HelpCircle,
} from 'lucide-react';
import { QuestionCard, type QuestionCardProps } from './QuestionCard';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface QuestionData extends Omit<QuestionCardProps, 'onAnswer' | 'onEdit' | 'onDelete' | 'onDuplicate' | 'variant' | 'index' | 'className'> { }

export interface QuestionListProps {
    questions: QuestionData[];
    isLoading?: boolean;
    language?: 'arabic' | 'english';

    // Actions
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
    onDuplicate?: (id: string) => void;
    onAdd?: () => void;
    onReorder?: (questions: QuestionData[]) => void;

    // Display
    variant?: 'default' | 'admin' | 'quiz';
    showFilters?: boolean;
    showSearch?: boolean;
    showAddButton?: boolean;
    allowReorder?: boolean;
    emptyMessage?: string;
    className?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function QuestionList({
    questions,
    isLoading = false,
    language = 'arabic',
    onEdit,
    onDelete,
    onDuplicate,
    onAdd,
    onReorder,
    variant = 'default',
    showFilters = true,
    showSearch = true,
    showAddButton = false,
    allowReorder = false,
    emptyMessage,
    className = '',
}: QuestionListProps) {
    const isRTL = language === 'arabic';

    // State
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
    const [orderedQuestions, setOrderedQuestions] = useState(questions);

    // Update ordered questions when questions prop changes
    React.useEffect(() => {
        setOrderedQuestions(questions);
    }, [questions]);

    // Filtered questions
    const filteredQuestions = useMemo(() => {
        return orderedQuestions.filter((q) => {
            const questionText = q.text || q.textAr || q.textEn || '';
            const matchesSearch = !searchQuery ||
                questionText.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesType = typeFilter === 'all' || q.type === typeFilter;
            const matchesDifficulty = difficultyFilter === 'all' || q.difficulty === difficultyFilter;
            return matchesSearch && matchesType && matchesDifficulty;
        });
    }, [orderedQuestions, searchQuery, typeFilter, difficultyFilter]);

    // Handle reorder
    const handleReorder = (newOrder: QuestionData[]) => {
        setOrderedQuestions(newOrder);
        onReorder?.(newOrder);
    };

    // Labels
    const labels = {
        search: isRTL ? 'البحث عن سؤال...' : 'Search questions...',
        noQuestions: isRTL ? 'لا توجد أسئلة' : 'No Questions',
        noResults: isRTL ? 'لا توجد نتائج مطابقة' : 'No matching results',
        addQuestion: isRTL ? 'إضافة سؤال' : 'Add Question',
        allTypes: isRTL ? 'كل الأنواع' : 'All Types',
        allDifficulties: isRTL ? 'كل المستويات' : 'All Levels',
    };

    // Empty state
    if (!isLoading && questions.length === 0) {
        return (
            <div className={`text-center py-16 ${className}`} dir={isRTL ? 'rtl' : 'ltr'}>
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-[#2e2e3a] flex items-center justify-center">
                    <HelpCircle className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {labels.noQuestions}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                    {emptyMessage || (isRTL ? 'لم يتم إضافة أي أسئلة بعد' : 'No questions have been added yet')}
                </p>
                {showAddButton && onAdd && (
                    <button
                        onClick={onAdd}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        {labels.addQuestion}
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className={className} dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Toolbar */}
            {(showSearch || showFilters || showAddButton) && (
                <div className="flex flex-wrap items-center gap-4 mb-6">
                    {/* Search */}
                    {showSearch && (
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute top-1/2 -translate-y-1/2 start-3 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={labels.search}
                                className="w-full ps-10 pe-4 py-2.5 bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-[#2e2e3a] rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>
                    )}

                    {/* Type Filter */}
                    {showFilters && (
                        <>
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="px-4 py-2.5 bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-[#2e2e3a] rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                                <option value="all">{labels.allTypes}</option>
                                <option value="mcq">{isRTL ? 'اختيار من متعدد' : 'Multiple Choice'}</option>
                                <option value="essay">{isRTL ? 'مقالي' : 'Essay'}</option>
                                <option value="maqali">{isRTL ? 'مقالي' : 'Essay'}</option>
                                <option value="true_false">{isRTL ? 'صح/خطأ' : 'True/False'}</option>
                            </select>

                            <select
                                value={difficultyFilter}
                                onChange={(e) => setDifficultyFilter(e.target.value)}
                                className="px-4 py-2.5 bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-[#2e2e3a] rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                                <option value="all">{labels.allDifficulties}</option>
                                <option value="easy">{isRTL ? 'سهل' : 'Easy'}</option>
                                <option value="medium">{isRTL ? 'متوسط' : 'Medium'}</option>
                                <option value="hard">{isRTL ? 'صعب' : 'Hard'}</option>
                            </select>
                        </>
                    )}

                    {/* Add Button */}
                    {showAddButton && onAdd && (
                        <button
                            onClick={onAdd}
                            className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            {labels.addQuestion}
                        </button>
                    )}
                </div>
            )}

            {/* Loading */}
            {isLoading && (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse bg-white dark:bg-[#1c1c24] rounded-xl border border-gray-200 dark:border-[#2e2e3a] p-6">
                            <div className="h-4 bg-gray-200 dark:bg-[#2e2e3a] rounded w-1/4 mb-4" />
                            <div className="h-5 bg-gray-200 dark:bg-[#2e2e3a] rounded w-3/4 mb-4" />
                            <div className="space-y-2">
                                <div className="h-12 bg-gray-200 dark:bg-[#2e2e3a] rounded" />
                                <div className="h-12 bg-gray-200 dark:bg-[#2e2e3a] rounded" />
                                <div className="h-12 bg-gray-200 dark:bg-[#2e2e3a] rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* No Results */}
            {!isLoading && filteredQuestions.length === 0 && questions.length > 0 && (
                <div className="text-center py-12">
                    <Filter className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500 dark:text-gray-400">{labels.noResults}</p>
                </div>
            )}

            {/* Questions List */}
            {!isLoading && filteredQuestions.length > 0 && (
                <>
                    {allowReorder ? (
                        <Reorder.Group
                            axis="y"
                            values={filteredQuestions}
                            onReorder={handleReorder}
                            className="space-y-4"
                        >
                            {filteredQuestions.map((question, index) => (
                                <Reorder.Item
                                    key={question.id}
                                    value={question}
                                    className="cursor-grab active:cursor-grabbing"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="pt-4">
                                            <GripVertical className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <div className="flex-1">
                                            <QuestionCard
                                                {...question}
                                                language={language}
                                                index={index}
                                                variant={variant === 'admin' ? 'admin' : 'preview'}
                                                onEdit={onEdit}
                                                onDelete={onDelete}
                                                onDuplicate={onDuplicate}
                                            />
                                        </div>
                                    </div>
                                </Reorder.Item>
                            ))}
                        </Reorder.Group>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            <div className="space-y-4">
                                {filteredQuestions.map((question, index) => (
                                    <motion.div
                                        key={question.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ delay: index * 0.03 }}
                                    >
                                        <QuestionCard
                                            {...question}
                                            language={language}
                                            index={index}
                                            variant={variant === 'quiz' ? 'quiz' : variant === 'admin' ? 'admin' : 'preview'}
                                            onEdit={onEdit}
                                            onDelete={onDelete}
                                            onDuplicate={onDuplicate}
                                        />
                                    </motion.div>
                                ))}
                            </div>
                        </AnimatePresence>
                    )}
                </>
            )}

            {/* Count */}
            {!isLoading && filteredQuestions.length > 0 && (
                <p className="mt-6 text-sm text-center text-gray-500">
                    {isRTL
                        ? `عرض ${filteredQuestions.length} من ${questions.length} سؤال`
                        : `Showing ${filteredQuestions.length} of ${questions.length} questions`
                    }
                </p>
            )}
        </div>
    );
}

export default QuestionList;
