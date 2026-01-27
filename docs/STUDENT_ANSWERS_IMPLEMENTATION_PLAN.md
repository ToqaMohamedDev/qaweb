# خطة تنفيذ نظام حفظ إجابات الطلاب
## Student Answers Implementation Plan

> ⚠️ **مستند تخطيطي فقط — لا يتم تنفيذ أي تغييرات أو Migrations قبل اعتمادك النهائي**

---

## 📋 الفهرس

0. [ملخص سريع (What & Why)](#0-ملخص-سريع-what--why)
1. [تحليل الوضع الحالي](#1-تحليل-الوضع-الحالي)
2. [المفهوم الموحد: Attempt](#2-المفهوم-الموحد-attempt)
3. [الجدول الجديد المطلوب](#3-الجدول-الجديد-المطلوب)
4. [تعديلات على الجداول الموجودة](#4-تعديلات-على-الجداول-الموجودة)
5. [هيكل البيانات JSONB](#5-هيكل-البيانات-jsonb)
6. [السيناريوهات التفصيلية](#6-السيناريوهات-التفصيلية)
7. [سياسات RLS](#7-سياسات-rls)
8. [الفهارس المطلوبة](#8-الفهارس-المطلوبة)
9. [API و Functions](#9-api-و-functions)
10. [تغييرات UI](#10-تغييرات-ui)
11. [منطق الحفظ التدريجي](#11-منطق-الحفظ-التدريجي)
12. [التصحيح وحساب الدرجة](#12-التصحيح-وحساب-الدرجة)
13. [التعامل مع تغييرات الأسئلة](#13-التعامل-مع-تغييرات-الأسئلة)
14. [خطة التنفيذ المرحلية](#14-خطة-التنفيذ-المرحلية)
15. [Test Plan](#15-test-plan)
16. [المخاطر المحتملة](#16-المخاطر-المحتملة)
17. [قرارات مثبتة](#17-قرارات-مثبتة)

---

## 0. ملخص سريع (What & Why)

### ما الذي نريد تحقيقه؟

| النوع | الهدف |
|-------|-------|
| **امتحانات الموقع** | الطالب يجاوب جزء → يخرج → يرجع يكمل → بعد التسليم يراجع → النتيجة في بروفايله |
| **امتحانات المدرس** | الطالب يحل → المدرس يرى قائمة الطلاب + درجاتهم + حلولهم → الطالب يرى النتيجة **منفصلة** عن امتحانات الموقع |
| **بنوك الأسئلة** | الطالب يجاوب سؤالين → يرجع يلاقيهم محفوظين ويكمل → النتيجة في بروفايله |

### القاعدة الذهبية

| ✅ نعم | ❌ لا |
|--------|-------|
| صف واحد لكل محاولة (طالب + امتحان/بنك) | صف لكل سؤال |
| الإجابات داخل `answers JSONB` | جدول منفصل للإجابات |
| حقول محسوبة للعرض السريع (counters) | حساب من JSONB كل مرة |
| UNIQUE constraint لمنع التكرار | السماح بمحاولات متعددة بدون تحكم |

---

## 1. تحليل الوضع الحالي

### 1.1 الجداول الموجودة حالياً

| الجدول | الغرض | جدول الإجابات المقابل |
|--------|-------|----------------------|
| `question_banks` | بنوك الأسئلة للدروس | ❌ **لا يوجد** |
| `comprehensive_exams` | امتحانات الموقع الشاملة | ✅ `comprehensive_exam_attempts` |
| `teacher_exams` | امتحانات المدرسين | ✅ `teacher_exam_attempts` |

### 1.2 هيكل `comprehensive_exam_attempts` الحالي

```sql
id                  UUID PRIMARY KEY
exam_id             UUID NOT NULL → comprehensive_exams.id
student_id          UUID NOT NULL → profiles.id
answers             JSONB DEFAULT '{}'
status              TEXT DEFAULT 'in_progress'  -- in_progress, submitted, graded
total_score         INTEGER
max_score           INTEGER
completed_at        TIMESTAMPTZ
updated_at          TIMESTAMPTZ DEFAULT now()
```

### 1.3 هيكل `teacher_exam_attempts` الحالي

```sql
id                  UUID PRIMARY KEY
exam_id             UUID NOT NULL → teacher_exams.id
student_id          UUID NOT NULL → profiles.id
answers             JSONB DEFAULT '{}'
status              TEXT DEFAULT 'in_progress'
total_score         INTEGER
max_score           INTEGER
started_at          TIMESTAMPTZ DEFAULT now()
created_at          TIMESTAMPTZ DEFAULT now()
updated_at          TIMESTAMPTZ DEFAULT now()
```

### 1.4 هيكل `question_banks` الحالي

```sql
id                  UUID PRIMARY KEY
lesson_id           UUID NOT NULL → lessons.id
stage_id            UUID → educational_stages.id
subject_id          UUID → subjects.id
title               JSONB DEFAULT '{"ar": "", "en": ""}'
description         JSONB
content_type        TEXT DEFAULT 'none'  -- none, reading, poetry
questions           JSONB DEFAULT '[]'   -- مصفوفة الأسئلة
total_questions     INTEGER DEFAULT 0
total_points        INTEGER DEFAULT 0
is_published        BOOLEAN DEFAULT false
created_by          UUID → profiles.id
created_at          TIMESTAMPTZ DEFAULT now()
updated_at          TIMESTAMPTZ DEFAULT now()
```

### 1.5 ملاحظة مهمة عن `question_banks`

> ⚠️ **يجب التأكد** أن كل سؤال داخل `questions JSONB[]` له `id` ثابت (UUID/String).
> هذا الـ `id` سيُستخدم كمفتاح داخل `answers` في محاولة الطالب.

---

## 2. المفهوم الموحد: Attempt

### 2.1 تعريف الـ Attempt

أي كيان تقييم (بنك أسئلة / امتحان موقع / امتحان مدرس) له:

| المكون | الوصف |
|--------|-------|
| **Source** | محتوى الأسئلة (الامتحان أو البنك) |
| **Attempt Table** | جدول لحفظ إجابات الطالب ودرجاته |
| **Student UI** | للبدء/الاستكمال/التسليم/المراجعة |
| **Admin/Teacher UI** | للمراجعة والتقارير (حسب النوع) |

### 2.2 توحيد حالات Status

```
┌─────────────────┐     تسليم     ┌─────────────────┐     تصحيح     ┌─────────────────┐
│   in_progress   │ ────────────► │    submitted    │ ────────────► │     graded      │
│  (قابل للتعديل) │               │ (لا تعديل)      │               │ (نهائي)         │
└─────────────────┘               └─────────────────┘               └─────────────────┘
```

| الحالة | الوصف | الطالب يعدل؟ |
|--------|-------|--------------|
| `in_progress` | الطالب يحل ويحفظ تدريجياً | ✅ نعم |
| `submitted` | الطالب سلّم - بانتظار تصحيح (لو فيه يدوي) | ❌ لا |
| `graded` | اكتمل التصحيح النهائي | ❌ لا |

> **لبنوك الأسئلة**: يمكن استخدام `in_progress → completed` فقط إذا لم يكن هناك مفهوم "تسليم رسمي".

---

## 3. الجدول الجديد المطلوب

### 3.1 `question_bank_attempts` - إجابات بنك الأسئلة

```sql
CREATE TABLE question_bank_attempts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- العلاقات الأساسية
    question_bank_id    UUID NOT NULL REFERENCES question_banks(id) ON DELETE CASCADE,
    student_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- بيانات الإجابات (JSONB ذكي)
    answers             JSONB DEFAULT '{}',
    
    -- الإحصائيات المحسوبة
    answered_count      INTEGER DEFAULT 0,        -- عدد الأسئلة المُجابة
    correct_count       INTEGER DEFAULT 0,        -- عدد الإجابات الصحيحة
    total_questions     INTEGER DEFAULT 0,        -- إجمالي الأسئلة في البنك
    score_percentage    NUMERIC(5,2) DEFAULT 0,   -- النسبة المئوية
    
    -- الحالة
    status              TEXT DEFAULT 'in_progress' 
                        CHECK (status IN ('in_progress', 'completed')),
    
    -- التوقيتات
    first_answered_at   TIMESTAMPTZ,              -- أول إجابة
    last_answered_at    TIMESTAMPTZ,              -- آخر إجابة
    completed_at        TIMESTAMPTZ,              -- وقت الإكمال (إذا أكمل الكل)
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now(),
    
    -- القيد الفريد: صف واحد فقط لكل طالب + بنك أسئلة
    UNIQUE(question_bank_id, student_id)
);
```

### 3.2 لماذا هذا التصميم؟

| القرار | السبب |
|--------|-------|
| **صف واحد لكل (طالب + بنك)** | أداء أفضل، استعلامات أبسط، لا تكرار |
| **JSONB للإجابات** | مرونة عالية، تحديث جزئي، لا حاجة لـ migrations عند تغيير البنية |
| **حقول إحصائية منفصلة** | استعلامات سريعة بدون حساب من JSONB |
| **UNIQUE constraint** | ضمان عدم تكرار الصفوف |

---

## 4. تعديلات على الجداول الموجودة

### 4.1 `comprehensive_exam_attempts` - لا تغيير في البنية

الجدول الحالي كافٍ، لكن نحتاج:

```sql
-- إضافة حقول جديدة إذا غير موجودة
ALTER TABLE comprehensive_exam_attempts 
ADD COLUMN IF NOT EXISTS answered_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS percentage NUMERIC(5,2);

-- تحديث الـ UNIQUE constraint
ALTER TABLE comprehensive_exam_attempts 
ADD CONSTRAINT unique_student_exam UNIQUE (exam_id, student_id);
```

### 4.2 `teacher_exam_attempts` - تحسينات

```sql
-- إضافة حقول مفيدة للعرض
ALTER TABLE teacher_exam_attempts 
ADD COLUMN IF NOT EXISTS answered_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS percentage NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- ضمان صف واحد لكل طالب + امتحان
ALTER TABLE teacher_exam_attempts 
ADD CONSTRAINT unique_student_teacher_exam UNIQUE (exam_id, student_id);
```

---

## 5. هيكل البيانات JSONB

### 5.1 الهيكل الموحّد (يناسب كل الأنواع)

**المفتاح**: `question_id` (string/uuid)  
**القيمة**: كائن يحفظ الإجابة + بيانات التصحيح

```jsonc
{
  "question_uuid_1": {
    // === بيانات الإجابة ===
    "answer": "option_a",                    // أو ["a","c"] أو نص مقال
    "answered_at": "2026-01-27T10:30:00Z",
    "time_spent_seconds": 45,                // اختياري (مفيد للامتحانات)
    "flagged": false,                        // اختياري (علامة للمراجعة)
    
    // === التصحيح التلقائي (MCQ/True-False/Matching) ===
    "auto": {
      "is_correct": true,
      "points_earned": 2,
      "max_points": 2
    },
    
    // === التصحيح اليدوي (Essay/Open-ended) ===
    "manual": {
      "is_correct": null,                    // null = لم يُصحح بعد
      "points_earned": null,
      "comment": null,                       // تعليق المدرس
      "graded_by": null,                     // UUID المصحح
      "graded_at": null
    }
  },
  
  "question_uuid_2": {
    "answer": ["option_b", "option_d"],      // إجابة متعددة
    "answered_at": "2026-01-27T10:35:00Z",
    "auto": {
      "is_correct": false,
      "points_earned": 0,
      "max_points": 3
    },
    "manual": null                           // لا يحتاج تصحيح يدوي
  },
  
  "question_uuid_3": {
    "answer": "هذا نص إجابة مقالية...",      // إجابة نصية
    "answered_at": "2026-01-27T10:40:00Z",
    "auto": null,                            // لا تصحيح تلقائي
    "manual": {
      "is_correct": true,
      "points_earned": 8,
      "max_points": 10,
      "comment": "إجابة جيدة لكن ناقصة بعض التفاصيل",
      "graded_by": "teacher_uuid",
      "graded_at": "2026-01-28T09:00:00Z"
    }
  }
}
```

### 5.2 لماذا فصل `auto` و `manual`؟

| السبب | الفائدة |
|-------|---------|
| يمنع الخلط بين التصحيح التلقائي واليدوي | وضوح البيانات |
| يسمح للمدرس يعدّل `manual` بدون لمس `answer` | أمان البيانات |
| يسهل حساب الدرجة النهائية | `total = sum(auto.points) + sum(manual.points)` |
| يدعم الأسئلة المختلطة | سؤال واحد يمكن أن يكون له `auto` + `manual` |

### 5.3 قواعد مهمة

| القاعدة | التفاصيل |
|---------|----------|
| **`question_id` ثابت** | عند تعديل السؤال (نص/اختيارات) **لا تغيّر الـ id** إلا لو سؤال جديد تمامًا |
| **التحديث الذكي** | استخدم `jsonb_set` لتحديث مفتاح واحد فقط (لا ترسل JSON كامل من Client) |
| **null vs missing** | `null` = لم يُصحح، missing key = لم يُجب |

### 5.4 كيفية التحديث من الكلاينت

```typescript
// عند إجابة سؤال واحد - نرسل المفتاح والقيمة فقط
const updateAnswer = async (
  attemptId: string, 
  questionId: string, 
  answer: any,
  autoGrading?: { is_correct: boolean; points_earned: number; max_points: number }
) => {
  await supabase.rpc('upsert_attempt_answer', {
    p_attempt_id: attemptId,
    p_question_id: questionId,
    p_answer: answer,
    p_auto_grading: autoGrading ?? null
  });
};
```

---

## 6. السيناريوهات التفصيلية

### 6.1 سيناريو الطالب - بنك الأسئلة

```
1. الطالب يدخل على درس معين
2. يضغط على "بنك الأسئلة"
3. النظام يتحقق:
   - هل يوجد صف في question_bank_attempts؟
   - إذا نعم: يُحمّل الإجابات السابقة ويُظهرها
   - إذا لا: يُنشئ صف جديد بـ answers = {}

4. الطالب يحل سؤال:
   - يُحفظ في JSONB فوراً
   - تُحدث الإحصائيات (answered_count, correct_count)
   
5. الطالب يخرج ويعود لاحقاً:
   - يجد كل ما حله محفوظ
   - الأسئلة المحلولة تظهر بشكل مختلف (✅ أو ❌)
   - يستطيع إكمال الباقي

6. في بروفايل الطالب:
   - قائمة بكل بنوك الأسئلة التي حلها
   - نسبة الإنجاز لكل بنك
   - الدرجة الكلية
```

### 6.2 سيناريو الطالب - امتحان الموقع

```
1. الطالب يدخل على المادة
2. يختار امتحان من قائمة الامتحانات
3. النظام يتحقق:
   - هل يوجد attempt سابق؟
   - إذا نعم + status='in_progress': يُكمل من حيث توقف
   - إذا نعم + status='submitted': يراجع فقط (لا يعدل)
   - إذا لا: يُنشئ attempt جديد

4. أثناء الامتحان:
   - كل إجابة تُحفظ فوراً في JSONB
   - يستطيع التنقل بين الأسئلة
   - يستطيع وضع "علامة للمراجعة"

5. عند الإنهاء:
   - يضغط "تسليم الامتحان"
   - status يتحول إلى 'submitted'
   - تُحسب الدرجة النهائية
   - يُعرض الامتحان بالحل والتصحيح

6. في بروفايل الطالب:
   - قائمة امتحانات الموقع المحلولة
   - الدرجة والنسبة المئوية لكل امتحان
   - إمكانية مراجعة الحل
```

### 6.3 سيناريو الطالب - امتحان المدرس

```
1. الطالب يدخل بروفايل المدرس
2. يختار امتحان من قائمة امتحانات المدرس
3. نفس منطق امتحان الموقع...

4. بعد التسليم:
   - الامتحان يظهر في قائمة "امتحانات المدرسين" في بروفايل الطالب
   - منفصل عن امتحانات الموقع

5. في بروفايل الطالب:
   - قسم خاص: "امتحانات المدرسين"
   - يظهر: اسم المدرس، اسم الامتحان، الدرجة، التاريخ
```

### 6.4 سيناريو المدرس - لوحة التحكم

```
1. المدرس يدخل لوحة التحكم
2. يختار "امتحاناتي"
3. يرى قائمة امتحاناته مع:
   - عدد الطلاب الذين حلوا كل امتحان
   - متوسط الدرجات

4. يضغط على امتحان معين:
   - يرى قائمة بكل الطلاب الذين حلوه
   - الاسم، التاريخ، الدرجة، الحالة
   - زر "عرض الحل" لكل طالب

5. يضغط "عرض الحل":
   - يرى الامتحان كاملاً مع إجابات الطالب
   - الإجابات الصحيحة باللون الأخضر
   - الخاطئة باللون الأحمر
   - إمكانية التعليق على إجابات معينة
```

---

## 7. سياسات RLS

### 7.1 `question_bank_attempts` (كاملة)

```sql
-- تفعيل RLS
ALTER TABLE question_bank_attempts ENABLE ROW LEVEL SECURITY;

-- الطالب يرى محاولاته فقط
CREATE POLICY "Students view own attempts" ON question_bank_attempts
  FOR SELECT USING (auth.uid() = student_id);

-- الطالب يُنشئ محاولة لنفسه فقط
CREATE POLICY "Students create own attempts" ON question_bank_attempts
  FOR INSERT WITH CHECK (auth.uid() = student_id);

-- ⚠️ الطالب يُحدث محاولته فقط أثناء in_progress
CREATE POLICY "Students update own in_progress attempts" ON question_bank_attempts
  FOR UPDATE USING (
    auth.uid() = student_id 
    AND status = 'in_progress'
  );

-- الأدمن يرى ويعدل الكل
CREATE POLICY "Admins full access" ON question_bank_attempts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### 7.2 `teacher_exam_attempts` (كاملة)

```sql
-- تفعيل RLS
ALTER TABLE teacher_exam_attempts ENABLE ROW LEVEL SECURITY;

-- الطالب يرى محاولاته فقط
CREATE POLICY "Students view own attempts" ON teacher_exam_attempts
  FOR SELECT USING (auth.uid() = student_id);

-- الطالب يُنشئ محاولة لنفسه فقط
CREATE POLICY "Students create own attempts" ON teacher_exam_attempts
  FOR INSERT WITH CHECK (auth.uid() = student_id);

-- ⚠️ الطالب يُحدث محاولته فقط أثناء in_progress
CREATE POLICY "Students update own in_progress attempts" ON teacher_exam_attempts
  FOR UPDATE USING (
    auth.uid() = student_id 
    AND status = 'in_progress'
  );

-- المدرس يرى محاولات امتحاناته
CREATE POLICY "Teachers view their exam attempts" ON teacher_exam_attempts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM teacher_exams 
      WHERE id = exam_id AND created_by = auth.uid()
    )
  );

-- المدرس يُحدث للتصحيح اليدوي (بعد submitted)
CREATE POLICY "Teachers grade submitted attempts" ON teacher_exam_attempts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM teacher_exams 
      WHERE id = exam_id AND created_by = auth.uid()
    )
    AND status IN ('submitted', 'graded')
  );

-- الأدمن يرى ويعدل الكل
CREATE POLICY "Admins full access" ON teacher_exam_attempts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### 7.3 `comprehensive_exam_attempts` (كاملة)

```sql
-- تفعيل RLS
ALTER TABLE comprehensive_exam_attempts ENABLE ROW LEVEL SECURITY;

-- الطالب يرى محاولاته فقط
CREATE POLICY "Students view own attempts" ON comprehensive_exam_attempts
  FOR SELECT USING (auth.uid() = student_id);

-- الطالب يُنشئ محاولة لنفسه فقط
CREATE POLICY "Students create own attempts" ON comprehensive_exam_attempts
  FOR INSERT WITH CHECK (auth.uid() = student_id);

-- ⚠️ الطالب يُحدث محاولته فقط أثناء in_progress
CREATE POLICY "Students update own in_progress attempts" ON comprehensive_exam_attempts
  FOR UPDATE USING (
    auth.uid() = student_id 
    AND status = 'in_progress'
  );

-- الأدمن يرى ويعدل الكل
CREATE POLICY "Admins full access" ON comprehensive_exam_attempts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

---

## 8. الفهارس المطلوبة

```sql
-- question_bank_attempts
CREATE INDEX idx_qb_attempts_student ON question_bank_attempts(student_id);
CREATE INDEX idx_qb_attempts_bank ON question_bank_attempts(question_bank_id);
CREATE INDEX idx_qb_attempts_status ON question_bank_attempts(status);
CREATE INDEX idx_qb_attempts_student_updated ON question_bank_attempts(student_id, updated_at DESC);

-- لتحسين البحث في JSONB (اختياري)
CREATE INDEX idx_qb_attempts_answers_gin ON question_bank_attempts USING GIN (answers);
```

---

## 9. API و Functions

### 9.1 RPC Functions المطلوبة

> ⚠️ **قاعدة أمنية مهمة**: الكلاينت يرسل **الإجابة فقط**. السيرفر يحسب التصحيح.

#### `upsert_question_bank_answer` (الآمنة)

```sql
CREATE OR REPLACE FUNCTION upsert_question_bank_answer(
  p_question_bank_id UUID,
  p_question_id TEXT,
  p_answer JSONB,
  p_time_spent_seconds INTEGER DEFAULT NULL,
  p_flagged BOOLEAN DEFAULT FALSE
) RETURNS JSONB
SET search_path = public
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_attempt_id UUID;
  v_status TEXT;
  v_student_id UUID := auth.uid();
  v_question JSONB;
  v_is_correct BOOLEAN;
  v_points_earned INTEGER;
  v_max_points INTEGER;
  v_new_answers JSONB;
  v_stats RECORD;
BEGIN
  -- 1) جلب أو إنشاء المحاولة
  INSERT INTO question_bank_attempts (question_bank_id, student_id, first_answered_at)
  VALUES (p_question_bank_id, v_student_id, NOW())
  ON CONFLICT (question_bank_id, student_id) DO NOTHING
  RETURNING id, status INTO v_attempt_id, v_status;
  
  IF v_attempt_id IS NULL THEN
    SELECT id, status INTO v_attempt_id, v_status
    FROM question_bank_attempts 
    WHERE question_bank_id = p_question_bank_id AND student_id = v_student_id;
  END IF;
  
  -- 2) منع التعديل بعد الإكمال
  IF v_status != 'in_progress' THEN
    RAISE EXCEPTION 'Cannot modify completed attempt';
  END IF;
  
  -- 3) جلب السؤال من البنك لحساب التصحيح
  SELECT q INTO v_question
  FROM question_banks qb,
       jsonb_array_elements(qb.questions) AS q
  WHERE qb.id = p_question_bank_id
    AND q->>'id' = p_question_id;
  
  IF v_question IS NULL THEN
    RAISE EXCEPTION 'Question not found in bank';
  END IF;
  
  -- 4) حساب التصحيح على السيرفر (مثال لـ MCQ)
  v_max_points := COALESCE((v_question->>'points')::int, 1);
  
  -- التصحيح التلقائي للأسئلة الموضوعية
  IF v_question->>'type' IN ('mcq', 'true_false', 'multi_select') THEN
    v_is_correct := (p_answer = v_question->'correctAnswer');
    v_points_earned := CASE WHEN v_is_correct THEN v_max_points ELSE 0 END;
  ELSE
    -- أسئلة مقالية: لا تصحيح تلقائي
    v_is_correct := NULL;
    v_points_earned := NULL;
  END IF;
  
  -- 5) تحديث الإجابة
  UPDATE question_bank_attempts
  SET 
    answers = jsonb_set(
      COALESCE(answers, '{}'::jsonb),
      ARRAY[p_question_id],
      jsonb_build_object(
        'answer', p_answer,
        'answered_at', NOW(),
        'time_spent_seconds', p_time_spent_seconds,
        'flagged', p_flagged,
        'auto', CASE 
          WHEN v_is_correct IS NOT NULL THEN
            jsonb_build_object(
              'is_correct', v_is_correct,
              'points_earned', v_points_earned,
              'max_points', v_max_points
            )
          ELSE NULL
        END,
        'manual', NULL
      )
    ),
    last_answered_at = NOW(),
    updated_at = NOW()
  WHERE id = v_attempt_id
  RETURNING answers INTO v_new_answers;
  
  -- 6) تحديث counters باستخدام subquery صحيحة
  WITH stats AS (
    SELECT 
      COUNT(*) AS answered,
      COUNT(*) FILTER (WHERE (value->'auto'->>'is_correct')::boolean = true) AS correct,
      COALESCE(SUM((value->'auto'->>'points_earned')::int), 0) AS earned,
      COALESCE(SUM((value->'auto'->>'max_points')::int), 0) AS max_pts
    FROM jsonb_each(v_new_answers)
  )
  UPDATE question_bank_attempts
  SET 
    answered_count = stats.answered,
    correct_count = stats.correct,
    score_percentage = CASE 
      WHEN stats.max_pts > 0 THEN ROUND((stats.earned::numeric / stats.max_pts) * 100, 2)
      ELSE 0
    END
  FROM stats
  WHERE id = v_attempt_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'attempt_id', v_attempt_id,
    'is_correct', v_is_correct,
    'points_earned', v_points_earned
  );
END;
$$;
```

#### `get_student_question_bank_progress`

```sql
CREATE OR REPLACE FUNCTION get_student_question_bank_progress(
  p_student_id UUID DEFAULT NULL
) RETURNS TABLE (
  attempt_id UUID,
  question_bank_id UUID,
  bank_title JSONB,
  lesson_id UUID,
  lesson_title TEXT,
  answered_count INTEGER,
  total_questions INTEGER,
  correct_count INTEGER,
  score_percentage NUMERIC,
  status TEXT,
  last_answered_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    qba.id,
    qba.question_bank_id,
    qb.title,
    qb.lesson_id,
    l.title,
    qba.answered_count,
    qb.total_questions,
    qba.correct_count,
    qba.score_percentage,
    qba.status,
    qba.last_answered_at
  FROM question_bank_attempts qba
  JOIN question_banks qb ON qb.id = qba.question_bank_id
  LEFT JOIN lessons l ON l.id = qb.lesson_id
  WHERE qba.student_id = COALESCE(p_student_id, auth.uid())
  ORDER BY qba.last_answered_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### `get_teacher_exam_results`

```sql
CREATE OR REPLACE FUNCTION get_teacher_exam_results(
  p_exam_id UUID
) RETURNS TABLE (
  attempt_id UUID,
  student_id UUID,
  student_name TEXT,
  student_email TEXT,
  total_score INTEGER,
  max_score INTEGER,
  percentage NUMERIC,
  status TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  answered_count INTEGER
) AS $$
BEGIN
  -- التحقق من أن المستخدم هو صاحب الامتحان
  IF NOT EXISTS (
    SELECT 1 FROM teacher_exams 
    WHERE id = p_exam_id AND created_by = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  RETURN QUERY
  SELECT 
    tea.id,
    tea.student_id,
    p.name,
    p.email,
    tea.total_score,
    tea.max_score,
    tea.percentage,
    tea.status,
    tea.started_at,
    tea.completed_at,
    tea.answered_count
  FROM teacher_exam_attempts tea
  JOIN profiles p ON p.id = tea.student_id
  WHERE tea.exam_id = p_exam_id
  ORDER BY tea.completed_at DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 10. تغييرات UI

### 10.1 بروفايل الطالب - أقسام جديدة

```
📱 بروفايل الطالب
├── 📊 الإحصائيات العامة
│   ├── إجمالي الامتحانات المحلولة
│   ├── إجمالي بنوك الأسئلة
│   └── متوسط الدرجات
│
├── 📝 امتحانات الموقع
│   └── [قائمة بالامتحانات + الدرجات]
│
├── 👨‍🏫 امتحانات المدرسين
│   └── [قائمة منفصلة بامتحانات المدرسين]
│
└── 📚 بنوك الأسئلة
    └── [قائمة ببنوك الأسئلة + نسبة الإنجاز]
```

### 10.2 لوحة تحكم المدرس - قسم الامتحانات

```
📱 لوحة تحكم المدرس
├── 📝 امتحاناتي
│   ├── [قائمة الامتحانات]
│   │   ├── اسم الامتحان
│   │   ├── عدد الحلول: 25 طالب
│   │   ├── متوسط الدرجات: 78%
│   │   └── [زر: عرض النتائج]
│   │
│   └── [صفحة نتائج امتحان]
│       ├── جدول الطلاب
│       │   ├── الاسم | الدرجة | التاريخ | الحالة | عرض الحل
│       │   └── ...
│       ├── تصدير Excel
│       └── إحصائيات الامتحان
```

### 10.3 صفحة حل بنك الأسئلة

```
📱 صفحة بنك الأسئلة
├── شريط التقدم: ██████░░░░ 6/10 أسئلة
├── 
├── [سؤال 1] ✅ محلول (صح)
├── [سؤال 2] ❌ محلول (خطأ)
├── [سؤال 3] ⬜ غير محلول
├── ...
│
├── [زر: حفظ والخروج]
└── [زر: إنهاء ومراجعة]
```

---

## 📋 ملخص التغييرات المطلوبة

### جداول جديدة
| الجدول | الوصف |
|--------|-------|
| `question_bank_attempts` | تخزين إجابات الطلاب في بنوك الأسئلة |

### تعديلات على جداول موجودة
| الجدول | التعديل |
|--------|---------|
| `comprehensive_exam_attempts` | إضافة `answered_count`, `percentage`, UNIQUE constraint |
| `teacher_exam_attempts` | إضافة `answered_count`, `percentage`, `completed_at`, UNIQUE constraint |

### RPC Functions جديدة
| الدالة | الوصف |
|--------|-------|
| `upsert_question_bank_answer` | حفظ/تحديث إجابة سؤال في بنك الأسئلة |
| `get_student_question_bank_progress` | جلب تقدم الطالب في بنوك الأسئلة |
| `get_teacher_exam_results` | جلب نتائج امتحان المدرس |
| `calculate_exam_score` | حساب درجة الامتحان تلقائياً |

### صفحات UI جديدة/معدلة
| الصفحة | التعديل |
|--------|---------|
| بروفايل الطالب | إضافة أقسام الامتحانات وبنوك الأسئلة |
| لوحة تحكم المدرس | إضافة صفحة نتائج الامتحانات |
| صفحة بنك الأسئلة | دعم الحفظ التدريجي وعرض التقدم |
| صفحة الامتحان | دعم الحفظ التدريجي والمراجعة |

---

---

## 11. منطق الحفظ التدريجي (Partial Save)

### 11.1 القاعدة الأساسية

```
┌─────────────────────────────────────────────────────────────┐
│  ❌ لا ترسل JSON كامل من الكلاينت                          │
│  ✅ أرسل (question_id, answer) فقط                         │
│  ✅ استخدم jsonb_set في الـ RPC                            │
└─────────────────────────────────────────────────────────────┘
```

### 11.2 لماذا؟

| المشكلة إذا أرسلنا JSON كامل | الحل |
|------------------------------|------|
| فقدان بيانات إذا فتح الطالب الامتحان في تاب ثاني | تحديث مفتاح واحد فقط |
| Race conditions | الـ DB يتعامل مع مفتاح واحد |
| حجم البيانات كبير | نرسل فقط ما تغير |

### 11.3 منع التعديل بعد التسليم

```sql
-- في RPC: نتحقق من الحالة قبل التحديث
IF v_status != 'in_progress' THEN
  RAISE EXCEPTION 'Cannot modify submitted attempt';
END IF;

-- في RLS: طبقة حماية إضافية
CREATE POLICY "Students update only in_progress" ON *_attempts
  FOR UPDATE USING (
    auth.uid() = student_id 
    AND status = 'in_progress'
  );
```

---

## 12. التصحيح وحساب الدرجة (Scoring Strategy)

### 12.1 التصحيح التلقائي (MCQ/True-False/Matching)

> ⚠️ **مشكلة شائعة**: استخدام `max_score` داخل نفس UPDATE لن يعمل لأن Postgres يحسب على القيمة القديمة.

✅ **الحل الصحيح**: استخدام CTE

```sql
-- submit_attempt function (مثال لبنك الأسئلة)
CREATE OR REPLACE FUNCTION submit_question_bank_attempt(
  p_attempt_id UUID
) RETURNS JSONB
SET search_path = public
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_student_id UUID := auth.uid();
  v_result RECORD;
BEGIN
  -- التحقق من الملكية والحالة
  IF NOT EXISTS (
    SELECT 1 FROM question_bank_attempts 
    WHERE id = p_attempt_id 
      AND student_id = v_student_id 
      AND status = 'in_progress'
  ) THEN
    RAISE EXCEPTION 'Invalid attempt or already submitted';
  END IF;

  -- حساب الدرجات باستخدام CTE ثم UPDATE
  WITH scores AS (
    SELECT 
      COALESCE(SUM(
        COALESCE((value->'auto'->>'points_earned')::int, 0) +
        COALESCE((value->'manual'->>'points_earned')::int, 0)
      ), 0) AS total_score,
      COALESCE(SUM(
        COALESCE((value->'auto'->>'max_points')::int, 0) +
        COALESCE((value->'manual'->>'max_points')::int, 0)
      ), 0) AS max_score
    FROM question_bank_attempts qa,
         jsonb_each(qa.answers)
    WHERE qa.id = p_attempt_id
  )
  UPDATE question_bank_attempts
  SET 
    total_score = scores.total_score,
    max_score = scores.max_score,
    score_percentage = CASE 
      WHEN scores.max_score > 0 
      THEN ROUND((scores.total_score::numeric / scores.max_score) * 100, 2)
      ELSE 0
    END,
    status = 'completed',
    completed_at = NOW(),
    updated_at = NOW()
  FROM scores
  WHERE id = p_attempt_id
  RETURNING total_score, max_score, score_percentage INTO v_result;

  RETURN jsonb_build_object(
    'success', true,
    'total_score', v_result.total_score,
    'max_score', v_result.max_score,
    'percentage', v_result.score_percentage
  );
END;
$$;
```

### 12.2 التصحيح اليدوي (Essay)

| الخطوة | الوصف |
|--------|-------|
| 1 | الطالب يسلم → `status = 'submitted'` |
| 2 | المدرس يفتح الحل → يرى الأسئلة المقالية |
| 3 | المدرس يضع `manual.points_earned` + `manual.comment` |
| 4 | بعد تصحيح كل الأسئلة اليدوية → `status = 'graded'` |

> **إن لم يوجد أسئلة مقالية**: `submitted = graded` مباشرة

---

## 13. التعامل مع تغييرات الأسئلة (Versioning)

### 13.1 المشكلة

لو بنك أسئلة أو امتحان تغيّر **بعد** ما طلاب حلوا:
- حذف سؤال
- تعديل الإجابة الصحيحة
- تغيير النقاط

→ محاولات قديمة تصبح **غير متوافقة** 😱

### 13.2 الحلول المتاحة

| الخيار | الوصف | التعقيد |
|--------|-------|---------|
| **A: تجميد بعد النشر** | بعد نشر الامتحان: لا تعديل إلا بعمل نسخة جديدة | ⭐ بسيط |
| **B: Versioning** | `version` في الامتحان + `source_version` في المحاولة | ⭐⭐ متوسط |
| **C: Soft Delete** | السؤال المحذوف يبقى لكن `is_deleted=true` | ⭐⭐ متوسط |

### 13.3 التوصية المعتمدة: **الخيار A (Freeze After Publish)**

```
┌────────────────────────────────────────────────────────────┐
│  📋 قاعدة: بعد نشر الامتحان/البنك → لا تعديل في الأسئلة   │
│  📋 إذا أردت تعديل → أوقف النشر أولاً أو أنشئ نسخة جديدة  │
└────────────────────────────────────────────────────────────┘
```

### 13.4 التنفيذ (اختياري: DB-level enforcement)

```sql
-- منع تعديل questions إذا is_published = true
CREATE OR REPLACE FUNCTION prevent_published_question_edit()
RETURNS TRIGGER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.is_published = true AND NEW.questions IS DISTINCT FROM OLD.questions THEN
    RAISE EXCEPTION 'Cannot modify questions of a published item. Unpublish first.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_published_question_edit
BEFORE UPDATE ON question_banks
FOR EACH ROW
EXECUTE FUNCTION prevent_published_question_edit();

-- نفس الـ trigger للامتحانات
CREATE TRIGGER trg_prevent_published_exam_edit
BEFORE UPDATE ON comprehensive_exams
FOR EACH ROW
EXECUTE FUNCTION prevent_published_question_edit();

CREATE TRIGGER trg_prevent_published_teacher_exam_edit
BEFORE UPDATE ON teacher_exams
FOR EACH ROW
EXECUTE FUNCTION prevent_published_question_edit();
```

يمكن إضافة **Versioning** لاحقاً إذا احتجنا.

---

## 14. خطة التنفيذ المرحلية (بالترتيب الآمن)

> ترتيب يضمن عدم كسر الموجود ولا فقد بيانات

### Step 1 — DB Schema

| # | الوصف | ملاحظات |
|---|-------|---------|
| 1 | إنشاء `question_bank_attempts` | مع `answers JSONB NOT NULL DEFAULT '{}'::jsonb` |
| 2 | إضافة الأعمدة الناقصة للجداول الحالية | `IF NOT EXISTS` لتجنب فشل migration |
| 3 | إضافة UNIQUE constraints | `DO $$ ... IF NOT EXISTS` |
| 4 | إضافة triggers لـ `updated_at` | إن لم تكن موجودة |

### Step 2 — Security

| # | الوصف | ملاحظات |
|---|-------|---------|
| 5 | تفعيل RLS على `question_bank_attempts` | |
| 6 | تحديث RLS لكل جداول attempts | إضافة شرط `status = 'in_progress'` |
| 7 | اختبار صلاحيات: طالب/مدرس/أدمن | سيناريوهات Test Plan |

### Step 3 — RPC Functions

| # | الوصف | ملاحظات |
|---|-------|---------|
| 8 | `upsert_*_answer` لكل نوع | **الكلاينت يرسل الإجابة فقط** |
| 9 | `submit_*_attempt` لكل نوع | CTE لحساب الدرجات |
| 10 | `get_student_*_attempts` للبروفايل | |
| 11 | `get_teacher_exam_results` للوحة المدرس | |

### Step 4 — UI

| # | الوصف | ملاحظات |
|---|-------|---------|
| 12 | توصيل UI على RPC | |
| 13 | فصل أقسام البروفايل (3 tabs) | |
| 14 | شاشة نتائج امتحان المدرس | |

### Step 5 — QA

| # | الوصف | ملاحظات |
|---|-------|---------|
| 15 | تشغيل Test Plan بالكامل | قبل الإطلاق |

---

## 14.1 المرحلة 1 — الأساسيات (MVP)

| الخطوة | الوصف | الأولوية |
|--------|-------|----------|
| 1 | إنشاء جدول `question_bank_attempts` | 🔴 عالية |
| 2 | إضافة UNIQUE + counters للجداول الحالية | 🔴 عالية |
| 3 | تحديث سياسات RLS | 🔴 عالية |
| 4 | RPC للحفظ الجزئي (3 أنواع) | 🔴 عالية |
| 5 | RPC للتسليم + حساب الدرجة | 🔴 عالية |
| 6 | UI: استكمال المحاولات | 🟡 متوسطة |
| 7 | UI: عرض النتائج في بروفايل الطالب | 🟡 متوسطة |
| 8 | UI: لوحة المدرس لنتائج امتحاناته | 🟡 متوسطة |

### المرحلة 2 — تحسينات

| الخطوة | الوصف | الأولوية |
|--------|-------|----------|
| 1 | flags + time_spent لكل سؤال | 🟢 منخفضة |
| 2 | التصحيح اليدوي + التعليقات | 🟡 متوسطة |
| 3 | تصدير Excel للنتائج | 🟢 منخفضة |
| 4 | Versioning للأسئلة | 🟢 منخفضة |

---

## 15. Test Plan

### 15.1 بنوك الأسئلة

| السيناريو | المتوقع |
|-----------|---------|
| الطالب يجاوب سؤالين → يخرج → يرجع | يلاقيهم محفوظين ✅ |
| محاولة واحدة فقط لكل (طالب + بنك) | UNIQUE يمنع التكرار ✅ |
| بعد `completed` لا تعديل | RLS يمنع ✅ |
| طالب يحاول يشوف محاولة طالب آخر | RLS يمنع ✅ |

### 15.2 امتحانات الموقع

| السيناريو | المتوقع |
|-----------|---------|
| حفظ تدريجي أثناء `in_progress` | يعمل ✅ |
| التسليم يقفل المحاولة ويحسب الدرجة | `status=submitted` + score ✅ |
| المراجعة بعد التسليم | قراءة فقط ✅ |
| الظهور في بروفايل الطالب | يظهر في القسم الصحيح ✅ |

### 15.3 امتحانات المدرس

| السيناريو | المتوقع |
|-----------|---------|
| الطالب يحل ويظهر في بروفايله | قسم منفصل "امتحانات المدرسين" ✅ |
| المدرس يرى قائمة الطلاب والدرجات | يعمل ✅ |
| المدرس يفتح حل طالب معين | يعرض الإجابات ✅ |
| المدرس يصحح سؤال مقالي | يحدث `manual` ✅ |
| مدرس يحاول يشوف امتحان مدرس آخر | RLS يمنع ✅ |

---

## 16. المخاطر المحتملة

| الخطر | الاحتمالية | التأثير | الحل |
|-------|-----------|---------|------|
| 🔴 **الكلاينت يرسل is_correct/points** | عالي | **حرج** | ✅ RPC تحسب التصحيح من DB فقط |
| 🔴 **الطالب يعدل بعد التسليم** | عالي | عالي | ✅ RLS + RPC تتحقق من status |
| 🟡 عدم ثبات `question_id` داخل questions | متوسط | عالي | التأكد من وجود `id` ثابت قبل النشر |
| 🟡 تعديل الأسئلة بعد محاولة الطلاب | عالي | عالي | ✅ Trigger يمنع التعديل بعد النشر |
| 🟡 الكلاينت يرسل JSON كامل | متوسط | متوسط | استخدام RPC فقط + تحديث مفتاح واحد |
| 🟢 RLS غير محكم | منخفض | عالي | اختبار كل سيناريو + audit |
| 🟢 أداء بطيء على JSONB كبير | منخفض | متوسط | فهارس GIN + materialized views |
| 🟢 SECURITY DEFINER بدون search_path | متوسط | عالي | ✅ إضافة `SET search_path = public` |

---

## 17. قرارات مثبتة

> هذه القرارات **معتمدة** بناءً على المراجعة الأمنية:

### 17.1 قرارات أمنية (Non-Negotiables)

| القرار | القيمة | السبب |
|--------|--------|-------|
| 🔒 التصحيح | **على السيرفر فقط** | منع الغش - الكلاينت يرسل الإجابة فقط |
| 🔒 التعديل بعد التسليم | **ممنوع** | RLS + RPC تتحقق من status |
| 🔒 search_path | **مطلوب في كل SECURITY DEFINER** | أمان Supabase |
| 🔒 تجميد بعد النشر | **نعم** | منع لخبطة المحاولات القديمة |

### 17.2 قرارات تقنية

| القرار | القيمة | ملاحظات |
|--------|--------|---------|
| حالات الامتحانات | `in_progress → submitted → graded` | |
| حالات بنوك الأسئلة | `in_progress → completed` | أو `submitted` إن أردت تسليم رسمي |
| كل سؤال له `id` ثابت | نعم (string/uuid) | مطلوب للربط |
| التصحيح اليدوي | مدعوم (حقل `manual`) | اختياري حسب نوع السؤال |
| UNIQUE constraints | `IF NOT EXISTS` في migration | تجنب فشل إعادة التشغيل |
| JSONB cast | `'{}'::jsonb` | تصريح واضح |
| Versioning | **لاحقاً** | نبدأ بتجميد بعد النشر |

---

## 📋 ملخص الملفات المطلوبة

| الملف | المحتوى |
|-------|---------|
| `migration.sql` | إنشاء الجداول + التعديلات + RLS + Indexes |
| `rpc_functions.sql` | كل الـ RPC functions |
| `types.ts` | TypeScript types للـ attempts |
| صفحات UI | حسب الخطة أعلاه |

---

## ✅ الخطوة التالية

بعد مراجعتك لهذا المستند:

1. **موافق على الخريطة** → أبدأ في إنشاء ملفات Migration + RPC
2. **تعديلات مطلوبة** → أخبرني بالتعديلات وأحدث الخطة

> ⚠️ **لن يتم تنفيذ أي شيء** حتى تعطيني الضوء الأخضر

---

*تم تحديث هذا المستند في: 2026-01-27*
*الإصدار: 3.0 (بعد المراجعة الأمنية)*

---

## 📝 سجل التغييرات

### v3.0 (المراجعة الأمنية)
- ✅ **RPC آمنة**: الكلاينت يرسل الإجابة فقط، السيرفر يحسب التصحيح
- ✅ **RLS محكمة**: شرط `status = 'in_progress'` لكل جداول attempts
- ✅ **CTE للـ scoring**: إصلاح مشكلة حساب percentage
- ✅ **search_path**: مضاف لكل SECURITY DEFINER functions
- ✅ **سياسات RLS كاملة**: لكل الجداول الثلاثة
- ✅ **Trigger تجميد النشر**: منع تعديل الأسئلة بعد النشر
- ✅ **خطة تنفيذ مرتبة**: بالترتيب الآمن

### v2.0
- إضافة أقسام 11-17
- هيكل JSONB مع auto/manual

### v1.0
- الإصدار الأول
