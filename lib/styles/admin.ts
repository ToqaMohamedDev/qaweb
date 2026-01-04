/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                    ADMIN STYLES - ثوابت التنسيق للإدارة                   ║
 * ║                                                                          ║
 * ║  نظام ألوان وتنسيقات موحد لجميع صفحات الإدارة                            ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN THEME - اللون الأساسي للإدارة
// ═══════════════════════════════════════════════════════════════════════════

export const adminTheme = {
    // اللون الأساسي - يُستخدم للهيدر والأزرار الرئيسية
    primary: {
        gradient: 'from-slate-800 via-slate-900 to-slate-800',
        accent: 'primary-600', // الأزرار
        accentHover: 'primary-700',
        light: 'primary-50',
        dark: 'primary-900/30',
    },

    // البطاقات والخلفيات
    card: {
        bg: 'bg-white dark:bg-[#1c1c24]',
        border: 'border-gray-200 dark:border-[#2e2e3a]',
        hover: 'hover:border-primary-300 dark:hover:border-primary-700',
    },

    // الحقول والمدخلات
    input: {
        bg: 'bg-gray-50 dark:bg-[#252530]',
        border: 'border-gray-200 dark:border-[#2e2e3a]',
        focus: 'focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
    },

    // الحالات
    status: {
        published: {
            bg: 'bg-green-100 dark:bg-green-900/30',
            text: 'text-green-700 dark:text-green-400',
            border: 'border-green-200 dark:border-green-800',
        },
        draft: {
            bg: 'bg-gray-100 dark:bg-gray-800',
            text: 'text-gray-600 dark:text-gray-400',
            border: 'border-gray-200 dark:border-gray-700',
        },
    },

    // الصعوبة
    difficulty: {
        easy: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400' },
        medium: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400' },
        hard: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400' },
    },
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT CLASSES - كلاسات جاهزة للمكونات
// ═══════════════════════════════════════════════════════════════════════════

export const adminClasses = {
    // الهيدر الرئيسي
    pageHeader: `
        relative overflow-hidden rounded-2xl 
        bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 
        p-6 text-white
    `,

    // زر إنشاء جديد
    createButton: `
        flex items-center gap-2 px-5 py-2.5 rounded-xl 
        bg-primary-600 hover:bg-primary-700 
        text-white font-medium text-sm transition-all 
        shadow-lg shadow-primary-600/20
    `,

    // البطاقة
    card: `
        bg-white dark:bg-[#1c1c24] rounded-2xl 
        border border-gray-200 dark:border-[#2e2e3a] 
        hover:border-primary-300 dark:hover:border-primary-700 
        overflow-hidden transition-all duration-300 hover:shadow-lg
    `,

    // بطاقة الإحصائيات
    statCard: `
        bg-white dark:bg-[#1c1c24] rounded-xl p-4 
        border border-gray-200 dark:border-[#2e2e3a] 
        hover:shadow-md transition-all
    `,

    // حقل البحث
    searchInput: `
        w-full pr-12 pl-4 py-3 rounded-xl 
        border border-gray-200 dark:border-[#2e2e3a] 
        bg-gray-50 dark:bg-[#252530] 
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 
        text-sm transition-all
    `,

    // القائمة المنسدلة
    select: `
        w-full px-4 py-3 rounded-xl 
        border border-gray-200 dark:border-[#2e2e3a] 
        bg-white dark:bg-[#252530] 
        text-sm font-medium 
        focus:border-primary-500 focus:ring-2 focus:ring-primary-100 
        transition-all cursor-pointer
    `,

    // زر الإجراء الثانوي
    secondaryButton: `
        flex items-center gap-2 px-4 py-2 rounded-xl 
        bg-gray-100 dark:bg-gray-800 
        text-gray-700 dark:text-gray-300 
        hover:bg-primary-50 dark:hover:bg-primary-900/20 
        hover:text-primary-700 dark:hover:text-primary-400 
        font-medium text-sm transition-colors
    `,

    // زر الحذف
    deleteButton: `
        text-gray-400 hover:text-red-500 
        hover:bg-red-50 dark:hover:bg-red-900/20 
        p-2 rounded-lg transition-colors
    `,

    // شارة الحالة
    badge: {
        published: `px-2.5 py-1 rounded-lg text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400`,
        draft: `px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400`,
        arabic: `px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400`,
        english: `px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400`,
    },

    // الأيقونة مع الخلفية
    iconBox: `
        p-3 rounded-xl bg-primary-100 dark:bg-primary-900/30 
        text-primary-600 dark:text-primary-400
    `,

    // خلفية العنصر النشط
    activeItem: `
        bg-primary-50 dark:bg-primary-900/20 
        border-primary-300 dark:border-primary-700
    `,
};

// ═══════════════════════════════════════════════════════════════════════════
// ANIMATION VARIANTS - متغيرات الحركة
// ═══════════════════════════════════════════════════════════════════════════

export const adminAnimations = {
    container: {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    },
    item: {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { type: 'spring', stiffness: 300, damping: 24 }
        }
    },
    fadeIn: {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.2 } }
    },
};

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default adminClasses;
