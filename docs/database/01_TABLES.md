# جداول قاعدة البيانات - Database Tables

## نظرة عامة

| الجدول | الوصف | عدد الصفوف | RLS |
|--------|-------|------------|-----|
| app_settings | إعدادات التطبيق العامة | 1 | ✅ |
| chat_messages | رسائل المحادثات | 0 | ✅ |
| comprehensive_exam_attempts | محاولات امتحانات الموقع | 0 | ✅ |
| comprehensive_exams | امتحانات الموقع الشاملة | 1 | ✅ |
| educational_stages | المراحل الدراسية | 0 | ✅ |
| lessons | الدروس | 252 | ✅ |
| messages | الرسائل | 0 | ✅ |
| notification_preferences | تفضيلات الإشعارات | 0 | ✅ |
| notifications | الإشعارات | 0 | ✅ |
| page_words | كلمات الصفحات | 15 | ✅ |
| profiles | بيانات المستخدمين | 3 | ✅ |
| question_bank_attempts | محاولات بنك الأسئلة | 0 | ✅ |
| question_banks | بنوك الأسئلة | 1 | ✅ |
| quiz_questions | أسئلة الكويز | 0 | ✅ |
| site_settings | إعدادات الموقع | 0 | ✅ |
| subject_stages | ربط المواد بالمراحل | 19 | ✅ |
| subjects | المواد الدراسية | 0 | ✅ |
| support_chats | محادثات الدعم | 0 | ✅ |
| supported_languages | اللغات المدعومة | 0 | ✅ |
| teacher_exam_attempts | محاولات امتحانات المدرسين | 0 | ✅ |
| teacher_exams | امتحانات المدرسين | 0 | ✅ |
| teacher_ratings | تقييمات المعلمين | 0 | ✅ |
| teacher_subscriptions | اشتراكات الطلاب مع المعلمين | 0 | ✅ |
| testimonials | الشهادات والآراء | 0 | ✅ |
| translation_cache | ذاكرة الترجمات | varies | ✅ |
| user_devices | أجهزة المستخدمين | varies | ✅ |
| user_lesson_likes | إعجابات الدروس | 0 | ✅ |
| user_lesson_progress | تقدم الدروس | 0 | ✅ |
| user_word_highlights | الكلمات المحددة | 0 | ✅ |
| visitor_devices | أجهزة الزوار | varies | ✅ |
| word_bank | بنك الكلمات | 0 | ✅ |
| word_bank_translations | ترجمات الكلمات | 0 | ✅ |
| word_categories | فئات الكلمات | 0 | ✅ |

---

## تفاصيل الجداول

### profiles
```
الوصف: بيانات المستخدمين (طلاب، معلمين، مشرفين)
الصفوف: ~3
RLS: مفعّل
```

**الأعمدة الرئيسية:**
- `id` (uuid) - المفتاح الأساسي
- `email` (text) - البريد الإلكتروني
- `name` (text) - الاسم
- `role` (user_role) - الدور (student/teacher/admin)
- `educational_stage_id` (uuid) - المرحلة الدراسية
- `avatar_url` (text) - صورة الملف الشخصي
- `bio` (text) - نبذة شخصية
- `exam_count` (integer) - عدد الامتحانات (للمعلمين)
- `subscriber_count` (integer) - عدد المشتركين (للمعلمين)

---

### comprehensive_exams
```
الوصف: امتحانات الموقع الشاملة
الصفوف: ~1
RLS: مفعّل
```

**الأعمدة الرئيسية:**
- `id` (uuid) - المفتاح الأساسي
- `exam_title` (text) - عنوان الامتحان
- `exam_description` (text) - وصف الامتحان
- `stage_id` (uuid) - المرحلة الدراسية
- `sections` (jsonb) - أقسام الامتحان وأسئلته
- `total_marks` (integer) - مجموع الدرجات
- `duration_minutes` (integer) - مدة الامتحان بالدقائق
- `is_published` (boolean) - هل منشور
- `semester` (semester_type) - الفصل الدراسي

---

### comprehensive_exam_attempts
```
الوصف: محاولات امتحانات الموقع
الصفوف: 0
RLS: مفعّل
```

