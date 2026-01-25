# 🏗️ خطة إعادة هيكلة شاملة - Architecture Refactoring Plan

> **الهدف:** توحيد طبقة البيانات، إزالة التكرار، تحسين الأداء بشكل جذري

---

## 📊 تحليل الوضع الحالي

### المشاكل المكتشفة:

#### 1. **تكرار في طرق جلب البيانات (3 طرق مختلفة!)**

| الطريقة | الموقع | المشكلة |
|---------|--------|---------|
| Server Actions | `lib/actions/` | جيدة لكن غير موحدة |
| Services | `lib/services/` | مكررة مع queries |
| Query Hooks | `lib/queries/` | تكرار كبير للـ pattern |

#### 2. **تكرار في الـ Hooks**
```
useStages() في queries/index.ts
useSubjects() في hooks/useSubjects.ts و queries/index.ts
useDashboard() و useAdminDashboard() - منطق متشابه جداً
```

#### 3. **API Endpoints متفرقة**
```
/api/admin/dashboard    → إحصائيات الأدمن
/api/public/data        → بيانات عامة
/api/profile            → بيانات المستخدم
/api/lessons/[id]       → درس واحد
/api/exams              → الامتحانات
... وغيرها
```

#### 4. **عدم وجود Single Source of Truth**
- نفس البيانات تُجلب من أماكن مختلفة
- لا يوجد caching موحد
- لا يوجد state management مركزي

---

## 🎯 الهيكل الجديد المقترح

```
lib/
├── data/                          # طبقة البيانات الموحدة
│   ├── index.ts                   # تصدير موحد
│   ├── client.ts                  # Supabase client موحد
│   │
│   ├── repositories/              # Repository Pattern
│   │   ├── base.repository.ts     # الـ base class
│   │   ├── stage.repository.ts    
│   │   ├── subject.repository.ts  
│   │   ├── lesson.repository.ts   
│   │   ├── exam.repository.ts     
│   │   ├── profile.repository.ts  
│   │   └── index.ts              
│   │
│   ├── hooks/                     # Hooks موحدة
│   │   ├── useQuery.ts            # Generic query hook
│   │   ├── useMutation.ts         # Generic mutation hook
│   │   ├── useStages.ts           
│   │   ├── useSubjects.ts         
│   │   ├── useLessons.ts          
│   │   ├── useExams.ts            
│   │   ├── useDashboard.ts        # موحد للـ admin و student
│   │   └── index.ts               
│   │
│   ├── actions/                   # Server Actions موحدة
│   │   ├── dashboard.action.ts    
│   │   ├── lessons.action.ts      
│   │   ├── exams.action.ts        
│   │   └── index.ts               
│   │
│   └── cache/                     # Caching موحد
│       ├── keys.ts                # Cache keys
│       ├── strategies.ts          # Caching strategies
│       └── index.ts               

app/
├── api/
│   ├── v1/                        # API موحد
│   │   ├── data/route.ts          # GET /api/v1/data?type=stages,subjects,lessons
│   │   ├── admin/route.ts         # Admin endpoints موحدة
│   │   └── user/route.ts          # User endpoints موحدة
```

---

## 📋 خطوات التنفيذ

### المرحلة 1: إنشاء Base Repository ⚡

```typescript
// lib/data/repositories/base.repository.ts
export abstract class BaseRepository<T> {
  protected tableName: string;
  protected defaultSelect: string = '*';
  
  constructor(tableName: string) {
    this.tableName = tableName;
  }

  // Generic methods
  async findAll(options?: QueryOptions): Promise<T[]>;
  async findById(id: string): Promise<T | null>;
  async findOne(filters: Partial<T>): Promise<T | null>;
  async create(data: Partial<T>): Promise<T>;
  async update(id: string, data: Partial<T>): Promise<T>;
  async delete(id: string): Promise<void>;
  async count(filters?: Partial<T>): Promise<number>;
}
```

### المرحلة 2: إنشاء Generic Query Hook ⚡

