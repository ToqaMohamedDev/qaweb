"use client";

import React from "react";
import { uiText } from "@/lib/constants/messages";

/**
 * AuthDivider - Divider with "أو" text
 * فاصل مع نص "أو"
 */
export function AuthDivider() {
    return (
        <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-[#2e2e3a]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white dark:bg-[#1c1c24] text-gray-500 dark:text-gray-400 font-medium">
                    {uiText.or}
                </span>
            </div>
        </div>
    );
}
