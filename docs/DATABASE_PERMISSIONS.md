# 📊 تحليل شامل لقاعدة البيانات - QAlaa Platform

> **آخر تحديث:** 2025-12-20
> **إجمالي الجداول:** 26 جدول
> **إجمالي الـ Storage Buckets:** 5 buckets
> **إجمالي ملفات الـ Migrations:** 44 ملف

---

## 📂 هيكل ملفات الـ Migrations (كامل)

```
supabase/migrations/
├── 00001_create_extensions.sql          # الامتدادات (uuid-ossp, pgcrypto, pg_trgm)
├── 00002_create_enums.sql               # الـ ENUMs (13 نوع)
├── 00003_create_profiles_table.sql      # الملفات الشخصية
├── 00004_create_educational_stages_table.sql  # المراحل التعليمية
├── 00005_create_subjects_table.sql      # المواد الدراسية
├── 00006_create_lessons_table.sql       # الدروس
├── 00007_create_lesson_questions_table.sql    # أسئلة الدروس
├── 00008_create_exams_table.sql         # الاختبارات
├── 00009_create_questions_table.sql     # الأسئلة
├── 00010_create_exam_results_table.sql  # نتائج الاختبارات
├── 00011_create_notifications_table.sql # الإشعارات (قديم)
├── 00012_create_messages_table.sql      # الرسائل
├── 00013_create_site_settings_table.sql # إعدادات الموقع
├── 00014_create_support_chats_table.sql # محادثات الدعم
├── 00015_create_chat_messages_table.sql # رسائل الدردشة
├── 00016_create_teacher_subscriptions_table.sql  # اشتراكات المعلمين
├── 00017_create_teacher_ratings_table.sql        # تقييمات المعلمين
├── 00018_create_exam_templates_table.sql         # قوالب الامتحانات
├── 00019_create_template_questions_table.sql     # أسئلة القوالب
├── 00020_create_exam_attempts_table.sql          # محاولات الامتحانات
├── 00021_create_comprehensive_exams_table.sql    # الامتحانات الشاملة
├── 00022_create_comprehensive_exam_attempts_table.sql  # محاولات الامتحانات الشاملة
├── 00023_create_user_lesson_progress_table.sql   # تقدم المستخدم في الدروس
├── 00024_create_storage_buckets.sql              # Storage Buckets
├── 00025_create_utility_functions.sql            # Functions مساعدة
├── 00026_create_views.sql                        # Views
├── 00027_seed_data.sql                           # البيانات الأولية
├── 00028_update_educational_stages.sql           # تحديث المراحل
├── 00029_make_admin.sql                          # جعل مستخدم admin
├── 00030_remove_stage_subject_relationship.sql   # إزالة علاقة المرحلة والمادة
├── 00031_add_language_subjects.sql               # إضافة مواد اللغات
├── 00032_cleanup_duplicates.sql                  # تنظيف المكررات
├── 00033_drop_unused_views.sql                   # حذف Views غير مستخدمة
├── 00034_drop_stage_id_column.sql                # حذف عمود stage_id
├── 00035_add_stage_to_lessons.sql                # إضافة stage للدروس
├── 00036_add_arabic_lessons.sql                  # دروس اللغة العربية
├── 00037_add_stage_to_profiles.sql               # إضافة stage للملفات الشخصية
├── 00038_add_english_lessons.sql                 # دروس اللغة الإنجليزية
├── 00039_create_user_devices_table.sql           # أجهزة المستخدمين
├── 00040_create_visitor_devices_table.sql        # أجهزة الزوار
├── 20251220050210_notification_system.sql        # نظام الإشعارات الجديد (شامل)
├── 20251220064500_fix_subscription_rls.sql       # إصلاح صلاحيات الاشتراك
├── README.md
└── _full_schema_part1.sql                        # Schema كامل
```

---

## 🔧 الامتدادات (Extensions)

| الامتداد | الوظيفة |
|----------|---------|
| `uuid-ossp` | توليد UUIDs |
| `pgcrypto` | التشفير |
| `pg_trgm` | البحث النصي المتقدم |

---

## 📝 أنواع البيانات المخصصة (ENUMs)

| ENUM | القيم | الاستخدام |
|------|-------|----------|
| `user_role` | `admin`, `teacher`, `student` | دور المستخدم |
| `notification_target_role` | `all`, `students`, `teachers`, `admins` | الفئة المستهدفة للإشعارات |
| `notification_status` | `draft`, `sent`, `scheduled` | حالة الإشعار |
| `notification_type` | `system`, `achievement`, `quiz_result`, `new_content`, `subscription`, `reminder`, `social`, `promotional`, `security`, `billing` | نوع الإشعار |
| `exam_type` | `quiz`, `midterm`, `final`, `practice` | نوع الاختبار |
| `question_type` | `multiple_choice`, `true_false`, `fill_blank` | نوع السؤال |
| `difficulty_level` | `easy`, `medium`, `hard` | مستوى الصعوبة |
| `support_chat_status` | `open`, `resolved`, `pending` | حالة محادثة الدعم |
| `sender_type` | `user`, `ai`, `admin` | نوع المرسل |
| `comprehensive_exam_type` | `arabic_comprehensive_exam`, `english_comprehensive_exam` | نوع الامتحان الشامل |
| `exam_usage_scope` | `exam`, `lesson` | نطاق استخدام الامتحان |
| `grading_mode` | `manual`, `hybrid`, `auto` | نوع التصحيح |
| `device_type` | `mobile`, `desktop`, `tablet`, `unknown` | نوع الجهاز |
| `device_platform` | `ios`, `android`, `web` | منصة الجهاز |

