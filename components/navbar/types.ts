'use client';

// =============================================
// Navbar Types - أنواع شريط التنقل
// =============================================

import type { User } from '@supabase/supabase-js';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
    href: string;
    label: string;
    icon: LucideIcon;
}

export interface NavbarContextType {
    user: User | null;
    isUserAdmin: boolean;
    isMobileMenuOpen: boolean;
    isProfileMenuOpen: boolean;
    activePaths: Set<string>;
    handleSignOut: () => Promise<void>;
    handleCloseMobileMenu: () => void;
    handleToggleMobileMenu: () => void;
    setIsProfileMenuOpen: (value: boolean) => void;
}

export interface UserStats {
    points: number;
    rank: number;
    exams: number;
}
