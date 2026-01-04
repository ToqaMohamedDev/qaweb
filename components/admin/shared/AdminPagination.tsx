"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface AdminPaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    maxVisiblePages?: number;
}

/**
 * AdminPagination - مكون التنقل بين الصفحات
 */
export function AdminPagination({
    currentPage,
    totalPages,
    onPageChange,
    maxVisiblePages = 5,
}: AdminPaginationProps) {
    if (totalPages <= 1) return null;

    // Calculate visible page numbers
    const getVisiblePages = () => {
        const pages: number[] = [];
        const half = Math.floor(maxVisiblePages / 2);

        let start = Math.max(1, currentPage - half);
        let end = Math.min(totalPages, start + maxVisiblePages - 1);

        if (end - start + 1 < maxVisiblePages) {
            start = Math.max(1, end - maxVisiblePages + 1);
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        return pages;
    };

    const visiblePages = getVisiblePages();

    return (
        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200 dark:border-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">
                صفحة {currentPage} من {totalPages}
            </p>
            <div className="flex gap-2">
                {/* Previous Button */}
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronRight className="h-5 w-5" />
                </button>

                {/* First page if not visible */}
                {visiblePages[0] > 1 && (
                    <>
                        <button
                            onClick={() => onPageChange(1)}
                            className="w-8 h-8 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            1
                        </button>
                        {visiblePages[0] > 2 && (
                            <span className="w-8 h-8 flex items-center justify-center text-gray-400">
                                ...
                            </span>
                        )}
                    </>
                )}

                {/* Page Numbers */}
                {visiblePages.map((page) => (
                    <button
                        key={page}
                        onClick={() => onPageChange(page)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === page
                                ? "bg-primary-500 text-white"
                                : "hover:bg-gray-100 dark:hover:bg-gray-800"
                            }`}
                    >
                        {page}
                    </button>
                ))}

                {/* Last page if not visible */}
                {visiblePages[visiblePages.length - 1] < totalPages && (
                    <>
                        {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
                            <span className="w-8 h-8 flex items-center justify-center text-gray-400">
                                ...
                            </span>
                        )}
                        <button
                            onClick={() => onPageChange(totalPages)}
                            className="w-8 h-8 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            {totalPages}
                        </button>
                    </>
                )}

                {/* Next Button */}
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronLeft className="h-5 w-5" />
                </button>
            </div>
        </div>
    );
}
