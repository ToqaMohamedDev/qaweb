'use client';

// =============================================
// NavLogo - شعار الموقع
// =============================================

import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export function NavLogo() {
    return (
        <Link
            href="/"
            className="flex items-center gap-3 group flex-shrink-0"
            aria-label="QAlaa - الصفحة الرئيسية"
        >
            <div className="p-2.5 rounded-2xl bg-primary-100 dark:bg-primary-900/40 group-hover:bg-primary-200 dark:group-hover:bg-primary-900/60 transition-colors">
                <Sparkles className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <span className="text-xl font-extrabold bg-gradient-to-r from-primary-600 to-pink-600 bg-clip-text text-transparent hidden sm:block">
                QAlaa
            </span>
        </Link>
    );
}
