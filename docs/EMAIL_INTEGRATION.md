# 📧 Email Integration - دليل التكامل

## ✅ تم التنفيذ

تم دمج نظام البريد الإلكتروني بالكامل مع جميع الأحداث المهمة في التطبيق!

---

## 📁 الملفات المُنشأة

### 1. API Routes
```
app/api/
├── email/send/route.ts              ← إرسال بريد عام
├── messages/reply/route.ts          ← الرد على رسالة اتصل بنا
├── support/reply/route.ts           ← الرد على دعم فني
└── notifications/exam-published/    ← نشر امتحان جديد (محدّث)
    └── route.ts
```

### 2. Email Service
```
lib/services/email.service.ts        ← نظام البريد الكامل
```

---

## 🎯 الأحداث المدمجة

### 1️⃣ نشر امتحان جديد ✅
**الحدث**: عندما معلم ينشر امتحان جديد  
**API**: `POST /api/notifications/exam-published`

**ما يحدث**:
1. ✅ إرسال إشعار داخل التطبيق لكل المشتركين
2. ✅ **إرسال بريد إلكتروني** للمشتركين (جديد!)
3. ✅ تحقق تلقائي من تفضيلات المستخدم

**البريد يحتوي على**:
- عنوان الامتحان
- اسم المعلم
- زر "عرض الامتحان" (Call to Action)

---

### 2️⃣ الرد على رسالة اتصل بنا ✅
**الحدث**: عندما admin يرد على رسالة من صفحة اتصل بنا  
**API**: `POST /api/messages/reply`

**ما يحدث**:
1. ✅ تحديث حالة الرسالة إلى "replied"
2. ✅ حفظ الرد في قاعدة البيانات
3. ✅ **إرسال بريد إلكتروني** للمستخدم (جديد!)

**البريد يحتوي على**:
- موضوع الرسالة الأصلية
- الرد من فريق الإدارة
- زر "عرض الرسالة"

**كيفية الاستخدام**:
```typescript
// من صفحة admin/messages
const response = await fetch('/api/messages/reply', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messageId: 'message-id-here',
    reply: 'نص الرد هنا',
  }),
});
```

---

### 3️⃣ الرد على دعم فني ✅
**الحدث**: عندما admin يرد على محادثة دعم فني  
**API**: `POST /api/support/reply`

**ما يحدث**:
1. ✅ إضافة رسالة جديدة في المحادثة
2. ✅ تحديث حالة المحادثة
3. ✅ **إرسال بريد إلكتروني** للمستخدم (جديد!)

**البريد يحتوي على**:
- موضوع المحادثة
- الرد من فريق الدعم
- زر "عرض الدردشة"

**كيفية الاستخدام**:
```typescript
// من صفحة admin/support
const response = await fetch('/api/support/reply', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    chatId: 'chat-id-here',
    message: 'نص الرد هنا',
  }),
});
```

---

### 4️⃣ إرسال بريد عام ✅
**API**: `POST /api/email/send`

**الاستخدام العام**:
```typescript
const response = await fetch('/api/email/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user-id',
    title: 'عنوان البريد',
    message: 'نص الرسالة',
    actionUrl: 'https://qaalaa.com/some-page',
    actionText: 'نص الزر',
  }),
});
```

---

## 🔧 الإعدادات المطلوبة

### 1. Resend API Key
```env
# .env.local
RESEND_API_KEY=re_your_key_here
```

### 2. App URL (اختياري)
```env
# للرواب ط في البريد
NEXT_PUBLIC_APP_URL=https://qaalaa.com
```

### 3. Service Role Key (موجود)
```env
# لإرسال البريد من الـ API
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## 🎨 القوالب المستخدمة

### 1. `createExamPublishedEmail()`
```typescript
import { createExamPublishedEmail } from '@/lib/services/email.service';

const html = createExamPublishedEmail({
  teacherName: 'أحمد محمد',
  examTitle: 'امتحان الرياضيات',
  examUrl: 'https://qaalaa.com/exams/123',
});
```

### 2. `createMessageReplyEmail()`
```typescript
import { createMessageReplyEmail } from '@/lib/services/email.service';

const html = createMessageReplyEmail({
  subject: 'استفسار عن المنهج',
  reply: 'شكراً على تواصلك...',
  messageUrl: 'https://qaalaa.com/contact',
});
```

### 3. `createSupportReplyEmail()`
```typescript
import { createSupportReplyEmail } from '@/lib/services/email.service';

const html = createSupportReplyEmail({
  chatSubject: 'مشكلة في التسجيل',
  reply: 'تم حل المشكلة...',
  chatUrl: 'https://qaalaa.com/support',
});
```

### 4. `createGeneralNotificationEmail()`
```typescript
import { createGeneralNotificationEmail } from '@/lib/services/email.service';

const html = createGeneralNotificationEmail({
  title: 'إشعار مهم',
  message: 'نص الإشعار...',
  url: 'https://qaalaa.com/page',
});
```

---

## 🔒 الأمان والخصوصية

### 1. التحقق من التفضيلات
```typescript
// يتم التحقق تلقائياً من:
const emailEnabled = user.notification_preferences?.email_notifications !== false;

// إذا المستخدم أوقف البريد، لا يُرسل
if (!emailEnabled) return;
```

### 2. التحقق من الصلاحيات
```typescript
// في /api/email/send
// فقط admin أو المستخدم نفسه يمكنه إرسال بريد
const isAdmin = profile?.role === 'admin';
const isSendingToSelf = userId === user.id;
```

### 3. Background Tasks
```typescript
// البريد يُرسل في الخلفية - لا يؤثر على الأداء
sendEmailToSubscribers(...)
  .catch(err => console.error('Background email error:', err));
```

---

## 📊 Logging والمراقبة

### Console Logs
```typescript
// نجاح
console.log(`✅ Email sent to ${email} for exam ${examId}`);

// فشل
console.error(`Failed to send email to ${email}:`, error);
```

### التحقق من الإرسال
- تحقق من console logs في الـ terminal
- راجع Resend Dashboard للمراقبة المباشرة
- تحقق من `sent_at` في جدول notifications

---

## 🎯 الحالات المدعومة

| الحدث | API | البريد | الحالة |
|-------|-----|--------|--------|
| نشر امتحان | ✅ | ✅ | مكتمل |
| رد على رسالة | ✅ | ✅ | مكتمل |
| رد على دعم | ✅ | ✅ | مكتمل |
| إرسال عام | ✅ | ✅ | مكتمل |

---

## 🚀 التحسينات المستقبلية (اختيارية)

### 1. Retry Logic
```typescript
// إعادة محاولة إرسال البريد عند الفشل
for (let i = 0; i < 3; i++) {
  try {
    await sendEmail(...);
    break;
  } catch (err) {
    if (i === 2) throw err;
    await delay(1000 * (i + 1));
  }
}
```

### 2. Queue System
```typescript
// استخدام queue لإرسال البريد بشكل أفضل
import { Queue } from 'bull';
const emailQueue = new Queue('emails');
emailQueue.process(sendEmailJob);
```

### 3. Email Templates Editor
- واجهة لتعديل القوالب
- معاينة قبل الإرسال
- حفظ القوالب المخصصة

---

## ✅ المايلستون

```
✅ Email Service Implementation
✅ API Routes Created
✅ Integration with Events
✅ HTML Templates (4 templates)
✅ Privacy & Permissions
✅ Background Processing
✅ Error Handling
✅ Documentation

🎉 100% Complete!
```

---

> **📝 ملحوظة**: كل شيء جاهز! فقط أضف `RESEND_API_KEY` و ابدأ الاستخدام!
