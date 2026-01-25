# 🚀 خطة تحسين أداء الموقع - Performance Optimization Plan

> **تاريخ الإنشاء:** 25 يناير 2026  
> **الهدف:** تقليل وقت تحميل البيانات من ثوانٍ إلى أجزاء من الثانية

---

## 📊 ملخص المشاكل المكتشفة

### 1. **Waterfall Queries (المشكلة الأكبر)**
في ملف `lib/actions/dashboard.ts`:
- **8+ استعلامات متتالية** بدلاً من parallel
- كل query ينتظر السابق ليكتمل
- **التأثير:** 8x زمن أبطأ من اللازم

### 2. **N+1 Query Problem**
- جلب كل الدروس ثم filter في JavaScript
- بدلاً من عمل filter في database مباشرة

### 3. **عدم وجود Caching**
- البيانات الثابتة (stages, subjects, app_settings) تُجلب في كل request
- لا يوجد استخدام لـ React Query أو SWR

### 4. **Table Bloat في قاعدة البيانات**
- `profiles`: 87.8% bloat
- `notifications`: 100% bloat  
- `subjects`: 100% bloat
- `teacher_subscriptions`: 90.91% bloat

### 5. **RLS Policies مكررة**
- سياسات أمان متعددة على نفس الجدول تضيف overhead

### 6. **Indexes غير مستخدمة**
- العديد من indexes لا تُستخدم (is_unused: true)

---

## 🎯 خطة التنفيذ (مرتبة حسب الأولوية)

---

## المرحلة 1: تحسين Dashboard Action (الأهم) ⚡

### 1.1 تحويل Waterfall إلى Parallel Queries

**قبل:**
```typescript
// 8 queries متتالية - كل واحد ينتظر السابق
const { data: appSettings } = await supabase.from('app_settings')...
const { data: { user } } = await supabase.auth.getUser();
const { data: profile } = await supabase.from('profiles')...
const { data: userStage } = await supabase.from('educational_stages')...
// ... إلخ
```

**بعد:**
```typescript
// جميع الاستعلامات المستقلة في وقت واحد
const [appSettingsResult, userResult] = await Promise.all([
  supabase.from('app_settings').select('...').eq('id', 'global').single(),
  supabase.auth.getUser()
]);

// ثم الاستعلامات المعتمدة على النتائج
const [profileResult, stageResult, lessonsResult] = await Promise.all([
  supabase.from('profiles').select('...').eq('id', user.id).single(),
  supabase.from('educational_stages').select('...'),
  supabase.from('lessons').select('id, subject_id, stage_id, semester').eq('is_published', true)
]);
```

### 1.2 إنشاء Database Function للـ Dashboard

```sql
-- دالة واحدة تجلب كل بيانات الـ Dashboard
CREATE OR REPLACE FUNCTION get_dashboard_data(p_user_id UUID DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
  v_stage_id UUID;
  v_stage_name TEXT;
  v_show_first BOOLEAN;
  v_show_second BOOLEAN;
  v_result JSON;
BEGIN
  -- جلب إعدادات الترم
  SELECT show_first_semester, show_second_semester 
  INTO v_show_first, v_show_second
  FROM app_settings WHERE id = 'global';
  
  -- جلب مرحلة المستخدم
  IF p_user_id IS NOT NULL THEN
    SELECT es.id, es.name INTO v_stage_id, v_stage_name
    FROM profiles p
    JOIN educational_stages es ON p.educational_stage_id = es.id
    WHERE p.id = p_user_id;
  END IF;
  
  -- الافتراضية إذا لم توجد
  IF v_stage_id IS NULL THEN
    SELECT id, name INTO v_stage_id, v_stage_name
    FROM educational_stages WHERE slug = 'grade-3-secondary';
  END IF;
  
  -- جلب كل البيانات في query واحد
  SELECT json_build_object(
    'stageId', v_stage_id,
    'stageName', v_stage_name,
    'showFirst', COALESCE(v_show_first, true),
    'showSecond', COALESCE(v_show_second, true),
    'subjects', (
      SELECT json_agg(row_to_json(s))
      FROM (
        SELECT 
          sub.id, sub.name, sub.slug, sub.icon, sub.color, sub.description, sub.image_url,
          COUNT(l.id) as lessons_count
        FROM subjects sub
        INNER JOIN subject_stages ss ON ss.subject_id = sub.id AND ss.stage_id = v_stage_id AND ss.is_active = true
        LEFT JOIN lessons l ON l.subject_id = sub.id 
          AND l.is_published = true 
          AND (l.stage_id = v_stage_id OR l.stage_id IS NULL)
          AND (
            (v_show_first AND NOT v_show_second AND l.semester IN ('first', 'full_year'))
            OR (NOT v_show_first AND v_show_second AND l.semester IN ('second', 'full_year'))
            OR (v_show_first AND v_show_second)
          )
        WHERE sub.is_active = true
        GROUP BY sub.id, ss.order_index
        ORDER BY ss.order_index
      ) s
    ),
    'stats', (
      SELECT json_build_object(
        'totalUsers', (SELECT COUNT(*) FROM profiles WHERE role = 'student'),
        'totalLessons', (SELECT COUNT(*) FROM lessons WHERE is_published = true AND stage_id = v_stage_id),
        'averageRating', COALESCE((SELECT AVG(rating) FROM teacher_ratings), 4.8),
        'successRate', 85
      )
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE;
```

