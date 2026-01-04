'use client';

// =============================================
// Not Found Page - صفحة 404
// =============================================

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, Search, ArrowLeft, Compass } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#121218] dark:to-[#1a1a24] p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center max-w-lg w-full"
            >
                {/* 404 Number with Animation */}
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                        type: 'spring',
                        stiffness: 200,
                        damping: 15,
                        delay: 0.1,
                    }}
                    className="relative mb-8"
                >
                    <div className="text-[180px] font-black text-transparent bg-clip-text bg-gradient-to-br from-primary-300 to-primary-600 dark:from-primary-400 dark:to-primary-700 leading-none select-none">
                        404
                    </div>
                    {/* Floating Compass Icon */}
                    <motion.div
                        animate={{
                            y: [-5, 5, -5],
                            rotate: [-5, 5, -5],
                        }}
                        transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                        className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg"
                    >
                        <Compass className="w-8 h-8 text-white" />
                    </motion.div>
                </motion.div>

                {/* Title */}
                <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-3xl font-bold text-gray-900 dark:text-white mb-4"
                >
                    الصفحة غير موجودة
                </motion.h1>

                {/* Description */}
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-gray-600 dark:text-gray-400 mb-10 text-lg leading-relaxed"
                >
                    عذراً، لم نتمكن من العثور على الصفحة التي تبحث عنها.
                    ربما تم نقلها أو حذفها.
                </motion.p>

                {/* Action Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex flex-col sm:flex-row gap-4 justify-center"
                >
                    <Link
                        href="/"
                        className="group flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-2xl font-semibold shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 transition-all duration-300"
                    >
                        <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        الصفحة الرئيسية
                    </Link>
                    <Link
                        href="/arabic"
                        className="flex items-center justify-center gap-3 px-8 py-4 bg-gray-100 dark:bg-[#252530] hover:bg-gray-200 dark:hover:bg-[#2a2a38] text-gray-700 dark:text-gray-200 rounded-2xl font-semibold transition-all duration-300"
                    >
                        <Search className="w-5 h-5" />
                        استكشف الدروس
                    </Link>
                </motion.div>

                {/* Quick Links */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="mt-12 pt-8 border-t border-gray-200 dark:border-[#2e2e3a]"
                >
                    <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                        روابط سريعة
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        {[
                            { href: '/arabic', label: 'اللغة العربية' },
                            { href: '/english', label: 'English' },
                            { href: '/teachers', label: 'المعلمين' },
                            { href: '/game', label: 'Quiz Battle' },
                        ].map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="px-4 py-2 rounded-full text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </motion.div>

                {/* Back Button */}
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    onClick={() => window.history.back()}
                    className="mt-8 inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors text-sm"
                >
                    <ArrowLeft className="w-4 h-4" />
                    العودة للصفحة السابقة
                </motion.button>
            </motion.div>
        </div>
    );
}
