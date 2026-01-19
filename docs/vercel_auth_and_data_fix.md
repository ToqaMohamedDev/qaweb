# تقرير إصلاح مشاكل Vercel Google Auth وجلب البيانات
**تاريخ:** 19 يناير 2026
**المهمة:** إصلاح مشكلة عدم حفظ تسجيل الدخول عبر Google على Vercel، وفشل تحميل بيانات الدروس.

---

## 1. مشكلة عدم حفظ الجلسة (Auth Session Persistence)

### المشكلة:
عند تسجيل الدخول باستخدام Google على Vercel، يتم توجيه المستخدم بنجاح ولكن يعود للموقع بصفته "Guest" (غير مسجل). الكوكيز لا يتم حفظها في المتصفح بعد الـ Redirect.

### الحل الجذري:

#### أ) تحديث `app/auth/callback/route.ts`
قمنا بتبسيط المنطق للعودة للنمط القياسي (Standard SSR Pattern) مع إضافة خطوة حاسمة لنسخ الكوكيز يدوياً للـ Response لضمان عملها مع Vercel.

**التغييرات الرئيسية:**
1. استخدام `createServerClient` لتبادل الـ Code بـ Session.
2. نسخ الـ Cookies يدوياً من `cookieStore` إلى `NextResponse` قبل عمل Redirect.
3. ضبط خصائص الـ Cookie بدقة:
   - `SameSite: 'lax'` (ضروري لـ Google Auth Redirect).
   - `Path: '/'` (لضمان وجودها في كل الموقع).
   - `httpOnly: false` (للسماح للـ Client-side JS بالوصول إليها).
   - `Secure: true` (في الإنتاج).

```typescript
// app/auth/callback/route.ts snippet
// ...
const allCookies = cookieStore.getAll();
allCookies.forEach(cookie => {
    response.cookies.set({
        name: cookie.name,
        value: cookie.value,
        path: '/', 
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        httpOnly: false, // Explicitly false
        maxAge: 60 * 60 * 24 * 7 
    });
});
return response;
```

#### ب) تحديث `middleware.ts`
كان الـ Middleware يتجاهل المسارات العامة (Public Routes) مثل الصفحة الرئيسية `/`. هذا كان يمنع تجديد الجلسة (Session Refresh) عند العودة من Google.

**التغيير:**
- إزالة الشرط الذي يوقف الـ Middleware للمسارات العامة.
- جعل الـ Middleware يعمل دائماً لتحديث الـ Cookies (`supabase.auth.getUser()`)، لكنه لا يقوم بالـ Redirect لصفحة الدخول إلا إذا كان المسار محمي (Protected).

---

## 2. مشكلة تعليق تحميل البيانات (Infinite Loading)

### المشكلة:
بعد تسجيل الدخول، تظل الصفحة تحمل البيانات (Loading...) إلى الأبد.

### السبب:
استخدام دوال `supabase.auth.getUser()` أو `getSession()` داخل الـ Render Cycle في الـ Client-side كان يسبب تعليق (Deadlock) إذا كانت حالة الـ Cookies غير مستقرة.

### الحل:
في `hooks/useLessons.ts`:
1. عدنا لاستخدام طلبات مباشرة للداتابيز بدون الاعتماد الكلي على الـ Auth state لجلب البيانات العامة.
2. استخدام `Promise.all` لجلب البيانات بالتوازي (Parallel Fetching) لزيادة السرعة.

---

## 3. أخطاء أسماء الأعمدة (Database Column Mismatches)

### المشكلة:
ظهور أخطاء 500 في الـ Console وملاحظة فشل جلب الدروس.

### الأخطاء المكتشفة:
1. استخدام `educational_stage_id` بدلاً من الاسم الصحيح `stage_id`.
2. استخدام الترتيب بعمود `order` وهو غير موجود.

### الحل:
- تم تعديل الاستعلام في `hooks/useLessons.ts`:
  - `.eq('stage_id', stage.id)`
  - `.order('title', { ascending: true })` (كبديل مؤقت للترتيب).

---

## 4. أخطاء TypeScript Build

### المشكلة:
فشل الـ Build بسبب محاولة قراءة خاصية `httpOnly` من `RequestCookie` وهي غير موجودة.

### الحل:
في `app/auth/callback/route.ts`، قمنا بتعيين `httpOnly: false` صراحةً بدلاً من محاولة قراءتها من الكوكي الأصلي.

---

## الخلاصة
الموقع الآن يعمل بنمط Hybird قوي:
1. **Server-Side (Middleware & Callback):** يضمن ثبات جلسة المستخدم.
2. **Client-Side (Hooks):** يجلب البيانات بكفاءة ويتعامل بمرونة مع الأخطاء.

## 5. Middleware Override Issue
**المشكلة:** بالرغم من ضبط الكوكيز في الـ Callback، الـ Middleware كان يعيد كتابتها بـ `httpOnly: true` (الافتراضي) عند كل زيارة، مما يخفيها عن الـ Browser Client.

**الحل:** إضافة `httpOnly: false` لـ `middleware.ts` أيضاً لضمان الرؤية الدائمة.
