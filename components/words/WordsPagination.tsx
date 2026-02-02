"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface WordsPaginationProps {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    className?: string;
}

export function WordsPagination({
    page,
    totalPages,
    onPageChange,
    className = "",
}: WordsPaginationProps) {
    if (totalPages <= 1) return null;

    return (
        <div className={`flex items-center justify-center gap-2 ${className}`}>
            <button
                onClick={() => onPageChange(page - 1)}
                disabled={page === 1}
                className="p-2 rounded-lg bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="الصفحة السابقة"
            >
                <ChevronRight className="w-5 h-5" />
            </button>
            <span className="px-4 py-2 text-sm text-zinc-400">
                صفحة {page} من {totalPages}
            </span>
            <button
                onClick={() => onPageChange(page + 1)}
                disabled={page === totalPages}
                className="p-2 rounded-lg bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="الصفحة التالية"
            >
                <ChevronLeft className="w-5 h-5" />
            </button>
        </div>
    );
}
