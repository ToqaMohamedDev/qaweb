// ═══════════════════════════════════════════════════════════════════════════
// Dashboard Translations - ترجمات لوحات التحكم الموحدة
// ═══════════════════════════════════════════════════════════════════════════

import type { SupportedLanguage } from './index';

export const dashboardTranslations = {
    ar: {
        // Layout
        dashboard: 'لوحة التحكم',
        adminPanel: 'لوحة الأدمن',
        teacherPanel: 'لوحة المدرس',
        systemManagement: 'إدارة النظام',
        contentManagement: 'إدارة المحتوى',
        
        // Navigation
        home: 'الرئيسية',
        analytics: 'الإحصائيات',
        users: 'المستخدمين',
        teachers: 'المعلمين',
        stages: 'المراحل الدراسية',
        subjects: 'المواد',
        units: 'الوحدات',
        lessons: 'الدروس',
        exams: 'الامتحانات',
        quizQuestions: 'أسئلة الكويز',
        devices: 'الأجهزة',
        messages: 'الرسائل الواردة',
        testimonials: 'آراء الطلاب',
        support: 'محادثات الدعم',
        notifications: 'الإشعارات',
        settings: 'الإعدادات',
        profile: 'الملف الشخصي',
        
        // Actions
        add: 'إضافة',
        edit: 'تعديل',
        delete: 'حذف',
        save: 'حفظ',
        cancel: 'إلغاء',
        confirm: 'تأكيد',
        search: 'بحث',
        filter: 'تصفية',
        clearFilters: 'مسح الفلاتر',
        viewAll: 'عرض الكل',
        backToSite: 'العودة للموقع',
        logout: 'تسجيل الخروج',
        
        // Status
        loading: 'جاري التحميل...',
        verifyingPermissions: 'جاري التحقق من الصلاحيات...',
        published: 'منشور',
        draft: 'مسودة',
        approved: 'معتمد',
        pending: 'في انتظار الموافقة',
        
        // Exams
        createExam: 'إنشاء امتحان',
        editExam: 'تعديل الامتحان',
        deleteExam: 'حذف الامتحان',
        publishExam: 'نشر الامتحان',
        unpublishExam: 'إلغاء نشر الامتحان',
        examTitle: 'عنوان الامتحان',
        totalQuestions: 'إجمالي الأسئلة',
        totalSections: 'إجمالي الأقسام',
        duration: 'المدة',
        minutes: 'دقيقة',
        
        // Filters
        allLanguages: 'كل اللغات',
        arabic: 'عربي',
        english: 'إنجليزي',
        allStatus: 'كل الحالات',
        allStages: 'كل المراحل',
        allSubjects: 'كل المواد',
        allSemesters: 'كل الفصول',
        firstSemester: 'الترم الأول',
        secondSemester: 'الترم الثاني',
        fullYear: 'سنة كاملة',
        
        // Messages
        noExams: 'لا توجد امتحانات',
        noResults: 'لا توجد نتائج',
        confirmDelete: 'هل أنت متأكد من الحذف؟',
        deleteWarning: 'هذا الإجراء لا يمكن التراجع عنه',
        savedSuccessfully: 'تم الحفظ بنجاح',
        deletedSuccessfully: 'تم الحذف بنجاح',
        errorOccurred: 'حدث خطأ',
    },
    en: {
        // Layout
        dashboard: 'Dashboard',
        adminPanel: 'Admin Panel',
        teacherPanel: 'Teacher Panel',
        systemManagement: 'System Management',
        contentManagement: 'Content Management',
        
        // Navigation
        home: 'Home',
        analytics: 'Analytics',
        users: 'Users',
        teachers: 'Teachers',
        stages: 'Educational Stages',
        subjects: 'Subjects',
        units: 'Units',
        lessons: 'Lessons',
        exams: 'Exams',
        quizQuestions: 'Quiz Questions',
        devices: 'Devices',
        messages: 'Messages',
        testimonials: 'Testimonials',
        support: 'Support Chats',
        notifications: 'Notifications',
        settings: 'Settings',
        profile: 'Profile',
        
        // Actions
        add: 'Add',
        edit: 'Edit',
        delete: 'Delete',
        save: 'Save',
        cancel: 'Cancel',
        confirm: 'Confirm',
        search: 'Search',
        filter: 'Filter',
        clearFilters: 'Clear Filters',
        viewAll: 'View All',
        backToSite: 'Back to Site',
        logout: 'Logout',
        
        // Status
        loading: 'Loading...',
        verifyingPermissions: 'Verifying permissions...',
        published: 'Published',
        draft: 'Draft',
        approved: 'Approved',
        pending: 'Pending Approval',
        
        // Exams
        createExam: 'Create Exam',
        editExam: 'Edit Exam',
        deleteExam: 'Delete Exam',
        publishExam: 'Publish Exam',
        unpublishExam: 'Unpublish Exam',
        examTitle: 'Exam Title',
        totalQuestions: 'Total Questions',
        totalSections: 'Total Sections',
        duration: 'Duration',
        minutes: 'minutes',
        
        // Filters
        allLanguages: 'All Languages',
        arabic: 'Arabic',
        english: 'English',
        allStatus: 'All Status',
        allStages: 'All Stages',
        allSubjects: 'All Subjects',
        allSemesters: 'All Semesters',
        firstSemester: 'First Semester',
        secondSemester: 'Second Semester',
        fullYear: 'Full Year',
        
        // Messages
        noExams: 'No exams found',
        noResults: 'No results found',
        confirmDelete: 'Are you sure you want to delete?',
        deleteWarning: 'This action cannot be undone',
        savedSuccessfully: 'Saved successfully',
        deletedSuccessfully: 'Deleted successfully',
        errorOccurred: 'An error occurred',
    },
} as const;

export type DashboardTranslationKey = keyof typeof dashboardTranslations['ar'];

export function getDashboardTranslations(lang: SupportedLanguage) {
    return dashboardTranslations[lang];
}
