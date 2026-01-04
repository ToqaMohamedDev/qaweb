"use client";

import React from "react";
import { Loader2 } from "lucide-react";

export interface AdminLoadingStateProps {
    message?: string;
}

/**
 * AdminLoadingState - حالة التحميل لصفحات Admin
 */
export function AdminLoadingState({ message = "جاري التحميل..." }: AdminLoadingStateProps) {
    return (
        <div className="flex flex-col items-center justify-center h-96 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">{message}</p>
        </div>
    );
}
