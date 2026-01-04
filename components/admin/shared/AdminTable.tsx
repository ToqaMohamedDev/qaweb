// =============================================
// AdminTable Component - جدول Admin موحد
// =============================================

"use client";

import React from "react";
import { motion } from "framer-motion";
import { Loader2, AlertCircle, Search, RefreshCw } from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface Column<T> {
    key: string;
    header: string;
    render: (item: T, index: number) => React.ReactNode;
    width?: string;
    align?: "left" | "center" | "right";
    sortable?: boolean;
}

export interface AdminTableProps<T> {
    columns: Column<T>[];
    data: T[];
    keyExtractor: (item: T) => string;
    emptyMessage?: string;
    emptyIcon?: React.ReactNode;
    isLoading?: boolean;
    error?: string | null;
    onRetry?: () => void;
    onRowClick?: (item: T) => void;
    selectedRows?: Set<string>;
    onSelectRow?: (id: string) => void;
    showSearch?: boolean;
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    searchPlaceholder?: string;
    headerActions?: React.ReactNode;
    stickyHeader?: boolean;
    striped?: boolean;
    compact?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════

export function AdminTable<T>({
    columns,
    data,
    keyExtractor,
    emptyMessage = "لا توجد نتائج",
    emptyIcon,
    isLoading = false,
    error = null,
    onRetry,
    onRowClick,
    selectedRows,
    showSearch = false,
    searchValue = "",
    onSearchChange,
    searchPlaceholder = "بحث...",
    headerActions,
    stickyHeader = false,
    striped = false,
    compact = false,
}: AdminTableProps<T>) {
    // ═══════════════════════════════════════════════════════════════════════
    // Loading State
    // ═══════════════════════════════════════════════════════════════════════

    if (isLoading) {
        return (
            <TableContainer>
                <div className="flex flex-col items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-primary-500 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">جاري التحميل...</p>
                </div>
            </TableContainer>
        );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Error State
    // ═══════════════════════════════════════════════════════════════════════

    if (error) {
        return (
            <TableContainer>
                <div className="flex flex-col items-center justify-center py-16">
                    <div className="p-4 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                        <AlertCircle className="h-8 w-8 text-red-500" />
                    </div>
                    <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                    {onRetry && (
                        <button
                            onClick={onRetry}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                        >
                            <RefreshCw className="h-4 w-4" />
                            إعادة المحاولة
                        </button>
                    )}
                </div>
            </TableContainer>
        );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Cell Padding
    // ═══════════════════════════════════════════════════════════════════════

    const cellPadding = compact ? "px-3 py-2" : "px-5 py-4";

    // ═══════════════════════════════════════════════════════════════════════
    // Render
    // ═══════════════════════════════════════════════════════════════════════

    return (
        <TableContainer>
            {/* Optional Header with Search & Actions */}
            {(showSearch || headerActions) && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-b border-gray-200 dark:border-gray-800">
                    {showSearch && onSearchChange && (
                        <div className="relative w-full sm:w-auto sm:min-w-[300px]">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchValue}
                                onChange={(e) => onSearchChange(e.target.value)}
                                placeholder={searchPlaceholder}
                                className="w-full pr-10 pl-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                    )}
                    {headerActions && <div className="flex gap-2">{headerActions}</div>}
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead
                        className={`bg-gray-50 dark:bg-gray-800/50 ${stickyHeader ? "sticky top-0 z-10" : ""
                            }`}
                    >
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    className={`${cellPadding} text-${column.align || "right"} text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider`}
                                    style={column.width ? { width: column.width } : undefined}
                                >
                                    {column.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                        {data.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={columns.length}
                                    className="px-5 py-16 text-center"
                                >
                                    <EmptyState message={emptyMessage} icon={emptyIcon} />
                                </td>
                            </tr>
                        ) : (
                            data.map((item, index) => {
                                const itemKey = keyExtractor(item);
                                const isSelected = selectedRows?.has(itemKey);

                                return (
                                    <motion.tr
                                        key={itemKey}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.02 }}
                                        onClick={() => onRowClick?.(item)}
                                        className={`
                                            ${onRowClick ? "cursor-pointer" : ""}
                                            ${isSelected ? "bg-primary-50 dark:bg-primary-900/20" : ""}
                                            ${striped && index % 2 === 1 ? "bg-gray-50/50 dark:bg-gray-800/20" : ""}
                                            hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors
                                        `}
                                    >
                                        {columns.map((column) => (
                                            <td
                                                key={column.key}
                                                className={`${cellPadding} text-${column.align || "right"}`}
                                            >
                                                {column.render(item, index)}
                                            </td>
                                        ))}
                                    </motion.tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </TableContainer>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// Helper Components
// ═══════════════════════════════════════════════════════════════════════════

function TableContainer({ children }: { children: React.ReactNode }) {
    return (
        <div className="bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200/60 dark:border-gray-800 overflow-hidden">
            {children}
        </div>
    );
}

function EmptyState({ message, icon }: { message: string; icon?: React.ReactNode }) {
    return (
        <div className="flex flex-col items-center">
            {icon ? (
                <div className="mb-4">{icon}</div>
            ) : (
                <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                    <Search className="h-7 w-7 text-gray-400" />
                </div>
            )}
            <p className="text-gray-500 dark:text-gray-400 text-sm">{message}</p>
        </div>
    );
}

export default AdminTable;
