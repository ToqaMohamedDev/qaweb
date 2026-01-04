// =============================================
// Arabic Messages Constants - ثوابت الرسائل العربية
// =============================================

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION MESSAGES - رسائل التحقق
// ═══════════════════════════════════════════════════════════════════════════

export const validationMessages = {
    required: {
        name: "الاسم مطلوب",
        email: "البريد الإلكتروني مطلوب",
        password: "كلمة المرور مطلوبة",
        confirmPassword: "تأكيد كلمة المرور مطلوب",
        phone: "رقم الهاتف مطلوب",
        message: "الرسالة مطلوبة",
        title: "العنوان مطلوب",
        description: "الوصف مطلوب",
        subject: "الموضوع مطلوب",
    },
    invalid: {
        email: "البريد الإلكتروني غير صحيح",
        phone: "رقم الهاتف غير صحيح",
        url: "الرابط غير صحيح",
        date: "التاريخ غير صحيح",
        number: "الرقم غير صحيح",
    },
    length: {
        name: (min: number) => `الاسم يجب أن يكون ${min} أحرف على الأقل`,
        password: (min: number) => `كلمة المرور يجب أن تكون ${min} أحرف على الأقل`,
        min: (field: string, min: number) => `${field} يجب أن يكون ${min} أحرف على الأقل`,
        max: (field: string, max: number) => `${field} يجب أن لا يتجاوز ${max} حرف`,
    },
    match: {
        password: "كلمة المرور غير متطابقة",
        email: "البريد الإلكتروني غير متطابق",
    },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// AUTH MESSAGES - رسائل المصادقة
// ═══════════════════════════════════════════════════════════════════════════

export const authMessages = {
    login: {
        title: "مرحباً بعودتك! 👋",
        subtitle: "سجّل دخولك للمتابعة إلى حسابك",
        button: "تسجيل الدخول",
        googleButton: "تسجيل الدخول بـ Google",
        loadingGoogle: "جاري تسجيل الدخول...",
        noAccount: "ليس لديك حساب؟",
        createAccount: "إنشاء حساب جديد",
        rememberMe: "تذكرني",
        forgotPassword: "نسيت كلمة المرور؟",
    },
    signup: {
        title: "إنشاء حساب جديد ✨",
        subtitle: "انضم إلينا وابدأ رحلة التعلم",
        button: "إنشاء الحساب",
        googleButton: "التسجيل بـ Google",
        loadingGoogle: "جاري التسجيل...",
        hasAccount: "لديك حساب بالفعل؟",
        loginLink: "تسجيل الدخول",
        accountType: "نوع الحساب",
        terms: "أوافق على",
        termsLink: "الشروط والأحكام",
        privacyLink: "سياسة الخصوصية",
    },
    roles: {
        student: {
            label: "طالب",
            description: "أريد التعلم والمشاركة في الاختبارات",
        },
        teacher: {
            label: "مدرس",
            description: "أريد إنشاء وإدارة الاختبارات",
        },
    },
    errors: {
        userExists: "هذا البريد الإلكتروني مسجل بالفعل",
        weakPassword: "كلمة المرور ضعيفة جداً",
        invalidCredentials: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
        emailNotConfirmed: "يرجى تأكيد البريد الإلكتروني أولاً",
        signupError: "حدث خطأ أثناء إنشاء الحساب",
        loginError: "حدث خطأ أثناء تسجيل الدخول",
        googleError: "حدث خطأ أثناء التسجيل بـ Google",
    },
    success: {
        emailSent: "تم إرسال رسالة تأكيد إلى بريدك الإلكتروني",
        passwordReset: "تم إرسال رابط إعادة تعيين كلمة المرور",
        accountCreated: "تم إنشاء الحساب بنجاح",
    },
    passwordStrength: {
        weak: "ضعيفة",
        medium: "متوسطة",
        good: "جيدة",
        strong: "قوية",
        strengthLabel: "قوة كلمة المرور",
        requirements: {
            length: "6 أحرف على الأقل",
            uppercase: "حرف كبير",
            lowercase: "حرف صغير",
            number: "رقم",
        },
    },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// FORM LABELS - تسميات النماذج
// ═══════════════════════════════════════════════════════════════════════════

export const formLabels = {
    name: "الاسم الكامل",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    confirmPassword: "تأكيد كلمة المرور",
    phone: "رقم الهاتف",
    message: "الرسالة",
    title: "العنوان",
    description: "الوصف",
    subject: "الموضوع",
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// PLACEHOLDERS - النصوص الإرشادية
// ═══════════════════════════════════════════════════════════════════════════

export const placeholders = {
    name: "أدخل اسمك الكامل",
    email: "example@email.com",
    password: "••••••••",
    confirmPassword: "••••••••",
    phone: "01xxxxxxxxx",
    message: "اكتب رسالتك هنا...",
    search: "ابحث...",
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// COMMON UI TEXT - نصوص واجهة المستخدم
// ═══════════════════════════════════════════════════════════════════════════

export const uiText = {
    buttons: {
        save: "حفظ",
        cancel: "إلغاء",
        delete: "حذف",
        edit: "تعديل",
        add: "إضافة",
        submit: "إرسال",
        close: "إغلاق",
        back: "رجوع",
        next: "التالي",
        previous: "السابق",
        confirm: "تأكيد",
        retry: "إعادة المحاولة",
        loading: "جاري التحميل...",
    },
    status: {
        loading: "جاري التحميل...",
        success: "تم بنجاح",
        error: "حدث خطأ",
        noData: "لا توجد بيانات",
        noResults: "لا توجد نتائج",
    },
    or: "أو",
    and: "و",
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// ERROR MESSAGES - رسائل الخطأ
// ═══════════════════════════════════════════════════════════════════════════

export const errorMessages = {
    general: "حدث خطأ غير متوقع",
    network: "خطأ في الاتصال بالشبكة",
    server: "خطأ في الخادم",
    notFound: "الصفحة غير موجودة",
    unauthorized: "غير مصرح لك بالوصول",
    forbidden: "الوصول محظور",
    timeout: "انتهت مهلة الطلب",
} as const;
