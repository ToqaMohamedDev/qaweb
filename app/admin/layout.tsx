"use client";

import { useState, useEffect, ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    LayoutDashboard,
    Users,
    GraduationCap,
    FileText,
    BookOpen,
    Settings,
    Bell,
    Search,
    Menu,
    X,
    ChevronDown,
    LogOut,
    Moon,
    Sun,
    BarChart3,
    MessageSquare,
    HelpCircle,
    Shield,
    Sparkles,
    Layers,
} from "lucide-react";
import { ThemeProvider, useTheme } from "@/components/ThemeProvider";
import { supabase, isAdmin } from "@/lib/supabase";

// Sidebar navigation items
const sidebarItems = [
    {
        title: "الرئيسية",
        items: [
            { href: "/admin", label: "لوحة التحكم", icon: LayoutDashboard },
            { href: "/admin/analytics", label: "الإحصائيات", icon: BarChart3 },
        ],
    },
    {
        title: "إدارة المحتوى",
        items: [
            { href: "/admin/users", label: "المستخدمين", icon: Users },
            { href: "/admin/teachers", label: "المعلمين", icon: GraduationCap },
            { href: "/admin/stages", label: "المراحل الدراسية", icon: Layers },
            { href: "/admin/subjects", label: "المواد", icon: BookOpen },
            { href: "/admin/lessons", label: "الدروس", icon: FileText },
            { href: "/admin/exams", label: "الامتحانات", icon: FileText },
            { href: "/admin/questions", label: "بنك الأسئلة", icon: HelpCircle },
        ],
    },
    {
        title: "النظام",
        items: [
            { href: "/admin/support", label: "محادثات الدعم", icon: MessageSquare },
            { href: "/admin/notifications", label: "الإشعارات", icon: Bell },
            { href: "/admin/messages", label: "الرسائل", icon: MessageSquare },
            { href: "/admin/settings", label: "الإعدادات", icon: Settings },
        ],
    },
];

// Theme Toggle for Admin
function AdminThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="تبديل الوضع"
        >
            {theme === "dark" ? (
                <Moon className="h-5 w-5 text-gray-600" />
            ) : (
                <Sun className="h-5 w-5 text-amber-500" />
            )}
        </button>
    );
}

