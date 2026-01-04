// =============================================
// Admin Constants - ثوابت لوحة التحكم
// =============================================

import { User, GraduationCap, Crown, Shield, LucideIcon } from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════
// Role Configuration
// ═══════════════════════════════════════════════════════════════════════════

export interface AdminRoleConfig {
    label: string;
    labelEn: string;
    color: string;
    bgColor: string;
    icon: LucideIcon;
}

export const ADMIN_ROLES: Record<string, AdminRoleConfig> = {
    student: {
        label: "طالب",
        labelEn: "Student",
        color: "text-blue-600 dark:text-blue-400",
        bgColor: "bg-blue-100 dark:bg-blue-900/30",
        icon: User,
    },
    teacher: {
        label: "معلم",
        labelEn: "Teacher",
        color: "text-purple-600 dark:text-purple-400",
        bgColor: "bg-purple-100 dark:bg-purple-900/30",
        icon: GraduationCap,
    },
    admin: {
        label: "مشرف",
        labelEn: "Admin",
        color: "text-amber-600 dark:text-amber-400",
        bgColor: "bg-amber-100 dark:bg-amber-900/30",
        icon: Crown,
    },
};


// ═══════════════════════════════════════════════════════════════════════════
// Status Configuration
// ═══════════════════════════════════════════════════════════════════════════

export interface StatusConfig {
    label: string;
    color: string;
    bgColor: string;
}

export const VERIFICATION_STATUS: Record<string, StatusConfig> = {
    verified: {
        label: "موثق",
        color: "text-green-600 dark:text-green-400",
        bgColor: "bg-green-100 dark:bg-green-900/30",
    },
    pending: {
        label: "بانتظار التوثيق",
        color: "text-amber-600 dark:text-amber-400",
        bgColor: "bg-amber-100 dark:bg-amber-900/30",
    },
    rejected: {
        label: "مرفوض",
        color: "text-red-600 dark:text-red-400",
        bgColor: "bg-red-100 dark:bg-red-900/30",
    },
};

export const PUBLISH_STATUS: Record<string, StatusConfig> = {
    published: {
        label: "منشور",
        color: "text-green-600 dark:text-green-400",
        bgColor: "bg-green-100 dark:bg-green-900/30",
    },
    draft: {
        label: "مسودة",
        color: "text-gray-600 dark:text-gray-400",
        bgColor: "bg-gray-100 dark:bg-gray-800",
    },
};

// ═══════════════════════════════════════════════════════════════════════════
// Pagination
// ═══════════════════════════════════════════════════════════════════════════

export const ADMIN_PAGINATION = {
    DEFAULT_PAGE_SIZE: 10,
    PAGE_SIZE_OPTIONS: [5, 10, 20, 50, 100],
    MAX_VISIBLE_PAGES: 5,
};


// ═══════════════════════════════════════════════════════════════════════════
// Animation Variants
// ═══════════════════════════════════════════════════════════════════════════

export const ANIMATION_VARIANTS = {
    container: {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.05 },
        },
    },
    item: {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { type: "spring", stiffness: 300, damping: 24 },
        },
    },
    fadeIn: {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.3 } },
    },
    slideUp: {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    },
    slideDown: {
        hidden: { opacity: 0, y: -20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    },
    scale: {
        hidden: { opacity: 0, scale: 0.95 },
        visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
    },
};

// ═══════════════════════════════════════════════════════════════════════════
// Filter Options
// ═══════════════════════════════════════════════════════════════════════════

export const FILTER_OPTIONS = {
    roles: [
        { value: "all", label: "جميع الأدوار" },
        { value: "student", label: "طلاب" },
        { value: "teacher", label: "معلمين" },
        { value: "admin", label: "مشرفين" },
    ],
    verified: [
        { value: "all", label: "الكل" },
        { value: "verified", label: "موثق" },
        { value: "pending", label: "غير موثق" },
    ],
    approval: [
        { value: "all", label: "الكل" },
        { value: "approved", label: "معتمد" },
        { value: "pending", label: "بانتظار" },
    ],
    status: [
        { value: "all", label: "كل الحالات" },
        { value: "published", label: "منشور" },
        { value: "draft", label: "مسودة" },
    ],
    language: [
        { value: "all", label: "كل اللغات" },
        { value: "arabic", label: "عربي" },
        { value: "english", label: "English" },
    ],
};

// ═══════════════════════════════════════════════════════════════════════════
// Color Gradients
// ═══════════════════════════════════════════════════════════════════════════

export const GRADIENT_COLORS = {
    primary: "from-primary-500 to-primary-600",
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    purple: "from-purple-500 to-purple-600",
    amber: "from-amber-500 to-amber-600",
    red: "from-red-500 to-red-600",
    emerald: "from-emerald-500 to-emerald-600",
    pink: "from-pink-500 to-pink-600",
    indigo: "from-indigo-500 to-indigo-600",
    gray: "from-gray-500 to-gray-600",
};

// ═══════════════════════════════════════════════════════════════════════════
// Table Column Widths
// ═══════════════════════════════════════════════════════════════════════════

export const COLUMN_WIDTHS = {
    checkbox: "40px",
    avatar: "60px",
    actions: "120px",
    status: "100px",
    date: "120px",
    number: "80px",
};

// ═══════════════════════════════════════════════════════════════════════════
// Messages
// ═══════════════════════════════════════════════════════════════════════════

export const ADMIN_MESSAGES = {
    loading: {
        default: "جاري التحميل...",
        users: "جاري تحميل المستخدمين...",
        teachers: "جاري تحميل المعلمين...",
        exams: "جاري تحميل الامتحانات...",
        settings: "جاري تحميل الإعدادات...",
    },
    empty: {
        default: "لا توجد نتائج",
        users: "لا يوجد مستخدمين",
        teachers: "لا يوجد معلمين",
        exams: "لا توجد امتحانات",
        search: "لا توجد نتائج للبحث",
    },
    success: {
        create: "تم الإنشاء بنجاح",
        update: "تم التحديث بنجاح",
        delete: "تم الحذف بنجاح",
        save: "تم الحفظ بنجاح",
    },
    error: {
        default: "حدث خطأ",
        fetch: "حدث خطأ في جلب البيانات",
        create: "حدث خطأ أثناء الإنشاء",
        update: "حدث خطأ أثناء التحديث",
        delete: "حدث خطأ أثناء الحذف",
    },
    confirm: {
        delete: "هل أنت متأكد من الحذف؟",
        logout: "هل أنت متأكد أنك تريد تسجيل الخروج؟",
    },
};
