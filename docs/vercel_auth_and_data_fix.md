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

## 6. Server-Side Auth Hydration (تمرير الجلسة من السيرفر)
**الهدف:** تجاوز مشكلة قراءة الكوكيز (HttpOnly) في المتصفح عن طريق جلب بيانات المستخدم في `RootLayout` (السيرفر) وتمريرها مباشرة لـ `AuthProvider`.

**التنفيذ:**
1. تعديل `app/layout.tsx` لجلب `user` و `profile` باستخدام `createServerClient`.
2. تمرير البيانات عبر `ClientProviders` إلى `AuthProvider`.
3. تعديل `AuthProvider` لاستخدام هذه البيانات فوراً (Hydration) عوضاً عن انتظار `getSession`.

**النتيجة (تشخيص Vercel Logs):**
- **نجاح:** ظهر في اللوج `[AuthProvider] Hydrating session from server props` مما يعني أن البيانات وصلت للعميل.
- **نجاح:** تعرف المتصفح على المستخدم (`SIGNED_IN`).
- **فشل:** ظهر خطأ **React Error #418 (Hydration Mismatch)**. هذا يعني اختلاف بين ما رسمه السيرفر وما توقعه المتصفح، مما قد يؤدي لكسر الواجهة أو إعادة تحميل غير نهائية، وهو ما يفسر استمرار "التعليق".

## 7. API Mediator Pattern (الحل النهائي)
**الهدف:** حل مشكلة قراءة الـ HttpOnly Cookies ومشكلة الـ Hydration Error معاً.

**التنفيذ:**
1. إنشاء API Route جديد `/api/auth/session` يعمل كجسر (Bridge).
2. الـ Client (`AuthProvider`) يطلب هذا الـ API عند البدء.
3. الـ API (يعمل على السيرفر) يقرأ الكوكيز، ويتحقق من Supabase، ويرجع بيانات المستخدم كـ JSON.
4. إزالة تمرير البيانات من `layout.tsx` لتجنب أخطاء React Hydration.


## 8. Server Actions for Data Fetching
**المشكلة:** استمرار تعليق جلب البيانات (Lessons) في المتصفح، حتى مع إصلاح الـ Auth. السبب المحتمل هو تداخلات الشبكة أو مشاكل في Supabase Client-side SDK مع بيئة Vercel.
**الحل:** نقل منطق جلب الدروس بالكامل إلى **Server Action** (`lib/actions/lessons.ts`).
**النتيجة المتوقعة:** البيانات يتم جلبها بسرعة وموثوقية على السيرفر، بمعزل عن مشاكل المتصفح.

## 9. Disable Auth Redirect Loop
**المشكلة:** المستخدم عالق في حلقة مفرغة: السيرفر يراه مسجل دخول ويحوله للصفحة الرئيسية، بينما الواجهة الرئيسية قد تكون غير مستجيبة، مما يمنعه من محاولة تسجيل الدخول مرة أخرى أو تسجيل الخروج.
**الحل:** تعطيل خاصية التحويل التلقائي (Redirect) من صفحة الدخول في `middleware.ts` مؤقتاً.
