// =============================================
// CategoryDropdown Component - قائمة الفئات المنسدلة
// =============================================

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, CheckCircle2, Sparkles, BookOpen, Loader2 } from 'lucide-react';

export interface CategoryOption {
    id: string;
    name: string;
    icon?: React.ReactNode;
}

export interface CategoryDropdownProps {
    options: CategoryOption[];
    selectedId: string;
    onSelect: (id: string) => void;
    isOpen: boolean;
    onToggle: () => void;
    allLabel?: string;
    placeholder?: string;
    className?: string;
    isLoading?: boolean;
}

export function CategoryDropdown({
    options,
    selectedId,
    onSelect,
    isOpen,
    onToggle,
    allLabel = 'الكل',
    placeholder = 'اختر',
    className = '',
    isLoading = false,
}: CategoryDropdownProps) {
    const selectedOption = options.find(o => o.id === selectedId);
    const displayLabel = selectedId === 'all' ? allLabel : selectedOption?.name || placeholder;

    return (
        <div className={`relative flex-shrink-0 ${className}`}>
            {/* Trigger Button */}
            <motion.button
                onClick={onToggle}
                disabled={isLoading}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-gray-100 dark:bg-[#272727] hover:bg-gray-200 dark:hover:bg-[#333] text-gray-700 dark:text-white font-medium text-xs sm:text-sm transition-all ${isLoading ? 'opacity-70 cursor-wait' : ''}`}
                whileHover={{ scale: isLoading ? 1 : 1.02 }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
                type="button"
            >
                {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <BookOpen className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">{isLoading ? 'جاري التحميل...' : displayLabel}</span>
                <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </motion.button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40"
                            onClick={onToggle}
                        />

                        {/* Dropdown */}
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute top-full mt-2 right-0 w-64 max-h-80 overflow-y-auto bg-white dark:bg-[#212121] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#333] z-50"
                        >
                            <div className="p-2">
                                {/* All option */}
                                <button
                                    onClick={() => { onSelect('all'); onToggle(); }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-right transition-all ${selectedId === 'all'
                                        ? 'bg-gradient-to-l from-primary-500/20 to-primary-500/5 dark:from-red-500/20 dark:to-red-500/5 text-primary-600 dark:text-red-400'
                                        : 'hover:bg-gray-100 dark:hover:bg-[#2a2a2a] text-gray-700 dark:text-gray-200'
                                        }`}
                                    type="button"
                                >
                                    <Sparkles className="h-5 w-5" />
                                    <span className="font-medium">{allLabel}</span>
                                    {selectedId === 'all' && (
                                        <CheckCircle2 className="h-4 w-4 mr-auto text-primary-500 dark:text-red-500" />
                                    )}
                                </button>

                                {/* Divider */}
                                <div className="my-2 h-px bg-gray-200 dark:bg-[#333]" />

                                {/* Options list */}
                                {options.map((option) => (
                                    <button
                                        key={option.id}
                                        onClick={() => { onSelect(option.id); onToggle(); }}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-right transition-all ${selectedId === option.id
                                            ? 'bg-gradient-to-l from-primary-500/20 to-primary-500/5 dark:from-red-500/20 dark:to-red-500/5 text-primary-600 dark:text-red-400'
                                            : 'hover:bg-gray-100 dark:hover:bg-[#2a2a2a] text-gray-700 dark:text-gray-200'
                                            }`}
                                        type="button"
                                    >
                                        {option.icon || <BookOpen className="h-5 w-5" />}
                                        <span className="font-medium">{option.name}</span>
                                        {selectedId === option.id && (
                                            <CheckCircle2 className="h-4 w-4 mr-auto text-primary-500 dark:text-red-500" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

export default CategoryDropdown;
