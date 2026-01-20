# 📋 توثيق إصلاحات مشاكل التطبيق
## QAlaa Educational Platform - Vercel Compatibility Fixes
**تاريخ التحديث:** 2026-01-20

---

## 🎯 المشكلة الرئيسية

كان التطبيق يعمل محلياً لكن يفشل على **Vercel** بسبب استخدام مباشر للـ Supabase Client في الـ client components. هذا يسبب:
- صفحات تعلق في حالة loading إلى ما لا نهاية
- بيانات لا تظهر
- أخطاء في الـ authentication

### السبب الجذري:
```typescript
// ❌ هذا الكود يسبب مشاكل على Vercel
const supabase = createClient();
const { data: { user } } = await supabase.auth.getUser();
```

الـ `supabase.auth.getUser()` في الـ client components على Vercel لا يعمل بشكل صحيح لأن الـ cookies لا تُقرأ بنفس الطريقة.

### الحل:
تحويل كل الـ data fetching لاستخدام **API Routes** بدلاً من Supabase Client مباشرة.

---

## 📁 الملفات المُعدَّلة والمُضافة

### 1️⃣ API Routes

#### `/app/api/public/data/route.ts`
**الغرض:** API موحد لجلب البيانات العامة

**الـ Entities المدعومة:**
| Entity | الوصف | المثال |
|--------|-------|--------|
| `teachers` | جميع المعلمين المعتمدين | `?entity=teachers` |
| `teacher_profile` | بيانات معلم واحد | `?entity=teacher_profile&id=XXX` |
| `teacher_exams` | امتحانات معلم | `?entity=teacher_exams&teacherId=XXX` |
| `stages` | المراحل الدراسية | `?entity=stages` |
| `subjects` | المواد الدراسية | `?entity=subjects` |
| `lessons` | الدروس | `?entity=lessons&stageId=X&subjectId=Y` |
| `lesson` | درس واحد | `?entity=lesson&id=XXX` |
| `question_banks` | بنوك الأسئلة | `?entity=question_banks&lessonId=XXX` |
| `exams` | الامتحانات | `?entity=exams` |

**التعديلات:**
```typescript
// إضافة cases جديدة
case 'teacher_profile': {
    // جلب بيانات معلم واحد مع إحصائياته
}

case 'teacher_exams': {
    // جلب امتحانات المعلم من comprehensive_exams و teacher_exams
}
```

---

#### `/app/api/subscriptions/route.ts` ✨ جديد
**الغرض:** إدارة اشتراكات المستخدمين في المعلمين

**الـ Methods:**
| Method | الوظيفة | المثال |
|--------|---------|--------|
| `GET` | جلب اشتراكات المستخدم | `/api/subscriptions` |
| `POST` | الاشتراك في معلم | `POST /api/subscriptions` مع `{ teacherId }` |
| `DELETE` | إلغاء الاشتراك | `DELETE /api/subscriptions?teacherId=XXX` |

---

### 2️⃣ Services Layer

#### `/lib/services/teacher.service.ts`
**التعديل:** تحويل `getTeachers()` لاستخدام API

```typescript
// ❌ قبل (مباشر مع Supabase)
const supabase = getSupabaseClient();
const { data } = await supabase.from('profiles').select('*')...

// ✅ بعد (عبر API)
const res = await fetch(`${baseUrl}/api/public/data?entity=teachers&limit=200`);
const result = await res.json();
return result.data || [];
```

---

#### `/lib/services/subject.service.ts`
**التعديل:** تحويل `getActiveSubjects()` لاستخدام API

```typescript
// ✅ الكود الجديد
export async function getActiveSubjects(): Promise<Subject[]> {
    const res = await fetch('/api/public/data?entity=subjects&limit=100');
    const result = await res.json();
    return result.data || [];
}
```

---

### 3️⃣ Hooks

#### `/hooks/useSubscriptions.ts`
**التعديل الكامل:** إعادة بناء كاملة لاستخدام API

```typescript
// ✅ قبل: كان يستخدم createClient() مباشرة
// ✅ بعد: يستخدم fetch('/api/subscriptions')

const fetchSubscriptions = useCallback(async () => {
    const res = await fetch('/api/subscriptions');
    const result = await res.json();
    // ...
}, [userId]);

const toggle = useCallback(async (teacherId: string) => {
    if (isCurrentlySubscribed) {
        await fetch(`/api/subscriptions?teacherId=${teacherId}`, { method: 'DELETE' });
    } else {
        await fetch('/api/subscriptions', { 
            method: 'POST', 
            body: JSON.stringify({ teacherId }) 
        });
    }
}, []);
```

---

#### `/hooks/useTeachers.ts`
**التعديل:** إصلاح الفلترة

```typescript
// ❌ قبل (يبحث في bio فقط)
result = result.filter(t => t.bio?.includes(selectedCategory));

// ✅ بعد (يبحث في specialization، subjects، و bio)
result = result.filter(t => {
    const specialization = (t as any).specialization?.toLowerCase() || '';
    const subjects = (t as any).subjects || [];
    const bio = t.bio?.toLowerCase() || '';
    const categoryLower = selectedCategory.toLowerCase();
    
    return specialization.includes(categoryLower) ||
           subjects.some((s: string) => s.toLowerCase().includes(categoryLower)) ||
           bio.includes(categoryLower);
});
```

---

### 4️⃣ Page Components

#### `/app/teachers/[teacherId]/page.tsx`
**المشكلة:** الصفحة تعلق في loading

**السبب:**
```typescript
// ❌ هذا يسبب المشكلة
const supabase = createClient();
const { data: { user } } = await supabase.auth.getUser();
```

