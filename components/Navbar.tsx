"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Sparkles,
    LogIn,
    UserPlus,
    Menu,
    X,
    Home,
    User as UserIcon,
    FileText,
    BookOpen,
    Gamepad2,
    Bell,
    LogOut,
    Settings,
    UserCircle,
    ChevronDown,
    Shield,
    Crown,
    Zap,
    Star,
    Trophy,
    ArrowLeft
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { cn } from "@/lib/utils";
import { supabase, signOut, isAdmin } from "@/lib/supabase";
import { type User } from "@supabase/supabase-js";

const navItems = [
    { href: "/", label: "الرئيسية", icon: Home },
    { href: "/teachers", label: "المدرسين", icon: UserIcon },
    { href: "/arabic", label: "اللغة العربية", icon: FileText },
    { href: "/english", label: "English", icon: BookOpen },
    { href: "/game", label: "Quiz Battle", icon: Gamepad2 },
] as const;

// Animation variants for dropdown menus
const dropdownVariants = {
    hidden: {
        opacity: 0,
        y: -10,
        scale: 0.95,
        filter: "blur(4px)"
    },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: "blur(0px)",
        transition: {
            type: "spring" as const,
            stiffness: 400,
            damping: 25,
            staggerChildren: 0.05,
            delayChildren: 0.1
        }
    },
    exit: {
        opacity: 0,
        y: -10,
        scale: 0.95,
        filter: "blur(4px)",
        transition: { duration: 0.15 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { type: "spring" as const, stiffness: 300, damping: 24 }
    }
} as const;

const mobileMenuVariants = {
    hidden: {
        opacity: 0,
        y: -30,
        scale: 0.9
    },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            type: "spring" as const,
            stiffness: 300,
            damping: 25,
            staggerChildren: 0.07,
            delayChildren: 0.1
        }
    },
    exit: {
        opacity: 0,
        y: -20,
        scale: 0.95,
        transition: { duration: 0.2 }
    }
};

const mobileItemVariants = {
    hidden: { opacity: 0, x: -20, scale: 0.9 },
    visible: {
        opacity: 1,
        x: 0,
        scale: 1,
        transition: { type: "spring" as const, stiffness: 400, damping: 25 }
    }
};

// Helper function to check if a path is active
const isPathActive = (pathname: string, href: string): boolean => {
    if (href === "/") {
        return pathname === href;
    }
    return pathname.startsWith(href);
};

