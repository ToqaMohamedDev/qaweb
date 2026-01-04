'use client';

// =============================================
// Error Page - صفحة الخطأ العامة
// =============================================

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { logger } from '@/lib/utils/logger';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        logger.error('Application error occurred', { context: 'ErrorPage', data: { message: error.message, digest: error.digest } });
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#121218] dark:to-[#1a1a24] p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="glass-card rounded-3xl p-10 max-w-lg w-full text-center"
            >
                {/* Error Icon with Animation */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                        type: 'spring',
                        stiffness: 260,
                        damping: 20,
                        delay: 0.2,
                    }}
                    className="w-24 h-24 mx-auto mb-8 relative"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-red-400 to-rose-500 rounded-full blur-lg opacity-30 animate-pulse" />
                    <div className="relative w-full h-full bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center shadow-xl">
                        <AlertTriangle className="w-12 h-12 text-white" />
                    </div>
                </motion.div>

                {/* Error Title */}
                <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-3xl font-bold text-gray-900 dark:text-white mb-4"
                >
                    عذراً، حدث خطأ
                </motion.h1>

                {/* Error Description */}
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed"
                >
                    نعتذر عن هذا الخطأ غير المتوقع. يمكنك تجربة إعادة تحميل الصفحة
                    أو العودة إلى الصفحة الرئيسية.
                </motion.p>

                {/* Error Details (Development Only) */}
                {process.env.NODE_ENV === 'development' && error?.message && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl text-right"
                    >
                        <p className="text-sm font-mono text-red-600 dark:text-red-400 break-all">
                            {error.message}
                        </p>
                        {error.digest && (
                            <p className="text-xs text-red-500/70 mt-2">
                                Error ID: {error.digest}
                            </p>
                        )}
                    </motion.div>
                )}

                {/* Action Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex flex-col sm:flex-row gap-4 justify-center"
                >
                    <button
                        onClick={reset}
                        className="group flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-2xl font-semibold shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 transition-all duration-300"
                    >
                        <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                        إعادة المحاولة
                    </button>
                    <Link
                        href="/"
                        className="flex items-center justify-center gap-3 px-8 py-4 bg-gray-100 dark:bg-[#252530] hover:bg-gray-200 dark:hover:bg-[#2a2a38] text-gray-700 dark:text-gray-200 rounded-2xl font-semibold transition-all duration-300"
                    >
                        <Home className="w-5 h-5" />
                        الصفحة الرئيسية
                    </Link>
                </motion.div>

                {/* Back Button */}
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    onClick={() => window.history.back()}
                    className="mt-6 inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors text-sm"
                >
                    <ArrowLeft className="w-4 h-4" />
                    العودة للصفحة السابقة
                </motion.button>
            </motion.div>
        </div>
    );
}
