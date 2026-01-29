# الدوال المخزنة - Stored Functions

## دوال الامتحانات والإجابات

### get_or_create_question_bank_attempt
```sql
الوصف: جلب أو إنشاء محاولة بنك أسئلة للطالب
المعاملات: p_question_bank_id UUID
الإرجاع: JSONB
```

**الوظيفة:**
- التحقق من تسجيل الدخول
- جلب بيانات بنك الأسئلة
- إنشاء محاولة جديدة أو جلب المحاولة الحالية
- إرجاع بيانات المحاولة

---

### get_student_exam_attempts
```sql
الوصف: جلب جميع محاولات الامتحانات للطالب
المعاملات: p_student_id UUID (اختياري)
الإرجاع: JSONB
```

**الإرجاع:**
```json
{
  "comprehensive_exams": [...],
  "teacher_exams": [...]
}
```

---

### get_student_question_bank_progress
```sql
الوصف: جلب تقدم الطالب في بنوك الأسئلة
المعاملات: p_student_id UUID (اختياري)
الإرجاع: TABLE
```

---

### upsert_question_bank_answer
```sql
الوصف: حفظ إجابة سؤال في بنك الأسئلة
المعاملات:
  - p_question_bank_id UUID
  - p_question_id TEXT
  - p_answer JSONB
  - p_time_spent_seconds INTEGER
  - p_flagged BOOLEAN
الإرجاع: JSONB
```

---

### upsert_teacher_exam_answer
```sql
الوصف: حفظ إجابة سؤال في امتحان المعلم
المعاملات:
  - p_exam_id UUID
  - p_question_id TEXT
  - p_answer JSONB
  - p_time_spent_seconds INTEGER
  - p_flagged BOOLEAN
الإرجاع: JSONB
```

---

### upsert_comprehensive_exam_answer
```sql
الوصف: حفظ إجابة سؤال في امتحان الموقع
المعاملات:
  - p_exam_id UUID
  - p_question_id TEXT
  - p_answer JSONB
  - p_time_spent_seconds INTEGER
  - p_flagged BOOLEAN
الإرجاع: JSONB
```

---

### submit_question_bank_attempt
```sql
الوصف: تسليم محاولة بنك الأسئلة
المعاملات: p_attempt_id UUID
الإرجاع: JSONB {total_score, max_score, percentage}
```

---

### submit_teacher_exam_attempt
```sql
الوصف: تسليم امتحان المعلم
المعاملات: p_attempt_id UUID
الإرجاع: JSONB
```

---

### submit_comprehensive_exam_attempt
```sql
الوصف: تسليم امتحان الموقع
المعاملات: p_attempt_id UUID
الإرجاع: JSONB
```

---

### grade_essay_answer
```sql
الوصف: تصحيح إجابة مقالية يدوياً
المعاملات:
  - p_attempt_id UUID
  - p_question_id TEXT
  - p_points_earned NUMERIC
  - p_comment TEXT
الإرجاع: JSONB
```

---

### get_teacher_exam_results
```sql
الوصف: جلب نتائج امتحان المعلم
المعاملات: p_exam_id UUID
الإرجاع: TABLE
```

---

## دوال المعلمين

### increment_exam_count
```sql
الوصف: زيادة عدد امتحانات المعلم عند إضافة امتحان
النوع: TRIGGER
```

---

### decrement_exam_count
```sql
الوصف: تقليل عدد امتحانات المعلم عند حذف امتحان
النوع: TRIGGER
```

---

### increment_subscriber_count
```sql
الوصف: زيادة عدد مشتركي المعلم
النوع: TRIGGER
```

---

### decrement_subscriber_count
```sql
الوصف: تقليل عدد مشتركي المعلم
النوع: TRIGGER
```

---

## دوال الترجمة

### get_cached_translation
```sql
الوصف: جلب ترجمة من الذاكرة المؤقتة
المعاملات:
  - p_source_text TEXT
  - p_source_lang VARCHAR
  - p_target_lang VARCHAR
الإرجاع: TEXT
```

---

### cleanup_translation_cache
```sql
الوصف: حذف الترجمات القديمة (أكثر من 30 يوم)
الإرجاع: INTEGER (عدد المحذوف)
```

---

## دوال الكلمات

### get_page_words_with_highlights_v2
```sql
الوصف: جلب كلمات الصفحة مع التحديدات
المعاملات:
  - p_user_id UUID
  - p_page_id VARCHAR
  - p_language_code VARCHAR
الإرجاع: TABLE
```

---

## دوال مساعدة

### update_updated_at_column
```sql
الوصف: تحديث عمود updated_at تلقائياً
النوع: TRIGGER
```

---

### update_timestamp_column
```sql
الوصف: تحديث الطابع الزمني تلقائياً
النوع: TRIGGER
```

---

### prevent_published_question_edit
```sql
الوصف: منع تعديل الأسئلة المنشورة
النوع: TRIGGER
```

---

### prevent_role_change
```sql
الوصف: منع تغيير دور المستخدم
النوع: TRIGGER
```
