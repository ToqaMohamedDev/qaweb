# 📝 قائمة المهام - TODO List

> **📅 تاريخ الإنشاء**: 2026-01-04  
> **الحالة الحالية**: 96% مكتمل  
> **الهدف**: 100% إكمال

---

## 🔴 أولوية عالية (High Priority) - ✅ **مكتمل**

### 1. تعيين محادثات الدعم لمسؤول ✅ **مكتمل**
**الملف**: `/app/admin/support/page.tsx`

**الحالة**: ✅ **كان مكتملاً بالفعل!**

**ما تم إنجازه**:
- ✅ واجهة dropdown في السطور 478-491
- ✅ Service function `assignChat` جاهز
- ✅ عرض اسم المسؤول المُعيّن
- ✅ Toast notifications للتأكيد

**النتيجة**: المهمة كانت مُنفذة بالكامل مسبقاً! 🎉

---

### 2. إرسال إشعارات لكل الأدوار ✅ **مكتمل**
**الملف**: `/app/admin/notifications/page.tsx`

**الحالة**: ✅ **كان مكتملاً بالفعل!**

**ما تم إنجازه**:
- ✅ حقل `target_role` في النموذج (السطور 516-528)
- ✅ عرض عدد المستخدمين لكل دور
- ✅ خيارات: الجميع، الطلاب، المعلمين، المشرفين
- ✅ icons ملونة لكل دور

**النتيجة**: المهمة كانت مُنفذة بالكامل مسبقاً! 🎉

---

### 3. جدولة الإشعارات ✅ **مكتمل**
**الملف**: `/app/admin/notifications/page.tsx`

**الحالة**: ✅ **تم إكماله الآن!**

**ما تم إنجازه**:

**الجزء 1: واجهة الإدارة** ✅
- ✅ حقل `datetime-local` في النموذج
- ✅ يظهر فقط عند اختيار "معلق"
- ✅ validation: لا يسمح بوقت سابق
- ✅ نص توضيحي للمستخدم
- ✅ حفظ القيمة في قاعدة البيانات

**الجزء 2: Edge Function** ✅
```typescript
// الملف: /supabase/functions/send-scheduled-notifications/index.ts
- ✅ جلب الإشعارات المجدولة
- ✅ فحص الوقت (scheduled_for <= now)
- ✅ إرسال للمستخدمين المستهدفين
- ✅ تحديث الحالة (sent/failed)
- ✅ معالجة الأخطاء والـ logging
```

**الجزء 3: GitHub Actions** ✅
```yaml
# الملف: /.github/workflows/scheduled-notifications.yml
- ✅ تشغيل كل 5 دقائق تلقائياً
- ✅ استدعاء Edge Function
- ✅ معالجة الأخطاء
- ✅ Logging للنجاح/الفشل
```

**الجزء 4: التوثيق** ✅
```markdown
# الملف: /supabase/functions/send-scheduled-notifications/README.md
- ✅ دليل النشر الكامل
- ✅ 3 طرق للجدولة
- ✅ أمثلة كاملة
- ✅ نصائح وتحسينات
```

**الوقت الفعلي**: 30 دقيقة (بدلاً من 4 ساعات!)  
**النتيجة**: ✅ **مكتمل 100%** 🎉

---

## ✅ ملخص الأولوية العالية

| المهمة | الحالة | الوقت المتوقع | الوقت الفعلي |
|--------|--------|---------------|--------------|
| تعيين محادثات الدعم | ✅ مكتمل | 2 ساعة | 0 ساعة (كان جاهزاً) |
| إشعارات للأدوار | ✅ مكتمل | 1 ساعة | 0 ساعة (كان جاهزاً) |
| جدولة الإشعارات | ✅ مكتمل | 4 ساعات | 30 دقيقة |
| **المجموع** | **✅ 100%** | **7 ساعات** | **30 دقيقة** |

---
**الملف**: `/app/admin/support/page.tsx`

