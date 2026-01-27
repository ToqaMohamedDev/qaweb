// =============================================
// TeacherSidebar Component - سايدبار المعلمين
// =============================================

'use client';

import Link from 'next/link';
import {
    Home,
    Compass,
    PlaySquare,
    Menu,
    CheckCircle2,
    Users,
    LucideIcon
} from 'lucide-react';
import { Avatar } from '@/components/common';
import type { Teacher } from '@/lib/types';

export interface SidebarLinkProps {
    icon: LucideIcon;
    label: string;
    href: string;
    active?: boolean;
    collapsed: boolean;
}

export function SidebarLink({ icon: Icon, label, href, active, collapsed }: SidebarLinkProps) {
    return (
        <Link
            href={href}
            className={`relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group overflow-hidden ${active
                ? "bg-gradient-to-l from-gray-100 via-gray-50 to-transparent dark:from-[#272727] dark:via-[#1f1f1f] dark:to-transparent text-gray-900 dark:text-white font-semibold"
                : "text-gray-600 dark:text-[#f1f1f1] hover:bg-gray-100/70 dark:hover:bg-[#272727]/70"
                } ${collapsed ? "justify-center" : ""}`}
        >
            {active && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-primary-500 to-primary-600 dark:from-red-500 dark:to-red-600 rounded-l-full" />
            )}
            <div className={`relative p-1.5 rounded-lg transition-all duration-300 ${active
                ? "bg-primary-500/10 dark:bg-red-500/10"
                : "group-hover:bg-gray-200/50 dark:group-hover:bg-[#333]/50"
                }`}>
                <Icon className={`h-5 w-5 transition-transform duration-300 group-hover:scale-110 ${active ? "text-primary-600 dark:text-red-500" : "text-gray-500 dark:text-[#aaa] group-hover:text-gray-700 dark:group-hover:text-white"}`} />
            </div>
            {!collapsed && <span className="text-sm">{label}</span>}
        </Link>
    );
}

export interface TeacherSidebarProps {
    isOpen: boolean;
    onToggle: () => void;
    subscribedTeachers: Teacher[];
    currentPath?: string;
}

export function TeacherSidebar({
    isOpen,
    onToggle,
    subscribedTeachers,
    currentPath = '/teachers',
}: TeacherSidebarProps) {
    const isTeachersPage = currentPath.startsWith('/teachers');

    return (
        <aside
            className={`hidden md:flex flex-col fixed top-16 right-0 h-[calc(100vh-64px)] bg-white dark:bg-[#0f0f0f] border-l border-gray-200 dark:border-[#272727] transition-all duration-300 ease-out z-40 ${isOpen ? 'w-64' : 'w-[72px]'}`}
        >
            {/* Navigation Section */}
            <nav className="flex-shrink-0 p-3 space-y-1">
                <SidebarLink icon={Home} label="الرئيسية" href="/" collapsed={!isOpen} active={currentPath === '/'} />
                <SidebarLink icon={Compass} label="استكشاف" href="/teachers" collapsed={!isOpen} active={isTeachersPage} />
                <SidebarLink icon={PlaySquare} label="الامتحانات" href="/arabic" collapsed={!isOpen} active={currentPath.startsWith('/arabic')} />
            </nav>

            {/* Divider */}
            {isOpen && (
                <div className="mx-4 my-2">
                    <div className="h-px bg-gray-200 dark:bg-[#333]" />
                </div>
            )}

            {/* Subscriptions Section */}
            {isOpen ? (
                <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
                    <div className="px-4 py-2">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            الاشتراكات
                        </h3>
                    </div>

                    {subscribedTeachers.length > 0 ? (
                        <div className="px-2 pb-2 space-y-1">
                            {subscribedTeachers.map((teacher) => (
                                <Link
                                    key={teacher.id}
                                    href={`/teachers/${teacher.id}`}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#272727] transition-colors group"
                                >
                                    {/* Avatar */}
                                    <div className="flex-shrink-0">
                                        <Avatar
                                            src={(teacher as any).photoURL || (teacher as any).avatar_url}
                                            name={(teacher as any).displayName || (teacher as any).name || 'معلم'}
                                            size="sm"
                                            ring
                                            ringColor="ring-gray-100 dark:ring-[#333]"
                                            customGradient="from-red-500 to-red-600"
                                        />
                                    </div>

                                    {/* Teacher Name */}
                                    <span className="flex-1 min-w-0 text-sm font-medium text-gray-800 dark:text-gray-100 truncate group-hover:text-gray-900 dark:group-hover:text-white">
                                        {(teacher as any).displayName || (teacher as any).name || 'معلم'}
                                    </span>

                                    {/* Verified Badge */}
                                    {(teacher as any).isVerified && (
                                        <CheckCircle2 className="flex-shrink-0 h-4 w-4 text-blue-500" />
                                    )}
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="px-4 py-8 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-[#1a1a1a] flex items-center justify-center">
                                <Users className="h-7 w-7 text-gray-400 dark:text-gray-600" />
                            </div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                لا توجد اشتراكات
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                تابع المعلمين لتظهر هنا
                            </p>
                        </div>
                    )}
                </div>
            ) : (
                /* Mini Subscriptions (when collapsed) */
                subscribedTeachers.length > 0 && (
                    <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide py-2">
                        <div className="px-2 space-y-2">
                            {subscribedTeachers.slice(0, 6).map((teacher) => (
                                <Link
                                    key={teacher.id}
                                    href={`/teachers/${teacher.id}`}
                                    className="flex justify-center py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#272727] transition-colors"
                                    title={(teacher as any).displayName || (teacher as any).name || 'معلم'}
                                >
                                    <Avatar
                                        src={(teacher as any).photoURL || (teacher as any).avatar_url}
                                        name={(teacher as any).displayName || (teacher as any).name || 'معلم'}
                                        size="sm"
                                        ring
                                        ringColor="ring-gray-100 dark:ring-[#333]"
                                        customGradient="from-red-500 to-red-600"
                                    />
                                </Link>
                            ))}
                        </div>
                    </div>
                )
            )}

            {/* Toggle Button */}
            <div className="flex-shrink-0 p-3 border-t border-gray-200 dark:border-[#272727]">
                <button
                    onClick={onToggle}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gray-100 dark:bg-[#1a1a1a] hover:bg-gray-200 dark:hover:bg-[#272727] transition-colors text-gray-700 dark:text-gray-300"
                >
                    <Menu className="h-5 w-5" />
                    {isOpen && <span className="text-sm font-medium">تصغير</span>}
                </button>
            </div>
        </aside>
    );
}

export default TeacherSidebar;