// Sidebar Component
function Sidebar({
    isOpen,
    onClose,
}: {
    isOpen: boolean;
    onClose: () => void;
}) {
    const pathname = usePathname();
    const [notificationCount, setNotificationCount] = useState(0);
    const [user, setUser] = useState<{ email: string; name: string } | null>(null);

    useEffect(() => {
        const fetchNotificationCount = async () => {
            try {
                const { count } = await supabase.from("notifications").select("*", { count: "exact", head: true }).eq("status", "sent");
                setNotificationCount(count || 0);
            } catch { }
        };
        fetchNotificationCount();
    }, []);

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser) {
                // Try to get profile name
                const { data: profile } = await supabase.from('profiles').select('name').eq('id', authUser.id).single();
                setUser({
                    email: authUser.email || '',
                    name: profile?.name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'مستخدم'
                });
            }
        };
        fetchUser();
    }, []);

    const isActive = (href: string) => {
        if (href === "/admin") return pathname === href;
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
            <aside
                className={`fixed lg:sticky top-0 right-0 h-screen w-[280px] bg-white dark:bg-[#0f0f12] border-l border-gray-200 dark:border-gray-800 z-50 transform transition-transform duration-300 lg:translate-x-0 ${isOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
                    }`}
            >
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
                        <Link href="/admin" className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-500/25">
                                <Shield className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <span className="font-bold text-gray-900 dark:text-white text-lg">
                                    لوحة التحكم
                                </span>
                                <span className="block text-xs text-gray-500 dark:text-gray-400">
                                    إدارة النظام
                                </span>
                            </div>
                        </Link>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden"
                        >
                            <X className="h-5 w-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto p-4 space-y-6">
                        {sidebarItems.map((section) => (
                            <div key={section.title}>
                                <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 px-3">
                                    {section.title}
                                </h3>
                                <div className="space-y-1">
                                    {section.items.map((item) => {
                                        const Icon = item.icon;
                                        const active = isActive(item.href);
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${active
                                                    ? "bg-primary-500 text-white shadow-lg shadow-primary-500/25"
                                                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                                                    }`}
                                            >
                                                <Icon className="h-5 w-5 flex-shrink-0" />
                                                <span className="font-medium text-sm">{item.label}</span>
                                                {item.label === "الإشعارات" && notificationCount > 0 && (
                                                    <span className="mr-auto px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-bold">
                                                        {notificationCount > 99 ? '99+' : notificationCount}
                                                    </span>
                                                )}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </nav>

                    {/* User Section */}
                    <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold">
                                {user?.name?.charAt(0)?.toUpperCase() || 'أ'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                    {user?.name || 'أدمن النظام'}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {user?.email || ''}
                                </p>
                            </div>
                            <button className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                <LogOut className="h-4 w-4 text-gray-500" />
                            </button>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}

// Header Component
function Header({
    onMenuClick,
}: {
    onMenuClick: () => void;
}) {
    const [showNotifications, setShowNotifications] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [user, setUser] = useState<{ email: string; name: string } | null>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser) {
                const { data: profile } = await supabase.from('profiles').select('name').eq('id', authUser.id).single();
                setUser({
                    email: authUser.email || '',
                    name: profile?.name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'مستخدم'
                });
            }
        };
        fetchUser();
    }, []);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('[data-dropdown="notifications"]')) {
                setShowNotifications(false);
            }
            if (!target.closest('[data-dropdown="user-menu"]')) {
                setShowUserMenu(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            router.push("/login");
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    return (
        <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-[#0f0f12]/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between h-full px-4 sm:px-6">
                {/* Right Section */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={onMenuClick}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden"
                    >
                        <Menu className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </button>

                    {/* Search */}
                    <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 w-80">
                        <Search className="h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="بحث..."
                            className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 dark:text-white placeholder:text-gray-400"
                        />
                        <kbd className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs font-mono">
                            ⌘K
                        </kbd>
                    </div>
                </div>

                {/* Left Section */}
                <div className="flex items-center gap-2">
                    <AdminThemeToggle />

                    {/* Help */}
                    <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <HelpCircle className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </button>

                    {/* Notifications */}
                    <div className="relative" data-dropdown="notifications">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                        </button>

                        <AnimatePresence>
                            {showNotifications && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute left-0 top-full mt-2 w-80 bg-white dark:bg-[#1c1c24] rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden"
                                >
                                    <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                                        <h3 className="font-semibold text-gray-900 dark:text-white">
                                            الإشعارات
                                        </h3>
                                    </div>
                                    <div className="max-h-80 overflow-y-auto">
                                        {[1, 2, 3].map((i) => (
                                            <div
                                                key={i}
                                                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 last:border-0"
                                            >
                                                <p className="text-sm text-gray-900 dark:text-white">
                                                    مستخدم جديد قام بالتسجيل
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">منذ 5 دقائق</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-3 border-t border-gray-200 dark:border-gray-800">
                                        <Link
                                            href="/admin/notifications"
                                            className="block text-center text-sm text-primary-600 dark:text-primary-400 font-medium hover:underline"
                                        >
                                            عرض جميع الإشعارات
                                        </Link>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* User Menu */}
                    <div className="relative" data-dropdown="user-menu">
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="flex items-center gap-2 p-1.5 pr-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-sm font-bold">
                                {user?.name?.charAt(0)?.toUpperCase() || 'أ'}
                            </div>
                            <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {showUserMenu && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    transition={{ type: "spring" as const, stiffness: 400, damping: 25 }}
                                    className="absolute left-0 top-full mt-2 w-64 bg-white dark:bg-[#1c1c24] rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden"
                                >
                                    {/* User Info */}
                                    <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-br from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-lg font-bold shadow-lg">
                                                {user?.name?.charAt(0)?.toUpperCase() || 'أ'}
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-gray-900 dark:text-white">
                                                    {user?.name || 'أدمن النظام'}
                                                </h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {user?.email || ''}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Menu Items */}
                                    <div className="p-2">
                                        <Link
                                            href="/"
                                            onClick={() => setShowUserMenu(false)}
                                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                                        >
                                            <Sparkles className="h-4 w-4" />
                                            <span className="text-sm font-medium">الرئيسية</span>
                                        </Link>
                                        <Link
                                            href="/profile"
                                            onClick={() => setShowUserMenu(false)}
                                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                        >
                                            <Users className="h-4 w-4" />
                                            <span className="text-sm font-medium">الملف الشخصي</span>
                                        </Link>
                                        <Link
                                            href="/admin/settings"
                                            onClick={() => setShowUserMenu(false)}
                                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                        >
                                            <Settings className="h-4 w-4" />
                                            <span className="text-sm font-medium">الإعدادات</span>
                                        </Link>
                                    </div>

                                    {/* Logout */}
                                    <div className="p-2 border-t border-gray-200 dark:border-gray-800">
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                        >
                                            <LogOut className="h-4 w-4" />
                                            <span className="text-sm font-medium">تسجيل الخروج</span>
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

// Admin Layout Content
function AdminLayoutContent({ children }: { children: ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0f]" dir="rtl">
            <div className="flex">
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <div className="flex-1 min-w-0">
                    <Header onMenuClick={() => setSidebarOpen(true)} />
                    <main className="p-4 sm:p-6 lg:p-8">{children}</main>
                </div>
            </div>
        </div>
    );
}

// Admin Layout with Theme Provider
export default function AdminLayout({ children }: { children: ReactNode }) {
    return (
        <ThemeProvider>
            <AdminProtection>
                <AdminLayoutContent>{children}</AdminLayoutContent>
            </AdminProtection>
        </ThemeProvider>
    );
}

function AdminProtection({ children }: { children: ReactNode }) {
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    router.push("/login");
                    return;
                }

                const adminStatus = await isAdmin(user.id);

                if (!adminStatus) {
                    router.push("/");
                    return;
                }

                setIsAuthorized(true);
            } catch (error) {
                console.error("Auth check failed:", error);
                router.push("/");
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, [router]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0f] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">جاري التحقق من الصلاحيات...</p>
                </div>
            </div>
        );
    }

    if (!isAuthorized) {
        return null; // Will trigger redirect in useEffect
    }

    return <>{children}</>;
}