---

## 📋 فهرس الجداول الكامل

| # | الجدول | الوصف | RLS | Migration |
|---|--------|-------|-----|-----------|
| 1 | `profiles` | الملفات الشخصية للمستخدمين | ✅ | 00003 |
| 2 | `educational_stages` | المراحل التعليمية | ✅ | 00004 |
| 3 | `subjects` | المواد الدراسية | ✅ | 00005 |
| 4 | `lessons` | الدروس | ✅ | 00006 |
| 5 | `lesson_questions` | أسئلة الدروس | ✅ | 00007 |
| 6 | `exams` | الاختبارات | ✅ | 00008 |
| 7 | `questions` | الأسئلة | ✅ | 00009 |
| 8 | `exam_results` | نتائج الاختبارات | ✅ | 00010 |
| 9 | `notifications` | الإشعارات (جديد) | ✅ | 20251220050210 |
| 10 | `messages` | الرسائل | ✅ | 00012 |
| 11 | `site_settings` | إعدادات الموقع | ✅ | 00013 |
| 12 | `support_chats` | محادثات الدعم | ✅ | 00014 |
| 13 | `chat_messages` | رسائل الدردشة | ✅ | 00015 |
| 14 | `teacher_subscriptions` | اشتراكات/متابعات المعلمين | ✅ | 00016 + 20251220064500 |
| 15 | `teacher_ratings` | تقييمات المعلمين | ✅ | 00017 |
| 16 | `exam_templates` | قوالب الامتحانات | ✅ | 00018 |
| 17 | `template_questions` | أسئلة القوالب | ✅ | 00019 |
| 18 | `exam_attempts` | محاولات الامتحانات | ✅ | 00020 |
| 19 | `comprehensive_exams` | الامتحانات الشاملة | ✅ | 00021 |
| 20 | `comprehensive_exam_attempts` | محاولات الامتحانات الشاملة | ✅ | 00022 |
| 21 | `user_lesson_progress` | تقدم المستخدم في الدروس | ✅ | 00023 |
| 22 | `user_devices` | أجهزة المستخدمين (login) | ✅ | 00039 |
| 23 | `visitor_devices` | أجهزة الزوار (anonymous) | ✅ | 00040 |
| 24 | `notification_preferences` | تفضيلات الإشعارات | ✅ | 20251220050210 |
| 25 | `notification_batches` | إرسال الإشعارات الجماعية | ✅ | 20251220050210 |

---

## 🔐 الأدوار المتاحة

| الدور | الوصف | الصلاحيات |
|-------|-------|----------|
| `student` | طالب (الدور الافتراضي) | قراءة المحتوى المنشور، تعديل ملفه، متابعة وتقييم المعلمين |
| `teacher` | معلم | كل صلاحيات الطالب + إنشاء وتعديل المحتوى الخاص |
| `admin` | مدير النظام | كل الصلاحيات على كل الجداول |

---

## 📊 تفصيل صلاحيات كل جدول

### 1. `profiles` - الملفات الشخصية

**الأعمدة الرئيسية:**
- `id`, `email`, `name`, `role`, `avatar_url`, `bio`, `specialization`
- `is_verified`, `subscriber_count`, `is_teacher_profile_public`
- `teacher_title`, `years_of_experience`, `education`, `phone`, `website`
- `social_links` (JSONB), `subjects[]`, `stages[]`, `teaching_style`
- `cover_image_url`, `is_featured`, `featured_until`
- `total_views`, `rating_average`, `rating_count`

| العملية | الجميع | المستخدم نفسه | المعلم | المدير |
|---------|--------|---------------|--------|--------|
| **SELECT** | ✅ | ✅ | ✅ | ✅ |
| **INSERT** | ❌ | ✅ فقط ملفه | ❌ | ❌ |
| **UPDATE** | ❌ | ✅ فقط ملفه | ❌ | ❌ |
| **DELETE** | ❌ | ❌ | ❌ | ❌ |

---

### 2. `educational_stages` - المراحل التعليمية

**الأعمدة:** `id`, `name`, `description`, `image_url`, `slug`, `order_index`, `is_active`

| العملية | الجميع | المستخدم نفسه | المعلم | المدير |
|---------|--------|---------------|--------|--------|
| **SELECT** | ✅ | ✅ | ✅ | ✅ |
| **INSERT** | ❌ | ❌ | ❌ | ✅ |
| **UPDATE** | ❌ | ❌ | ❌ | ✅ |
| **DELETE** | ❌ | ❌ | ❌ | ✅ |

