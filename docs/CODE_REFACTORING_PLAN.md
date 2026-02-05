# خطة إعادة هيكلة الكود الشاملة
## Code Refactoring Plan - Clean Code Initiative

---

## 📊 ملخص التحليل

بعد تحليل شامل للكود، وجدت **7 مناطق رئيسية** تحتاج تحسين:

---

## 1️⃣ توحيد Dashboard Layouts (أولوية عالية جداً)

### المشكلة:
- `app/admin/layout.tsx` (651 سطر) و `app/teacher/layout.tsx` (316 سطر)
- تكرار في: Sidebar, Header, ThemeToggle, Protection, UserMenu, LoadingSpinner

### الحل:
إنشاء `components/shared/layout/DashboardLayout.tsx` موحد:

```
components/shared/layout/
├── DashboardLayout.tsx      # Layout الموحد
├── DashboardSidebar.tsx     # Sidebar موحد
├── DashboardHeader.tsx      # Header موحد
├── DashboardProtection.tsx  # Protection موحد
└── types.ts                 # الأنواع المشتركة
```

### التوفير المتوقع: ~400 سطر

---

## 2️⃣ توحيد Exams List Pages (أولوية عالية)

### المشكلة:
- `app/admin/exams/page.tsx` (775 سطر)
- `app/teacher/exams/page.tsx` (471 سطر)
- تكرار في: ExamCard, Filters, Stats, Delete Modal

### الحل:
إنشاء `components/shared/exams/ExamsList.tsx`:

```
components/shared/exams/
├── ExamsList.tsx           # القائمة الموحدة
├── ExamCard.tsx            # بطاقة الامتحان
├── ExamsFilters.tsx        # الفلاتر
├── ExamStats.tsx           # الإحصائيات
└── hooks/
    └── useExamsList.ts     # Hook موحد
```

### التوفير المتوقع: ~500 سطر

---

## 3️⃣ توحيد Question Hooks (أولوية عالية)

### المشكلة:
- `hooks/useExamCreate.ts` (579 سطر)
- `hooks/useQuestionBankCreate.ts` (549 سطر)
- تكرار كبير في: verse handlers, question handlers, option handlers

### الحل:
توسيع `lib/utils/questionUtils.ts` وإنشاء base hook:

```
hooks/
├── useQuestionBase.ts       # Base hook مشترك
├── useExamCreate.ts         # يرث من Base
└── useQuestionBankCreate.ts # يرث من Base
```

### التوفير المتوقع: ~300 سطر

---

## 4️⃣ توحيد API Query Hooks (أولوية متوسطة)

### المشكلة:
تكرار نمط الـ hooks في `lib/queries/adminQueries.ts`:
```ts
// نفس النمط يتكرر 20+ مرة
const [data, setData] = useState([]);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState(null);
```

### الحل:
إنشاء `hooks/useApiQuery.ts` - Generic Hook:

```ts
function useApiQuery<T>(config: QueryConfig): UseQueryResult<T>
function useApiMutation<T>(config: MutationConfig): UseMutationResult
```

### التوفير المتوقع: ~400 سطر

---

## 5️⃣ تقسيم الملفات الكبيرة (أولوية متوسطة)

### الملفات التي تحتاج تقسيم:
| الملف | الحجم | المقترح |
|-------|-------|---------|
| `components/shared/LessonPage.tsx` | 943 سطر | تقسيم لـ 4 ملفات |
| `components/ChatWidget.tsx` | 675 سطر | تقسيم لـ 3 ملفات |
| `components/shared/SubjectPage.tsx` | 31KB | تقسيم لـ 3 ملفات |
| `components/NotificationDropdown.tsx` | 21KB | تقسيم لـ 2 ملفات |

---

## 6️⃣ توحيد الترجمات (أولوية متوسطة)

### المشكلة:
- ترجمات متناثرة في hooks مختلفة
- `useExamCreate.ts` يحتوي على translations داخلية
- `useQuestionBankCreate.ts` يستخدم `questionBankI18n`

### الحل:
توحيد كل الترجمات في `lib/i18n/`:
```
lib/i18n/
├── index.ts
├── common.ts        # ترجمات عامة
├── exam.ts          # ترجمات الامتحانات
├── questions.ts     # ترجمات الأسئلة
├── dashboard.ts     # ترجمات لوحة التحكم
└── forms.ts         # ترجمات النماذج
```

