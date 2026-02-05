// ═══════════════════════════════════════════════════════════════════════════
// Dashboard Configurations - تكوينات Admin و Teacher
// ═══════════════════════════════════════════════════════════════════════════

import {
    LayoutDashboard, Users, GraduationCap, FileText, BookOpen,
    Settings, Bell, BarChart3, MessageSquare, Sparkles, Layers,
    Smartphone, Mail, Gamepad2, Shield, User,
} from 'lucide-react';
import type { DashboardConfig, NavSection, NavItem } from './types';

// ═══════════════════════════════════════════════════════════════════════════
// Admin Configuration
// ═══════════════════════════════════════════════════════════════════════════

export const adminNavItems: NavSection[] = [
    {
        title: 'الرئيسية',
        items: [
            { href: '/admin', label: 'لوحة التحكم', icon: LayoutDashboard },
            { href: '/admin/analytics', label: 'الإحصائيات', icon: BarChart3 },
        ],
    },
    {
        title: 'إدارة المحتوى',
        items: [
            { href: '/admin/users', label: 'المستخدمين', icon: Users },
            { href: '/admin/teachers', label: 'المعلمين', icon: GraduationCap },
            { href: '/admin/stages', label: 'المراحل الدراسية', icon: Layers },
            { href: '/admin/subjects', label: 'المواد', icon: BookOpen },
            { href: '/admin/units', label: 'الوحدات', icon: Layers },
            { href: '/admin/lessons', label: 'الدروس', icon: FileText },
            { href: '/admin/exams', label: 'الامتحانات', icon: FileText },
            { href: '/admin/quiz-questions', label: 'أسئلة الكويز', icon: Gamepad2 },
        ],
    },
    {
        title: 'النظام',
        items: [
            { href: '/admin/devices', label: 'الأجهزة', icon: Smartphone },
            { href: '/admin/messages', label: 'الرسائل الواردة', icon: Mail },
            { href: '/admin/testimonials', label: 'آراء الطلاب', icon: Sparkles },
            { href: '/admin/support', label: 'محادثات الدعم', icon: MessageSquare },
            { href: '/admin/notifications', label: 'الإشعارات', icon: Bell },
            { href: '/admin/settings', label: 'الإعدادات', icon: Settings },
        ],
    },
];

export const adminConfig: DashboardConfig = {
    role: 'admin',
    title: 'لوحة التحكم',
    subtitle: 'إدارة النظام',
    logo: Shield,
    logoGradient: 'from-primary-500 to-primary-600',
    primaryColor: 'primary',
    navItems: adminNavItems,
    homeHref: '/admin',
    loginRedirect: '/admin',
    allowedRoles: ['admin'],
};

// ═══════════════════════════════════════════════════════════════════════════
// Teacher Configuration
// ═══════════════════════════════════════════════════════════════════════════

export const teacherNavItems: NavItem[] = [
    { href: '/teacher', label: 'لوحة التحكم', icon: LayoutDashboard },
    { href: '/teacher/exams', label: 'الامتحانات', icon: FileText },
    { href: '/teacher/profile', label: 'الملف الشخصي', icon: User },
];

export const teacherConfig: DashboardConfig = {
    role: 'teacher',
    title: 'لوحة المدرس',
    subtitle: 'إدارة المحتوى',
    logo: BookOpen,
    logoGradient: 'from-purple-500 to-pink-500',
    primaryColor: 'purple',
    navItems: teacherNavItems,
    homeHref: '/teacher',
    loginRedirect: '/teacher',
    allowedRoles: ['teacher', 'admin'],
};