---

### 3. `subjects` - المواد الدراسية

**الأعمدة:** `id`, `stage_id`, `name`, `description`, `image_url`, `slug`, `order_index`, `is_active`

| العملية | الجميع | المستخدم نفسه | المعلم | المدير |
|---------|--------|---------------|--------|--------|
| **SELECT** | ✅ | ✅ | ✅ | ✅ |
| **INSERT** | ❌ | ❌ | ❌ | ✅ |
| **UPDATE** | ❌ | ❌ | ❌ | ✅ |
| **DELETE** | ❌ | ❌ | ❌ | ✅ |

---

### 4. `lessons` - الدروس

**الأعمدة:** `id`, `subject_id`, `title`, `description`, `content`, `image_url`, `order_index`, `is_published`, `is_free`, `views_count`, `likes_count`, `created_by`

| العملية | الجميع | المنشئ | المعلم | المدير |
|---------|--------|--------|--------|--------|
| **SELECT** | ✅ المنشورة | ✅ دروسه | ✅ | ✅ |
| **INSERT** | ❌ | - | ✅ | ✅ |
| **UPDATE** | ❌ | ✅ | - | ✅ |
| **DELETE** | ❌ | ✅ | - | ✅ |

**Functions:**
- `increment_lesson_views(lesson_id)` - زيادة المشاهدات
- `toggle_lesson_like(lesson_id, increment)` - إعجاب/إلغاء

---

### 5. `lesson_questions` - أسئلة الدروس

**الأعمدة:** `id`, `lesson_id`, `text` (JSONB), `type`, `options` (JSONB), `correct_option_id`, `correct_answer` (JSONB), `points`, `difficulty`, `order_index`, `media` (JSONB), `hint` (JSONB), `explanation` (JSONB), `is_active`, `created_by`

| العملية | الجميع | المنشئ | المعلم | المدير |
|---------|--------|--------|--------|--------|
| **SELECT** | ✅ للدروس المنشورة | ✅ أسئلته | ✅ | ✅ |
| **INSERT** | ❌ | - | ✅ | ✅ |
| **UPDATE** | ❌ | ✅ | - | ✅ |
| **DELETE** | ❌ | ✅ | - | ✅ |

---

### 6. `exams` - الاختبارات

**الأعمدة:** `id`, `subject_id`, `lesson_id`, `title`, `description`, `exam_type`, `duration_minutes`, `passing_score`, `max_attempts`, `shuffle_questions`, `show_answers_after`, `is_published`, `starts_at`, `ends_at`

| العملية | الجميع | المنشئ | المعلم | المدير |
|---------|--------|--------|--------|--------|
| **SELECT** | ✅ المنشورة | - | ✅ الكل | ✅ |
| **INSERT** | ❌ | - | ✅ | ✅ |
| **UPDATE** | ❌ | - | ✅ | ✅ |
| **DELETE** | ❌ | ❌ | ❌ | ✅ |

⚠️ **ملاحظة:** المعلم **لا يقدر يحذف** الاختبارات!

---

### 7. `questions` - الأسئلة

**الأعمدة:** `id`, `lesson_id`, `exam_id`, `question_text`, `question_type`, `options` (JSONB), `correct_answer`, `explanation`, `points`, `difficulty`, `order_index`, `is_active`

| العملية | الجميع | المنشئ | المعلم | المدير |
|---------|--------|--------|--------|--------|
| **SELECT** | ✅ للمحتوى المنشور | - | ✅ | ✅ |
| **INSERT** | ❌ | - | ✅ | ✅ |
| **UPDATE** | ❌ | - | ✅ | ✅ |
| **DELETE** | ❌ | ❌ | ❌ | ✅ |

⚠️ **ملاحظة:** المعلم **لا يقدر يحذف** الأسئلة!

---

### 8. `exam_results` - نتائج الاختبارات

**الأعمدة:** `id`, `user_id`, `exam_id`, `score`, `total_questions`, `correct_answers`, `time_taken_seconds`, `answers` (JSONB), `started_at`, `completed_at`

| العملية | الجميع | المستخدم نفسه | المعلم | المدير |
|---------|--------|---------------|--------|--------|
| **SELECT** | ❌ | ✅ نتائجه | ✅ الكل | ✅ |
| **INSERT** | ❌ | ✅ | ❌ | ❌ |
| **UPDATE** | ❌ | ✅ نتائجه | ❌ | ❌ |
| **DELETE** | ❌ | ❌ | ❌ | ❌ |

**Functions:**
- `get_exam_statistics(exam_id)` - إحصائيات الامتحان
- `get_student_rank(exam_id, user_id)` - ترتيب الطالب

---

### 9. `notifications` - الإشعارات (النظام الجديد)

**الأعمدة:** `id`, `user_id`, `type` (notification_type), `title`, `body`, `data` (JSONB), `is_read`, `is_pushed`, `push_sent_at`, `read_at`, `expires_at`, `priority`

