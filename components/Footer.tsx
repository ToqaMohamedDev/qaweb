"use client";

import Link from "next/link";
import { Sparkles, Heart, Github, Twitter, Mail } from "lucide-react";
import { motion } from "framer-motion";

const footerLinks = {
    support: [
        { label: "الأسئلة الشائعة", href: "/faq" },
        { label: "اتصل بنا", href: "/contact" },
        { label: "الدعم الفني", href: "/support" },
    ],
    legal: [
        { label: "سياسة الخصوصية", href: "/privacy" },
        { label: "الشروط والأحكام", href: "/terms" },
    ],
};

export function Footer() {
    return (
        <footer
            className="mt-20 bg-gray-50 dark:bg-[#0d0d12] border-t border-gray-100 dark:border-[#2e2e3a]"
            dir="rtl"
            role="contentinfo"
            aria-label="Footer"
        >
            <div className="container mx-auto px-4 py-12 max-w-6xl">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    {/* Brand */}
                    <div className="md:col-span-1">
                        <Link
                            href="/"
                            className="flex items-center gap-2 mb-4"
                            aria-label="QAlaa - الصفحة الرئيسية"
                        >
                            <Sparkles className="h-8 w-8 text-primary-600 dark:text-primary-400" aria-hidden="true" />
                            <span className="text-xl font-bold gradient-text">QAlaa</span>
                        </Link>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                            منصة تعليمية حديثة للأسئلة والأجوبة بتصميم عصري ومميز.
                        </p>
                        <div className="flex items-center gap-3">
                            <motion.a
                                href="https://github.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                className="flex items-center justify-center h-10 w-10 rounded-full bg-gray-100 dark:bg-[#1c1c24] text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                                aria-label="زيارة صفحة GitHub"
                            >
                                <Github className="h-5 w-5" aria-hidden="true" />
                            </motion.a>
                            <motion.a
                                href="https://twitter.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                className="flex items-center justify-center h-10 w-10 rounded-full bg-gray-100 dark:bg-[#1c1c24] text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                                aria-label="زيارة صفحة Twitter"
                            >
                                <Twitter className="h-5 w-5" aria-hidden="true" />
                            </motion.a>
                            <motion.a
                                href="mailto:contact@qaalaa.com"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                className="flex items-center justify-center h-10 w-10 rounded-full bg-gray-100 dark:bg-[#1c1c24] text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                                aria-label="إرسال بريد إلكتروني"
                            >
                                <Mail className="h-5 w-5" aria-hidden="true" />
                            </motion.a>
                        </div>
                    </div>

                    {/* Support */}
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                            الدعم
                        </h3>
                        <ul className="space-y-2">
                            {footerLinks.support.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                            قانوني
                        </h3>
                        <ul className="space-y-2">
                            {footerLinks.legal.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom */}
                <div className="pt-8 border-t border-gray-200 dark:border-[#2e2e3a]">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                            © {new Date().getFullYear()} QAlaa. جميع الحقوق محفوظة.
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 text-sm flex items-center gap-1">
                            صُنع بـ <Heart className="h-4 w-4 text-primary-500 fill-primary-500" /> في مصر
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
