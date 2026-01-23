# نظام الإشعارات الكامل - Notifications System

## 📋 نظرة عامة

تم إصلاح وتطوير نظام الإشعارات بالكامل ليدعم:
- ✅ إرسال إشعارات لجميع المستخدمين
- ✅ إرسال إشعارات لمجموعات محددة (طلاب، مدرسين، مشرفين)
- ✅ إرسال إشعارات للمدرسين الموثقين فقط
- ✅ إرسال إشعارات لمشتركي مدرس معين
- ✅ جدولة الإشعارات
- ✅ Push notifications عبر OneSignal
- ✅ إشعارات داخل التطبيق

---

## 🗄️ Database Schema

### جدول `notifications`

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    target_role notification_target_role DEFAULT 'all',
    status notification_status DEFAULT 'pending',
    is_read BOOLEAN DEFAULT false,
    scheduled_for TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Enums

```sql
-- notification_target_role
'all' | 'students' | 'teachers' | 'admins'

-- notification_status
'pending' | 'sent' | 'failed'
```

---

## 🔐 Row Level Security (RLS)

### User Policies
1. **Users can view their own notifications**: المستخدمون يشوفوا إشعاراتهم الخاصة
2. **Users can view role-targeted notifications**: المستخدمون يشوفوا الإشعارات الموجهة لدورهم
3. **Users can update their own notifications**: المستخدمون يعدلوا إشعاراتهم (mark as read)

### Admin Policies
1. **Admins can view all notifications**: الأدمن يشوف كل الإشعارات
2. **Admins can insert notifications**: الأدمن يقدر ينشئ إشعارات
3. **Admins can update all notifications**: الأدمن يقدر يعدل أي إشعار
4. **Admins can delete notifications**: الأدمن يقدر يحذف إشعارات

### Service Role Policy
- **System can insert notifications**: السيستم يقدر ينشئ إشعارات تلقائية

---

## 🚀 API Endpoints

### 1. Admin Send Notifications
**POST** `/api/admin/notifications/send`

إرسال إشعارات من الأدمن لمجموعات مختلفة

#### Request Body
```json
{
  "title": "عنوان الإشعار",
  "message": "محتوى الإشعار",
  "target_role": "all",  // 'all' | 'students' | 'teachers' | 'admins'
  "send_immediately": true,
  "scheduled_for": null,  // ISO timestamp for scheduling
  "teacher_verified_only": false,  // للمدرسين الموثقين فقط
  "teacher_id": null  // لإرسال لمشتركي مدرس معين
}
```

#### Response
```json
{
  "success": true,
  "message": "Notifications sent to 150 users",
  "notified": 150,
  "target_role": "all",
  "status": "sent"
}
```

#### Examples

**إرسال لجميع المستخدمين:**
```javascript
await fetch('/api/admin/notifications/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'إعلان مهم',
    message: 'تم إضافة ميزات جديدة للمنصة',
    target_role: 'all',
    send_immediately: true
  })
});
```

**إرسال للطلاب فقط:**
```javascript
await fetch('/api/admin/notifications/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'امتحان جديد',
    message: 'تم إضافة امتحان شامل جديد',
    target_role: 'students',
    send_immediately: true
  })
});
```

**إرسال للمدرسين الموثقين فقط:**
```javascript
await fetch('/api/admin/notifications/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'تحديث للمدرسين',
    message: 'يرجى مراجعة السياسات الجديدة',
    target_role: 'teachers',
    teacher_verified_only: true,
    send_immediately: true
  })
});
```

**إرسال لمشتركي مدرس معين:**
```javascript
await fetch('/api/admin/notifications/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'امتحان جديد من المدرس أحمد',
    message: 'تم نشر امتحان جديد',
    teacher_id: 'teacher-uuid-here',
    send_immediately: true
  })
});
```

---

### 2. Automated Notification APIs

#### Teacher Approved
**POST** `/api/notifications/teacher-approved`
```json
{
  "teacherId": "uuid",
  "teacherName": "اسم المدرس"
}
```

#### Exam Published
**POST** `/api/notifications/exam-published`
```json
{
  "examId": "uuid",
  "examTitle": "عنوان الامتحان",
  "teacherId": "uuid",
  "teacherName": "اسم المدرس",
  "examType": "arabic"
}
```

#### Comprehensive Exam Published
**POST** `/api/notifications/comprehensive-exam-published`
```json
{
  "examId": "uuid",
  "examTitle": "عنوان الامتحان",
  "stageId": "uuid",
  "stageName": "المرحلة الثانوية"
}
```

#### Question Bank Added
**POST** `/api/notifications/question-bank-added`
```json
{
  "lessonId": "uuid",
  "lessonTitle": "عنوان الدرس",
  "stageId": "uuid",
  "stageName": "المرحلة الثانوية",
  "subjectName": "اللغة العربية"
}
```

---

## 🎯 Use Cases

### 1. Admin Dashboard - إرسال إشعار عام
```typescript
// في صفحة /admin/notifications
const handleSendNotification = async () => {
  const response = await fetch('/api/admin/notifications/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: formData.title,
      message: formData.message,
      target_role: formData.target_role,
      send_immediately: true
    })
  });
  
  const result = await response.json();
  console.log(`تم إرسال الإشعار إلى ${result.notified} مستخدم`);
};
```