**الأعمدة الرئيسية:**
- `id` (uuid) - المفتاح الأساسي
- `exam_id` (uuid) - معرف الامتحان
- `student_id` (uuid) - معرف الطالب
- `answers` (jsonb) - إجابات الطالب
- `status` (text) - الحالة (in_progress/submitted/graded)
- `total_score` (numeric) - الدرجة الكلية
- `max_score` (numeric) - أقصى درجة
- `percentage` (numeric) - النسبة المئوية
- `answered_count` (integer) - عدد الأسئلة المجابة

---

### teacher_exams
```
الوصف: امتحانات المدرسين
الصفوف: 0
RLS: مفعّل
```

**الأعمدة الرئيسية:**
- `id` (uuid) - المفتاح الأساسي
- `created_by` (uuid) - معرف المعلم
- `exam_title` (text) - عنوان الامتحان
- `exam_description` (text) - وصف الامتحان
- `stage_id` (uuid) - المرحلة الدراسية
- `sections` (jsonb) - أقسام الامتحان
- `is_published` (boolean) - هل منشور
- `available_from` (timestamptz) - متاح من
- `available_until` (timestamptz) - متاح حتى

---

### teacher_exam_attempts
```
الوصف: محاولات امتحانات المدرسين
الصفوف: 0
RLS: مفعّل
```

**الأعمدة الرئيسية:**
- `id` (uuid) - المفتاح الأساسي
- `exam_id` (uuid) - معرف الامتحان
- `student_id` (uuid) - معرف الطالب
- `answers` (jsonb) - إجابات الطالب
- `status` (text) - الحالة
- `total_score` (numeric) - الدرجة
- `max_score` (numeric) - أقصى درجة

---

### question_banks
```
الوصف: بنوك الأسئلة للدروس
الصفوف: ~1
RLS: مفعّل
```

**الأعمدة الرئيسية:**
- `id` (uuid) - المفتاح الأساسي
- `lesson_id` (uuid) - معرف الدرس
- `stage_id` (uuid) - المرحلة
- `title` (jsonb) - العنوان {ar, en}
- `questions` (jsonb) - الأسئلة
- `total_questions` (integer) - عدد الأسئلة
- `is_published` (boolean) - منشور

---

### question_bank_attempts
```
الوصف: محاولات بنك الأسئلة
الصفوف: 0
RLS: مفعّل
```

**الأعمدة الرئيسية:**
- `id` (uuid) - المفتاح الأساسي
- `question_bank_id` (uuid) - معرف البنك
- `student_id` (uuid) - معرف الطالب
- `answers` (jsonb) - الإجابات
- `status` (text) - الحالة (in_progress/completed)
- `answered_count` (integer) - عدد المجاب
- `correct_count` (integer) - عدد الصحيح
- `score_percentage` (numeric) - النسبة

---

### lessons
```
الوصف: الدروس التعليمية
الصفوف: ~252
RLS: مفعّل
```

**الأعمدة الرئيسية:**
- `id` (uuid) - المفتاح الأساسي
- `title` (text) - العنوان
- `description` (text) - الوصف
- `subject_id` (uuid) - المادة
- `stage_id` (uuid) - المرحلة
- `content` (jsonb) - المحتوى
- `is_published` (boolean) - منشور

---

### user_lesson_progress
```
الوصف: تقدم الطلاب في الدروس
RLS: مفعّل
```

**الأعمدة الرئيسية:**
- `id` (uuid) - المفتاح الأساسي
- `user_id` (uuid) - معرف المستخدم
- `lesson_id` (uuid) - معرف الدرس
- `progress_percentage` (integer) - نسبة التقدم
- `is_completed` (boolean) - مكتمل
- `last_accessed_at` (timestamptz) - آخر وصول

---

### quiz_questions
```
الوصف: أسئلة الكويز والألعاب التعليمية
RLS: مفعّل
```

**الأعمدة الرئيسية:**
- `id` (uuid) - المفتاح الأساسي
- `lesson_id` (uuid) - معرف الدرس (اختياري)
- `text` (jsonb) - نص السؤال {ar, en}
- `type` (text) - نوع السؤال (mcq, true_false, etc.)
- `options` (jsonb) - الخيارات
- `correct_answer` (jsonb) - الإجابة الصحيحة
- `points` (integer) - النقاط
- `difficulty` (text) - الصعوبة

---

### educational_stages
```
الوصف: المراحل الدراسية
RLS: مفعّل
```

