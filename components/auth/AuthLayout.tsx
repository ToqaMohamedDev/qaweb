"use client";

import React from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

interface AuthLayoutProps {
    children: React.ReactNode;
}

/**
 * AuthLayout - Layout wrapper for authentication pages
 * يوفر تخطيط موحد لصفحات المصادقة مع الخلفية المتحركة
 */
export function AuthLayout({ children }: AuthLayoutProps) {
    return (
        <div
            className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-[#0a0a0f] dark:via-[#121218] dark:to-[#0a0a0f] flex flex-col"
            dir="rtl"
        >
            {/* Background decoration */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-primary-200/20 dark:bg-primary-900/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-1/4 left-0 w-[400px] h-[400px] bg-primary-300/15 dark:bg-primary-800/10 rounded-full blur-[80px]" />
            </div>

            <Navbar />

            <main className="flex-1 flex items-center justify-center p-4 py-8 sm:py-12 relative z-10">
                <div className="w-full max-w-md">
                    {children}
                </div>
            </main>

            <Footer />
        </div>
    );
}