```typescript
// lib/data/hooks/useQuery.ts
export function useQuery<T>(
  queryFn: () => Promise<T>,
  options?: {
    cacheKey?: string;
    staleTime?: number;
    enabled?: boolean;
  }
) {
  const [data, setData] = useState<T | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<Error | null>(null);
  
  // ... implementation with caching
}
```

### المرحلة 3: توحيد Dashboard Data ⚡

```typescript
// API موحد للـ Dashboard
// GET /api/v1/data?include=stages,subjects,lessons,stats

interface DataRequest {
  include: ('stages' | 'subjects' | 'lessons' | 'exams' | 'stats' | 'profile')[];
  filters?: {
    stageId?: string;
    subjectId?: string;
    semester?: string;
  };
}

interface DataResponse {
  stages?: Stage[];
  subjects?: SubjectWithLessons[];
  lessons?: Lesson[];
  exams?: Exam[];
  stats?: PlatformStats;
  profile?: Profile;
  _meta: {
    timestamp: number;
    cacheHit: boolean;
  };
}
```

### المرحلة 4: إنشاء Unified Data Service ⚡

```typescript
// lib/data/service.ts
export class DataService {
  private static instance: DataService;
  private cache: Map<string, CacheEntry>;
  
  // Singleton
  static getInstance(): DataService;
  
  // Unified fetch
  async fetch(request: DataRequest): Promise<DataResponse>;
  
  // Individual fetchers (cached)
  async getStages(options?: { active?: boolean }): Promise<Stage[]>;
  async getSubjects(stageId?: string): Promise<Subject[]>;
  async getLessons(filters: LessonFilters): Promise<Lesson[]>;
  async getStats(type: 'admin' | 'student', stageId?: string): Promise<Stats>;
  
  // Cache management
  invalidate(keys: string[]): void;
  clearAll(): void;
}
```

---

## 🔄 خطة الترحيل

### Phase 1: إنشاء البنية الجديدة (بدون حذف القديم)
1. إنشاء `lib/data/` folder
2. إنشاء Base Repository
3. إنشاء Generic Hooks
4. إنشاء Unified API endpoint

### Phase 2: ترحيل تدريجي
1. تحديث الـ components لاستخدام البنية الجديدة واحداً تلو الآخر
2. إضافة deprecation warnings للـ imports القديمة
3. اختبار كل component بعد الترحيل

### Phase 3: تنظيف الكود القديم
1. حذف الملفات المكررة
2. تحديث الـ exports
3. تحديث الـ documentation

---

## 📁 الملفات المراد إنشاؤها

| الملف | الغرض |
|-------|-------|
| `lib/data/index.ts` | تصدير موحد |
| `lib/data/client.ts` | Supabase client |
| `lib/data/types.ts` | Types موحدة |
| `lib/data/repositories/base.ts` | Base Repository |
| `lib/data/repositories/stage.ts` | Stage Repository |
| `lib/data/repositories/subject.ts` | Subject Repository |
| `lib/data/repositories/lesson.ts` | Lesson Repository |
| `lib/data/repositories/exam.ts` | Exam Repository |
| `lib/data/repositories/profile.ts` | Profile Repository |
| `lib/data/hooks/useQuery.ts` | Generic Query Hook |
| `lib/data/hooks/useMutation.ts` | Generic Mutation Hook |
| `lib/data/hooks/useData.ts` | Unified Data Hook |
| `lib/data/service.ts` | Data Service Singleton |
| `lib/data/cache.ts` | Cache Manager |
| `app/api/v1/data/route.ts` | Unified API Endpoint |

---

## 🎯 النتيجة المتوقعة

| المقياس | قبل | بعد |
|---------|-----|-----|
| عدد ملفات جلب البيانات | 20+ | 5-7 |
| تكرار الكود | عالي جداً | صفر |
| Cache hits | 0% | 80%+ |
| وقت التحميل | 2-3 ثانية | <500ms |
| قابلية الصيانة | صعبة | سهلة |

---

## 🚀 لنبدأ التنفيذ!
