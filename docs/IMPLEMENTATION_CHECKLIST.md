# ✅ قائمة التنفيذ العملية - Implementation Checklist

> هذا الملف يحتوي على الخطوات العملية لتنفيذ خطة التوحيد

---

## 📋 المرحلة 1: توحيد Supabase Client

### الخطوة 1.1: إنشاء الملف الموحد
- [ ] إنشاء `/lib/supabase/index.ts`
- [ ] نقل `createBrowserClient` من `lib/supabase-client.ts`
- [ ] نقل `createServerClient` من `lib/supabase-server.ts`
- [ ] نقل `createAdminClient` من `lib/data/client.ts`

### الخطوة 1.2: تحديث الـ imports في الملفات التالية

#### API Routes:
- [ ] `app/api/public/data/route.ts`
- [ ] `app/api/exam/route.ts`
- [ ] `app/api/admin/query/route.ts`
- [ ] `app/api/auth/callback/route.ts`
- [ ] `app/api/notifications/*.ts`
- [ ] `app/api/subscriptions/route.ts`
- [ ] `app/api/support/route.ts`
- [ ] جميع API routes الأخرى

#### Services:
- [ ] `lib/services/auth.service.ts`
- [ ] `lib/services/exam.service.ts`
- [ ] `lib/services/teacher.service.ts`
- [ ] `lib/services/profile.service.ts`
- [ ] `lib/services/lesson.service.ts`
- [ ] `lib/services/notification.service.ts`
- [ ] جميع الخدمات الأخرى

#### Stores:
- [ ] `lib/stores/useAuthStore.ts`
- [ ] `lib/stores/useExamStore.ts`

#### Hooks:
- [ ] `hooks/useExamSession.ts`
- [ ] `hooks/useAuth.ts`
- [ ] `hooks/useProfile.tsx`
- [ ] `hooks/useTeacherSetup.ts`

#### Pages:
- [ ] `app/teacher/exams/page.tsx`
- [ ] `app/admin/exams/page.tsx`
- [ ] `app/login/page.tsx`
- [ ] `app/signup/page.tsx`
- [ ] جميع الصفحات التي تستخدم Supabase مباشرة

### الخطوة 1.3: حذف الملفات القديمة
- [ ] حذف `lib/supabase-client.ts` (بعد التأكد من عدم وجود imports)
- [ ] حذف `lib/supabase-server.ts`
- [ ] تحديث `lib/data/client.ts` ليكون re-export فقط
- [ ] تحديث `lib/supabase.ts` ليكون re-export فقط

### الخطوة 1.4: الاختبار
- [ ] اختبار تسجيل الدخول
- [ ] اختبار تسجيل الخروج
- [ ] اختبار جلب البيانات في Admin
- [ ] اختبار جلب البيانات في Teacher
- [ ] اختبار API routes

---

## 📋 المرحلة 2: توحيد API Layer

### الخطوة 2.1: إنشاء الهيكل الجديد
- [ ] إنشاء `/lib/api/index.ts`
- [ ] تحديث `/lib/api-client/index.ts` ليتكامل مع الهيكل الجديد
- [ ] إضافة type definitions في `/lib/api/types.ts`

### الخطوة 2.2: إنشاء API modules

```
lib/api/
├── index.ts           # Main export
├── types.ts           # API types
├── client.ts          # Base client
├── modules/
│   ├── public.ts      # Public data API
│   ├── exams.ts       # Exams API
│   ├── admin.ts       # Admin API
│   ├── notifications.ts
│   └── subscriptions.ts
```

- [ ] إنشاء `lib/api/modules/public.ts`
- [ ] إنشاء `lib/api/modules/exams.ts`
- [ ] إنشاء `lib/api/modules/admin.ts`
- [ ] إنشاء `lib/api/modules/notifications.ts`
- [ ] إنشاء `lib/api/modules/subscriptions.ts`

### الخطوة 2.3: تحديث الـ imports

#### Hooks:
- [ ] `hooks/useTeachers.ts`
- [ ] `hooks/useSubscriptions.ts`
- [ ] `hooks/useNotifications.ts`

#### Components:
- [ ] `components/teachers/*.tsx`
- [ ] `components/exam/*.tsx`

### الخطوة 2.4: الاختبار
- [ ] اختبار جلب المعلمين
- [ ] اختبار جلب الامتحانات
- [ ] اختبار الاشتراكات
- [ ] اختبار الإشعارات

---

## 📋 المرحلة 3: توحيد Hooks

### الخطوة 3.1: إعادة هيكلة مجلد hooks

```
lib/hooks/
├── index.ts
├── entities/
│   ├── useStages.ts
│   ├── useSubjects.ts
│   ├── useLessons.ts
│   ├── useExams.ts
│   ├── useUsers.ts
│   └── useTeachers.ts
├── features/
│   ├── useExamSession.ts
│   ├── useExamCreate.ts
│   └── useQuestionBankCreate.ts
├── auth/
│   ├── useAuth.ts
│   └── useProtectedRoute.ts
└── ui/
    ├── useFormValidation.ts
    ├── useAdminTable.ts
    └── useAsync.ts
```

