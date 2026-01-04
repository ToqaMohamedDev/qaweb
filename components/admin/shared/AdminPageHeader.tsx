"use client";

import React from "react";
import { RefreshCw, Download, Plus, LucideIcon } from "lucide-react";

export interface AdminPageHeaderAction {
    icon: LucideIcon;
    label?: string;
    onClick: () => void;
    loading?: boolean;
    variant?: 'default' | 'primary';
}

export interface AdminPageHeaderProps {
    title: string;
    subtitle?: string;
    count?: number;
    actions?: AdminPageHeaderAction[];
    onRefresh?: () => void;
    onExport?: () => void;
    onAdd?: () => void;
    addLabel?: string;
    isLoading?: boolean;
}

/**
 * AdminPageHeader - رأس صفحة Admin موحد
 */
export function AdminPageHeader({
    title,
    subtitle,
    count,
    actions,
    onRefresh,
    onExport,
    onAdd,
    addLabel = "إضافة",
    isLoading = false,
}: AdminPageHeaderProps) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
                    {title}
                </h1>
                {(subtitle || count !== undefined) && (
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {subtitle}
                        {count !== undefined && ` (${count})`}
                    </p>
                )}
            </div>
            <div className="flex gap-3">
                {onRefresh && (
                    <button
                        onClick={onRefresh}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-gray-800 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                )}
                {onExport && (
                    <button
                        onClick={onExport}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-gray-800 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                        <Download className="h-4 w-4" />
                        <span>تصدير</span>
                    </button>
                )}
                {onAdd && (
                    <button
                        onClick={onAdd}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-medium hover:from-primary-600 hover:to-primary-700 transition-colors shadow-lg shadow-primary-500/25"
                    >
                        <Plus className="h-4 w-4" />
                        <span>{addLabel}</span>
                    </button>
                )}
                {actions?.map((action, index) => (
                    <button
                        key={index}
                        onClick={action.onClick}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${action.variant === 'primary'
                                ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 shadow-lg shadow-primary-500/25'
                                : 'bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                    >
                        <action.icon className={`h-4 w-4 ${action.loading ? 'animate-spin' : ''}`} />
                        {action.label && <span>{action.label}</span>}
                    </button>
                ))}
            </div>
        </div>
    );
}