| العملية | الجميع | المستخدم نفسه | Service Role |
|---------|--------|---------------|--------------|
| **SELECT** | ❌ | ✅ إشعاراته | ✅ |
| **INSERT** | ❌ | ❌ (via functions) | ✅ |
| **UPDATE** | ❌ | ✅ إشعاراته | ✅ |
| **DELETE** | ❌ | ✅ إشعاراته | ✅ |

**Functions:**
- `create_notification(...)` - إنشاء إشعار
- `mark_notification_read(id)` - تحديد كمقروء
- `mark_notifications_read_bulk(ids, mark_all)` - تحديد متعدد
- `get_unread_notification_count()` - عدد غير المقروءة
- `delete_old_notifications(days_old)` - حذف القديمة

---

### 10. `notification_preferences` - تفضيلات الإشعارات

**الأعمدة:** `id`, `user_id`, `notification_type`, `email_enabled`, `push_enabled`, `in_app_enabled`

| العملية | المستخدم نفسه | Service Role |
|---------|---------------|--------------|
| **SELECT** | ✅ | ✅ |
| **INSERT** | ✅ | ✅ |
| **UPDATE** | ✅ | ✅ |
| **DELETE** | ✅ | ✅ |

**Functions:**
- `update_notification_preferences(...)` - تحديث التفضيلات
- `get_user_notification_preferences()` - الحصول على التفضيلات

---

### 11. `messages` - الرسائل

**الأعمدة:** `id`, `from_user_id`, `from_name`, `from_email`, `subject`, `message`, `is_read`, `is_starred`, `is_archived`, `is_replied`, `reply_text`, `replied_at`, `replied_by`

| العملية | الجميع | المستخدم نفسه | المدير |
|---------|--------|---------------|--------|
| **SELECT** | ❌ | ✅ رسائله | ✅ الكل |
| **INSERT** | ✅ (أي حد) | ✅ | ✅ |
| **UPDATE** | ❌ | ❌ | ✅ |
| **DELETE** | ❌ | ❌ | ✅ |

**Functions:**
- `get_unread_messages_count()` - عدد الرسائل غير المقروءة

---

### 12. `site_settings` - إعدادات الموقع

**الأعمدة:** `id`, `key`, `value` (JSONB), `description`, `updated_by`

| العملية | الجميع | المدير |
|---------|--------|--------|
| **SELECT** | ✅ | ✅ |
| **INSERT** | ❌ | ✅ |
| **UPDATE** | ❌ | ✅ |
| **DELETE** | ❌ | ✅ |

**Functions:**
- `get_site_setting(key)` - الحصول على إعداد
- `set_site_setting(key, value, user_id)` - تعديل إعداد

---

### 13. `support_chats` - محادثات الدعم

**الأعمدة:** `id`, `user_id`, `user_name`, `user_email`, `status`

| العملية | الجميع | المستخدم نفسه | المدير |
|---------|--------|---------------|--------|
| **SELECT** | ❌ | ✅ محادثاته | ✅ الكل |
| **INSERT** | ✅ (أي حد) | ✅ | ✅ |
| **UPDATE** | ❌ | ✅ محادثاته | ✅ |
| **DELETE** | ❌ | ❌ | ✅ |

---

### 14. `chat_messages` - رسائل الدردشة

**الأعمدة:** `id`, `chat_id`, `sender_type`, `sender_id`, `message`, `is_ai_response`

| العملية | المشاركون بالمحادثة | المدير |
|---------|---------------------|--------|
| **SELECT** | ✅ | ✅ |
| **INSERT** | ✅ | ✅ |
| **UPDATE** | ❌ | ❌ |
| **DELETE** | ❌ | ✅ |

**Triggers:**
- `trigger_update_chat_on_message` - تحديث `updated_at` للمحادثة

---

### 15. `teacher_subscriptions` - اشتراكات المعلمين

**الأعمدة:** `id`, `user_id`, `teacher_id`, `notifications_enabled`

| العملية | المستخدم نفسه | المعلم (المتابَع) | المدير |
|---------|---------------|-------------------|--------|
| **SELECT** | ✅ اشتراكاته | ✅ متابعيه | ✅ الكل |
| **INSERT** | ✅ | ❌ | ✅ |
| **UPDATE** | ✅ | ❌ | ✅ |
| **DELETE** | ✅ | ❌ | ✅ |

**Constraints:**
- `UNIQUE (user_id, teacher_id)` - لا يمكن الاشتراك مرتين
- `CHECK (user_id != teacher_id)` - لا يمكن متابعة النفس

**Triggers:**
- `trigger_increment_subscribers` - زيادة `subscriber_count`
- `trigger_decrement_subscribers` - إنقاص `subscriber_count`

**Functions:**
- `is_subscribed_to_teacher(user_id, teacher_id)` - التحقق من المتابعة

---

### 16. `teacher_ratings` - تقييمات المعلمين

**الأعمدة:** `id`, `teacher_id`, `user_id`, `rating` (1-5), `review`

