'use client';

// =============================================
// Navbar - شريط التنقل (Refactored)
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
import { supabase, signOut, isAdmin } from '@/lib/supabase';
import { logger } from '@/lib/utils/logger';
import type { User } from '@supabase/supabase-js';

export function Navbar() {
    const pathname = usePathname();
    const router = useRouter();

    // State
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [isUserAdmin, setIsUserAdmin] = useState(false);
    const [isApprovedTeacher, setIsApprovedTeacher] = useState(false);

    // Check auth state
    useEffect(() => {
        const checkUser = async () => {
            // First check if there's a session to avoid AuthSessionMissingError
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                // No session, user is not logged in - this is normal
                return;
            }

            const { data: { user }, error } = await supabase.auth.getUser();

            if (error) {
                console.error('[Navbar] Auth error:', error);
                return;
            }

            logger.auth('User authenticated', { data: { email: user?.email, id: user?.id } });
            setUser(user);

            if (user) {
                console.log('[Navbar] Checking admin status for:', user.email);
                const adminStatus = await isAdmin(user.id);
                console.log('[Navbar] Admin status result:', adminStatus);
                logger.auth('Admin status checked', { data: { email: user.email, isAdmin: adminStatus } });
                setIsUserAdmin(adminStatus);

                // Check teacher approval status (only if not admin)
                if (!adminStatus) {
                    const { data: profile, error: profileError } = await supabase
                        .from('profiles')
                        .select('role, is_teacher_approved')
                        .eq('id', user.id)
                        .single();

                    if (profileError) {
                        console.error('[Navbar] Profile fetch error:', profileError);
                    }

                    if (profile?.role === 'teacher' && profile?.is_teacher_approved) {
                        setIsApprovedTeacher(true);
                    }
                }
            }
        };

        checkUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                isAdmin(session.user.id).then(adminStatus => {
                    logger.auth('Auth state changed', { data: { isAdmin: adminStatus } });
                    setIsUserAdmin(adminStatus);

                    // Re-check teacher status on auth change (only if not admin)
                    if (!adminStatus) {
                        supabase
                            .from('profiles')
                            .select('role, is_teacher_approved')
                            .eq('id', session.user.id)
                            .single()
                            .then(({ data: profile }) => {
                                setIsApprovedTeacher(profile?.role === 'teacher' && profile?.is_teacher_approved === true);
                            });
                    } else {
                        setIsApprovedTeacher(false);
                    }
                });
            } else {
                setIsUserAdmin(false);
                setIsApprovedTeacher(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

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
            await signOut();
            router.push('/login');
            setIsMobileMenuOpen(false);
            setIsProfileMenuOpen(false);
        } catch (error) {
            logger.error('Error signing out', { context: 'Navbar', data: error });
        }
    }, [router]);

    const handleToggleMobileMenu = useCallback(() => {
        setIsMobileMenuOpen(prev => !prev);
    }, []);

    const handleCloseMobileMenu = useCallback(() => {
        setIsMobileMenuOpen(false);
    }, []);

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

                            {/* Desktop Auth */}
                            <div className="hidden md:flex items-center gap-2.5">
                                {user ? (
                                    <UserProfileDropdown
                                        user={user}
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
                user={user}
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