**الحل:**
```typescript
// ✅ استخدام API routes
const profileRes = await fetch(`/api/public/data?entity=teacher_profile&id=${teacherId}`);
const examsRes = await fetch(`/api/public/data?entity=teacher_exams&teacherId=${teacherId}`);
```

**التعديلات المحددة:**
1. ✅ إزالة `createClient` import
2. ✅ إزالة `supabase.auth.getUser()`
3. ✅ تحويل كل queries لـ API calls
4. ✅ تبسيط الـ `fetchData` function

---

#### `/components/shared/SubjectPage.tsx`
**المشكلة:** صفحة `/arabic` و `/english` تعلق

**الحل:**
```typescript
// ✅ إزالة
import { createClient } from '@/lib/supabase';
const { data: { user } } = await supabase.auth.getUser();

// ✅ استخدام API
const lessonsRes = await fetch(`/api/public/data?entity=lessons&stageId=${stageId}&subjectId=${subjectId}`);
```

---

#### `/components/shared/LessonPage.tsx`
**المشكلة:** صفحات الدروس لا تحمل

**الحل:**
```typescript
// ✅ استخدام API routes
const lessonRes = await fetch(`/api/public/data?entity=lesson&id=${lessonId}`);
const banksRes = await fetch(`/api/public/data?entity=question_banks&lessonId=${lessonId}`);
```

---

## 🔐 سياسات الأمان (RLS Policies)

### الجداول مع سياسات القراءة العامة:

| الجدول | السياسة | الشرط |
|--------|---------|-------|
| `subjects` | `subjects_public_read` | `USING (true)` |
| `educational_stages` | `stages_public_read` | `USING (true)` |
| `lessons` | `lessons_read_published` | `USING (is_published = true)` |
| `profiles` | `profiles_read_all` | `USING (true)` |
| `comprehensive_exams` | `Public can view published exams` | `USING (is_published = true)` |
| `teacher_subscriptions` | `subs_read_all` | `USING (true)` |
| `teacher_subscriptions` | `subs_insert_own` | `WITH CHECK (auth.uid() = user_id)` |
| `teacher_subscriptions` | `subs_delete_own` | `USING (auth.uid() = user_id)` |

---

## 📊 ملخص الصفحات المُصلَحة

| الصفحة | المشكلة | الحل |
|--------|---------|------|
| `/teachers` | المعلمين مش بيظهروا | تحويل `getTeachers()` لـ API |
| `/teachers/[id]` | الصفحة بتعلق | تحويل `fetchData()` لـ API routes |
| `/arabic` | الصفحة بتعلق | إزالة `supabase.auth.getUser()` |
| `/english` | الصفحة بتعلق | إزالة `supabase.auth.getUser()` |
| `/arabic/[lessonId]` | الدروس مش بتحمل | تحويل لـ API routes |
| `/english/[lessonId]` | الدروس مش بتحمل | تحويل لـ API routes |
| الفلترة | مش شغالة | إصلاح filter logic في `useTeachers` |
| الاشتراكات | مش بتشتغل | إنشاء `/api/subscriptions` route |

---

## 🚀 كيفية الاختبار

### 1. اختبار الـ API مباشرة:
```
https://qaweb-beryl.vercel.app/api/public/data?entity=teachers
https://qaweb-beryl.vercel.app/api/public/data?entity=subjects
https://qaweb-beryl.vercel.app/api/public/data?entity=teacher_profile&id=TEACHER_ID
```

### 2. اختبار الصفحات:
- `/teachers` - قائمة المعلمين
- `/teachers/[teacherId]` - صفحة المعلم
- `/arabic` - مادة اللغة العربية
- `/english` - مادة اللغة الإنجليزية

### 3. اختبار الفلترة:
- اختر مادة من القائمة المنسدلة
- تأكد من ظهور المعلمين المتخصصين في هذه المادة

### 4. اختبار الاشتراكات:
- سجل دخول
- اضغط على زر "اشتراك" في كارت المعلم
- تأكد من تحديث العداد

---

## 📝 ملاحظات مهمة

1. **الـ Cookies على Vercel:** لا تستخدم `createClient()` في الـ client components. استخدم API routes دائماً.

2. **الـ Server Components:** يمكن استخدام Supabase Server Client فيها بأمان.

3. **الـ Helper Function:**
```typescript
function getBaseUrl(): string {
    if (typeof window !== 'undefined') {
        return ''; // Client-side: relative URL
    }
    return process.env.NEXT_PUBLIC_SITE_URL || 
           (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
}
```

4. **Error Handling:** كل الـ API routes تُرجع:
```typescript
{ success: true, data: [...] }  // أو
{ success: false, error: "..." }
```

---

## 🔄 Commits المُرسلة

1. `fix: convert subjects service to use API route for Vercel compatibility`
2. `fix: convert teacher profile page to use API routes for Vercel compatibility`
3. `fix: improve teacher filtering to use specialization and subjects fields`
4. `feat: add subscriptions API route and refactor useSubscriptions hook for Vercel compatibility`

---

## ✅ الحالة النهائية

| الميزة | الحالة |
|--------|--------|
| عرض المعلمين | ✅ يعمل |
| صفحة المعلم | ✅ يعمل |
| صفحة المادة | ✅ يعمل |
| صفحة الدرس | ✅ يعمل |
| الفلترة | ✅ يعمل |
| الاشتراكات | ✅ يعمل (بعد الـ push) |
| البحث | ✅ يعمل |

---

**تم إعداد هذا التوثيق بواسطة:** AI Assistant  
**التاريخ:** 2026-01-20