| العملية | الجميع | المستخدم نفسه | المدير |
|---------|--------|---------------|--------|
| **SELECT** | ✅ | ✅ | ✅ |
| **INSERT** | ❌ | ✅ | ✅ |
| **UPDATE** | ❌ | ✅ تقييمه | ✅ |
| **DELETE** | ❌ | ✅ تقييمه | ✅ |

**Constraints:**
- `UNIQUE (teacher_id, user_id)` - تقييم واحد لكل مستخدم
- `CHECK (teacher_id != user_id)` - لا يمكن تقييم النفس
- `CHECK (rating >= 1 AND rating <= 5)` - التقييم من 1 لـ 5

**Triggers:**
- `trigger_update_rating_on_insert/update/delete` - تحديث `rating_average` و `rating_count`

---

### 17. `exam_templates` - قوالب الامتحانات

**الأعمدة:** `id`, `title` (JSONB), `description` (JSONB), `language`, `subject_id`, `stage_id`, `subject_name`, `grade`, `duration_minutes`, `is_published`, `settings` (JSONB), `questions_count`, `total_points`, `attempts_count`, `average_score`, `created_by`

| العملية | الجميع | المنشئ | المعلم | المدير |
|---------|--------|--------|--------|--------|
| **SELECT** | ✅ المنشورة | ✅ قوالبه | - | ✅ |
| **INSERT** | ❌ | - | ✅ | ✅ |
| **UPDATE** | ❌ | ✅ | - | ✅ |
| **DELETE** | ❌ | ✅ | - | ✅ |

---

### 18. `template_questions` - أسئلة القوالب

**الأعمدة:** `id`, `template_id`, `text` (JSONB), `type`, `options` (JSONB), `correct_option_id`, `correct_answer` (JSONB), `points`, `order_index`, `media` (JSONB), `hint` (JSONB), `explanation` (JSONB)

| العملية | الجميع | منشئ القالب | المدير |
|---------|--------|-------------|--------|
| **SELECT** | ✅ للقوالب المنشورة | ✅ | ✅ |
| **INSERT** | ❌ | ✅ | ✅ |
| **UPDATE** | ❌ | ✅ | ✅ |
| **DELETE** | ❌ | ✅ | ✅ |

**Triggers:**
- `trigger_template_stats_insert` - تحديث `questions_count` و `total_points`
- `trigger_template_stats_delete` - تحديث عند الحذف

---

### 19. `exam_attempts` - محاولات الامتحانات

**الأعمدة:** `id`, `template_id`, `student_id`, `status`, `started_at`, `submitted_at`, `graded_at`, `expires_at`, `answers` (JSONB), `score`, `total_points`, `percentage`, `passed`, `time_spent_seconds`, `questions_answered`, `question_results` (JSONB)

| العملية | الطالب نفسه | منشئ القالب | المدير |
|---------|-------------|-------------|--------|
| **SELECT** | ✅ محاولاته | ✅ | ✅ |
| **INSERT** | ✅ | ❌ | ✅ |
| **UPDATE** | ✅ محاولاته | ✅ | ✅ |
| **DELETE** | ❌ | ❌ | ❌ |

**Triggers:**
- `trigger_update_template_attempt_stats` - تحديث `attempts_count` و `average_score`

---

### 20. `comprehensive_exams` - الامتحانات الشاملة

**الأعمدة:** `id`, `type`, `language`, `usage_scope`, `lesson_id`, `exam_title`, `exam_description`, `total_marks`, `duration_minutes`, `passing_score`, `grading_mode`, `branch_tags[]`, `blocks` (JSONB), `sections` (JSONB), `is_published`, `stage_id`, `subject_id`, `subject_name`, `stage_name`, `created_by`

| العملية | الجميع | المنشئ | المعلم | المدير |
|---------|--------|--------|--------|--------|
| **SELECT** | ✅ المنشورة | ✅ | - | ✅ |
| **INSERT** | ❌ | - | ✅ | ✅ |
| **UPDATE** | ❌ | ✅ | - | ✅ |
| **DELETE** | ❌ | ✅ | - | ✅ |

---

### 21. `comprehensive_exam_attempts` - محاولات الامتحانات الشاملة

**الأعمدة:** `id`, `exam_id`, `student_id`, `started_at`, `completed_at`, `answers` (JSONB), `total_score`, `max_score`, `status`

| العملية | الطالب نفسه | منشئ الامتحان | المدير |
|---------|-------------|---------------|--------|
| **SELECT** | ✅ محاولاته | ✅ | ✅ |
| **INSERT** | ✅ | ❌ | ✅ |
| **UPDATE** | ✅ محاولاته | ✅ | ✅ |
| **DELETE** | ❌ | ❌ | ❌ |

---

### 22. `user_lesson_progress` - تقدم المستخدم في الدروس

**الأعمدة:** `id`, `user_id`, `lesson_id`, `is_completed`, `progress_percentage`, `last_accessed_at`, `completed_at`

