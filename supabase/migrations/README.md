# Supabase Migrations

## 📋 نظرة عامة

هذا المجلد يحتوي على جميع ملفات الـ SQL migrations الخاصة بقاعدة بيانات المشروع.

## 📁 هيكل الملفات

```
supabase/migrations/
├── 00001_create_extensions.sql         # تفعيل الإضافات (uuid-ossp, pgcrypto, pg_trgm)
├── 00002_create_enums.sql              # أنواع البيانات المخصصة (ENUMs)
├── 00003_create_profiles_table.sql     # جدول المستخدمين/الملفات الشخصية
├── 00004_create_educational_stages_table.sql  # جدول المراحل التعليمية
├── 00005_create_subjects_table.sql     # جدول المواد الدراسية
├── 00006_create_lessons_table.sql      # جدول الدروس
├── 00007_create_lesson_questions_table.sql    # جدول أسئلة الدروس
├── 00008_create_exams_table.sql        # جدول الاختبارات
├── 00009_create_questions_table.sql    # جدول الأسئلة
├── 00010_create_exam_results_table.sql # جدول نتائج الاختبارات
├── 00011_create_notifications_table.sql # جدول الإشعارات
├── 00012_create_messages_table.sql     # جدول الرسائل
├── 00013_create_site_settings_table.sql # جدول إعدادات الموقع
├── 00014_create_support_chats_table.sql # جدول محادثات الدعم
├── 00015_create_chat_messages_table.sql # جدول رسائل المحادثات
├── 00016_create_teacher_subscriptions_table.sql # جدول متابعات المعلمين
├── 00017_create_teacher_ratings_table.sql # جدول تقييمات المعلمين
├── 00018_create_exam_templates_table.sql # جدول قوالب الامتحانات
├── 00019_create_template_questions_table.sql # جدول أسئلة القوالب
├── 00020_create_exam_attempts_table.sql # جدول محاولات الامتحانات
├── 00021_create_comprehensive_exams_table.sql # جدول الامتحانات الشاملة
├── 00022_create_comprehensive_exam_attempts_table.sql # محاولات الامتحانات الشاملة
├── 00023_create_user_lesson_progress_table.sql # جدول تقدم الطلاب
├── 00024_create_storage_buckets.sql    # Storage buckets وسياساتها
├── 00025_create_utility_functions.sql  # Functions مساعدة
├── 00026_create_views.sql              # Views للتقارير
└── 00027_seed_data.sql                 # بيانات تجريبية
```

## 🚀 كيفية التطبيق

### باستخدام Supabase CLI

```bash
# تسجيل الدخول
supabase login

# ربط المشروع
supabase link --project-ref <project-id>

# تطبيق جميع الـ migrations
supabase db push

# أو تطبيق migration محددة
supabase db push --include-all
```

### يدوياً عبر SQL Editor

1. افتح Supabase Dashboard
2. اذهب إلى SQL Editor
3. قم بنسخ ولصق كل ملف بالترتيب
4. نفذ كل ملف على حدة

## 📊 مخطط قاعدة البيانات

### الجداول الرئيسية

| الجدول | الوصف |
|--------|-------|
| `profiles` | الملفات الشخصية (طلاب، معلمين، مدراء) |
| `educational_stages` | المراحل التعليمية |
| `subjects` | المواد الدراسية |
| `lessons` | الدروس |
| `lesson_questions` | أسئلة الدروس |
| `exams` | الاختبارات |
| `questions` | أسئلة الاختبارات |
| `exam_results` | نتائج الاختبارات |
| `exam_templates` | قوالب الامتحانات |
| `template_questions` | أسئلة القوالب |
| `exam_attempts` | محاولات الامتحانات |
| `comprehensive_exams` | الامتحانات الشاملة |
| `comprehensive_exam_attempts` | محاولات الامتحانات الشاملة |
| `notifications` | الإشعارات |
| `messages` | الرسائل |
| `site_settings` | إعدادات الموقع |
| `support_chats` | محادثات الدعم |
| `chat_messages` | رسائل المحادثات |
| `teacher_subscriptions` | متابعات المعلمين |
| `teacher_ratings` | تقييمات المعلمين |
| `user_lesson_progress` | تقدم الطلاب |

### العلاقات الرئيسية

```
profiles (users)
    ├── lessons (created_by)
    ├── exam_templates (created_by)
    ├── teacher_subscriptions (user_id, teacher_id)
    ├── teacher_ratings (user_id, teacher_id)
    ├── exam_results (user_id)
    ├── exam_attempts (student_id)
    └── user_lesson_progress (user_id)

educational_stages
    └── subjects (stage_id)
        ├── lessons (subject_id)
        │   └── lesson_questions (lesson_id)
        └── exams (subject_id)
            └── questions (exam_id)

exam_templates
    ├── template_questions (template_id)
    └── exam_attempts (template_id)

comprehensive_exams
    └── comprehensive_exam_attempts (exam_id)

support_chats
    └── chat_messages (chat_id)
```

## 🔒 الأمان (RLS)

جميع الجداول مُفعّل عليها Row Level Security (RLS) مع السياسات التالية:

- **profiles**: الجميع يمكنهم القراءة، المستخدم يعدل ملفه فقط
- **educational_stages/subjects**: الجميع يقرأ، المدراء يعدلون
- **lessons**: المنشورة للجميع، المنشئ والمدراء يعدلون
- **exams/questions**: المنشورة للجميع، المعلمون والمدراء يعدلون
- **exam_results**: المستخدم يرى نتائجه، المعلمون والمدراء يرون الكل
- **notifications**: حسب الدور المستهدف
- **messages**: المدراء يرون الكل، المرسل يرى رسالته
- **site_settings**: الجميع يقرأ، المدراء يعدلون
- **support_chats/chat_messages**: المشاركون والمدراء

## ⚡ Triggers

- `update_updated_at_column()`: تحديث تلقائي لـ updated_at
- `handle_new_user()`: إنشاء ملف شخصي تلقائي عند التسجيل
- `increment_subscriber_count()`: زيادة عدد المتابعين
- `decrement_subscriber_count()`: إنقاص عدد المتابعين
- `update_teacher_rating_average()`: تحديث متوسط تقييم المعلم
- `update_template_stats_on_*()`: تحديث إحصائيات القالب

## 📝 Functions

- `get_dashboard_stats()`: إحصائيات لوحة التحكم
- `search_content()`: البحث العام
- `get_featured_teachers()`: المعلمون المميزون
- `get_exam_statistics()`: إحصائيات الاختبار
- `get_subject_progress()`: تقدم المستخدم في مادة
- `is_subscribed_to_teacher()`: التحقق من المتابعة
- وغيرها...

## 📦 Storage Buckets

| Bucket | الوصف | الحجم الأقصى |
|--------|-------|-------------|
| `avatars` | صور الملفات الشخصية | 5MB |
| `covers` | صور الغلاف | 10MB |
| `lessons` | ملفات الدروس | 100MB |
| `exams` | ملفات الاختبارات | 50MB |
| `chat-attachments` | مرفقات المحادثات | 10MB |
