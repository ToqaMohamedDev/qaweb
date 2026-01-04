'use client';

// =============================================
// AuthButtons - أزرار تسجيل الدخول
// =============================================

import Link from 'next/link';
import { LogIn, UserPlus } from 'lucide-react';

export function AuthButtons() {
    return (
        <>
            <Link
                href="/login"
                aria-label="تسجيل الدخول"
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1c1c24] transition-colors border border-gray-200/50 dark:border-[#2e2e3a]/50"
            >
                <LogIn className="h-4 w-4" />
                <span>تسجيل الدخول</span>
            </Link>
            <Link
                href="/signup"
                aria-label="إنشاء حساب جديد"
                className="flex items-center gap-2 px-5 py-2 rounded-full bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold transition-colors"
            >
                <UserPlus className="h-4 w-4" />
                <span>إنشاء حساب</span>
            </Link>
        </>
    );
}
