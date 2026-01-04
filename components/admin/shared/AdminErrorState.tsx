"use client";

import React from "react";
import { AlertCircle } from "lucide-react";

export interface AdminErrorStateProps {
    message?: string;
    onRetry?: () => void;
}

/**
 * AdminErrorState - حالة الخطأ لصفحات Admin
 */
export function AdminErrorState({
    message = "حدث خطأ في جلب البيانات",
    onRetry
}: AdminErrorStateProps) {
    return (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 dark:text-red-400">{message}</p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="mt-4 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                >
                    إعادة المحاولة
                </button>
            )}
        </div>
    );
}
