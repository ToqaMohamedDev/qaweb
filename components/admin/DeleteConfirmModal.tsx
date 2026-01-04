"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Trash2, Loader2 } from "lucide-react";

interface DeleteConfirmModalProps {
    isOpen: boolean;
    title: string;
    itemName: string;
    description?: string;
    isDeleting?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export function DeleteConfirmModal({
    isOpen,
    title,
    itemName,
    description = "هذا الإجراء لا يمكن التراجع عنه",
    isDeleting = false,
    onConfirm,
    onCancel,
}: DeleteConfirmModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    onClick={onCancel}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-md bg-white dark:bg-[#1c1c24] rounded-2xl shadow-2xl overflow-hidden"
                    >
                        {/* Red Header */}
                        <div className="h-2 bg-gradient-to-r from-red-500 to-rose-500"></div>

                        <div className="p-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/30">
                                    <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
                                    <p className="text-sm text-gray-500">{description}</p>
                                </div>
                            </div>

                            <p className="text-gray-600 dark:text-gray-400 mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                                هل أنت متأكد من حذف <span className="font-bold text-gray-900 dark:text-white">"{itemName}"</span>؟
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={onConfirm}
                                    disabled={isDeleting}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors disabled:opacity-50"
                                >
                                    {isDeleting ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="h-4 w-4" />
                                    )}
                                    {isDeleting ? "جاري الحذف..." : "نعم، احذف"}
                                </button>
                                <button
                                    onClick={onCancel}
                                    disabled={isDeleting}
                                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-[#2e2e3a] hover:bg-gray-50 dark:hover:bg-[#252530] font-semibold transition-colors disabled:opacity-50"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
