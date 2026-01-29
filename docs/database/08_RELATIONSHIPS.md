# العلاقات بين الجداول - Relationships

## رسم بياني للعلاقات

```
profiles (المستخدمين)
    │
    ├──► educational_stages (المرحلة الدراسية)
    │
    ├──► user_lesson_progress (تقدم الدروس)
    │       └──► lessons
    │
    ├──► user_devices (الأجهزة)
    │
    ├──► comprehensive_exam_attempts (محاولات امتحانات الموقع)
    │       └──► comprehensive_exams
    │
    ├──► teacher_exam_attempts (محاولات امتحانات المدرسين)
    │       └──► teacher_exams
    │               └──► profiles (المعلم)
    │
    ├──► question_bank_attempts (محاولات بنك الأسئلة)
    │       └──► question_banks
    │               └──► lessons
    │
    ├──► teacher_subscriptions (الاشتراكات)
    │       └──► profiles (المعلم)
    │
    └──► teacher_ratings (التقييمات)
            └──► profiles (المعلم)


lessons (الدروس)
    │
    ├──► subjects (المادة)
    │       └──► subject_stages (ربط المواد بالمراحل)
    │               └──► educational_stages
    │
    ├──► educational_stages (المرحلة)
    │
    ├──► question_banks (بنوك الأسئلة)
    │
    └──► quiz_questions (أسئلة الكويز)


comprehensive_exams (امتحانات الموقع)
    │
    ├──► educational_stages (المرحلة)
    │
    └──► profiles (المنشئ - admin)


teacher_exams (امتحانات المدرسين)
    │
    ├──► educational_stages (المرحلة)
    │
    └──► profiles (المعلم - created_by)
```

---

## تفاصيل العلاقات

### profiles ↔ educational_stages
```
النوع: Many-to-One
الوصف: كل مستخدم ينتمي لمرحلة دراسية واحدة
العمود: profiles.educational_stage_id → educational_stages.id
```

### lessons ↔ subjects
```
النوع: Many-to-One
الوصف: كل درس ينتمي لمادة واحدة
العمود: lessons.subject_id → subjects.id
```

### lessons ↔ educational_stages
```
النوع: Many-to-One
الوصف: كل درس ينتمي لمرحلة واحدة
العمود: lessons.stage_id → educational_stages.id
```

### subjects ↔ educational_stages (via subject_stages)
```
النوع: Many-to-Many
الوصف: المادة يمكن أن تكون في عدة مراحل
جدول الربط: subject_stages
العمودان: subject_id, stage_id
```

### comprehensive_exam_attempts ↔ comprehensive_exams
```
النوع: Many-to-One
الوصف: كل محاولة تنتمي لامتحان واحد
العمود: comprehensive_exam_attempts.exam_id → comprehensive_exams.id
```

### comprehensive_exam_attempts ↔ profiles
```
النوع: Many-to-One
الوصف: كل محاولة تنتمي لطالب واحد
العمود: comprehensive_exam_attempts.student_id → profiles.id
```

### teacher_exam_attempts ↔ teacher_exams
```
النوع: Many-to-One
الوصف: كل محاولة تنتمي لامتحان واحد
العمود: teacher_exam_attempts.exam_id → teacher_exams.id
```

### teacher_exam_attempts ↔ profiles
```
النوع: Many-to-One
الوصف: كل محاولة تنتمي لطالب واحد
العمود: teacher_exam_attempts.student_id → profiles.id
```

### teacher_exams ↔ profiles
```
النوع: Many-to-One
الوصف: كل امتحان ينشئه معلم واحد
العمود: teacher_exams.created_by → profiles.id
```

### question_bank_attempts ↔ question_banks
```
النوع: Many-to-One
الوصف: كل محاولة تنتمي لبنك واحد
العمود: question_bank_attempts.question_bank_id → question_banks.id
```

### question_bank_attempts ↔ profiles
```
النوع: Many-to-One
الوصف: كل محاولة تنتمي لطالب واحد
العمود: question_bank_attempts.student_id → profiles.id
```

### question_banks ↔ lessons
```
النوع: Many-to-One
الوصف: كل بنك أسئلة ينتمي لدرس واحد
العمود: question_banks.lesson_id → lessons.id
```

### teacher_subscriptions ↔ profiles (user)
```
النوع: Many-to-One
الوصف: كل اشتراك ينتمي لمستخدم (طالب)
العمود: teacher_subscriptions.user_id → profiles.id
```

### teacher_subscriptions ↔ profiles (teacher)
```
النوع: Many-to-One
الوصف: كل اشتراك ينتمي لمعلم
العمود: teacher_subscriptions.teacher_id → profiles.id
```

### user_lesson_progress ↔ profiles
```
النوع: Many-to-One
الوصف: كل تقدم ينتمي لمستخدم
العمود: user_lesson_progress.user_id → profiles.id
```

### user_lesson_progress ↔ lessons
```
النوع: Many-to-One
الوصف: كل تقدم ينتمي لدرس
العمود: user_lesson_progress.lesson_id → lessons.id
```

---

## قيود الفريدة (Unique Constraints)

| الجدول | الأعمدة | الوصف |
|--------|---------|-------|
| question_bank_attempts | (question_bank_id, student_id) | محاولة واحدة لكل طالب لكل بنك |
| user_lesson_progress | (user_id, lesson_id) | تقدم واحد لكل مستخدم لكل درس |
| teacher_subscriptions | (user_id, teacher_id) | اشتراك واحد لكل طالب مع كل معلم |
| user_lesson_likes | (user_id, lesson_id) | إعجاب واحد لكل مستخدم لكل درس |
