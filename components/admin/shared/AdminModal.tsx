"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";

export interface AdminModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    onSave?: () => void;
    saveLabel?: string;
    cancelLabel?: string;
    isSaving?: boolean;
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

/**
 * AdminModal - Modal موحد لصفحات Admin
 */
export function AdminModal({
    isOpen,
    onClose,
    title,
    children,
    footer,
    onSave,
    saveLabel = "حفظ",
    cancelLabel = "إلغاء",
    isSaving = false,
    size = 'lg',
}: AdminModalProps) {
    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className={`bg-white dark:bg-[#1c1c24] rounded-2xl p-6 w-full ${sizeClasses[size]} max-h-[90vh] overflow-y-auto`}
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {title}
                            </h2>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Content */}
                        {children}

                        {/* Footer */}
                        {footer || (onSave && (
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={onClose}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                >
                                    {cancelLabel}
                                </button>
                                <button
                                    onClick={onSave}
                                    disabled={isSaving}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-primary-500 text-white font-medium disabled:opacity-50 hover:bg-primary-600 transition-colors flex items-center justify-center gap-2"
                                >
                                    {isSaving ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        saveLabel
                                    )}
                                </button>
                            </div>
                        ))}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
