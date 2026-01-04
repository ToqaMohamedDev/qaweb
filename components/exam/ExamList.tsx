'use client';

/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                      EXAM LIST - قائمة الامتحانات                         ║
 * ║                                                                          ║
 * ║  مكون لعرض قائمة الامتحانات مع الفلترة والبحث                            ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Filter,
    Grid,
    List,
    BookOpen,
    RefreshCw
} from 'lucide-react';
import { ExamCard, type ExamCardProps } from './ExamCard';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface ExamData extends Omit<ExamCardProps, 'onEdit' | 'onDelete' | 'onView' | 'variant' | 'showActions' | 'className'> { }

export interface ExamListProps {
    exams: ExamData[];
    isLoading?: boolean;
    language?: 'arabic' | 'english';

    // Actions
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
    onView?: (id: string) => void;
    onRefresh?: () => void;

    // Display options
    variant?: 'default' | 'admin';
    showFilters?: boolean;
    showSearch?: boolean;
    showViewToggle?: boolean;
    emptyMessage?: string;
    className?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function ExamList({
    exams,
    isLoading = false,
    language = 'arabic',
    onEdit,
    onDelete,
    onView,
    onRefresh,
    variant = 'default',
    showFilters = true,
    showSearch = true,
    showViewToggle = true,
    emptyMessage,
    className = '',
}: ExamListProps) {
    const isRTL = language === 'arabic';

    // State
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Filtered exams
    const filteredExams = useMemo(() => {
        return exams.filter(exam => {
            const matchesSearch = !searchQuery ||
                exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                exam.description?.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus = statusFilter === 'all' || exam.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [exams, searchQuery, statusFilter]);

    // Empty state
    if (!isLoading && exams.length === 0) {
        return (
            <div className={`text-center py-16 ${className}`} dir={isRTL ? 'rtl' : 'ltr'}>
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-[#2e2e3a] flex items-center justify-center">
                    <BookOpen className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {isRTL ? 'لا توجد امتحانات' : 'No Exams Found'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                    {emptyMessage || (isRTL ? 'لم يتم إنشاء أي امتحانات بعد' : 'No exams have been created yet')}
                </p>
            </div>
        );
    }

    return (
        <div className={className} dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Toolbar */}
            {(showSearch || showFilters || showViewToggle) && (
                <div className="flex flex-wrap items-center gap-4 mb-6">
                    {/* Search */}
                    {showSearch && (
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute top-1/2 -translate-y-1/2 start-3 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={isRTL ? 'البحث عن امتحان...' : 'Search exams...'}
                                className="w-full ps-10 pe-4 py-2.5 bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-[#2e2e3a] rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                            />
                        </div>
                    )}

                    {/* Filters */}
                    {showFilters && (
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2.5 bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-[#2e2e3a] rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                            <option value="all">{isRTL ? 'كل الحالات' : 'All Status'}</option>
                            <option value="published">{isRTL ? 'منشور' : 'Published'}</option>
                            <option value="draft">{isRTL ? 'مسودة' : 'Draft'}</option>
                            <option value="archived">{isRTL ? 'مؤرشف' : 'Archived'}</option>
                        </select>
                    )}

                    {/* View Toggle */}
                    {showViewToggle && (
                        <div className="flex items-center bg-gray-100 dark:bg-[#2e2e3a] rounded-lg p-1">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-md transition-colors ${viewMode === 'grid'
                                        ? 'bg-white dark:bg-[#1c1c24] text-primary-500 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <Grid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-md transition-colors ${viewMode === 'list'
                                        ? 'bg-white dark:bg-[#1c1c24] text-primary-500 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <List className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* Refresh */}
                    {onRefresh && (
                        <button
                            onClick={onRefresh}
                            disabled={isLoading}
                            className="p-2.5 bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-[#2e2e3a] rounded-xl text-gray-500 hover:text-primary-500 hover:border-primary-500 transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                    )}
                </div>
            )}

            {/* Loading State */}
            {isLoading && (
                <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="animate-pulse bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200 dark:border-[#2e2e3a] p-6">
                            <div className="h-4 bg-gray-200 dark:bg-[#2e2e3a] rounded w-1/4 mb-4" />
                            <div className="h-6 bg-gray-200 dark:bg-[#2e2e3a] rounded w-3/4 mb-2" />
                            <div className="h-4 bg-gray-200 dark:bg-[#2e2e3a] rounded w-full mb-6" />
                            <div className="grid grid-cols-3 gap-4">
                                <div className="h-16 bg-gray-200 dark:bg-[#2e2e3a] rounded" />
                                <div className="h-16 bg-gray-200 dark:bg-[#2e2e3a] rounded" />
                                <div className="h-16 bg-gray-200 dark:bg-[#2e2e3a] rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Results */}
            {!isLoading && filteredExams.length === 0 && exams.length > 0 && (
                <div className="text-center py-12">
                    <Filter className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500 dark:text-gray-400">
                        {isRTL ? 'لا توجد نتائج مطابقة للبحث' : 'No matching results found'}
                    </p>
                </div>
            )}

            {/* Exam Grid/List */}
            {!isLoading && filteredExams.length > 0 && (
                <AnimatePresence mode="wait">
                    <motion.div
                        key={viewMode}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`grid gap-6 ${viewMode === 'grid'
                                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                                : 'grid-cols-1'
                            }`}
                    >
                        {filteredExams.map((exam, index) => (
                            <motion.div
                                key={exam.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <ExamCard
                                    {...exam}
                                    variant={viewMode === 'list' ? 'compact' : variant}
                                    onEdit={onEdit}
                                    onDelete={onDelete}
                                    onView={onView}
                                    showActions={variant === 'admin'}
                                />
                            </motion.div>
                        ))}
                    </motion.div>
                </AnimatePresence>
            )}

            {/* Results count */}
            {!isLoading && filteredExams.length > 0 && (
                <p className="mt-6 text-sm text-center text-gray-500">
                    {isRTL
                        ? `عرض ${filteredExams.length} من ${exams.length} امتحان`
                        : `Showing ${filteredExams.length} of ${exams.length} exams`
                    }
                </p>
            )}
        </div>
    );
}

export default ExamList;
