# تشغيل الإشعارات المجدولة - Scheduled Notifications

## 📝 الوصف

هذه الوظيفة Edge Function تعمل تلقائياً لإرسال الإشعارات المجدولة في الوقت المحدد.

## 🚀 كيفية النشر

### 1. تثبيت Supabase CLI

```bash
npm install -g supabase
```

### 2. تسجيل الدخول

```bash
supabase login
```

### 3. ربط المشروع

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

### 4. نشر الدالة

```bash
supabase functions deploy send-scheduled-notifications
```

## ⏰ جدولة التشغيل التلقائي

### الطريقة 1: GitHub Actions (موصى بها)

أنشئ ملف `.github/workflows/scheduled-notifications.yml`:

```yaml
name: Send Scheduled Notifications

on:
  schedule:
    # كل 5 دقائق
    - cron: '*/5 * * * *'
  workflow_dispatch: # السماح بالتشغيل اليدوي

jobs:
  send-notifications:
    runs-on: ubuntu-latest
    steps:
      - name: Call Edge Function
        run: |
          curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-scheduled-notifications' \
            -H 'Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}' \
            -H 'Content-Type: application/json'
```

### الطريقة 2: Cron Job على السيرفر

إذا كان لديك سيرفر، استخدم crontab:

```bash
# تشغيل كل 5 دقائق
*/5 * * * * curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-scheduled-notifications' -H 'Authorization: Bearer YOUR_ANON_KEY'
```

### الطريقة 3: Third-party Cron Service

استخدم خدمة مثل:
- **cron-job.org** (مجاني)
- **EasyCron** (مجاني)
- **Zapier** (مدفوع)

قم بإعداد HTTP Request كل 5 دقائق:
- **URL**: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-scheduled-notifications`
- **Method**: POST
- **Headers**: 
  - `Authorization`: `Bearer YOUR_ANON_KEY`
  - `Content-Type`: `application/json`

## 🔑 المتغيرات المطلوبة

تأكد من تعيين هذه المتغيرات في Supabase Dashboard → Edge Functions:

- `SUPABASE_URL` (تلقائي)
- `SUPABASE_SERVICE_ROLE_KEY` (تلقائي)

## 🧪 الاختبار

### اختبار يدوي:

```bash
# باستخدام Supabase CLI
supabase functions invoke send-scheduled-notifications --no-verify-jwt

# أو باستخدام curl
curl -X POST 'http://localhost:54321/functions/v1/send-scheduled-notifications' \
  -H 'Authorization: Bearer YOUR_ANON_KEY'
```

## 📊 كيف يعمل

1. تُفحص **كل 5 دقائق** (أو حسب الجدولة)
2. تجلب الإشعارات:
   - `status = 'pending'`
   - `scheduled_for <= now()`
3. لكل إشعار:
   - تجلب المستخدمين حسب `target_role`
   - ترسل الإشعار
   - تحدث الحالة إلى `sent`
4. إذا فشل الإرسال → الحالة تصبح `failed`

## 📝 مثال على البيانات

### إنشاء إشعار مجدول:

```sql
INSERT INTO notifications (title, message, target_role, status, scheduled_for)
VALUES (
  'تذكير بالامتحان',
  'لا تنسى امتحان الرياضيات غداً',
  'students',
  'pending',
  '2026-01-05 09:00:00+00'
);
```

### بعد الإرسال:

```sql
SELECT id, title, status, sent_at FROM notifications;
-- status = 'sent', sent_at = '2026-01-05 09:00:05...'
```

## 🛠️ التخصيص

### إضافة إشعارات البريد الإلكتروني:

في الدالة، أضف:

```typescript
// بعد تحديث الحالة
if (notif.send_email) {
  await sendEmailNotification(targetUsers, notif)
}
```

### إضافة Push Notifications:

```typescript
if (notif.send_push) {
  await sendPushNotification(targetUsers, notif)
}
```

## ⚠️ ملاحظات مهمة

1. **الوقت بتوقيت UTC** - حوّل من Cairo time عند الحفظ:
   ```js
   const cairoTime = new Date('2026-01-05 09:00:00+02:00')
   const utcTime = cairoTime.toISOString() // للحفظ في DB
   ```

2. **الحد الأقصى للمستخدمين** - إذا كان عدد المستخدمين كبير، قسّمهم:
   ```typescript
   const batches = chunk(targetUsers, 1000) // 1000 user per batch
   ```

3. **التكرار** - لا تستخدم جدولة أقل من 5 دقائق لتجنب التكلفة

## 🔍 المراقبة

راجع logs في Supabase Dashboard:
- **Edge Functions** → **send-scheduled-notifications** → **Logs**

## 📈 تحسينات مستقبلية

- [ ] إضافة retry logic للإشعارات الفاشلة
- [ ] دعم الإشعارات المتكررة (daily/weekly)
- [ ] إحصائيات مفصلة
- [ ] نظام قوائم انتظار (Queue)

---

> **✅ جاهز للاستخدام!** بمجرد النشر والجدولة، ستعمل الإشعارات تلقائياً.
