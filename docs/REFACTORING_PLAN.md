# 🏗️ خطة التطوير الشامل وتوحيد الكود
## QAlaa Educational Platform - Clean Architecture Refactoring Plan
**تاريخ الإنشاء:** 2026-01-20

---

## 📋 جدول المحتويات
1. [تحليل الحالة الحالية](#-تحليل-الحالة-الحالية)
2. [المشاكل المكتشفة](#-المشاكل-المكتشفة)
3. [الإصلاحات المُنجزة](#-الإصلاحات-المُنجزة)
4. [خطة التوحيد الشامل](#-خطة-التوحيد-الشامل)
5. [البنية المقترحة](#-البنية-المقترحة)
6. [المهام التفصيلية](#-المهام-التفصيلية)
7. [الأولويات](#-الأولويات)

---

## 🔍 تحليل الحالة الحالية

### المشكلة الجذرية
الكود كان يستخدم **Supabase Client مباشرة** في الـ Client Components:

```typescript
// ❌ هذا النمط يسبب مشاكل على Vercel
const supabase = createClient();
const { data: { user } } = await supabase.auth.getUser();
const { data } = await supabase.from('table').select('*');
```

**لماذا هذا مشكلة؟**
- على Vercel، الـ `createClient()` لا تستطيع قراءة cookies بشكل صحيح
- الـ `auth.getUser()` تعلق (hangs) بدون response
- الصفحات تظل في حالة loading للأبد

---

## ⚠️ المشاكل المكتشفة

### 1. تكرار كود الـ Supabase
| الملف | المشكلة |
|------|---------|
| `hooks/useTeachers.ts` | `createClient()` مباشر |
| `hooks/useSubjects.ts` | `createClient()` مباشر |
| `hooks/useSubscriptions.ts` | `createClient()` مباشر |
| `hooks/useTeacherExamPlayer.ts` | `createClient()` + `auth.getUser()` |
| `components/shared/SubjectPage.tsx` | `createClient()` + `auth.getUser()` |
| `components/shared/LessonPage.tsx` | `createClient()` مباشر |
| `app/teachers/[teacherId]/page.tsx` | `createClient()` + `auth.getUser()` |

### 2. عدم وجود API Layer موحد
- كل component/hook بيتعامل مع Supabase بطريقته
- لو حصل تغيير في schema، لازم نعدل في أماكن كتير
- مفيش error handling موحد

### 3. تكرار Types
- نفس الـ interfaces معرفة في أماكن مختلفة
- مفيش single source of truth للـ Types

### 4. تكرار Logic
- نفس الـ data transformation في أماكن متعددة
- نفس الـ error handling patterns مكررة

---

## ✅ الإصلاحات المُنجزة

### Phase 1: إنشاء API Routes للبيانات العامة
| الملف | الغرض | التاريخ |
|------|-------|--------|
| `/api/public/data/route.ts` | جلب البيانات العامة (teachers, subjects, stages, lessons) | ✅ مُنجز |
| `/api/subscriptions/route.ts` | إدارة الاشتراكات | ✅ مُنجز |
| `/api/exam/route.ts` | جلب وإدارة الامتحانات | ✅ مُنجز |

### Phase 2: تحويل الـ Hooks
| الملف | التحويل | الحالة |
|------|---------|--------|
| `hooks/useTeachers.ts` | تحسين الـ filtering | ✅ مُنجز |
| `hooks/useSubscriptions.ts` | تحويل لـ API | ✅ مُنجز |
| `hooks/useTeacherExamPlayer.ts` | تحويل لـ API | ✅ مُنجز |

### Phase 3: تحويل الـ Services
| الملف | التحويل | الحالة |
|------|---------|--------|
| `lib/services/teacher.service.ts` | تحويل لـ API | ✅ مُنجز |
| `lib/services/subject.service.ts` | تحويل لـ API | ✅ مُنجز |

### Phase 4: تحويل الصفحات
| الصفحة | التحويل | الحالة |
|--------|---------|--------|
| `/teachers/[teacherId]` | تحويل لـ API | ✅ مُنجز |
| `/arabic` + `/english` | إزالة auth.getUser() | ✅ مُنجز |
| `/arabic/exam/[examId]` | عبر useTeacherExamPlayer | ✅ مُنجز |

---

## 🎯 خطة التوحيد الشامل

### المبدأ الأساسي:
> **"Single Source of Truth"** - كل شيء يُعرَّف مرة واحدة فقط

### البنية الجديدة المقترحة:

```
/lib
├── /api-client           # 🆕 Unified API Client
│   ├── index.ts          # Main API client
│   ├── types.ts          # API response types
│   └── endpoints.ts      # Endpoint constants
│
├── /services             # Business Logic Layer
│   ├── teacher.service.ts
│   ├── subject.service.ts
│   ├── exam.service.ts
│   └── subscription.service.ts
│
├── /types                # 🆕 Centralized Types
│   ├── index.ts          # Re-exports all types
│   ├── teacher.types.ts
│   ├── exam.types.ts
│   ├── subject.types.ts
│   └── api.types.ts
│
└── /utils
    ├── formatters.ts
    ├── validators.ts
    └── transformers.ts   # 🆕 Data transformation utils

/app/api
├── /public
│   └── /data
│       └── route.ts      # ✅ موجود
├── /subscriptions
│   └── route.ts          # ✅ موجود
├── /exam
│   └── route.ts          # ✅ موجود
├── /auth
│   └── /user
│       └── route.ts      # 🆕 جلب بيانات المستخدم
└── /[entity]             # 🆕 Dynamic entity routes
    └── route.ts

/hooks
├── /data                 # 🆕 Data fetching hooks
│   ├── useTeachers.ts
│   ├── useSubjects.ts
│   └── useExam.ts
├── /mutations            # 🆕 Data mutation hooks
│   ├── useSubscription.ts
│   └── useExamAttempt.ts
└── /ui                   # 🆕 UI-specific hooks
    ├── useLocalStorage.ts
    └── useMediaQuery.ts
```

---

## 🏛️ البنية المقترحة

### 1. Unified API Client

```typescript
// /lib/api-client/index.ts

class ApiClient {
    private baseUrl: string;
    
    constructor() {
        this.baseUrl = typeof window !== 'undefined' 
            ? '' 
            : process.env.NEXT_PUBLIC_SITE_URL || '';
    }
    
    async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
        const url = new URL(`${this.baseUrl}${endpoint}`);
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    url.searchParams.set(key, String(value));
                }
            });
        }
        
        const res = await fetch(url.toString());
        return this.handleResponse<T>(res);
    }
    
    async post<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
        const res = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        return this.handleResponse<T>(res);
    }
    
    async delete<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
        const url = new URL(`${this.baseUrl}${endpoint}`);
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                url.searchParams.set(key, String(value));
            });
        }
        
        const res = await fetch(url.toString(), { method: 'DELETE' });
        return this.handleResponse<T>(res);
    }
    
    private async handleResponse<T>(res: Response): Promise<ApiResponse<T>> {
        const data = await res.json();
        
        if (!res.ok || !data.success) {
            throw new ApiError(data.error || 'Unknown error', res.status);
        }
        
        return data;
    }
}

export const apiClient = new ApiClient();
```

### 2. Centralized Types

```typescript
// /lib/types/teacher.types.ts

export interface Teacher {
    id: string;
    name: string;
    bio: string | null;
    avatar_url: string | null;
    cover_image_url: string | null;
    specialization: string | null;
    is_verified: boolean;
    subscriber_count: number;
    exam_count: number;
    subjects: string[];
    // Aliases for backwards compatibility
    displayName?: string;
    photoURL?: string;
    coverImageURL?: string;
    isVerified?: boolean;
    subscriberCount?: number;
    examsCount?: number;
}

// /lib/types/api.types.ts

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    total?: number;
    page?: number;
    limit?: number;
}
```

### 3. Unified Service Layer

```typescript
// /lib/services/teacher.service.ts

import { apiClient } from '@/lib/api-client';
import type { Teacher, TeacherProfile } from '@/lib/types';

export const teacherService = {
    async getAll(limit = 200): Promise<Teacher[]> {
        const response = await apiClient.get<Teacher[]>('/api/public/data', {
            entity: 'teachers',
            limit,
        });
        return response.data || [];
    },
    
    async getById(id: string): Promise<TeacherProfile | null> {
        const response = await apiClient.get<TeacherProfile[]>('/api/public/data', {
            entity: 'teacher_profile',
            id,
        });
        return response.data?.[0] || null;
    },
    
    async getExams(teacherId: string, limit = 50): Promise<TeacherExam[]> {
        const response = await apiClient.get<TeacherExam[]>('/api/public/data', {
            entity: 'teacher_exams',
            teacherId,
            limit,
        });
        return response.data || [];
    },
};
```

### 4. Unified Hooks

```typescript
// /hooks/data/useTeachers.ts

import { useState, useEffect, useCallback, useMemo } from 'react';
import { teacherService } from '@/lib/services';
import type { Teacher } from '@/lib/types';

interface UseTeachersOptions {
    autoFetch?: boolean;
    limit?: number;
}

interface UseTeachersReturn {
    teachers: Teacher[];
    filteredTeachers: Teacher[];
    featuredTeachers: Teacher[];
    regularTeachers: Teacher[];
    status: 'idle' | 'loading' | 'success' | 'error';
    error: string | null;
    searchQuery: string;
    selectedCategory: string;
    setSearchQuery: (query: string) => void;
    setSelectedCategory: (category: string) => void;
    clearFilters: () => void;
    refetch: () => Promise<void>;
    updateTeacher: (id: string, updates: Partial<Teacher>) => void;
}

export function useTeachers(options: UseTeachersOptions = {}): UseTeachersReturn {
    const { autoFetch = true, limit = 200 } = options;
    
    // ... implementation using teacherService
}
```

---

## 📝 المهام التفصيلية

### المرحلة 1: إنشاء البنية الأساسية (الأولوية: عالية)

#### 1.1 إنشاء API Client الموحد
```
/lib/api-client/
├── index.ts          # ApiClient class
├── types.ts          # ApiResponse, ApiError types
├── endpoints.ts      # Endpoint constants
└── helpers.ts        # URL building, error handling
```

**المهام:**
- [ ] إنشاء ApiClient class
- [ ] إنشاء ApiError class
- [ ] إنشاء endpoint constants
- [ ] إنشاء URL builder helper

#### 1.2 توحيد الـ Types
```
/lib/types/
├── index.ts          # Re-exports
├── api.types.ts      # API response types
├── teacher.types.ts  # Teacher-related types
├── exam.types.ts     # Exam-related types
├── subject.types.ts  # Subject-related types
├── user.types.ts     # User-related types
└── common.types.ts   # Shared types
```

**المهام:**
- [ ] نقل الـ types من database.types.ts
- [ ] توحيد الـ interfaces المكررة
- [ ] إضافة type aliases للتوافق

#### 1.3 إنشاء Auth API Route
```typescript
// /api/auth/user/route.ts
// GET - جلب بيانات المستخدم الحالي
```

**المهام:**
- [ ] إنشاء route للـ user data
- [ ] إنشاء useAuth hook موحد

---

### المرحلة 2: إعادة بناء الـ Services (الأولوية: عالية)

#### 2.1 تحديث teacher.service.ts
- [ ] تحويل للـ ApiClient الجديد
- [ ] توحيد الـ return types
- [ ] إضافة caching

#### 2.2 تحديث subject.service.ts
- [ ] تحويل للـ ApiClient الجديد
- [ ] توحيد الـ return types

#### 2.3 إنشاء exam.service.ts
- [ ] دالة getExam
- [ ] دالة createAttempt
- [ ] دالة saveAnswers
- [ ] دالة submitExam

#### 2.4 إنشاء subscription.service.ts
- [ ] دالة getSubscriptions
- [ ] دالة subscribe
- [ ] دالة unsubscribe

---

### المرحلة 3: إعادة بناء الـ Hooks (الأولوية: متوسطة)

#### 3.1 تنظيم الـ Hooks
```
/hooks/
├── /data/            # Data fetching
│   ├── useTeachers.ts
│   ├── useSubjects.ts
│   ├── useExam.ts
│   └── useUser.ts
├── /mutations/       # Data mutations
│   ├── useSubscription.ts
│   ├── useExamAttempt.ts
│   └── useProfile.ts
└── /ui/              # UI hooks
    ├── useLocalStorage.ts
    ├── useMediaQuery.ts
    └── useTheme.ts
```

#### 3.2 توحيد نمط الـ Hooks
```typescript
// كل hook يتبع نفس النمط:
interface UseXxxReturn {
    data: T;
    status: 'idle' | 'loading' | 'success' | 'error';
    error: string | null;
    refetch: () => Promise<void>;
    // ... mutations
}
```

---

### المرحلة 4: تنظيف الصفحات (الأولوية: متوسطة)

#### 4.1 توحيد صفحات الامتحانات
- `/arabic/exam/[examId]` و `/english/exam/[examId]` يستخدموا نفس الـ component
- `/arabic/teacher-exam/[examId]` و `/english/teacher-exam/[examId]` يستخدموا نفس الـ component

#### 4.2 توحيد صفحات المواد
- `/arabic` و `/english` يستخدموا نفس الـ `SubjectPage` component

---

### المرحلة 5: تحسينات إضافية (الأولوية: منخفضة)

#### 5.1 إضافة Caching
- [ ] React Query أو SWR للـ data caching
- [ ] Optimistic updates للـ mutations

#### 5.2 إضافة Error Boundaries
- [ ] Global error boundary
- [ ] Per-page error boundaries

#### 5.3 إضافة Loading States
- [ ] Skeleton loaders موحدة
- [ ] Suspense boundaries

---

## 🎖️ الأولويات

### P0 - Critical (هذا الأسبوع)
1. ✅ إصلاح الصفحات اللي بتعلق على Vercel
2. ✅ إنشاء API routes أساسية
3. ⏳ إنشاء API Client موحد

### P1 - High (الأسبوع القادم)
4. توحيد الـ Types
5. إعادة بناء الـ Services
6. توحيد الـ Hooks

### P2 - Medium (خلال أسبوعين)
7. تنظيف الصفحات المتكررة
8. إضافة documentation

### P3 - Low (مستقبلاً)
9. إضافة caching
10. تحسين performance
11. إضافة tests

---

## 📊 مقارنة قبل/بعد

### قبل التوحيد:
```typescript
// في كل component أو hook:
const supabase = createClient();
const { data: { user } } = await supabase.auth.getUser();
const { data } = await supabase.from('teachers').select('*')...
// تكرار في 10+ ملفات
```

### بعد التوحيد:
```typescript
// في الـ hook:
import { teacherService } from '@/lib/services';
const teachers = await teacherService.getAll();

// أو:
import { apiClient } from '@/lib/api-client';
const { data } = await apiClient.get('/api/public/data', { entity: 'teachers' });
```

### الفوائد:
| الميزة | قبل | بعد |
|--------|-----|-----|
| تغيير endpoint | 10+ ملفات | ملف واحد |
| تغيير error handling | 10+ ملفات | ملف واحد |
| تغيير types | 5+ ملفات | ملف واحد |
| اختبار الكود | صعب | سهل |
| Debugging | صعب | سهل |

---

## 🔧 ملفات تحتاج مراجعة

### يجب تحويلها لـ API:
- [ ] `hooks/useAuth.ts` - لو فيها `auth.getUser()`
- [ ] `hooks/useProfile.ts` - لو فيها Supabase مباشر
- [ ] `components/Navbar.tsx` - لو فيها auth checks
- [ ] أي component يستخدم `createClient()` مباشرة

### للتحقق:
```bash
# البحث عن استخدامات createClient في hooks/components
grep -r "createClient" hooks/ components/ --include="*.ts" --include="*.tsx"

# البحث عن auth.getUser
grep -r "auth.getUser" hooks/ components/ --include="*.ts" --include="*.tsx"
```

---

## 📅 الجدول الزمني المقترح

| المرحلة | المدة | التاريخ المتوقع |
|---------|-------|----------------|
| المرحلة 1: البنية الأساسية | 2-3 أيام | 2026-01-23 |
| المرحلة 2: الـ Services | 2-3 أيام | 2026-01-26 |
| المرحلة 3: الـ Hooks | 2-3 أيام | 2026-01-29 |
| المرحلة 4: الصفحات | 1-2 يوم | 2026-01-31 |
| المرحلة 5: التحسينات | مستمر | - |

---

## ✅ Checklist للتنفيذ

### قبل البدء في أي ملف:
- [ ] هل الملف بيستخدم `createClient()` مباشرة؟
- [ ] هل الملف بيستخدم `auth.getUser()`؟
- [ ] هل الـ types معرفة locally ولا من `/lib/types`؟
- [ ] هل الـ error handling موحد؟

### بعد التعديل:
- [ ] هل الـ build بينجح؟
- [ ] هل الصفحة بتشتغل locally؟
- [ ] هل الصفحة بتشتغل على Vercel؟
- [ ] هل الـ types صحيحة؟

---

**تم إعداد هذه الخطة بواسطة:** AI Assistant  
**التاريخ:** 2026-01-20  
**الإصدار:** 1.0
