"use client";

import React from "react";
import { Search } from "lucide-react";

export interface FilterOption {
    value: string;
    label: string;
}

export interface SelectFilter {
    value: string;
    onChange: (value: string) => void;
    options: FilterOption[];
    placeholder?: string;
}

export interface AdminFiltersProps {
    searchValue: string;
    onSearchChange: (value: string) => void;
    searchPlaceholder?: string;
    filters?: SelectFilter[];
}

/**
 * AdminFilters - مكون الفلاتر الموحد لصفحات Admin
 */
export function AdminFilters({
    searchValue,
    onSearchChange,
    searchPlaceholder = "بحث...",
    filters = [],
}: AdminFiltersProps) {
    return (
        <div className="bg-white dark:bg-[#1c1c24] rounded-2xl p-4 border border-gray-200/60 dark:border-gray-800 flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchValue}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 border-none text-sm outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                />
            </div>

            {/* Select Filters */}
            {filters.map((filter, index) => (
                <select
                    key={index}
                    value={filter.value}
                    onChange={(e) => filter.onChange(e.target.value)}
                    className="px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm outline-none text-gray-700 dark:text-gray-300 min-w-[140px]"
                >
                    {filter.options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            ))}
        </div>
    );
}