| العملية | الطالب نفسه | المعلم | المدير |
|---------|-------------|--------|--------|
| **SELECT** | ✅ تقدمه | ✅ الكل | ✅ |
| **INSERT** | ✅ | ❌ | ✅ |
| **UPDATE** | ✅ تقدمه | ❌ | ✅ |
| **DELETE** | ❌ | ❌ | ❌ |

**Constraints:**
- `UNIQUE (user_id, lesson_id)` - تقدم واحد لكل درس

**Functions:**
- `get_subject_progress(user_id, subject_id)` - تقدم المستخدم في مادة

---

### 23. `user_devices` - أجهزة المستخدمين

**الأعمدة:** `id`, `user_id`, `device_type`, `os_name`, `os_version`, `browser`, `browser_version`, `ip_address`, `country`, `city`, `user_agent`, `first_seen_at`, `last_seen_at`, `login_count`, `is_current_device`

| العملية | المستخدم نفسه | المدير | Service Role |
|---------|---------------|--------|--------------|
| **SELECT** | ✅ أجهزته | ✅ الكل | ✅ |
| **INSERT** | ❌ (via function) | - | ✅ |
| **UPDATE** | ❌ (via function) | - | ✅ |
| **DELETE** | ❌ | - | ✅ |

**Functions:**
- `upsert_user_device(...)` - إضافة/تحديث جهاز

---

### 24. `visitor_devices` - أجهزة الزوار (بدون login)

**الأعمدة:** `id`, `visitor_id`, `device_type`, `os_name`, `os_version`, `browser`, `browser_version`, `ip_address`, `country`, `city`, `user_agent`, `page_url`, `referrer`, `first_seen_at`, `last_seen_at`, `visit_count`

| العملية | الجميع | المدير |
|---------|--------|--------|
| **SELECT** | ❌ | ✅ |
| **INSERT** | ✅ | ✅ |
| **UPDATE** | ❌ | ✅ |
| **DELETE** | ❌ | ✅ |

**Functions:**
- `upsert_visitor_device(...)` - إضافة/تحديث زائر

---

## 💾 Storage Buckets - التخزين

### Buckets المتاحة

| اسم الـ Bucket | عام | الحجم الأقصى | أنواع الملفات |
|----------------|-----|-------------|---------------|
| `avatars` | ✅ | 5 MB | image/jpeg, image/png, image/gif, image/webp |
| `covers` | ✅ | 10 MB | image/jpeg, image/png, image/gif, image/webp |
| `lessons` | ✅ | 100 MB | صور، video/mp4, video/webm, application/pdf, audio/mpeg, audio/wav |
| `exams` | ❌ | 50 MB | صور، صوت |
| `chat-attachments` | ❌ | 10 MB | صور، PDF |

### صلاحيات التخزين

#### `avatars` و `covers` - الصور
| العملية | الصلاحية |
|---------|---------|
| **قراءة** | ✅ للجميع |
| **رفع** | ✅ المستخدم في مجلده فقط (folder = user_id) |
| **تعديل** | ✅ المستخدم في مجلده فقط |
| **حذف** | ✅ المستخدم في مجلده فقط |

#### `lessons` - ملفات الدروس
| العملية | الصلاحية |
|---------|---------|
| **قراءة** | ✅ للجميع |
| **رفع** | ✅ معلم أو مدير |
| **تعديل** | ✅ معلم أو مدير |
| **حذف** | ✅ معلم أو مدير |

---

## 🔑 ملخص الصلاحيات حسب الدور

### 👨‍🎓 الطالب (student)
| الإجراء | مسموح |
|---------|--------|
| قراءة المحتوى المنشور | ✅ |
| تعديل ملفه الشخصي | ✅ |
| إضافة نتائج امتحاناته | ✅ |
| متابعة المعلمين | ✅ |
| تقييم المعلمين | ✅ |
| إرسال رسائل | ✅ |
| إرسال محادثات دعم | ✅ |
| تسجيل تقدمه بالدروس | ✅ |
| إدارة تفضيلات الإشعارات | ✅ |
| إنشاء محتوى تعليمي | ❌ |

### 👨‍🏫 المعلم (teacher)
| الإجراء | مسموح |
|---------|--------|
| كل صلاحيات الطالب | ✅ |
| **إنشاء** دروس | ✅ |
| **إنشاء** امتحانات | ✅ |
| **إنشاء** أسئلة | ✅ |
| **إنشاء** قوالب امتحانات | ✅ |
| **إنشاء** امتحانات شاملة | ✅ |
| **تعديل** محتواه | ✅ |
| **حذف** دروسه | ✅ |
| حذف امتحاناته | ❌ ⚠️ |
| حذف أسئلته العامة | ❌ ⚠️ |
| رفع ملفات للدروس | ✅ |
| رؤية نتائج الطلاب | ✅ |
| إدارة المراحل/المواد | ❌ |
| إرسال إشعارات | ❌ |

