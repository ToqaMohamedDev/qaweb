# 🔔 نظام الإشعارات - التوثيق الشامل

## ملخص النظام

نظام الإشعارات يدعم **3 أنواع رئيسية**:
1. **إشعارات Push** عبر OneSignal
2. **إشعارات داخل التطبيق** (In-App)
3. **إشعارات البريد الإلكتروني**

---

## 📊 أنواع الامتحانات والإشعارات

### النوع 1: امتحانات المدرسين (`teacher_exams`)
| الهدف | المستلمين | API Endpoint |
|-------|----------|--------------|
| عند نشر امتحان | المشتركين في هذا المدرس فقط | `/api/notifications/exam-published` |

### النوع 2: الامتحانات الشاملة (`comprehensive_exams`)
| الهدف | المستلمين | API Endpoint |
|-------|----------|--------------|
| عند نشر امتحان شامل | جميع الطلاب أو مرحلة معينة | `/api/notifications/comprehensive-exam-published` |

---

## 🔌 API Endpoints

### 1. إشعار امتحان مدرس (للمشتركين)
```http
POST /api/notifications/exam-published
Content-Type: application/json

{
  "examId": "uuid",
  "examTitle": "عنوان الامتحان",
  "teacherId": "uuid",
  "teacherName": "اسم المدرس",
  "examType": "arabic" // or "english"
}
```

### 2. إشعار امتحان شامل (من الموقع)
```http
POST /api/notifications/comprehensive-exam-published
Content-Type: application/json

{
  "examId": "uuid",
  "examTitle": "عنوان الامتحان الشامل",
  "stageId": "uuid",       // اختياري - لاستهداف مرحلة معينة
  "stageName": "الصف الأول" // اختياري
}
```

### 3. إشعار بنك أسئلة جديد
```http
POST /api/notifications/question-bank-added
Content-Type: application/json

{
  "lessonId": "uuid",
  "lessonTitle": "عنوان الدرس",
  "stageId": "uuid",        // اختياري
  "stageName": "الصف الأول", // اختياري
  "subjectName": "اللغة العربية" // اختياري
}
```

### 4. إشعار قبول المدرس
```http
POST /api/notifications/teacher-approved
Content-Type: application/json

{
  "teacherId": "uuid",
  "teacherName": "اسم المدرس" // اختياري
}
```

---

## 📁 البنية الهيكلية للملفات

```
lib/
├── onesignal/
│   ├── index.ts        # التصديرات العامة
│   ├── config.ts       # الإعدادات
│   ├── client.ts       # دوال Client-side
│   └── server.ts       # دوال Server-side ⬅️
│
├── notifications.ts    # Notification Client (Supabase Realtime)
│
app/api/notifications/
├── exam-published/route.ts                # امتحانات المدرسين
├── comprehensive-exam-published/route.ts  # امتحانات الموقع ⬅️ NEW
├── question-bank-added/route.ts           # بنوك الأسئلة ⬅️ NEW
└── teacher-approved/route.ts              # قبول المدرس
```

---

## ⚙️ دوال OneSignal Server

### دوال موجودة مسبقاً:
```typescript
// إرسال لمشتركي مدرس معين
notifyNewExam({ teacherId, teacherName, examId, examTitle, examType })

// إرسال للمدرس عند القبول
notifyTeacherApproved({ teacherId, teacherName })

// إرسال للمدرس عند الرفض
notifyTeacherRejected({ teacherId, reason })

// إرسال نتيجة امتحان
notifyExamResult({ userId, examTitle, score, resultId })

// إرسال للجميع
notifyAll({ title, message, url })
```

