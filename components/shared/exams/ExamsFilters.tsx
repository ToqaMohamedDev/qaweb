'use client';

// ═══════════════════════════════════════════════════════════════════════════
// ExamsFilters - فلاتر مشتركة لصفحات الامتحانات
// ═══════════════════════════════════════════════════════════════════════════

import { Search, Filter, X, Globe, CheckCircle2, Clock } from 'lucide-react';
import type { ExamsFiltersProps, ExamLanguage, ExamStatusFilter } from './types';

const LANGUAGE_OPTIONS: { value: ExamLanguage; label: string }[] = [
    { value: 'all', label: 'كل اللغات' },
    { value: 'arabic', label: 'عربي' },
    { value: 'english', label: 'English' },
];

const STATUS_OPTIONS: { value: ExamStatusFilter; label: string; icon?: React.ReactNode }[] = [
    { value: 'all', label: 'كل الحالات' },
    { value: 'published', label: 'منشور', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
    { value: 'draft', label: 'مسودة', icon: <Clock className="h-3.5 w-3.5" /> },
];

const SEMESTER_OPTIONS = [
    { value: '', label: 'كل الفصول' },
    { value: 'first', label: 'الترم الأول' },
    { value: 'second', label: 'الترم الثاني' },
    { value: 'full_year', label: 'سنة كاملة' },
];

export function ExamsFilters({
    searchQuery,
    onSearchChange,
    filterLanguage,
    onLanguageChange,
    filterStatus,
    onStatusChange,
    hasActiveFilters,
    onClearFilters,
    // Extended filters
    stages,
    subjects,
    selectedStage,
    onStageChange,
    selectedSubject,
    onSubjectChange,
    selectedSemester,
    onSemesterChange,
}: ExamsFiltersProps) {
    const hasExtendedFilters = stages || subjects;

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="ابحث عن امتحان..."
                        className="w-full pl-4 pr-12 py-3 bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-[#2e2e3a] rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => onSearchChange('')}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {/* Clear Filters Button */}
                {hasActiveFilters && onClearFilters && (
                    <button
                        onClick={onClearFilters}
                        className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    >
                        <X className="h-4 w-4" />
                        <span className="text-sm font-medium">مسح الفلاتر</span>
                    </button>
                )}
            </div>

            {/* Basic Filters */}
            <div className="flex flex-wrap gap-3">
                {/* Language Filter */}
                <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
                    <Globe className="h-4 w-4 text-gray-500 mr-2" />
                    {LANGUAGE_OPTIONS.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => onLanguageChange(option.value)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                filterLanguage === option.value
                                    ? 'bg-white dark:bg-[#1c1c24] text-primary-600 shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
                    <Filter className="h-4 w-4 text-gray-500 mr-2" />
                    {STATUS_OPTIONS.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => onStatusChange(option.value)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                filterStatus === option.value
                                    ? 'bg-white dark:bg-[#1c1c24] text-primary-600 shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            {option.icon}
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Extended Filters (for Admin) */}
            {hasExtendedFilters && (
                <div className="flex flex-wrap gap-3">
                    {/* Stage Filter */}
                    {stages && onStageChange && (
                        <select
                            value={selectedStage || ''}
                            onChange={(e) => onStageChange(e.target.value)}
                            className="px-4 py-2.5 bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-[#2e2e3a] rounded-xl text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                        >
                            <option value="">كل المراحل</option>
                            {stages.map((stage) => (
                                <option key={stage.id} value={stage.id}>
                                    {stage.name}
                                </option>
                            ))}
                        </select>
                    )}

                    {/* Subject Filter */}
                    {subjects && onSubjectChange && (
                        <select
                            value={selectedSubject || ''}
                            onChange={(e) => onSubjectChange(e.target.value)}
                            className="px-4 py-2.5 bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-[#2e2e3a] rounded-xl text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                        >
                            <option value="">كل المواد</option>
                            {subjects.map((subject) => (
                                <option key={subject.id} value={subject.id}>
                                    {subject.name}
                                </option>
                            ))}
                        </select>
                    )}

                    {/* Semester Filter */}
                    {onSemesterChange && (
                        <select
                            value={selectedSemester || ''}
                            onChange={(e) => onSemesterChange(e.target.value)}
                            className="px-4 py-2.5 bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-[#2e2e3a] rounded-xl text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                        >
                            {SEMESTER_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
            )}
        </div>
    );
}