### 👑 المدير (admin)
| الإجراء | مسموح |
|---------|--------|
| **كل الصلاحيات** | ✅ |
| إدارة المراحل التعليمية | ✅ |
| إدارة المواد الدراسية | ✅ |
| حذف أي محتوى | ✅ |
| إرسال الإشعارات | ✅ |
| الرد على الرسائل | ✅ |
| تعديل إعدادات الموقع | ✅ |
| رؤية كل أجهزة المستخدمين | ✅ |
| رؤية أجهزة الزوار | ✅ |

---

## ⚙️ Triggers الرئيسية

| الجدول | Trigger | الوظيفة |
|--------|---------|---------|
| جميع الجداول | `update_*_updated_at` | تحديث `updated_at` تلقائياً |
| `teacher_subscriptions` | `trigger_increment_subscribers` | زيادة `subscriber_count` عند الاشتراك |
| `teacher_subscriptions` | `trigger_decrement_subscribers` | إنقاص `subscriber_count` عند إلغاء الاشتراك |
| `teacher_ratings` | `trigger_update_rating_on_*` | تحديث `rating_average` و `rating_count` |
| `template_questions` | `trigger_template_stats_insert` | تحديث `questions_count` و `total_points` |
| `template_questions` | `trigger_template_stats_delete` | تحديث عند الحذف |
| `exam_attempts` | `trigger_update_template_attempt_stats` | تحديث `attempts_count` و `average_score` |
| `chat_messages` | `trigger_update_chat_on_message` | تحديث `updated_at` للمحادثة |

---

## 🛡️ Functions المتاحة

### Lessons
| Function | الوصف | نوع الصلاحية |
|----------|-------|-------------|
| `increment_lesson_views(lesson_id)` | زيادة مشاهدات الدرس | SECURITY DEFINER |
| `toggle_lesson_like(lesson_id, increment)` | إعجاب/إلغاء | SECURITY DEFINER |

### Exams
| Function | الوصف | نوع الصلاحية |
|----------|-------|-------------|
| `get_exam_statistics(exam_id)` | إحصائيات الامتحان | SECURITY DEFINER |
| `get_student_rank(exam_id, user_id)` | ترتيب الطالب | SECURITY DEFINER |

### Messages
| Function | الوصف | نوع الصلاحية |
|----------|-------|-------------|
| `get_unread_messages_count()` | عدد الرسائل غير المقروءة | SECURITY DEFINER |

### Site Settings
| Function | الوصف | نوع الصلاحية |
|----------|-------|-------------|
| `get_site_setting(key)` | الحصول على إعداد | SECURITY DEFINER |
| `set_site_setting(key, value, user_id)` | تعديل إعداد | SECURITY DEFINER |

### Subscriptions
| Function | الوصف | نوع الصلاحية |
|----------|-------|-------------|
| `is_subscribed_to_teacher(user_id, teacher_id)` | التحقق من المتابعة | SECURITY DEFINER |

### Notifications
| Function | الوصف | نوع الصلاحية |
|----------|-------|-------------|
| `create_notification(...)` | إنشاء إشعار | SECURITY DEFINER |
| `mark_notification_read(id)` | تحديد كمقروء | SECURITY DEFINER |
| `mark_notifications_read_bulk(ids, mark_all)` | تحديد متعدد | SECURITY DEFINER |
| `get_unread_notification_count()` | عدد غير المقروءة | SECURITY DEFINER |
| `delete_old_notifications(days_old)` | حذف القديمة | SECURITY DEFINER |
| `update_notification_preferences(...)` | تحديث التفضيلات | SECURITY DEFINER |
| `get_user_notification_preferences()` | الحصول على التفضيلات | SECURITY DEFINER |
| `register_device(...)` | تسجيل جهاز للـ push | SECURITY DEFINER |
| `unregister_device(token)` | إلغاء تسجيل جهاز | SECURITY DEFINER |

### Devices
| Function | الوصف | نوع الصلاحية |
|----------|-------|-------------|
| `upsert_user_device(...)` | إضافة/تحديث جهاز مستخدم | SECURITY DEFINER |
| `upsert_visitor_device(...)` | إضافة/تحديث جهاز زائر | SECURITY DEFINER |

### Progress
| Function | الوصف | نوع الصلاحية |
|----------|-------|-------------|
| `get_subject_progress(user_id, subject_id)` | تقدم المستخدم في مادة | SECURITY DEFINER |

### Utility Functions (00025)
| Function | الوصف | نوع الصلاحية |
|----------|-------|-------------|
| `get_dashboard_stats()` | إحصائيات لوحة التحكم (طلاب، معلمين، دروس، امتحانات) | SECURITY DEFINER |
| `search_content(query, limit)` | البحث العام في الدروس والامتحانات والمعلمين | SECURITY DEFINER |
| `cleanup_old_data()` | تنظيف البيانات القديمة (محادثات، رسائل) | SECURITY DEFINER |
| `get_featured_teachers(limit)` | المعلمين المميزين | SECURITY DEFINER |
| `process_scheduled_notifications()` | معالجة الإشعارات المجدولة | SECURITY DEFINER |

---

## 📊 Views المتاحة (00026)

> ⚠️ **ملاحظة:** معظم الـ Views تم حذفها في migration 00033

