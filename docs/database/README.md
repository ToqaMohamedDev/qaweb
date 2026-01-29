# تحليل قاعدة البيانات - Database Analysis

هذا المجلد يحتوي على تحليل شامل لقاعدة بيانات المشروع.

## الملفات

| الملف | الوصف |
|-------|-------|
| [01_TABLES.md](./01_TABLES.md) | جداول قاعدة البيانات ومعلومات التخزين |
| [02_ENUMS.md](./02_ENUMS.md) | أنواع البيانات المخصصة (Enums) |
| [03_COLUMNS.md](./03_COLUMNS.md) | أعمدة الجداول وأنواع البيانات |
| [04_FUNCTIONS.md](./04_FUNCTIONS.md) | الدوال المخزنة (Stored Functions) |
| [05_TRIGGERS.md](./05_TRIGGERS.md) | المحفزات (Triggers) |
| [06_INDEXES.md](./06_INDEXES.md) | الفهارس (Indexes) |
| [07_SECURITY.md](./07_SECURITY.md) | سياسات الأمان (RLS) والصلاحيات |
| [08_RELATIONSHIPS.md](./08_RELATIONSHIPS.md) | العلاقات بين الجداول |

## الجداول الرئيسية

### جداول المستخدمين
- **profiles** - بيانات المستخدمين (طلاب، معلمين، مشرفين)
- **user_devices** - أجهزة المستخدمين
- **user_lesson_progress** - تقدم الطلاب في الدروس
- **user_word_highlights** - الكلمات المحددة

### جداول المحتوى التعليمي
- **educational_stages** - المراحل الدراسية
- **subjects** - المواد الدراسية
- **lessons** - الدروس
- **question_banks** - بنوك الأسئلة
- **quiz_questions** - أسئلة الكويز

### جداول الامتحانات
- **comprehensive_exams** - امتحانات الموقع الشاملة
- **comprehensive_exam_attempts** - محاولات امتحانات الموقع
- **teacher_exams** - امتحانات المدرسين
- **teacher_exam_attempts** - محاولات امتحانات المدرسين
- **question_bank_attempts** - محاولات بنك الأسئلة

### جداول أخرى
- **notifications** - الإشعارات
- **support_chats** - محادثات الدعم
- **teacher_subscriptions** - اشتراكات الطلاب مع المعلمين
- **teacher_ratings** - تقييمات المعلمين
- **translation_cache** - ذاكرة التخزين المؤقت للترجمات

## ملاحظات مهمة

1. **RLS مفعّل** على جميع الجداول للحماية
2. **الدوال الرئيسية** للإجابات والامتحانات موجودة في `04_FUNCTIONS.md`
3. **العلاقات** بين الجداول موضحة في `08_RELATIONSHIPS.md`

---
*تم إنشاء هذا التحليل من ملف `database_xray_output.json`*
