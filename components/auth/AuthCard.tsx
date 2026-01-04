"use client";

import React from "react";
import { motion } from "framer-motion";

interface AuthCardProps {
    children: React.ReactNode;
}

/**
 * AuthCard - Card wrapper for auth forms
 * غلاف البطاقة لنماذج المصادقة
 */
export function AuthCard({ children }: AuthCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="relative rounded-2xl p-6 sm:p-8 bg-white dark:bg-[#1c1c24] border border-gray-200/60 dark:border-[#2e2e3a] shadow-xl"
        >
            {children}
        </motion.div>
    );
}