### Views المتبقية
| View | الوصف |
|------|-------|
| `v_user_notifications` | إشعارات المستخدم مع `time_ago` |

### Views المحذوفة (كانت موجودة)
| View | الوصف |
|------|-------|
| `teacher_stats` | إحصائيات المعلمين (دروس، قوالب، مشاهدات) |
| `subject_stats` | إحصائيات المواد (دروس، امتحانات) |
| `recent_lessons` | أحدث الدروس المنشورة |
| `exam_results_detailed` | نتائج الاختبارات مع التفاصيل |
| `student_progress_overview` | نظرة عامة على تقدم الطلاب |

---

## 🌱 البيانات الأولية (Seed Data)

### المراحل التعليمية (educational_stages)
| الصف | الـ Slug |
|------|----------|
| الصف الأول الإعدادي | `grade-7` |
| الصف الثاني الإعدادي | `grade-8` |
| الصف الثالث الإعدادي | `grade-9` |
| الصف الأول الثانوي | `grade-10` |
| الصف الثاني الثانوي | `grade-11` |
| الصف الثالث الثانوي | `grade-12` |

### المواد الدراسية (subjects)
| المادة | الـ Slug |
|--------|----------|
| اللغة العربية | `arabic` |
| الرياضيات | `math` |
| اللغة الإنجليزية | `english` |
| العلوم | `science` |
| الدراسات الاجتماعية | `social-studies` |
| الفيزياء | `physics` |
| الكيمياء | `chemistry` |
| الأحياء | `biology` |
| الجغرافيا | `geography` |
| التاريخ | `history` |
| الفلسفة والمنطق | `philosophy` |
| علم النفس والاجتماع | `psychology` |
| الحاسب الآلي | `computer` |
| اللغة الفرنسية | `french` |
| اللغة الإيطالية | `italian` |
| اللغة الألمانية | `german` |

### دروس اللغة العربية (لكل مرحلة)
- النحو
- القراءة
- النصوص
- القصة
- الأدب
- البلاغة
- التعبير

### دروس اللغة الإنجليزية (لكل مرحلة)
- Vocabulary and Structure
- Reading Comprehension
- Story (Literature)
- Reading Passage
- Translation
- Critical Thinking Questions
- Writing

---

## 🔄 تاريخ التعديلات على الـ Schema

| Migration | الوصف |
|-----------|-------|
| 00028 | تحديث المراحل التعليمية لتكون بالتفصيل (صف بصف) |
| 00029 | جعل `dzggghjg@gmail.com` admin |
| 00030 | إزالة العلاقة بين المراحل والمواد (stage_id optional) |
| 00031 | إضافة اللغة الفرنسية، الإيطالية، الألمانية |
| 00032 | تنظيف البيانات المتكررة |
| 00033 | حذف Views غير المستخدمة |
| 00034 | حذف عمود stage_id من subjects نهائياً |
| 00035 | إضافة stage_id للدروس (lessons) |
| 00036 | إضافة دروس اللغة العربية لكل المراحل |
| 00037 | إضافة educational_stage_id للملفات الشخصية |
| 00038 | إضافة دروس اللغة الإنجليزية لكل المراحل |
| 00039 | إنشاء جدول أجهزة المستخدمين |
| 00040 | إنشاء جدول أجهزة الزوار |
| 20251220050210 | نظام الإشعارات الجديد الشامل |
| 20251220064500 | إصلاح صلاحيات الاشتراك (RLS) |

---

## 🔒 ملاحظات أمنية مهمة

1. **كل الجداول عليها RLS مُفعّل** - لا يمكن الوصول بدون صلاحيات
2. **SECURITY DEFINER** - الـ functions تعمل بصلاحيات صاحبها (postgres)
3. **Service Role** - بعض العمليات تتطلب service role key (الـ backend فقط)
4. **Constraints**:
   - لا يمكن للمستخدم متابعة نفسه
   - لا يمكن للمستخدم تقييم نفسه
   - لا يمكن الاشتراك مرتين لنفس المعلم
   - التقييم من 1 لـ 5 فقط
5. **ON DELETE CASCADE** - الحذف المتتالي مُفعّل للعلاقات
6. **ON DELETE SET NULL** - بعض العلاقات تحتفظ بالبيانات عند حذف المرجع
7. **ON DELETE RESTRICT** - بعض العلاقات تمنع الحذف (مثل `exam_templates.created_by`)

---

## � إحصائيات الـ Schema

| العنصر | العدد |
|--------|-------|
| **الجداول** | 25 |
| **الـ ENUMs** | 14 |
| **الـ Functions** | 30+ |
| **الـ Triggers** | 15+ |
| **الـ Storage Buckets** | 5 |
| **ملفات الـ Migrations** | 44 |
| **المراحل التعليمية** | 6 |
| **المواد الدراسية** | 16 |

---

*تم إنشاء هذا التوثيق تلقائياً من تحليل **كل** ملفات الـ migrations*
*آخر تحديث: 2025-12-20*