---

## المرحلة 2: إضافة Caching Layer 🗄️

### 2.1 إضافة React Query للـ Client-side Caching

```typescript
// lib/queries/dashboardQueries.ts
import { useQuery } from '@tanstack/react-query';

export const QUERY_KEYS = {
  dashboard: ['dashboard'] as const,
  appSettings: ['app-settings'] as const,
  stages: ['stages'] as const,
  subjects: (stageId: string) => ['subjects', stageId] as const,
};

export function useDashboardQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.dashboard,
    queryFn: fetchDashboardAction,
    staleTime: 5 * 60 * 1000, // 5 دقائق
    gcTime: 30 * 60 * 1000, // 30 دقيقة
    refetchOnWindowFocus: false,
  });
}

export function useAppSettingsQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.appSettings,
    queryFn: fetchAppSettings,
    staleTime: 10 * 60 * 1000, // 10 دقائق - بيانات نادراً ما تتغير
    gcTime: 60 * 60 * 1000, // ساعة
  });
}
```

### 2.2 إضافة Server-side Caching بـ unstable_cache

```typescript
// lib/cache/dashboardCache.ts
import { unstable_cache } from 'next/cache';

export const getCachedDashboardData = unstable_cache(
  async (stageId: string, semester: string) => {
    // fetch data
  },
  ['dashboard-data'],
  {
    revalidate: 300, // 5 دقائق
    tags: ['dashboard'],
  }
);

export const getCachedAppSettings = unstable_cache(
  async () => {
    // fetch app settings
  },
  ['app-settings'],
  {
    revalidate: 600, // 10 دقائق
    tags: ['settings'],
  }
);
```

---

## المرحلة 3: تحسين Admin Dashboard 📊

### 3.1 تحسين `/api/admin/dashboard/route.ts`

الكود الحالي يستخدم `Promise.all` ✅ لكن يمكن تحسينه أكثر:

```typescript
// بدلاً من جلب كل البيانات ثم filter
const [comprehensiveExamsResult, lessonsResult] = await Promise.all([
  supabase.from('comprehensive_exams').select('id, is_published', { count: 'exact' }),
  supabase.from('lessons').select('id, is_published', { count: 'exact' }),
]);

// الأفضل: استخدام count مع filter مباشرة
const [
  totalExamsResult,
  publishedExamsResult,
  totalLessonsResult,
  publishedLessonsResult,
] = await Promise.all([
  supabase.from('comprehensive_exams').select('*', { count: 'exact', head: true }),
  supabase.from('comprehensive_exams').select('*', { count: 'exact', head: true }).eq('is_published', true),
  supabase.from('lessons').select('*', { count: 'exact', head: true }),
  supabase.from('lessons').select('*', { count: 'exact', head: true }).eq('is_published', true),
]);
```

---

## المرحلة 4: Database Maintenance 🔧

### 4.1 تنظيف Table Bloat

