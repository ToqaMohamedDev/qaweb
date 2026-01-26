'use client';

// =============================================
// Navbar Constants - ثوابت شريط التنقل
// =============================================

import { Home, User, BookOpen } from 'lucide-react';
import type { NavItem } from './types';

// Navigation Items
export const navItems: readonly NavItem[] = [
    { href: '/', label: 'الرئيسية', icon: Home },
    { href: '/teachers', label: 'المدرسين', icon: User },
    { href: '/words', label: 'تعلم الكلمات', icon: BookOpen },
    // Admin link will be handled separately in components
] as const;

// Helper function to check if a path is active
export const isPathActive = (pathname: string, href: string): boolean => {
    if (href === '/') {
        return pathname === href;
    }
    return pathname.startsWith(href);
};