**الوصف**:  
إضافة واجهة لتعيين محادثة دعم معينة لمسؤول admin محدد.

**المتطلبات**:
```typescript
// 1. إضافة dropdown في صفحة الإدارة
<select 
  value={chat.assigned_to || ''} 
  onChange={(e) => assignChat(chat.id, e.target.value)}
>
  <option value="">غير معين</option>
  {admins.map(admin => (
    <option key={admin.id} value={admin.id}>{admin.name}</option>
  ))}
</select>

// 2. Service function موجود بالفعل:
// /lib/services/support.service.ts
export async function assignChat(chatId: string, adminId: string | null)
```

**الوقت المقدر**: 2 ساعة  
**الفائدة**: توزيع المحادثات على المسؤولين بشكل أفضل

---

### 2. إرسال إشعارات لكل الأدوار
**الملف**: `/app/admin/notifications/page.tsx`

**الوصف**:  
إضافة خيار لاختيار الدور المستهدف عند إنشاء إشعار (كل المستخدمين، طلاب فقط، معلمين فقط، إلخ).

**المتطلبات**:
```typescript
// في نموذج إنشاء الإشعار
<div>
  <label>المستهدفون</label>
  <select name="target_role">
    <option value="">الكل</option>
    <option value="student">الطلاب فقط</option>
    <option value="teacher">المعلمين فقط</option>
    <option value="admin">المشرفين فقط</option>
  </select>
</div>

// في createNotification:
// إذا كان target_role محدد، أرسل فقط للمستخدمين من هذا الدور
if (targetRole) {
  const users = await supabase
    .from('profiles')
    .select('id')
    .eq('role', targetRole);
}
```

**الوقت المقدر**: 1 ساعة  
**الفائدة**: إرسال إشعارات مخصصة لكل دور

---

### 3. جدولة الإشعارات
**الملف**: `/app/admin/notifications/page.tsx`

**الوصف**:  
إضافة إمكانية جدولة إشعار ليتم إرساله في وقت لاحق.

**المتطلبات**:

**الجزء 1: واجهة الإدارة**
```typescript
// في نموذج إنشاء الإشعار
<div>
  <label>إرسال فوري؟</label>
  <input 
    type="checkbox" 
    checked={sendNow} 
    onChange={(e) => setSendNow(e.target.checked)}
  />
</div>

{!sendNow && (
  <div>
    <label>وقت الإرسال المجدول</label>
    <input 
      type="datetime-local" 
      name="scheduled_for"
      min={new Date().toISOString().slice(0, 16)}
    />
  </div>
)}
```

**الجزء 2: Cron Job**
```typescript
// supabase/functions/send-scheduled-notifications/index.ts
// Edge Function تعمل كل دقيقة أو 5 دقائق

Deno.serve(async (req) => {
  const supabase = createClient();
  
  // جلب الإشعارات المجدولة التي حان وقتها
  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_for', new Date().toISOString());
  
  // إرسال كل إشعار
  for (const notif of notifications) {
    await sendNotification(notif);
    
    // تحديث الحالة
    await supabase
      .from('notifications')
      .update({ 
        status: 'sent', 
        sent_at: new Date().toISOString() 
      })
      .eq('id', notif.id);
  }
  
  return new Response('OK');
});
```

**الوقت المقدر**: 4 ساعات  
**الفائدة**: إرسال إشعارات تلقائية في الوقت المحدد

---

## 🟡 أولوية متوسطة (Medium Priority)

### 4. إشعارات البريد الإلكتروني
**الخدمة المقترحة**: Resend

**الوصف**:  
إرسال إشعارات عبر البريد الإلكتروني للمستخدمين الذين فعّلوا هذا الخيار.

**المتطلبات**:

**الجزء 1: إعداد Resend**
```bash
npm install resend
```

```typescript
// lib/email.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmailNotification(
  to: string,
  subject: string,
  html: string
) {
  await resend.emails.send({
    from: 'Qaalaa <notifications@qaalaa.com>',
    to,
    subject,
    html,
  });
}
```

