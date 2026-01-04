// =============================================
// SearchBar Component - شريط البحث
// =============================================

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';

export interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export function SearchBar({
    value,
    onChange,
    placeholder = 'ابحث...',
    className = '',
}: SearchBarProps) {
    return (
        <div className={`flex-1 relative group ${className}`}>
            {/* Glow Effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-500/20 via-purple-500/20 to-blue-500/20 dark:from-red-500/20 dark:via-orange-500/20 dark:to-yellow-500/20 rounded-xl opacity-0 group-focus-within:opacity-100 blur-md transition-all duration-500" />

            {/* Input Container */}
            <div className="relative flex items-center bg-gray-100/90 dark:bg-[#121212]/90 border-2 border-transparent focus-within:border-primary-500/50 dark:focus-within:border-red-500/50 rounded-xl overflow-hidden shadow-sm focus-within:shadow-lg transition-all duration-300">
                <Search className="h-5 w-5 text-gray-400 dark:text-[#717171] mr-3" />

                <input
                    type="text"
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="flex-1 bg-transparent py-2.5 sm:py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#717171] focus:outline-none text-sm"
                />

                {/* Clear Button */}
                <AnimatePresence>
                    {value && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            onClick={() => onChange('')}
                            className="p-2 hover:bg-gray-200 dark:hover:bg-[#272727] rounded-full transition-colors ml-1"
                            type="button"
                        >
                            <X className="h-4 w-4 text-gray-500" />
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

export default SearchBar;