### 2. عند قبول مدرس
```typescript
// في صفحة /admin/teachers عند الموافقة
await fetch('/api/notifications/teacher-approved', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    teacherId: teacher.id,
    teacherName: teacher.name
  })
});
```

### 3. عند نشر امتحان من مدرس
```typescript
// في صفحة إنشاء الامتحان
await fetch('/api/notifications/exam-published', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    examId: newExam.id,
    examTitle: newExam.title,
    teacherId: teacher.id,
    teacherName: teacher.name,
    examType: 'arabic'
  })
});
```

### 4. عند نشر امتحان شامل
```typescript
// في صفحة /admin/exams/create
await fetch('/api/notifications/comprehensive-exam-published', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    examId: newExam.id,
    examTitle: newExam.title,
    stageId: newExam.stage_id,
    stageName: stage.name
  })
});
```

---

## 📱 Frontend Integration

### جلب إشعارات المستخدم
```typescript
import { getNotifications, getUnreadCount } from '@/lib/services/notification.service';

// جلب كل الإشعارات
const notifications = await getNotifications(userId);

// جلب عدد الإشعارات غير المقروءة
const unreadCount = await getUnreadCount(userId);
```

### تحديث حالة الإشعار
```typescript
import { markAsRead, markAllAsRead } from '@/lib/services/notification.service';

// تحديد إشعار كمقروء
await markAsRead(notificationId);

// تحديد كل الإشعارات كمقروءة
await markAllAsRead(userId);
```

---

## 🔧 Helper Functions

### Database Functions

#### `get_unread_notification_count()`
يرجع عدد الإشعارات غير المقروءة للمستخدم الحالي

```sql
SELECT get_unread_notification_count();
```

#### `mark_all_notifications_read()`
يحدد كل إشعارات المستخدم الحالي كمقروءة

```sql
SELECT mark_all_notifications_read();
```

---

## 📊 Indexes

تم إنشاء indexes للأداء:
- `idx_notifications_user_id` - للبحث بـ user_id
- `idx_notifications_target_role` - للبحث بـ target_role
- `idx_notifications_status` - للفلترة بـ status
- `idx_notifications_created_at` - للترتيب بـ created_at
- `idx_notifications_is_read` - للبحث بـ is_read
- `idx_notifications_user_read` - composite index للاستعلامات المركبة

---

## 🚀 Migration

### تشغيل الـ Migration

```bash
# في Supabase Dashboard -> SQL Editor
# قم بتشغيل الملف:
supabase/migrations/20260124_fix_notifications_system.sql
```

أو عبر CLI:
```bash
supabase db push
```

---

## ✅ Testing Checklist

### Admin Tests
- [ ] إنشاء إشعار جديد من `/admin/notifications`
- [ ] إرسال إشعار لجميع المستخدمين
- [ ] إرسال إشعار للطلاب فقط
- [ ] إرسال إشعار للمدرسين فقط
- [ ] إرسال إشعار للمدرسين الموثقين فقط
- [ ] جدولة إشعار لوقت لاحق
- [ ] تعديل إشعار موجود
- [ ] حذف إشعار

### User Tests
- [ ] المستخدم يشوف إشعاراته الخاصة
- [ ] المستخدم يشوف الإشعارات الموجهة لدوره
- [ ] المستخدم يقدر يحدد إشعار كمقروء
- [ ] عداد الإشعارات غير المقروءة يشتغل صح

### Automated Tests
- [ ] إشعار عند قبول مدرس
- [ ] إشعار عند نشر امتحان من مدرس
- [ ] إشعار عند نشر امتحان شامل
- [ ] إشعار عند إضافة بنك أسئلة

---

## 🎉 Features

### ✅ تم التنفيذ
1. **RLS Policies كاملة** - أمان كامل للبيانات
2. **Admin Dashboard** - واجهة إدارة متكاملة
3. **API Endpoints** - APIs جاهزة للاستخدام
4. **Automated Notifications** - إشعارات تلقائية للأحداث المهمة
5. **Push Notifications** - دعم OneSignal
6. **Scheduling** - جدولة الإشعارات
7. **Role-based Targeting** - استهداف حسب الدور
8. **Teacher Subscribers** - إشعارات لمشتركي المدرسين
9. **Verified Teachers Only** - إشعارات للمدرسين الموثقين فقط
10. **Performance Indexes** - indexes للأداء العالي

---

## 📝 Notes

- الإشعارات تُرسل فوراً عند اختيار "إرسال فوري"
- الإشعارات المجدولة تحتاج cron job أو scheduled function
- Push notifications تحتاج OneSignal configuration
- كل الـ APIs محمية بـ admin authentication
- RLS policies تضمن أمان البيانات

---

## 🔗 Related Files

- Migration: `supabase/migrations/20260124_fix_notifications_system.sql`
- API: `app/api/admin/notifications/send/route.ts`
- Admin Page: `app/admin/notifications/page.tsx`
- Service: `lib/services/notification.service.ts`
- OneSignal: `lib/onesignal/server.ts`
- Types: `lib/database.types.ts`