- [ ] إنشاء المجلدات الفرعية
- [ ] نقل الـ hooks الموجودة للأماكن الصحيحة

### الخطوة 3.2: دمج الـ queries المكررة
- [ ] دمج `lib/queries/index.ts` في `lib/hooks/entities/`
- [ ] دمج `lib/queries/adminQueries.ts` في `lib/hooks/entities/`
- [ ] حذف `lib/queries/` بعد الدمج

### الخطوة 3.3: تحديث الـ exports
- [ ] تحديث `hooks/index.ts`
- [ ] تحديث كل الملفات التي تستورد من hooks

### الخطوة 3.4: الاختبار
- [ ] اختبار كل hook على حدة
- [ ] اختبار الصفحات التي تستخدم الـ hooks

---

## 📋 المرحلة 4: توحيد Services

### الخطوة 4.1: إعادة هيكلة Services

```
lib/services/
├── index.ts
├── core/
│   ├── auth.service.ts
│   ├── notification.service.ts
│   └── support.service.ts
├── entities/
│   ├── stage.service.ts
│   ├── subject.service.ts
│   ├── lesson.service.ts
│   ├── exam.service.ts
│   ├── question.service.ts
│   ├── teacher.service.ts
│   └── user.service.ts
└── utils/
    ├── cache.ts
    └── helpers.ts
```

- [ ] إعادة هيكلة المجلدات
- [ ] دمج `lib/data/service.ts` في `lib/services/`

### الخطوة 4.2: تحديث API routes لاستخدام Services
- [ ] تحديث `app/api/public/data/route.ts`
- [ ] تحديث `app/api/exam/route.ts`
- [ ] تحديث `app/api/admin/query/route.ts`

### الخطوة 4.3: حذف الملفات المكررة
- [ ] حذف `lib/data/service.ts` (بعد الدمج)
- [ ] تحديث `lib/data/index.ts`

---

## 📋 المرحلة 5: توحيد Components

### الخطوة 5.1: إنشاء Design System

```
components/
├── ui/                 # Atomic
├── layout/             # Layout
├── forms/              # Forms
├── data/               # Data display
└── features/           # Feature-specific
```

### الخطوة 5.2: دمج المكونات المكررة
- [ ] دمج `common/Skeleton` و `shared/Skeleton`
- [ ] دمج `common/EmptyState` و `shared/EmptyState`
- [ ] دمج `common/ErrorBoundary` و `shared/ErrorBoundary`

### الخطوة 5.3: تحديث الـ exports
- [ ] تحديث `components/index.ts`
- [ ] تحديث كل الـ imports

---

## 📋 المرحلة 6: توحيد Types

### الخطوة 6.1: إعادة هيكلة Types

```
lib/types/
├── index.ts
├── database.types.ts
├── api.types.ts
├── entities/
│   ├── user.ts
│   ├── exam.ts
│   ├── lesson.ts
│   └── teacher.ts
└── common.ts
```

### الخطوة 6.2: تحديث الـ imports
- [ ] تحديث كل الملفات التي تستورد types

---

## 🧪 الاختبار النهائي

### اختبارات وظيفية:
- [ ] تسجيل دخول/خروج
- [ ] إنشاء حساب جديد
- [ ] عرض الصفحة الرئيسية
- [ ] عرض قائمة المعلمين
- [ ] عرض صفحة معلم
- [ ] الاشتراك في معلم
- [ ] عرض امتحان
- [ ] حل امتحان
- [ ] عرض النتائج

### اختبارات Admin:
- [ ] لوحة التحكم
- [ ] إدارة المستخدمين
- [ ] إدارة الامتحانات
- [ ] إنشاء امتحان
- [ ] إدارة الدروس

### اختبارات Teacher:
- [ ] لوحة التحكم
- [ ] قائمة الامتحانات
- [ ] إنشاء امتحان
- [ ] نشر امتحان

---

## 📝 ملاحظات التنفيذ

### قواعد مهمة:
1. **لا تحذف أي ملف قبل التأكد من عدم وجود imports له**
2. **اختبر بعد كل تغيير صغير**
3. **استخدم git branches للعمل**
4. **راجع الكود قبل الـ merge**

### أوامر مفيدة:

```bash
# البحث عن imports لملف معين
grep -r "from.*supabase-client" --include="*.ts" --include="*.tsx"

# التأكد من عدم وجود أخطاء TypeScript
npx tsc --noEmit

# البحث عن استخدامات دالة معينة
grep -r "getSupabaseClient" --include="*.ts" --include="*.tsx"
```

---

## 📊 تتبع التقدم

| المرحلة | الحالة | التاريخ |
|---------|--------|---------|
| توحيد Supabase | ⏳ لم يبدأ | - |
| توحيد API Layer | ⏳ لم يبدأ | - |
| توحيد Hooks | ⏳ لم يبدأ | - |
| توحيد Services | ⏳ لم يبدأ | - |
| توحيد Components | ⏳ لم يبدأ | - |
| توحيد Types | ⏳ لم يبدأ | - |
| الاختبار النهائي | ⏳ لم يبدأ | - |

---

> **تذكير:** هذه القائمة للتتبع فقط. راجع `COMPREHENSIVE_ANALYSIS.md` للتفاصيل الكاملة.