**الأعمدة الرئيسية:**
- `id` (uuid) - المفتاح الأساسي
- `name` (text) - اسم المرحلة
- `slug` (text) - المعرف النصي
- `description` (text) - الوصف
- `order_index` (integer) - الترتيب
- `is_active` (boolean) - نشط

---

### subjects
```
الوصف: المواد الدراسية
RLS: مفعّل
```

**الأعمدة الرئيسية:**
- `id` (uuid) - المفتاح الأساسي
- `name` (text) - اسم المادة
- `slug` (text) - المعرف النصي
- `icon` (text) - الأيقونة
- `color` (text) - اللون
- `is_active` (boolean) - نشط

---

### subject_stages
```
الوصف: ربط المواد بالمراحل الدراسية
RLS: مفعّل
```

**الأعمدة الرئيسية:**
- `id` (uuid) - المفتاح الأساسي
- `subject_id` (uuid) - معرف المادة
- `stage_id` (uuid) - معرف المرحلة
- `is_active` (boolean) - نشط

---

### notifications
```
الوصف: الإشعارات للمستخدمين
RLS: مفعّل
```

**الأعمدة الرئيسية:**
- `id` (uuid) - المفتاح الأساسي
- `title` (text) - العنوان
- `message` (text) - الرسالة
- `user_id` (uuid) - المستخدم المستهدف
- `type` (notification_type) - نوع الإشعار
- `status` (notification_status) - الحالة
- `is_read` (boolean) - مقروء

---

### teacher_ratings
```
الوصف: تقييمات الطلاب للمعلمين
RLS: مفعّل
```

**الأعمدة الرئيسية:**
- `id` (uuid) - المفتاح الأساسي
- `user_id` (uuid) - معرف المقيّم
- `teacher_id` (uuid) - معرف المعلم
- `rating` (integer) - التقييم (1-5)
- `comment` (text) - التعليق

---

### teacher_subscriptions
```
الوصف: اشتراكات الطلاب مع المعلمين
RLS: مفعّل
```

**الأعمدة الرئيسية:**
- `id` (uuid) - المفتاح الأساسي
- `user_id` (uuid) - معرف الطالب
- `teacher_id` (uuid) - معرف المعلم
- `created_at` (timestamptz) - تاريخ الاشتراك

---

### testimonials
```
الوصف: شهادات وآراء الطلاب
RLS: مفعّل
```

**الأعمدة الرئيسية:**
- `id` (uuid) - المفتاح الأساسي
- `user_id` (uuid) - معرف المستخدم
- `content` (text) - المحتوى
- `rating` (integer) - التقييم
- `status` (text) - الحالة (pending/approved/rejected)
- `is_featured` (boolean) - مميز

---

### support_chats
```
الوصف: محادثات الدعم الفني
RLS: مفعّل
```

**الأعمدة الرئيسية:**
- `id` (uuid) - المفتاح الأساسي
- `user_id` (uuid) - معرف المستخدم
- `status` (text) - الحالة
- `subject` (text) - الموضوع
- `assigned_to` (uuid) - مسند إلى

---

### chat_messages
```
الوصف: رسائل محادثات الدعم
RLS: مفعّل
```

**الأعمدة الرئيسية:**
- `id` (uuid) - المفتاح الأساسي
- `chat_id` (uuid) - معرف المحادثة
- `sender_id` (uuid) - معرف المرسل
- `sender_type` (sender_type) - نوع المرسل
- `message` (text) - الرسالة

---

### messages
```
الوصف: رسائل التواصل العامة
RLS: مفعّل
```

**الأعمدة الرئيسية:**
- `id` (uuid) - المفتاح الأساسي
- `from_name` (text) - اسم المرسل
- `from_email` (text) - بريد المرسل
- `subject` (text) - الموضوع
- `message` (text) - الرسالة
- `is_read` (boolean) - مقروءة
- `is_replied` (boolean) - تم الرد

---

### user_devices
```
الوصف: أجهزة المستخدمين المسجلين
RLS: مفعّل
```

**الأعمدة الرئيسية:**
- `id` (uuid) - المفتاح الأساسي
- `user_id` (uuid) - معرف المستخدم
- `device_type` (device_type) - نوع الجهاز
- `os_name` (text) - نظام التشغيل
- `browser_name` (text) - المتصفح
- `ip_address` (inet) - عنوان IP

---

### visitor_devices
```
الوصف: أجهزة الزوار غير المسجلين
RLS: مفعّل
```

