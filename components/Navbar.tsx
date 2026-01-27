'use client';

// =============================================
// Navbar - شريط التنقل (Refactored)
// Uses useAuthStore for auth state (fixed for Vercel/OAuth)
// =============================================

import { useState, useEffect, useMemo, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X } from 'lucide-react';

import { ThemeToggle } from './ThemeToggle';
import { NotificationDropdown } from './NotificationDropdown';
import { NavLogo } from './navbar/NavLogo';
import { DesktopNav } from './navbar/DesktopNav';
import { UserProfileDropdown } from './navbar/UserProfileDropdown';
import { MobileMenu } from './navbar/MobileMenu';
import { AuthButtons } from './navbar/AuthButtons';
import { navItems, isPathActive } from './navbar/constants';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { signOut } from '@/lib/supabase';
import { logger } from '@/lib/utils/logger';

export function Navbar() {
    const pathname = usePathname();
    const router = useRouter();

    // Get auth state from the store (fed by AuthProvider via API Mediator)
    const { user, isLoading } = useAuthStore();

    // State
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

    // Derive admin/teacher status from user profile
    const isUserAdmin = user?.role === 'admin';
    const isApprovedTeacher = user?.role === 'teacher' && user?.isTeacherApproved === true;

    // Memoize active path calculation
    const activePaths = useMemo(
        () => new Set(navItems.filter(item => isPathActive(pathname, item.href)).map(item => item.href)),
        [pathname]
    );

    // Close menus when pathname changes
    useEffect(() => {
        setIsMobileMenuOpen(false);
        setIsProfileMenuOpen(false);
    }, [pathname]);

    // Handlers
    const handleSignOut = useCallback(async () => {
        try {
            // 1. إغلاق القوائم فوراً (UI feedback)
            setIsMobileMenuOpen(false);
            setIsProfileMenuOpen(false);

            // 2. مسح الـ localStorage فوراً (sync operation)
            if (typeof window !== 'undefined') {
                localStorage.removeItem('auth-storage');
                const keys = Object.keys(localStorage);
                keys.forEach(key => {
                    if (key.startsWith('sb-') || key.includes('supabase')) {
                        localStorage.removeItem(key);
                    }
                });
                sessionStorage.clear();
            }

            // 3. مسح الـ store فوراً (sync operation)
            useAuthStore.getState().reset();

            // 4. الانتقال لصفحة login فوراً
            router.push('/login');

            // 5. في الخلفية: تنظيف السيرفر والـ Supabase (non-blocking)
            Promise.all([
                fetch('/api/auth/logout', { method: 'POST' }).catch(() => {}),
                signOut().catch(() => {})
            ]).catch(() => {});

        } catch (error) {
            logger.error('Error signing out', { context: 'Navbar', data: error });
            // حتى لو في error، امسح الـ store وروح login
            useAuthStore.getState().reset();
            router.push('/login');
        }
    }, [router]);

    const handleToggleMobileMenu = useCallback(() => {
        setIsMobileMenuOpen(prev => !prev);
    }, []);

    const handleCloseMobileMenu = useCallback(() => {
        setIsMobileMenuOpen(false);
    }, []);

    // Create a pseudo-user object for components that expect Supabase User type
    const supabaseStyleUser = user ? {
        id: user.id,
        email: user.email,
        user_metadata: {
            name: user.name,
            avatar_url: user.avatarUrl,
        }
    } : null;

    return (
        <>
            <nav
                className="fixed top-0 left-0 right-0 z-50 h-[72px] flex items-center bg-white dark:bg-[#121218] shadow-sm border-b border-gray-200 dark:border-[#2e2e3a]"
                dir="rtl"
            >
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
                    <div className="flex items-center justify-between gap-4">
                        {/* Logo */}
                        <NavLogo />

                        {/* Desktop Navigation */}
                        <DesktopNav activePaths={activePaths} isUserAdmin={isUserAdmin} />

                        {/* Actions */}
                        <div className="flex items-center gap-2.5 flex-shrink-0">
                            {/* Notifications */}
                            <NotificationDropdown />

                            <ThemeToggle />

                            {/* Desktop Auth - Always show something */}
                            <div className="hidden md:flex items-center gap-2.5">
                                {user ? (
                                    <UserProfileDropdown
                                        user={supabaseStyleUser as any}
                                        isUserAdmin={isUserAdmin}
                                        isApprovedTeacher={isApprovedTeacher}
                                        isOpen={isProfileMenuOpen}
                                        onToggle={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                        onClose={() => setIsProfileMenuOpen(false)}
                                        onSignOut={handleSignOut}
                                    />
                                ) : (
                                    <AuthButtons />
                                )}
                            </div>

                            {/* Mobile Menu Button */}
                            <button
                                onClick={handleToggleMobileMenu}
                                className="md:hidden flex items-center justify-center h-10 w-10 rounded-xl bg-gray-100 dark:bg-[#1c1c24] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#252530] transition-colors border border-gray-200/50 dark:border-[#2e2e3a]/50"
                                aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                                aria-expanded={isMobileMenuOpen}
                            >
                                {isMobileMenuOpen ? (
                                    <X className="h-5 w-5" />
                                ) : (
                                    <Menu className="h-5 w-5" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu */}
            <MobileMenu
                isOpen={isMobileMenuOpen}
                user={supabaseStyleUser as any}
                isUserAdmin={isUserAdmin}
                activePaths={activePaths}
                onClose={handleCloseMobileMenu}
                onSignOut={handleSignOut}
            />

            {/* Fixed Spacer */}
            <div className="h-[72px]" />
        </>
    );
}
