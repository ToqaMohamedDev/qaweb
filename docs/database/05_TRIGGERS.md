# المحفزات - Triggers

## محفزات الامتحانات

### trg_prevent_published_exam_edit
```sql
الجدول: comprehensive_exams
الحدث: UPDATE (BEFORE)
الوظيفة: prevent_published_question_edit()
الوصف: منع تعديل الامتحانات المنشورة
```

---

### trg_prevent_published_teacher_exam_edit
```sql
الجدول: teacher_exams
الحدث: UPDATE (BEFORE)
الوظيفة: prevent_published_question_edit()
الوصف: منع تعديل امتحانات المدرسين المنشورة
```

---

### update_comp_exam_count_on_insert
```sql
الجدول: comprehensive_exams
الحدث: INSERT (AFTER)
الوظيفة: increment_exam_count()
الوصف: زيادة عدد امتحانات المعلم عند الإضافة
```

---

### update_comp_exam_count_on_delete
```sql
الجدول: comprehensive_exams
الحدث: DELETE (AFTER)
الوظيفة: decrement_exam_count()
الوصف: تقليل عدد امتحانات المعلم عند الحذف
```

---

### update_exam_count_on_insert
```sql
الجدول: teacher_exams
الحدث: INSERT (AFTER)
الوظيفة: increment_exam_count()
الوصف: زيادة عدد امتحانات المعلم
```

---

### update_exam_count_on_delete
```sql
الجدول: teacher_exams
الحدث: DELETE (AFTER)
الوظيفة: decrement_exam_count()
الوصف: تقليل عدد امتحانات المعلم
```

---

## محفزات بنوك الأسئلة

### trg_prevent_published_question_edit
```sql
الجدول: question_banks
الحدث: UPDATE (BEFORE)
الوظيفة: prevent_published_question_edit()
الوصف: منع تعديل بنوك الأسئلة المنشورة
```

---

### trigger_insert_question_banks_stats
```sql
الجدول: question_banks
الحدث: INSERT (BEFORE)
الوظيفة: update_question_banks_updated_at()
```

---

### trigger_update_question_banks_updated_at
```sql
الجدول: question_banks
الحدث: UPDATE (BEFORE)
الوظيفة: update_question_banks_updated_at()
```

---

### trg_question_bank_attempts_updated_at
```sql
الجدول: question_bank_attempts
الحدث: UPDATE (BEFORE)
الوظيفة: update_updated_at_column()
```

---

## محفزات المشتركين

### update_subscriber_count_on_insert
```sql
الجدول: teacher_subscriptions
الحدث: INSERT (AFTER)
الوظيفة: increment_subscriber_count()
الوصف: زيادة عدد المشتركين للمعلم
```

---

### update_subscriber_count_on_delete
```sql
الجدول: teacher_subscriptions
الحدث: DELETE (AFTER)
الوظيفة: decrement_subscriber_count()
الوصف: تقليل عدد المشتركين للمعلم
```

---

## محفزات البروفايل

### prevent_role_update
```sql
الجدول: profiles
الحدث: UPDATE (BEFORE)
الوظيفة: prevent_role_change()
الوصف: منع تغيير دور المستخدم
```

---

## محفزات الطوابع الزمنية

### tr_page_words_timestamp
```sql
الجدول: page_words
الحدث: UPDATE (BEFORE)
الوظيفة: update_timestamp_column()
```

---

### tr_supported_languages_timestamp
```sql
الجدول: supported_languages
الحدث: UPDATE (BEFORE)
الوظيفة: update_timestamp_column()
```

---

### tr_user_highlights_timestamp
```sql
الجدول: user_word_highlights
الحدث: UPDATE (BEFORE)
الوظيفة: update_timestamp_column()
```

---

### tr_word_bank_timestamp
```sql
الجدول: word_bank
الحدث: UPDATE (BEFORE)
الوظيفة: update_timestamp_column()
```

---

### testimonials_updated_at
```sql
الجدول: testimonials
الحدث: UPDATE (BEFORE)
الوظيفة: update_testimonials_updated_at()
```