---

## 7️⃣ توحيد Animation Variants (أولوية منخفضة)

### المشكلة:
- `ANIMATION_VARIANTS` معرفة في أماكن متعددة
- `fadeInUp`, `staggerContainer` مكررة

### الحل:
موجود بالفعل في `lib/animations/variants.ts` - يحتاج استخدام أوسع

---

## 📋 خطة التنفيذ

### المرحلة 1: DashboardLayout الموحد
1. إنشاء DashboardLayout.tsx
2. إنشاء DashboardSidebar.tsx
3. إنشاء DashboardHeader.tsx
4. تحديث admin/layout.tsx
5. تحديث teacher/layout.tsx

### المرحلة 2: ExamsList الموحد
1. إنشاء ExamCard.tsx المشترك
2. إنشاء ExamsFilters.tsx المشترك
3. إنشاء useExamsList.ts hook
4. تحديث admin/exams/page.tsx
5. تحديث teacher/exams/page.tsx

### المرحلة 3: توحيد Hooks
1. إنشاء useApiQuery generic hook
2. تبسيط adminQueries.ts
3. توحيد question hooks

### المرحلة 4: تقسيم الملفات الكبيرة
1. تقسيم LessonPage.tsx
2. تقسيم ChatWidget.tsx

---

## 🎯 النتائج المتوقعة

| المقياس | قبل | بعد |
|---------|-----|-----|
| إجمالي الأسطر المكررة | ~2000+ | ~200 |
| عدد الملفات > 500 سطر | 8 | 2 |
| قابلية الصيانة | متوسطة | عالية |
| سهولة إضافة ميزات | صعبة | سهلة |

---

---

## ✅ التحسينات المنفذة

### 1. DashboardLayout الموحد
**الملفات الجديدة:**
- `components/shared/layout/dashboard/types.ts` - الأنواع المشتركة
- `components/shared/layout/dashboard/DashboardSidebar.tsx` - Sidebar موحد
- `components/shared/layout/dashboard/DashboardHeader.tsx` - Header موحد
- `components/shared/layout/dashboard/DashboardProtection.tsx` - حماية موحدة
- `components/shared/layout/dashboard/DashboardLayout.tsx` - Layout الرئيسي
- `components/shared/layout/dashboard/configs.ts` - تكوينات Admin و Teacher
- `components/shared/layout/dashboard/index.ts` - التصديرات

**الملفات المحدثة:**
- `app/admin/layout.tsx` - تقليل من **651 سطر** إلى **15 سطر**
- `app/teacher/layout.tsx` - تقليل من **316 سطر** إلى **15 سطر**

**التوفير: ~950 سطر**

### 2. Exams Shared Components
**الملفات الجديدة:**
- `components/shared/exams/types.ts` - أنواع الامتحانات
- `components/shared/exams/ExamCard.tsx` - بطاقة امتحان موحدة
- `components/shared/exams/ExamsFilters.tsx` - فلاتر موحدة
- `components/shared/exams/index.ts` - التصديرات

### 3. Generic API Query Hook
**الملفات الجديدة:**
- `hooks/useApiQuery.ts` - Hook عام للـ API
  - `useApiQuery<T>()` - للـ queries
  - `useApiCreate<T>()` - للـ create mutations
  - `useApiUpdate<T>()` - للـ update mutations
  - `useApiDelete()` - للـ delete mutations
  - Pre-configured hooks لكل entity

### 4. ترجمات Dashboard الموحدة
**الملفات الجديدة:**
- `lib/i18n/dashboard.ts` - ترجمات عربي/إنجليزي للوحات التحكم

---

## 📊 ملخص الإنجازات

| المقياس | قبل | بعد |
|---------|-----|-----|
| admin/layout.tsx | 651 سطر | 15 سطر |
| teacher/layout.tsx | 316 سطر | 15 سطر |
| ملفات جديدة مشتركة | 0 | 12 |
| قابلية إعادة الاستخدام | منخفضة | عالية |

---

*تم إنشاء هذا التقرير تلقائياً بتاريخ: 2026-02-05*
*آخر تحديث: تم تنفيذ المرحلة الأولى والثانية*