### دوال جديدة (تمت إضافتها):
```typescript
// إرسال لجميع الطلاب أو مرحلة (امتحان شامل)
notifyNewComprehensiveExam({ examId, examTitle, stageId?, stageName? })

// إرسال إشعار بنك أسئلة
notifyNewQuestionBank({ lessonId, lessonTitle, stageId?, stageName?, subjectName? })

// إرسال لمرحلة معينة
notifyStage({ stageId, title, message, url?, data? })

// إرسال لجميع الطلاب
notifyStudents({ title, message, url?, data? })

// إرسال لجميع المدرسين
notifyTeachers({ title, message, url?, data? })
```

---

## 🏷️ Tags المستخدمة في OneSignal

لكي يعمل النظام، يجب تعيين هذه الـ Tags للمستخدمين عند تسجيل الدخول:

| Tag Key | القيم المحتملة | الاستخدام |
|---------|----------------|-----------|
| `user_id` | UUID | لإرسال إشعار لمستخدم معين |
| `role` | `student`, `teacher`, `admin` | لاستهداف فئة معينة |
| `stage_id` | UUID | لاستهداف مرحلة تعليمية |
| `teacher_{teacherId}` | `subscribed` | عند الاشتراك مع مدرس |

### مثال على تعيين Tags (Client-side):
```typescript
import { addUserTag, subscribeToTeacher } from '@/lib/onesignal';

// عند تسجيل الدخول
await addUserTag('user_id', userId);
await addUserTag('role', 'student');
await addUserTag('stage_id', stageId);

// عند الاشتراك مع مدرس
await subscribeToTeacher(teacherId);
```

---

## 📋 جداول قاعدة البيانات

### notifications
| العمود | النوع | الوصف |
|--------|------|-------|
| id | uuid | المفتاح الأساسي |
| title | text | عنوان الإشعار |
| message | text | محتوى الإشعار |
| user_id | uuid | المستخدم المستهدف (null = للجميع) |
| type | notification_type | system, exam, lesson, message, subscription |
| target_role | notification_target_role | all, students, teachers, admins |
| status | notification_status | pending, sent, failed |
| sent_at | timestamptz | وقت الإرسال |

### teacher_subscriptions
| العمود | النوع | الوصف |
|--------|------|-------|
| id | uuid | المفتاح الأساسي |
| user_id | uuid | الطالب المشترك |
| teacher_id | uuid | المدرس |
| notifications_enabled | boolean | هل الإشعارات مفعلة |
| created_at | timestamptz | تاريخ الاشتراك |

---

## 🔄 تدفق العمل

### عند نشر امتحان مدرس:
```
1. المدرس ينشر امتحان جديد في teacher_exams
2. يتم استدعاء POST /api/notifications/exam-published
3. النظام يجلب المشتركين من teacher_subscriptions
4. يرسل Push عبر OneSignal (باستخدام teacher_{teacherId} tag)
5. يخزن الإشعارات في جدول notifications
6. يرسل البريد الإلكتروني (في الخلفية)
```

### عند نشر امتحان شامل:
```
1. الأدمن ينشر امتحان شامل في comprehensive_exams
2. يتم استدعاء POST /api/notifications/comprehensive-exam-published
3. يرسل Push عبر OneSignal (باستخدام stage_id أو role=student)
4. يخزن الإشعارات في جدول notifications لكل طالب
```

---

## ✅ الوضع الحالي

| الميزة | الحالة |
|--------|--------|
| إشعارات امتحانات المدرسين | ✅ يعمل |
| إشعارات قبول/رفض المدرس | ✅ يعمل |
| إشعارات الامتحانات الشاملة | ✅ تم إنشاؤه |
| إشعارات بنوك الأسئلة | ✅ تم إنشاؤه |
| إشعارات لمرحلة معينة | ✅ تم إنشاؤه |
| إشعارات لجميع الطلاب | ✅ تم إنشاؤه |
| إشعارات لجميع المدرسين | ✅ تم إنشاؤه |

---

## 🔧 متطلبات البيئة

```env
ONESIGNAL_APP_ID=your_app_id
ONESIGNAL_REST_API_KEY=your_rest_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```
