"use client";

// =============================================
// Teacher Layout - حماية وتنظيم صفحات المدرس
// =============================================

import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    LayoutDashboard,
    FileText,
    Settings,
    Menu,
    X,
    LogOut,
    User,
    Clock,
    CheckCircle,
    AlertCircle,
    ChevronDown,
    BookOpen,
} from "lucide-react";
import { ThemeProvider, useTheme } from "@/components/ThemeProvider";
import { supabase } from "@/lib/supabase";
import { useAuthStore, selectIsApprovedTeacher } from "@/lib/stores/useAuthStore";
import { logger } from "@/lib/utils/logger";

// Navigation items
const navItems = [
    { href: "/teacher", label: "لوحة التحكم", icon: LayoutDashboard },
    { href: "/teacher/exams", label: "الامتحانات", icon: FileText },
    { href: "/teacher/profile", label: "الملف الشخصي", icon: User },
];

// Theme Toggle
function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();
    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="تبديل الوضع"
        >
            {theme === "dark" ? "🌙" : "☀️"}
        </button>
    );
}

// Sidebar
function TeacherSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const pathname = usePathname();
    const { user } = useAuthStore();
    const isApproved = useAuthStore(selectIsApprovedTeacher);

    const isActive = (href: string) => {
        if (href === "/teacher") return pathname === href;
        return pathname.startsWith(href);
    };

    return (
        <>
            {/* Mobile Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside className={`fixed lg:sticky top-0 right-0 h-screen w-[260px] bg-white dark:bg-[#0f0f12] border-l border-gray-200 dark:border-gray-800 z-50 transform transition-transform duration-300 lg:translate-x-0 ${isOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}`}>
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
                        <Link href="/teacher" className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
                                <BookOpen className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <span className="font-bold text-gray-900 dark:text-white">لوحة المدرس</span>
                                <span className="block text-xs text-gray-500">إدارة المحتوى</span>
                            </div>
                        </Link>
                        <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden">
                            <X className="h-5 w-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Approval Status */}
                    <div className="p-4">
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${isApproved
                            ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                            : "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300"
                            }`}>
                            {isApproved ? (
                                <>
                                    <CheckCircle className="h-4 w-4" />
                                    <span>حساب معتمد</span>
                                </>
                            ) : (
                                <>
                                    <Clock className="h-4 w-4" />
                                    <span>في انتظار الموافقة</span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4 space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${active
                                        ? "bg-purple-500 text-white shadow-lg shadow-purple-500/25"
                                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                                        }`}
                                >
                                    <Icon className="h-5 w-5" />
                                    <span className="font-medium text-sm">{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User Section */}
                    <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                                {user?.name?.charAt(0)?.toUpperCase() || 'م'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                    {user?.name || 'مدرس'}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                    {user?.email || ''}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}

