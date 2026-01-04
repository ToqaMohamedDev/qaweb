"use client";

import React from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface AuthHeaderProps {
    icon: LucideIcon;
    title: string;
    subtitle: string;
}

/**
 * AuthHeader - Animated header for auth pages
 * عنوان متحرك لصفحات المصادقة
 */
export function AuthHeader({ icon: Icon, title, subtitle }: AuthHeaderProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
        >
            {/* Icon */}
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-xl shadow-primary-500/30 mb-5"
            >
                <Icon className="h-8 w-8 text-white" />
            </motion.div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
                {title}
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                {subtitle}
            </p>
        </motion.div>
    );
}
