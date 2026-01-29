# سياسات الأمان - Security & RLS

## نظرة عامة

جميع الجداول لديها Row Level Security (RLS) مفعّل.

## حالة الأمان لكل جدول

| الجدول | RLS | عدد السياسات | الحالة |
|--------|-----|-------------|--------|
| app_settings | ✅ | 3 | ✅ آمن |
| chat_messages | ✅ | 4 | ✅ آمن |
| comprehensive_exam_attempts | ✅ | 10 | ✅ آمن |
| comprehensive_exams | ✅ | 9 | ✅ آمن |
| educational_stages | ✅ | 2 | ✅ آمن |
| lessons | ✅ | 2 | ✅ آمن |
| messages | ✅ | 2 | ✅ آمن |
| notification_preferences | ✅ | 1 | ✅ آمن |
| notifications | ✅ | 12 | ✅ آمن |
| page_words | ✅ | 2 | ✅ آمن |
| profiles | ✅ | 6 | ✅ آمن |
| question_bank_attempts | ✅ | 4 | ✅ آمن |
| question_banks | ✅ | 4 | ✅ آمن |
| quiz_questions | ✅ | 6 | ✅ آمن |
| site_settings | ✅ | 6 | ✅ آمن |
| subject_stages | ✅ | 4 | ✅ آمن |
| subjects | ✅ | 2 | ✅ آمن |
| support_chats | ✅ | 4 | ✅ آمن |
| supported_languages | ✅ | 2 | ✅ آمن |
| teacher_exam_attempts | ✅ | 13 | ✅ آمن |
| teacher_exams | ✅ | 3 | ✅ آمن |
| teacher_ratings | ✅ | 4 | ✅ آمن |
| teacher_subscriptions | ✅ | 3 | ✅ آمن |
| testimonials | ✅ | 12 | ✅ آمن |
| translation_cache | ✅ | 2 | ✅ آمن |
| user_devices | ✅ | 3 | ✅ آمن |
| user_lesson_likes | ✅ | 4 | ✅ آمن |
| user_lesson_progress | ✅ | 1 | ✅ آمن |
| user_word_highlights | ✅ | 3 | ✅ آمن |
| visitor_devices | ✅ | 1 | ✅ آمن |
| word_bank | ✅ | 2 | ✅ آمن |
| word_bank_translations | ✅ | 2 | ✅ آمن |
| word_categories | ✅ | 2 | ✅ آمن |

---

## أنماط السياسات الشائعة

### قراءة عامة
```sql
-- السماح للجميع بقراءة الجداول العامة
CREATE POLICY "Allow public read" ON table_name
FOR SELECT USING (true);
```

### قراءة للمستخدم فقط
```sql
-- السماح للمستخدم بقراءة بياناته فقط
CREATE POLICY "Users can view own data" ON table_name
FOR SELECT USING (auth.uid() = user_id);
```

### كتابة للمستخدم
```sql
-- السماح للمستخدم بتعديل بياناته فقط
CREATE POLICY "Users can update own data" ON table_name
FOR UPDATE USING (auth.uid() = user_id);
```

### صلاحيات المعلم
```sql
-- السماح للمعلم بإدارة امتحاناته
CREATE POLICY "Teachers can manage own exams" ON teacher_exams
FOR ALL USING (auth.uid() = created_by);
```

### صلاحيات المشرف
```sql
-- السماح للمشرفين بكل شيء
CREATE POLICY "Admins full access" ON table_name
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

---

## ملاحظات أمنية

1. **SECURITY DEFINER**: الدوال الحساسة تستخدم `SECURITY DEFINER` للتشغيل بصلاحيات المالك
2. **search_path**: مضبوط على `public` لمنع هجمات path injection
3. **RLS مفعّل**: على جميع الجداول بدون استثناء
4. **لا يوجد public access**: لا توجد جداول متاحة للعامة بدون قيود