export function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [isUserAdmin, setIsUserAdmin] = useState(false);
    const mobileMenuRef = useRef<HTMLDivElement>(null);
    const mobileButtonRef = useRef<HTMLButtonElement>(null);
    const profileMenuRef = useRef<HTMLDivElement>(null);
    const profileButtonRef = useRef<HTMLButtonElement>(null);

    // Mock data for notifications (UI Only)
    const unreadNotifications = 3;

    // Check auth state
    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            if (user) {
                const adminStatus = await isAdmin(user.id);
                setIsUserAdmin(adminStatus);
            }
        };

        checkUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (!session) {
                // Optional: redirect to login if session expires
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleSignOut = async () => {
        try {
            await signOut();
            router.push("/login");
            setIsMobileMenuOpen(false);
            setIsProfileMenuOpen(false);
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

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

    // Click outside handler
    const handleClickOutside = useCallback((event: MouseEvent) => {
        const target = event.target as HTMLElement;

        // Mobile Menu
        if (
            isMobileMenuOpen &&
            mobileMenuRef.current &&
            !mobileMenuRef.current.contains(target) &&
            mobileButtonRef.current &&
            !mobileButtonRef.current.contains(target)
        ) {
            setIsMobileMenuOpen(false);
        }

        // Profile Menu
        if (
            isProfileMenuOpen &&
            profileMenuRef.current &&
            !profileMenuRef.current.contains(target) &&
            profileButtonRef.current &&
            !profileButtonRef.current.contains(target)
        ) {
            setIsProfileMenuOpen(false);
        }
    }, [isMobileMenuOpen, isProfileMenuOpen]);

    useEffect(() => {
        if (isMobileMenuOpen || isProfileMenuOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [isMobileMenuOpen, isProfileMenuOpen, handleClickOutside]);

    // Memoized handlers
    const handleToggleMobileMenu = useCallback(() => {
        setIsMobileMenuOpen((prev) => !prev);
    }, []);

    const handleCloseMobileMenu = useCallback(() => {
        setIsMobileMenuOpen(false);
    }, []);

    // Navigation Item Component
    const NavItem = useCallback(({ item }: { item: typeof navItems[number] }) => {
        const Icon = item.icon;
        const isActive = activePaths.has(item.href);

        return (
            <Link
                href={item.href}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors",
                    isActive
                        ? "bg-primary-500 text-white"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-[#252530]"
                )}
            >
                <Icon className={cn("h-4 w-4", isActive ? "text-white" : "")} />
                <span>{item.label}</span>
            </Link>
        );
    }, [activePaths]);

    // Mobile Navigation Item Component
    const MobileNavItem = useCallback(({ item }: { item: typeof navItems[number] }) => {
        const Icon = item.icon;
        const isActive = activePaths.has(item.href);

        return (
            <Link
                href={item.href}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
                onClick={handleCloseMobileMenu}
                className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors",
                    isActive
                        ? "bg-primary-500 text-white"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252530]"
                )}
            >
                <Icon className={cn("h-4 w-4", isActive ? "text-white" : "")} />
                <span>{item.label}</span>
            </Link>
        );
    }, [activePaths, handleCloseMobileMenu]);

    return (
        <>
            <nav
                className="fixed top-0 left-0 right-0 z-50 h-[72px] flex items-center bg-white dark:bg-[#121218] shadow-sm border-b border-gray-200 dark:border-[#2e2e3a]"
                dir="rtl"
            >
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
                    <div className="flex items-center justify-between gap-4">
                        {/* Logo */}
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

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center flex-1 justify-center">
                            <div className="flex items-center gap-1 bg-white/90 dark:bg-[#1c1c24]/90 rounded-full px-2 py-1.5 border border-gray-200/80 dark:border-[#2e2e3a]/80 shadow-sm">
                                {navItems.map((item) => (
                                    <NavItem key={item.href} item={item} />
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2.5 flex-shrink-0">
                            {/* Notifications */}
                            <Link
                                href="/notifications"
                                className="relative p-2.5 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1c1c24] transition-colors"
                                aria-label="الإشعارات"
                            >
                                <Bell className="h-5 w-5" />
                                {unreadNotifications > 0 && (
                                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                        {unreadNotifications > 9 ? '9+' : unreadNotifications}
                                    </span>
                                )}
                            </Link>

                            <ThemeToggle />

                            {/* Desktop Auth Buttons */}
                            <div className="hidden md:flex items-center gap-2.5">
                                {user ? (
                                    <div className="relative">
                                        <button
                                            ref={profileButtonRef}
                                            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                            className="flex items-center gap-2 pl-2 pr-4 py-1.5 rounded-full bg-gray-50 dark:bg-[#1c1c24] border border-gray-200 dark:border-[#2e2e3a] hover:border-gray-300 dark:hover:border-[#3e3e4a] transition-all"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
                                                {user.user_metadata?.avatar_url ? (
                                                    <img src={user.user_metadata.avatar_url} alt={user.user_metadata.name} className="w-8 h-8 rounded-full" />
                                                ) : (
                                                    <UserCircle className="w-5 h-5" />
                                                )}
                                            </div>
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200 max-w-[100px] truncate">
                                                {user.user_metadata?.name || user.email?.split('@')[0]}
                                            </span>
                                            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
                                        </button>

                                        <AnimatePresence>
                                            {isProfileMenuOpen && (
                                                <motion.div
                                                    ref={profileMenuRef}
                                                    variants={dropdownVariants}
                                                    initial="hidden"
                                                    animate="visible"
                                                    exit="exit"
                                                    className="absolute top-full left-0 mt-3 w-72 rounded-2xl bg-white/95 dark:bg-[#1c1c24]/95 backdrop-blur-xl border border-gray-200/50 dark:border-[#2e2e3a]/50 shadow-2xl shadow-black/5 dark:shadow-black/20 overflow-hidden"
                                                >
                                                    {/* Decorative Gradient Header */}
                                                    <div className="relative h-20 bg-gradient-to-br from-primary-500 via-purple-500 to-pink-500 overflow-hidden">
                                                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMiIgZmlsbD0id2hpdGUiIGZpbGwtb3BhY2l0eT0iMC4xIi8+PC9zdmc+')] opacity-50" />
                                                        <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-xl" />
                                                        <div className="absolute -top-4 -left-4 w-16 h-16 bg-white/10 rounded-full blur-lg" />
                                                    </div>

                                                    {/* User Avatar - Overlapping Header */}
                                                    <div className="relative -mt-10 px-4">
                                                        <div className="flex items-end gap-3">
                                                            <motion.div
                                                                variants={itemVariants}
                                                                className="relative"
                                                            >
                                                                <div className="w-16 h-16 rounded-2xl bg-white dark:bg-[#252530] p-1 shadow-lg ring-4 ring-white dark:ring-[#1c1c24]">
                                                                    {user?.user_metadata?.avatar_url ? (
                                                                        <img
                                                                            src={user.user_metadata.avatar_url}
                                                                            alt={user.user_metadata.name}
                                                                            className="w-full h-full rounded-xl object-cover"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-full h-full rounded-xl bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center">
                                                                            <UserCircle className="w-8 h-8 text-white" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                {/* Online indicator */}
                                                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-3 border-white dark:border-[#1c1c24] flex items-center justify-center">
                                                                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                                                </div>
                                                            </motion.div>
                                                            <motion.div variants={itemVariants} className="flex-1 min-w-0 pb-1">
                                                                <h3 className="text-base font-bold text-gray-900 dark:text-white truncate">
                                                                    {user?.user_metadata?.name || user?.email?.split('@')[0]}
                                                                </h3>
                                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                                    {user?.email}
                                                                </p>
                                                            </motion.div>
                                                        </div>
                                                    </div>

                                                    {/* Quick Stats */}
                                                    <motion.div variants={itemVariants} className="px-4 py-3 mt-3">
                                                        <div className="grid grid-cols-3 gap-2">
                                                            <div className="text-center p-2.5 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-100 dark:border-amber-800/30">
                                                                <Trophy className="w-4 h-4 mx-auto text-amber-500 mb-1" />
                                                                <p className="text-xs font-bold text-amber-600 dark:text-amber-400">150</p>
                                                                <p className="text-[10px] text-amber-500/80 dark:text-amber-400/60">نقطة</p>
                                                            </div>
                                                            <div className="text-center p-2.5 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-100 dark:border-purple-800/30">
                                                                <Crown className="w-4 h-4 mx-auto text-purple-500 mb-1" />
                                                                <p className="text-xs font-bold text-purple-600 dark:text-purple-400">12</p>
                                                                <p className="text-[10px] text-purple-500/80 dark:text-purple-400/60">مرتبة</p>
                                                            </div>
                                                            <div className="text-center p-2.5 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-100 dark:border-blue-800/30">
                                                                <Zap className="w-4 h-4 mx-auto text-blue-500 mb-1" />
                                                                <p className="text-xs font-bold text-blue-600 dark:text-blue-400">25</p>
                                                                <p className="text-[10px] text-blue-500/80 dark:text-blue-400/60">اختبار</p>
                                                            </div>
                                                        </div>
                                                    </motion.div>

                                                    {/* Menu Items */}
                                                    <div className="p-2 mt-1 space-y-1">
                                                        {isUserAdmin && (
                                                            <motion.div variants={itemVariants}>
                                                                <Link
                                                                    href="/admin"
                                                                    className="group flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:bg-gradient-to-l hover:from-primary-50 hover:to-transparent dark:hover:from-primary-900/20 dark:hover:to-transparent rounded-xl transition-all duration-200"
                                                                >
                                                                    <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30 group-hover:scale-110 transition-transform">
                                                                        <Shield className="w-4 h-4" />
                                                                    </div>
                                                                    <span>لوحة التحكم</span>
                                                                    <ArrowLeft className="w-4 h-4 mr-auto opacity-0 group-hover:opacity-100 group-hover:-translate-x-1 transition-all" />
                                                                </Link>
                                                            </motion.div>
                                                        )}
                                                        <motion.div variants={itemVariants}>
                                                            <Link
                                                                href="/profile"
                                                                className="group flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gradient-to-l hover:from-gray-100 hover:to-transparent dark:hover:from-[#2a2a38] dark:hover:to-transparent rounded-xl transition-all duration-200"
                                                            >
                                                                <div className="p-2 rounded-lg bg-gray-100 dark:bg-[#2a2a38] group-hover:scale-110 group-hover:bg-gray-200 dark:group-hover:bg-[#353545] transition-all">
                                                                    <UserIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                                                                </div>
                                                                <span>الملف الشخصي</span>
                                                                <ArrowLeft className="w-4 h-4 mr-auto opacity-0 group-hover:opacity-100 group-hover:-translate-x-1 transition-all" />
                                                            </Link>
                                                        </motion.div>

                                                        {/* Divider */}
                                                        <motion.div variants={itemVariants} className="h-px bg-gradient-to-l from-gray-200 via-gray-100 to-transparent dark:from-[#2e2e3a] dark:via-[#252530] dark:to-transparent my-2" />

                                                        {/* Logout Button */}
                                                        <motion.div variants={itemVariants}>
                                                            <button
                                                                onClick={handleSignOut}
                                                                className="group w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-gradient-to-l hover:from-red-50 hover:to-transparent dark:hover:from-red-900/20 dark:hover:to-transparent rounded-xl transition-all duration-200"
                                                            >
                                                                <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 group-hover:scale-110 group-hover:bg-red-100 dark:group-hover:bg-red-900/30 transition-all">
                                                                    <LogOut className="w-4 h-4" />
                                                                </div>
                                                                <span>تسجيل الخروج</span>
                                                            </button>
                                                        </motion.div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ) : (
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
                                )}
                            </div>

                            {/* Mobile Menu Button */}
                            <button
                                ref={mobileButtonRef}
                                onClick={handleToggleMobileMenu}
                                className="md:hidden flex items-center justify-center h-10 w-10 rounded-xl bg-gray-100 dark:bg-[#1c1c24] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#252530] transition-colors border border-gray-200/50 dark:border-[#2e2e3a]/50"
                                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
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
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        {/* Backdrop with blur */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={handleCloseMobileMenu}
                            className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm z-40 md:hidden"
                        />
                        <motion.div
                            variants={mobileMenuVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="fixed inset-x-0 top-[72px] z-50 md:hidden px-4"
                            ref={mobileMenuRef}
                        >
                            <div className="bg-white/95 dark:bg-[#1c1c24]/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/10 dark:shadow-black/30 border border-gray-200/50 dark:border-[#2e2e3a]/50 overflow-hidden">
                                {/* User Profile Card (if logged in) */}
                                {user && (
                                    <motion.div variants={mobileItemVariants} className="relative">
                                        <div className="relative h-16 bg-gradient-to-br from-primary-500 via-purple-500 to-pink-500 overflow-hidden">
                                            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMiIgZmlsbD0id2hpdGUiIGZpbGwtb3BhY2l0eT0iMC4xIi8+PC9zdmc+')] opacity-50" />
                                            <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                                        </div>
                                        <div className="relative -mt-8 px-4 pb-4">
                                            <div className="flex items-end gap-3">
                                                <div className="relative">
                                                    <div className="w-14 h-14 rounded-2xl bg-white dark:bg-[#252530] p-0.5 shadow-lg ring-4 ring-white/50 dark:ring-[#1c1c24]/50">
                                                        {user.user_metadata?.avatar_url ? (
                                                            <img
                                                                src={user.user_metadata.avatar_url}
                                                                alt={user.user_metadata.name}
                                                                className="w-full h-full rounded-xl object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full rounded-xl bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center">
                                                                <UserCircle className="w-7 h-7 text-white" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-[#1c1c24]" />
                                                </div>
                                                <div className="flex-1 min-w-0 pb-1">
                                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                                        {user.user_metadata?.name || user.email?.split('@')[0]}
                                                    </h3>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                        {user.email}
                                                    </p>
                                                </div>
                                            </div>
                                            {/* Quick Stats */}
                                            <div className="grid grid-cols-3 gap-2 mt-4">
                                                <div className="text-center p-2 rounded-xl bg-amber-50/80 dark:bg-amber-900/20 border border-amber-100/50 dark:border-amber-800/20">
                                                    <Trophy className="w-4 h-4 mx-auto text-amber-500 mb-0.5" />
                                                    <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400">150 نقطة</p>
                                                </div>
                                                <div className="text-center p-2 rounded-xl bg-purple-50/80 dark:bg-purple-900/20 border border-purple-100/50 dark:border-purple-800/20">
                                                    <Crown className="w-4 h-4 mx-auto text-purple-500 mb-0.5" />
                                                    <p className="text-[11px] font-bold text-purple-600 dark:text-purple-400">#12 مرتبة</p>
                                                </div>
                                                <div className="text-center p-2 rounded-xl bg-blue-50/80 dark:bg-blue-900/20 border border-blue-100/50 dark:border-blue-800/20">
                                                    <Zap className="w-4 h-4 mx-auto text-blue-500 mb-0.5" />
                                                    <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400">25 اختبار</p>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                <div className="p-4 space-y-3">
                                    {/* Navigation Items */}
                                    <motion.div
                                        variants={mobileItemVariants}
                                        className="bg-gray-50/80 dark:bg-[#252530]/80 rounded-2xl p-2 border border-gray-200/30 dark:border-[#2e2e3a]/30"
                                    >
                                        <div className="space-y-1">
                                            {navItems.map((item, index) => {
                                                const Icon = item.icon;
                                                const isActive = activePaths.has(item.href);
                                                return (
                                                    <motion.div
                                                        key={item.href}
                                                        variants={mobileItemVariants}
                                                        custom={index}
                                                    >
                                                        <Link
                                                            href={item.href}
                                                            onClick={handleCloseMobileMenu}
                                                            className={cn(
                                                                "group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200",
                                                                isActive
                                                                    ? "bg-gradient-to-l from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25"
                                                                    : "text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-[#2a2a38]"
                                                            )}
                                                        >
                                                            <div className={cn(
                                                                "p-2 rounded-lg transition-all",
                                                                isActive
                                                                    ? "bg-white/20"
                                                                    : "bg-gray-100 dark:bg-[#2a2a38] group-hover:bg-gray-200 dark:group-hover:bg-[#353545]"
                                                            )}>
                                                                <Icon className={cn("h-4 w-4", isActive ? "text-white" : "text-gray-600 dark:text-gray-400")} />
                                                            </div>
                                                            <span>{item.label}</span>
                                                            {isActive && (
                                                                <motion.div
                                                                    layoutId="mobileActiveIndicator"
                                                                    className="mr-auto w-1.5 h-1.5 rounded-full bg-white"
                                                                />
                                                            )}
                                                        </Link>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    </motion.div>

                                    {/* Divider */}
                                    <motion.div
                                        variants={mobileItemVariants}
                                        className="h-px bg-gradient-to-l from-gray-200 via-gray-100 to-transparent dark:from-[#2e2e3a] dark:via-[#252530] dark:to-transparent"
                                    />

                                    {/* Auth Section */}
                                    <motion.div variants={mobileItemVariants} className="space-y-2">
                                        {user ? (
                                            <>
                                                {isUserAdmin && (
                                                    <Link
                                                        href="/admin"
                                                        onClick={handleCloseMobileMenu}
                                                        className="group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-primary-600 dark:text-primary-400 bg-primary-50/50 dark:bg-primary-900/10 hover:bg-primary-100 dark:hover:bg-primary-900/20 transition-all border border-primary-100/50 dark:border-primary-800/30"
                                                    >
                                                        <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30 group-hover:scale-110 transition-transform">
                                                            <Shield className="h-4 w-4" />
                                                        </div>
                                                        <span>لوحة التحكم</span>
                                                        <Crown className="w-4 h-4 mr-auto text-primary-400" />
                                                    </Link>
                                                )}
                                                <Link
                                                    href="/profile"
                                                    onClick={handleCloseMobileMenu}
                                                    className="group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a38] transition-all"
                                                >
                                                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-[#2a2a38] group-hover:scale-110 transition-transform">
                                                        <UserCircle className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                                    </div>
                                                    <span>الملف الشخصي</span>
                                                </Link>
                                                <button
                                                    onClick={handleSignOut}
                                                    className="group w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 transition-all border border-red-100/50 dark:border-red-800/30"
                                                >
                                                    <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 group-hover:scale-110 transition-transform">
                                                        <LogOut className="h-4 w-4" />
                                                    </div>
                                                    <span>تسجيل الخروج</span>
                                                </button>
                                            </>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-3">
                                                <Link
                                                    href="/login"
                                                    onClick={handleCloseMobileMenu}
                                                    className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-[#252530] hover:bg-gray-200 dark:hover:bg-[#2a2a38] transition-all border border-gray-200/50 dark:border-[#2e2e3a]/50"
                                                >
                                                    <LogIn className="h-4 w-4" />
                                                    <span>تسجيل الدخول</span>
                                                </Link>
                                                <Link
                                                    href="/signup"
                                                    onClick={handleCloseMobileMenu}
                                                    className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-gradient-to-l from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white text-sm font-semibold transition-all shadow-lg shadow-primary-500/25"
                                                >
                                                    <UserPlus className="h-4 w-4" />
                                                    <span>إنشاء حساب</span>
                                                </Link>
                                            </div>
                                        )}
                                    </motion.div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Fixed Spacer - matches navbar height */}
            <div className="h-[72px]" />
        </>
    );
}