```sql
-- تنظيف الجداول المتضخمة
VACUUM (VERBOSE, ANALYZE) profiles;
VACUUM (VERBOSE, ANALYZE) notifications;
VACUUM (VERBOSE, ANALYZE) subjects;
VACUUM (VERBOSE, ANALYZE) teacher_subscriptions;
VACUUM (VERBOSE, ANALYZE) teacher_exam_attempts;
VACUUM (VERBOSE, ANALYZE) teacher_exams;

-- أو للتنظيف الكامل (يحتاج exclusive lock)
VACUUM FULL profiles;
```

### 4.2 تحديث Statistics

```sql
ANALYZE profiles;
ANALYZE lessons;
ANALYZE subjects;
ANALYZE educational_stages;
ANALYZE subject_stages;
ANALYZE comprehensive_exams;
```

### 4.3 حذف Indexes غير المستخدمة

```sql
-- قائمة الـ indexes غير المستخدمة (is_unused: true)
-- يمكن حذفها لتحسين أداء الكتابة

-- ملاحظة: تأكد أولاً أنها فعلاً غير مطلوبة
DROP INDEX IF EXISTS idx_comprehensive_exams_semester;
DROP INDEX IF EXISTS idx_comprehensive_exams_subject;
DROP INDEX IF EXISTS idx_notifications_is_read;
DROP INDEX IF EXISTS idx_notifications_status;
DROP INDEX IF EXISTS idx_notifications_target_role;
DROP INDEX IF EXISTS idx_notifications_user;
DROP INDEX IF EXISTS idx_profiles_educational_stage_id;
DROP INDEX IF EXISTS idx_profiles_email; -- يوجد unique index آخر
DROP INDEX IF EXISTS idx_profiles_is_teacher_approved;
DROP INDEX IF EXISTS idx_profiles_is_teacher_profile_public;
DROP INDEX IF EXISTS idx_profiles_is_verified;
```

---

## المرحلة 5: تحسين RLS Policies 🔒

### 5.1 دمج السياسات المكررة

```sql
-- مثال: دمج سياسات testimonials
-- بدلاً من 4 سياسات SELECT مختلفة، نستخدم واحدة

DROP POLICY IF EXISTS "Admins can view all testimonials" ON testimonials;
DROP POLICY IF EXISTS "Users can view own testimonials" ON testimonials;
DROP POLICY IF EXISTS "Users can view their own testimonials" ON testimonials;
DROP POLICY IF EXISTS "Public can view approved testimonials" ON testimonials;

CREATE POLICY "testimonials_select_policy" ON testimonials
FOR SELECT USING (
  status = 'approved' 
  OR auth.uid() = user_id 
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
```

---

## المرحلة 6: تحسين Select Fields 🎯

### 6.1 جلب الحقول المطلوبة فقط

```typescript
// ❌ سيء - جلب كل الحقول
const { data } = await supabase.from('lessons').select('*');

// ✅ جيد - جلب الحقول المطلوبة فقط
const { data } = await supabase
  .from('lessons')
  .select('id, title, description, is_published, semester');
```

---

## المرحلة 7: إضافة Loading States ذكية 🔄

### 7.1 Skeleton Loading

```typescript
// استخدام Suspense مع Skeleton
<Suspense fallback={<DashboardSkeleton />}>
  <DashboardContent />
</Suspense>
```

### 7.2 Optimistic Updates

```typescript
// تحديث UI فوراً قبل انتظار السيرفر
const handleLike = async () => {
  // تحديث UI فوراً
  setLiked(true);
  setLikesCount(prev => prev + 1);
  
  try {
    await likeLesson(lessonId);
  } catch {
    // إرجاع الحالة السابقة في حالة الخطأ
    setLiked(false);
    setLikesCount(prev => prev - 1);
  }
};
```

---

## 📋 جدول التنفيذ