// Header
function TeacherHeader({ onMenuClick }: { onMenuClick: () => void }) {
    const [showUserMenu, setShowUserMenu] = useState(false);
    const { user, logout } = useAuthStore();
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            router.push("/login");
        } catch (error) {
            logger.error('Error signing out', { context: 'TeacherLayout', data: error });
        }
    };

    return (
        <header className="sticky top-0 z-30 h-14 bg-white/80 dark:bg-[#0f0f12]/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between h-full px-4">
                <div className="flex items-center gap-4">
                    <button onClick={onMenuClick} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden">
                        <Menu className="h-5 w-5 text-gray-600" />
                    </button>
                    <Link href="/" className="text-sm text-primary-600 hover:underline font-medium">
                        العودة للموقع
                    </Link>
                </div>

                <div className="flex items-center gap-2">
                    <ThemeToggle />

                    {/* User Menu */}
                    <div className="relative">
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="flex items-center gap-2 p-1.5 pr-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
                                {user?.name?.charAt(0)?.toUpperCase() || 'م'}
                            </div>
                            <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {showUserMenu && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute left-0 top-full mt-2 w-48 bg-white dark:bg-[#1c1c24] rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden"
                                >
                                    <div className="p-2">
                                        <Link
                                            href="/teacher/profile"
                                            onClick={() => setShowUserMenu(false)}
                                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                                        >
                                            <User className="h-4 w-4" />
                                            <span className="text-sm">الملف الشخصي</span>
                                        </Link>
                                        <Link
                                            href="/profile?tab=settings"
                                            onClick={() => setShowUserMenu(false)}
                                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                                        >
                                            <Settings className="h-4 w-4" />
                                            <span className="text-sm">الإعدادات</span>
                                        </Link>
                                    </div>
                                    <div className="p-2 border-t border-gray-200 dark:border-gray-800">
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                        >
                                            <LogOut className="h-4 w-4" />
                                            <span className="text-sm">تسجيل الخروج</span>
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </header>
    );
}

// Teacher Protection Component - With DEBUG MODE
function TeacherProtection({ children }: { children: ReactNode }) {
    const { user, isLoading: authLoading } = useAuthStore();

    // Fix for Zustand hydration: force re-render after mount to get latest store values
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        console.log('[TeacherProtection] Mounted, authLoading:', authLoading, 'user:', user?.email);
        setMounted(true);
    }, []);

    useEffect(() => {
        console.log('[TeacherProtection] authLoading changed:', authLoading);
    }, [authLoading]);

    useEffect(() => {
        console.log('[TeacherProtection] user changed:', user?.email, 'role:', user?.role);
    }, [user]);

    // DEBUG OVERLAY - Simple version without state updates
    const DebugOverlay = () => (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            background: 'rgba(0,0,0,0.9)',
            color: '#00ff00',
            padding: '10px',
            fontSize: '12px',
            fontFamily: 'monospace',
            zIndex: 99999,
            direction: 'ltr'
        }}>
            <strong>🔧 DEBUG</strong> |
            mounted: <span style={{ color: mounted ? '#0f0' : '#f00' }}>{String(mounted)}</span> |
            authLoading: <span style={{ color: authLoading ? '#ff0' : '#0f0' }}>{String(authLoading)}</span> |
            user: <span style={{ color: user ? '#0f0' : '#f00' }}>{user ? `${user.email} (${user.role})` : 'NULL'}</span>
        </div>
    );

    // Before mount (SSR or first render): always show spinner
    if (!mounted) {
        return (
            <>
                <DebugOverlay />
                <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0f] flex items-center justify-center pt-20">
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-purple-200 dark:border-purple-900 rounded-full" />
                            <div className="absolute inset-0 w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">Waiting for mount...</p>
                    </div>
                </div>
            </>
        );
    }

    // After mount: Zustand has hydrated, now check the real values

    // Case 1: Still loading auth AND no user cached -> show spinner
    if (authLoading && !user) {
        return (
            <>
                <DebugOverlay />
                <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0f] flex items-center justify-center pt-20">
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-purple-200 dark:border-purple-900 rounded-full" />
                            <div className="absolute inset-0 w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">Waiting for auth... (authLoading=true, user=null)</p>
                    </div>
                </div>
            </>
        );
    }

    // Case 2: No user (loading finished or cached as null) -> redirect to login
    if (!user) {
        console.log('[TeacherProtection] REDIRECTING: No user found');
        window.location.href = "/login?redirect=/teacher";
        return <DebugOverlay />;
    }

    // Case 3: User exists but wrong role -> redirect to home
    if (user.role !== 'teacher' && user.role !== 'admin') {
        console.log('[TeacherProtection] REDIRECTING: Wrong role', user.role);
        window.location.href = "/";
        return <DebugOverlay />;
    }

    // Case 4: Authorized! Render children immediately
    console.log('[TeacherProtection] SUCCESS: Rendering children');
    return (
        <>
            <DebugOverlay />
            {children}
        </>
    );
}

// Layout Content
function TeacherLayoutContent({ children }: { children: ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0f]" dir="rtl">
            <div className="flex">
                <TeacherSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <div className="flex-1 min-w-0">
                    <TeacherHeader onMenuClick={() => setSidebarOpen(true)} />
                    <main className="p-4 sm:p-6">{children}</main>
                </div>
            </div>
        </div>
    );
}

// Main Layout Export
export default function TeacherLayout({ children }: { children: ReactNode }) {
    return (
        <ThemeProvider>
            <TeacherProtection>
                <TeacherLayoutContent>{children}</TeacherLayoutContent>
            </TeacherProtection>
        </ThemeProvider>
    );
}
