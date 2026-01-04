"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

interface AuthFooterLinkProps {
    text: string;
    linkText: string;
    href: string;
}

/**
 * AuthFooterLink - Footer link component for auth pages
 * رابط التذييل لصفحات المصادقة
 */
export function AuthFooterLink({ text, linkText, href }: AuthFooterLinkProps) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 text-center"
        >
            <p className="text-gray-600 dark:text-gray-400 text-sm">
                {text}{" "}
                <Link
                    href={href}
                    className="text-primary-600 dark:text-primary-400 font-semibold hover:text-primary-700 dark:hover:text-primary-300 hover:underline inline-flex items-center gap-1.5 transition-colors group"
                >
                    {linkText}
                    <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                </Link>
            </p>
        </motion.div>
    );
}