| المرحلة | الأولوية | التأثير المتوقع | الوقت المطلوب |
|---------|----------|-----------------|---------------|
| 1. Dashboard Parallel Queries | 🔴 عالية جداً | -70% وقت تحميل | 1 ساعة |
| 2. Database Function | 🔴 عالية جداً | -80% وقت تحميل | 2 ساعة |
| 3. React Query Caching | 🟠 عالية | -50% requests | 1 ساعة |
| 4. Server-side Caching | 🟠 عالية | -60% database load | 1 ساعة |
| 5. Database Maintenance | 🟡 متوسطة | -20% query time | 30 دقيقة |
| 6. RLS Optimization | 🟡 متوسطة | -10% overhead | 1 ساعة |
| 7. Select Optimization | 🟢 منخفضة | -5% bandwidth | 30 دقيقة |

---

## 🎯 النتيجة المتوقعة

| المقياس | قبل | بعد |
|---------|-----|-----|
| وقت تحميل Dashboard | ~2-3 ثانية | ~200-400ms |
| عدد Database Queries | 8-10 | 1-2 |
| حجم البيانات المنقولة | ~50KB | ~15KB |
| Database Connection Time | ~500ms | ~100ms |

---

## ⚠️ ملاحظات مهمة

1. **قبل تنفيذ أي تغيير:**
   - عمل backup للـ database
   - اختبار على بيئة staging أولاً

2. **المراقبة بعد التغييرات:**
   - استخدام Supabase Dashboard لمراقبة الأداء
   - مراجعة logs للأخطاء

3. **الصيانة الدورية:**
   - تشغيل VACUUM ANALYZE أسبوعياً
   - مراجعة unused indexes شهرياً

---

---

## ✅ التغييرات المنفذة (25 يناير 2026)

### 1. تحسين `lib/actions/dashboard.ts`
- ✅ تحويل 8+ waterfall queries إلى 2-3 parallel queries باستخدام `Promise.all`
- ✅ استخدام JOINs بدلاً من queries منفصلة (profiles + educational_stages)
- ✅ استخدام JOINs (subject_stages + subjects)
- ✅ جلب الحقول المطلوبة فقط بدلاً من `select('*')`
- ✅ إضافة timing logs لمراقبة الأداء

### 2. تحسين `fetchSubjectLessonsAction`
- ✅ تحويل 5 waterfall queries إلى parallel queries
- ✅ جلب الحقول المطلوبة فقط

### 3. تحسين `app/api/admin/dashboard/route.ts`
- ✅ استخدام count مع filter مباشرة بدلاً من جلب البيانات ثم filter
- ✅ إضافة إحصائية الأسئلة
- ✅ إضافة timing logs

### 4. إنشاء Caching Layer
- ✅ ملف `lib/cache/dashboardCache.ts` مع:
  - `getCachedAppSettings` (10 دقائق)
  - `getCachedEducationalStages` (ساعة)
  - `getCachedDefaultStage` (ساعة)
  - `getCachedSubjectsForStage` (5 دقائق)
  - `getCachedLessonsCount` (دقيقة)
  - `getCachedPlatformStats` (5 دقائق)

### 5. Database Migration
- ✅ ملف `supabase/migrations/20260125_optimize_dashboard.sql` مع:
  - `get_dashboard_data()` - دالة لجلب كل بيانات الـ Dashboard
  - `get_admin_stats()` - دالة لإحصائيات الأدمن
  - Indexes محسّنة للـ Dashboard queries
  - تعليمات VACUUM و ANALYZE

---

## 📋 خطوات متبقية (للمستخدم)

### 1. تشغيل Migration في Supabase
```bash
# أو من Supabase Dashboard > SQL Editor
# انسخ محتوى الملف: supabase/migrations/20260125_optimize_dashboard.sql
```

### 2. تنظيف Table Bloat (من Supabase Dashboard)
```sql
VACUUM (VERBOSE, ANALYZE) profiles;
VACUUM (VERBOSE, ANALYZE) notifications;
VACUUM (VERBOSE, ANALYZE) subjects;
```

### 3. اختبار الأداء
```bash
npm run dev
# ثم افتح Console في المتصفح لرؤية timing logs
# مثال: [Dashboard] Total time: 150ms
```

---

## 🎯 النتيجة المتوقعة بعد التحسينات

| المقياس | قبل | بعد |
|---------|-----|-----|
| وقت تحميل Dashboard | ~2-3 ثانية | ~200-400ms |
| عدد Database Queries | 8-10 | 2-3 |
| Admin Dashboard | ~1-2 ثانية | ~300-500ms |
