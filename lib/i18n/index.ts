// =============================================
// نظام الترجمة المركزي - Centralized i18n System
// =============================================

export type SupportedLanguage = 'ar' | 'en';

export interface LocalizedText {
    ar: string;
    en: string;
}

/**
 * الحصول على النص بناءً على اللغة
 */
export function getText(text: LocalizedText | string | undefined | null, lang: SupportedLanguage = 'ar'): string {
    if (!text) return '';
    if (typeof text === 'string') return text;
    return text[lang] || text.ar || text.en || '';
}

/**
 * الحصول على اتجاه النص
 */
export function getDirection(lang: SupportedLanguage): 'rtl' | 'ltr' {
    return lang === 'ar' ? 'rtl' : 'ltr';
}

/**
 * ترجمات عامة للواجهة
 */
export const commonTranslations = {
    ar: {
        // Navigation
        backToHome: 'العودة للرئيسية',
        back: 'رجوع',
        next: 'التالي',
        previous: 'السابق',

        // Actions
        save: 'حفظ',
        cancel: 'إلغاء',
        delete: 'حذف',
        edit: 'تعديل',
        add: 'إضافة',
        submit: 'إرسال',
        confirm: 'تأكيد',

        // Status
        loading: 'جاري التحميل...',
        error: 'حدث خطأ',
        success: 'تمت العملية بنجاح',
        noData: 'لا توجد بيانات',

        // Common Labels
        lessons: 'الدروس',
        exams: 'الامتحانات',
        questions: 'الأسئلة',
        lesson: 'درس',
        exam: 'امتحان',
        question: 'سؤال',

        // Time
        minutes: 'دقيقة',
        hours: 'ساعة',
        seconds: 'ثانية',

        // Results
        score: 'الدرجة',
        correct: 'صحيح',
        incorrect: 'خطأ',
        passed: 'ناجح',
        failed: 'راسب',
    },
    en: {
        // Navigation
        backToHome: 'Back to Home',
        back: 'Back',
        next: 'Next',
        previous: 'Previous',

        // Actions
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        add: 'Add',
        submit: 'Submit',
        confirm: 'Confirm',

        // Status
        loading: 'Loading...',
        error: 'An error occurred',
        success: 'Operation successful',
        noData: 'No data available',

        // Common Labels
        lessons: 'Lessons',
        exams: 'Exams',
        questions: 'Questions',
        lesson: 'Lesson',
        exam: 'Exam',
        question: 'Question',

        // Time
        minutes: 'minutes',
        hours: 'hours',
        seconds: 'seconds',

        // Results
        score: 'Score',
        correct: 'Correct',
        incorrect: 'Incorrect',
        passed: 'Passed',
        failed: 'Failed',
    }
} as const;

/**
 * ترجمات صفحات المواد الدراسية
 */
export const subjectPageTranslations = {
    ar: {
        arabic: 'اللغة العربية',
        arabicColored: 'العربية',
        noLessonsMessage: 'لا توجد دروس لهذه المرحلة حالياً',
        noExamsMessage: 'لا توجد امتحانات لهذه المرحلة حالياً',
        comprehensiveExam: 'امتحان شامل',
        grade: 'درجة',
    },
    en: {
        arabic: 'Arabic Language',
        arabicColored: 'Arabic',
        noLessonsMessage: 'No lessons available for this stage',
        noExamsMessage: 'No exams available for this stage',
        comprehensiveExam: 'Comprehensive Exam',
        grade: 'grade',
    }
} as const;

export type CommonTranslationKey = keyof typeof commonTranslations['ar'];
export type SubjectTranslationKey = keyof typeof subjectPageTranslations['ar'];

/**
 * Hook-like function للحصول على الترجمات
 */
export function useTranslations<T extends Record<SupportedLanguage, Record<string, string>>>(
    translations: T,
    lang: SupportedLanguage
): T[SupportedLanguage] {
    return translations[lang];
}

// Question Bank Translations
export { questionBankI18n, getTranslations, type QuestionBankTranslations } from './question-bank';

// Dashboard Translations
export { dashboardTranslations, getDashboardTranslations, type DashboardTranslationKey } from './dashboard';