**الأعمدة الرئيسية:**
- `id` (uuid) - المفتاح الأساسي
- `visitor_id` (text) - معرف الزائر
- `device_type` (device_type) - نوع الجهاز
- `page_url` (text) - رابط الصفحة
- `referrer` (text) - المصدر

---

### word_bank
```
الوصف: بنك الكلمات للتعلم
RLS: مفعّل
```

**الأعمدة الرئيسية:**
- `id` (uuid) - المفتاح الأساسي
- `language_code` (varchar) - كود اللغة
- `word_text` (text) - الكلمة
- `word_definition` (text) - التعريف
- `category_slug` (text) - الفئة
- `difficulty_level` (integer) - مستوى الصعوبة

---

### word_bank_translations
```
الوصف: ترجمات كلمات البنك
RLS: مفعّل
```

**الأعمدة الرئيسية:**
- `id` (uuid) - المفتاح الأساسي
- `word_bank_id` (uuid) - معرف الكلمة
- `target_language` (varchar) - لغة الهدف
- `translated_text` (text) - النص المترجم

---

### word_categories
```
الوصف: فئات الكلمات
RLS: مفعّل
```

**الأعمدة الرئيسية:**
- `id` (uuid) - المفتاح الأساسي
- `name_en` (text) - الاسم بالإنجليزية
- `name_ar` (text) - الاسم بالعربية
- `slug` (text) - المعرف النصي
- `sort_order` (integer) - الترتيب

---

### supported_languages
```
الوصف: اللغات المدعومة في التطبيق
RLS: مفعّل
```

**الأعمدة الرئيسية:**
- `code` (varchar) - كود اللغة (المفتاح الأساسي)
- `name_en` (text) - الاسم بالإنجليزية
- `name_native` (text) - الاسم الأصلي
- `text_direction` (varchar) - اتجاه النص
- `is_active` (boolean) - نشط

---

### translation_cache
```
الوصف: ذاكرة تخزين الترجمات
RLS: مفعّل
```

**الأعمدة الرئيسية:**
- `id` (uuid) - المفتاح الأساسي
- `source_text` (text) - النص الأصلي
- `source_lang` (varchar) - لغة المصدر
- `target_lang` (varchar) - لغة الهدف
- `translated_text` (text) - النص المترجم

---

### app_settings
```
الوصف: إعدادات التطبيق العامة
RLS: مفعّل
```

**الأعمدة الرئيسية:**
- `id` (text) - المفتاح الأساسي
- `show_first_semester` (boolean) - عرض الترم الأول
- `show_second_semester` (boolean) - عرض الترم الثاني
- `updated_by` (uuid) - المحدث

---

### site_settings
```
الوصف: إعدادات الموقع المتنوعة
RLS: مفعّل
```

**الأعمدة الرئيسية:**
- `id` (uuid) - المفتاح الأساسي
- `key` (text) - المفتاح
- `value` (jsonb) - القيمة
- `description` (text) - الوصف

---

### notification_preferences
```
الوصف: تفضيلات إشعارات المستخدمين
RLS: مفعّل
```

**الأعمدة الرئيسية:**
- `id` (uuid) - المفتاح الأساسي
- `user_id` (uuid) - معرف المستخدم
- `email_notifications` (boolean) - إشعارات البريد
- `push_notifications` (boolean) - إشعارات الدفع
- `exam_reminders` (boolean) - تذكيرات الامتحانات

---

### page_words
```
الوصف: كلمات الصفحات للتعلم
RLS: مفعّل
```

**الأعمدة الرئيسية:**
- `id` (uuid) - المفتاح الأساسي
- `word_id` (varchar) - معرف الكلمة
- `page_id` (varchar) - معرف الصفحة
- `language_code` (varchar) - كود اللغة
- `word_text` (text) - نص الكلمة

---

### user_lesson_likes
```
الوصف: إعجابات الدروس
RLS: مفعّل
```

**الأعمدة الرئيسية:**
- `id` (uuid) - المفتاح الأساسي
- `user_id` (uuid) - معرف المستخدم
- `lesson_id` (uuid) - معرف الدرس

---

### user_word_highlights
```
الوصف: الكلمات المحددة من المستخدمين
RLS: مفعّل
```

**الأعمدة الرئيسية:**
- `id` (uuid) - المفتاح الأساسي
- `user_id` (uuid) - معرف المستخدم
- `highlighted_words` (jsonb) - الكلمات المحددة
