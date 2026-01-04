"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface AuthAlertProps {
    type: "error" | "success";
    message: string;
}

/**
 * AuthAlert - Animated alert for auth pages
 * تنبيه متحرك لصفحات المصادقة
 */
export function AuthAlert({ type, message }: AuthAlertProps) {
    if (!message) return null;

    const isError = type === "error";
    const Icon = isError ? AlertCircle : CheckCircle2;

    return (
        <AnimatePresence mode="wait">
            <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                transition={{ duration: 0.3 }}
                className={`mb-5 p-4 rounded-xl flex items-start gap-3 ${isError
                        ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50"
                        : "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50"
                    }`}
            >
                <Icon
                    className={`h-5 w-5 shrink-0 mt-0.5 ${isError
                            ? "text-red-600 dark:text-red-400"
                            : "text-green-600 dark:text-green-400"
                        }`}
                />
                <p
                    className={`text-sm flex-1 ${isError
                            ? "text-red-700 dark:text-red-300"
                            : "text-green-700 dark:text-green-300"
                        }`}
                >
                    {message}
                </p>
            </motion.div>
        </AnimatePresence>
    );
}
