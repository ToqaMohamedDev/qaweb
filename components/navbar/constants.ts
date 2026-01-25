'use client';

// =============================================
// Navbar Constants - ثوابت شريط التنقل
// =============================================

import { Home, User, Gamepad2 } from 'lucide-react';
import type { NavItem } from './types';

// Navigation Items
export const navItems: readonly NavItem[] = [
    { href: '/', label: 'الرئيسية', icon: Home },
    { href: '/teachers', label: 'المدرسين', icon: User },
    { href: '/game', label: 'Quiz Battle', icon: Gamepad2 },
    // Admin link will be handled separately in components
] as const;

// Helper function to check if a path is active
export const isPathActive = (pathname: string, href: string): boolean => {
    if (href === '/') {
        return pathname === href;
    }
    return pathname.startsWith(href);
};