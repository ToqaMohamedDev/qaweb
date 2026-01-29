# الفهارس - Indexes

## فهارس الأساسية (Primary Keys)

كل جدول لديه فهرس أساسي على عمود `id`.

---

## فهارس مهمة

### profiles
| الفهرس | الأعمدة | النوع |
|--------|---------|-------|
| profiles_pkey | id | PRIMARY KEY |
| profiles_email_key | email | UNIQUE |

### comprehensive_exams
| الفهرس | الأعمدة | النوع |
|--------|---------|-------|
| comprehensive_exams_pkey | id | PRIMARY KEY |
| idx_comp_exams_stage | stage_id | INDEX |
| idx_comp_exams_published | is_published | INDEX |

### comprehensive_exam_attempts
| الفهرس | الأعمدة | النوع |
|--------|---------|-------|
| comprehensive_exam_attempts_pkey | id | PRIMARY KEY |
| idx_comp_attempts_exam | exam_id | INDEX |
| idx_comp_attempts_student | student_id | INDEX |
| idx_comp_attempts_exam_student | (exam_id, student_id) | INDEX |

### teacher_exams
| الفهرس | الأعمدة | النوع |
|--------|---------|-------|
| teacher_exams_pkey | id | PRIMARY KEY |
| idx_teacher_exams_created_by | created_by | INDEX |
| idx_teacher_exams_stage | stage_id | INDEX |
| idx_teacher_exams_published | is_published | INDEX |

### teacher_exam_attempts
| الفهرس | الأعمدة | النوع |
|--------|---------|-------|
| teacher_exam_attempts_pkey | id | PRIMARY KEY |
| idx_teacher_attempts_exam | exam_id | INDEX |
| idx_teacher_attempts_student | student_id | INDEX |

### question_banks
| الفهرس | الأعمدة | النوع |
|--------|---------|-------|
| question_banks_pkey | id | PRIMARY KEY |
| idx_qbanks_lesson | lesson_id | INDEX |
| idx_qbanks_stage | stage_id | INDEX |

### question_bank_attempts
| الفهرس | الأعمدة | النوع |
|--------|---------|-------|
| question_bank_attempts_pkey | id | PRIMARY KEY |
| idx_qbank_attempts_bank_student | (question_bank_id, student_id) | UNIQUE |

### lessons
| الفهرس | الأعمدة | النوع |
|--------|---------|-------|
| lessons_pkey | id | PRIMARY KEY |
| idx_lessons_subject | subject_id | INDEX |
| idx_lessons_stage | stage_id | INDEX |
| idx_lessons_published | is_published | INDEX |

### user_lesson_progress
| الفهرس | الأعمدة | النوع |
|--------|---------|-------|
| user_lesson_progress_pkey | id | PRIMARY KEY |
| idx_progress_user_lesson | (user_id, lesson_id) | UNIQUE |

### translation_cache
| الفهرس | الأعمدة | النوع |
|--------|---------|-------|
| translation_cache_pkey | id | PRIMARY KEY |
| idx_translation_lookup | (source_text, source_lang, target_lang) | INDEX |

---

## توصيات للفهارس الإضافية

```sql
-- فهرس للبحث السريع في الامتحانات حسب المرحلة والنشر
CREATE INDEX idx_comp_exams_stage_published 
ON comprehensive_exams(stage_id, is_published) 
WHERE is_published = true;

-- فهرس للبحث في محاولات الطالب
CREATE INDEX idx_comp_attempts_student_status 
ON comprehensive_exam_attempts(student_id, status);

-- فهرس للبحث في امتحانات المعلم
CREATE INDEX idx_teacher_exams_creator_published 
ON teacher_exams(created_by, is_published);
```

---

## ملاحظات

1. **الفهارس الجزئية (Partial Indexes)**: يُفضل استخدامها للجداول الكبيرة
2. **فهارس JSONB**: يمكن إضافة فهارس GIN للبحث في JSONB
3. **الصيانة**: يجب مراقبة حجم الفهارس وإعادة بنائها دورياً