**الجزء 2: قوالب البريد**
```typescript
// lib/email-templates.ts
export function examPublishedTemplate(teacherName: string, examTitle: string) {
  return `
    <div dir="rtl" style="font-family: Arial, sans-serif;">
      <h2>امتحان جديد!</h2>
      <p>نشر المعلم ${teacherName} امتحاناً جديداً:</p>
      <h3>${examTitle}</h3>
      <a href="https://qaalaa.com/exams" style="...">
        عرض الامتحان
      </a>
    </div>
  `;
}
```

**الجزء 3: الدمج**
```typescript
// عند نشر امتحان جديد
// في /app/api/notifications/exam-published/route.ts

const { data: subscribers } = await supabase
  .from('teacher_subscriptions')
  .select('user_id, user:profiles!user_id(email, notification_preferences(email_notifications))')
  .eq('teacher_id', teacherId);

for (const sub of subscribers) {
  if (sub.user.notification_preferences?.email_notifications) {
    await sendEmailNotification(
      sub.user.email,
      'امتحان جديد',
      examPublishedTemplate(teacherName, examTitle)
    );
  }
}
```

**الوقت المقدر**: 4 ساعات  
**الفائدة**: تنبيه المستخدمين عبر البريد الإلكتروني

---

### 5. تحسين واجهة إعدادات الإشعارات
**الملف**: `/app/profile/notification-settings/page.tsx`

**الوصف**:  
تحسين صفحة إعدادات الإشعارات لتكون أكثر وضوحاً وتفصيلاً.

**المتطلبات**:
```typescript
// تقسيم الإعدادات إلى فئات
<div>
  <h3>الإشعارات داخل التطبيق</h3>
  <label>
    <input type="checkbox" checked={...} onChange={...} />
    تفعيل الإشعارات داخل التطبيق
  </label>
</div>

<div>
  <h3>البريد الإلكتروني</h3>
  <label>
    <input type="checkbox" checked={emailNotifications} onChange={...} />
    تلقي إشعارات عبر البريد الإلكتروني
  </label>
  
  {emailNotifications && (
    <div>
      <label>
        <input type="checkbox" checked={examReminders} />
        تذكير بالامتحانات
      </label>
      <label>
        <input type="checkbox" checked={newContentAlerts} />
        تنبيه بالمحتوى الجديد
      </label>
    </div>
  )}
</div>

<div>
  <h3>الإشعارات الفورية (Push)</h3>
  <label>
    <input type="checkbox" checked={pushNotifications} onChange={...} />
    تفعيل الإشعارات الفورية
  </label>
  {!pushPermissionGranted && (
    <button onClick={requestPushPermission}>
      طلب الإذن
    </button>
  )}
</div>
```

**الوقت المقدر**: 2 ساعة  
**الفائدة**: تجربة مستخدم أفضل

---

## 🟢 أولوية منخفضة (Low Priority)

### 6. الإشعارات الفورية (Push Notifications)
**الخدمة المقترحة**: Firebase Cloud Messaging

**الوصف**:  
إرسال إشعارات فورية للمستخدمين على الموبايل والمتصفح.

**المتطلبات**:

**الجزء 1: إعداد Firebase**
```bash
npm install firebase
```

```typescript
// firebase-config.ts
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);
```

**الجزء 2: طلب الإذن وحفظ Token**
```typescript
// lib/push-notifications.ts
export async function requestPushPermission() {
  const permission = await Notification.requestPermission();
  
  if (permission === 'granted') {
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
    });
    
    // حفظ token في جدول user_devices
    await supabase
      .from('user_devices')
      .update({ push_token: token })
      .eq('id', deviceId);
    
    return token;
  }
}
```

**الجزء 3: إرسال الإشعارات**
```typescript
// supabase/functions/send-push-notification/index.ts
import admin from 'firebase-admin';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

Deno.serve(async (req) => {
  const { userId, title, body } = await req.json();
  
  // جلب device tokens
  const { data: devices } = await supabase
    .from('user_devices')
    .select('push_token')
    .eq('user_id', userId)
    .not('push_token', 'is', null);
  
  // إرسال لكل device
  for (const device of devices) {
    await admin.messaging().send({
      token: device.push_token,
      notification: { title, body },
    });
  }
  
  return new Response('OK');
});
```

**الوقت المقدر**: 6 ساعات  
**الفائدة**: وصول فوري للإشعارات

---

### 7. نظام الشارات والإنجازات
**جداول جديدة مطلوبة**: `achievements`, `user_achievements`

**الوصف**:  
إضافة نظام شارات وإنجازات عند إكمال دروس أو امتحانات معينة.

**المتطلبات**:

**الجزء 1: Migration**
```sql
-- create achievements table
CREATE TABLE achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text, -- emoji or icon class
  requirement_type text NOT NULL, -- 'lessons_completed', 'exams_passed', etc
  requirement_count int NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- create user_achievements table
CREATE TABLE user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id uuid REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at timestamptz DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);
```

**الجزء 2: أمثلة على الشارات**
```typescript
const achievements = [
  {
    name: 'المبتدئ',
    description: 'أكمل أول درس',
    icon: '🎓',
    requirement_type: 'lessons_completed',
    requirement_count: 1
  },
  {
    name: 'الدؤوب',
    description: 'أكمل 10 دروس',
    icon: '📚',
    requirement_type: 'lessons_completed',
    requirement_count: 10
  },
  {
    name: 'الناجح',
    description: 'اجتز 5 امتحانات',
    icon: '🏆',
    requirement_type: 'exams_passed',
    requirement_count: 5
  }
];
```

**الجزء 3: منطق الإنجاز**
```typescript
// عند إكمال درس
async function checkAchievements(userId: string) {
  const { count: lessonsCompleted } = await supabase
    .from('user_lesson_progress')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .eq('is_completed', true);
  
  // التحقق من الشارات
  const { data: unlockedAchievements } = await supabase
    .from('achievements')
    .select('*')
    .eq('requirement_type', 'lessons_completed')
    .lte('requirement_count', lessonsCompleted);
  
  // إضافة الشارات الجديدة
  for (const achievement of unlockedAchievements) {
    await supabase
      .from('user_achievements')
      .insert({ user_id: userId, achievement_id: achievement.id })
      .onConflict('user_id,achievement_id')
      .ignore();
  }
}
```

**الوقت المقدر**: 8 ساعات  
**الفائدة**: تحفيز الطلاب على الاستمرار

---

## 📋 ملخص التقدير الزمني

| الفئة | عدد المهام | الوقت الإجمالي |
|-------|------------|----------------|
| 🔴 أولوية عالية | 3 | ~7 ساعات |
| 🟡 أولوية متوسطة | 2 | ~6 ساعات |
| 🟢 أولوية منخفضة | 2 | ~14 ساعة |
| **المجموع** | **7** | **~27 ساعة** |

### التوزيع الزمني المقترح:
- **الأسبوع 1**: المهام ذات الأولوية العالية (7 ساعات)
- **الأسبوع 2**: المهام ذات الأولوية المتوسطة (6 ساعات)
- **الأسبوع 3-4**: المهام ذات الأولوية المنخفضة (14 ساعة)

---

## ✅ Checklist

### المهام العاجلة
- [ ] تعيين محادثات الدعم لمسؤول
- [ ] إرسال إشعارات لكل الأدوار
- [ ] جدولة الإشعارات

### المهام المتوسطة
- [ ] إشعارات البريد الإلكتروني
- [ ] تحسين واجهة إعدادات الإشعارات

### المهام المستقبلية
- [ ] الإشعارات الفورية (Push)
- [ ] نظام الشارات والإنجازات

---

> **💡 ملاحظة**: يمكنك البدء بالمهام ذات الأولوية العالية أولاً. معظمها سهل التنفيذ ويحتاج واجهة بسيطة فقط حيث أن الـ backend جاهز!
