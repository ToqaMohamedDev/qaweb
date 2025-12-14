# خريطة البيانات والتدفقات في المشروع

## نظرة سريعة
- الإطار: Next.js (دليل `app/`) مع Firebase (Auth + Firestore) للتخزين.
- مصادر البيانات الرئيسية:
  - Firestore: `users`, `questions`, `exams`, `examSessions` (جلسات الحل والحفظ).
  - سياق المصادقة: `contexts/AuthContext.tsx` (تغليف عام في `app/layout.tsx`).
  - واجهات API: `app/api/save-progress/route.ts` (حفظ/إنشاء جلسة) و `app/api/submit-and-score/route.ts` (تصحيح وإغلاق جلسة).
  - التخزين المحلي: `localStorage` للثيم (dark/light) في `components/ThemeProvider.tsx` و bootstrap مبكر في `app/layout.tsx`.

## واجهات الـ API
- `POST /api/save-progress`
  - الهدف: إنشاء/تحديث جلسة حل (examSessions) مع دمج الإجابات.
  - المدخلات: `{ sessionId?: string, userId: string, examId: string, userAnswers: UserAnswersMap }`.
  - التحقق: فحص يدوي للهيكل (userId/examId نصوص غير فارغة، sessionId إن وجد، userAnswers كائن).
  - السلوك:
    - إن وجد `sessionId`: يجلب المستند، يدمج `userAnswers`، يحدّث `status: in_progress`, `lastUpdated`, ويحافظ على `startedAt` إن وجد.
    - إن لم يوجد `sessionId`: يبحث عن جلسة `in_progress` لنفس `userId + examId`; إن وُجدت تُعاد مع دمج الإجابات، وإلا يُنشئ مستند جديد بحقول: `userId, examId, status: in_progress, userAnswers, startedAt, lastUpdated`.
  - الاستجابة: `{ success: true, sessionId }` أو `{ success: false, error }` (400 للحقول/الهيكل غير الصحيح، 500 للأخطاء الداخلية).

- `POST /api/submit-and-score`
  - الهدف: حساب الدرجة وإغلاق الجلسة.
  - المدخلات: `{ sessionId, userId }`.
  - التدفق: يجلب الجلسة، يتأكد من `userId`, يجلب الأسئلة، يقيّم حسب النوع، يحدّث `status: completed`, `score`, `completedAt`.
  - يعتمد على `types/firestoreExam.ts` لأنواع الأسئلة (multi_choice, parsing, extraction, translation...).

## المصادقة وتدفق المستخدم
- الملف: `contexts/AuthContext.tsx` يوفر `user`, `loading`, ودوال auth (email/password + Google) ويكتب/يحدّث مستخدم Firestore في `users/{uid}`.
- الحفظ يتطلب وجود `user?.uid` (لن يتم حفظ الإجابات بدون تسجيل دخول).

## بنية Firestore المختصرة
- `users/{uid}`: حساب المستخدم وبيانات التعريف.
- `questions/{questionId}`: تعريف السؤال/الامتحان، مع `questionType`, `correctAnswers`, `lessonId`, `language`, إلخ.
- `exams/{examId}`: أقسام امتحان تشير إلى `questionId`/`templateType` (أو نفس وثائق الأسئلة الشاملة بحسب التصميم).
- `examSessions/{sessionId}`: جلسات الحل مع `userId`, `examId`, `status`, `userAnswers`, طوابع زمنية، ودرجة عند الإغلاق.

## ربط الدروس بالأسئلة والقوالب
1) إنشاء درس ⇒ تخزين `lessonId`.
2) إنشاء سؤال ⇒ تخزينه في `questions` مع `lessonId`.
3) بناء امتحان ⇒ أقسام `sections[]` تشير إلى `questionId` وتحدد `templateType` لعرضه.
4) الواجهة (دروس/امتحانات) تجلب الأسئلة حسب `lessonId` أو تجلب الامتحان وتعرض `sections` حسب `templateType`.
5) أثناء الحل: الإجابات تُحفظ في `examSessions.userAnswers` بمفاتيح الأسئلة (أو مفاتيح مركّبة في الواجهة) وتُسترجع للهيدرَيشِن بعد التحديث.

## أنواع البيانات المهمة
- `types/firestoreExam.ts`: `QuestionDoc`, `UserAnswersMap`, `ExamSessionDoc`, `UserAnswerShape`.
- `types/questionTypes.ts`: `Question`, `ExamData`, `ExamSection`, ونماذج الأسئلة (MCQ, translation, essay, parsing...).

## التخزين المحلي / واجهة المستخدم
- الثيم فقط في `localStorage` (مفتاح `theme`).
- لا تخزين محلي للإجابات؛ الاعتماد على `save-progress` + Firestore.

## الحفظ التلقائي والأداء (Debounce + beforeunload)
- الهوك: `hooks/useAutoSave.ts`
  - Debounce داخلي بـ `setTimeout` (افتراضي 1000ms، قابل للتعديل) لتجميع الكتابات وتقليل التكلفة.
  - `beforeunload` يرسل آخر حالة عبر `sendBeacon` مع fallback `fetch keepalive` لضمان الحفظ عند إغلاق/تحديث الصفحة.
- الاستخدام (مثال): استدعِ `useAutoSave` داخل صفحات الامتحان مع `userId`, `examId`, `sessionId`, و `userAnswers` القادمة من `useExamSession`.
- الصفحات المفعَّلة: `app/english/exam/[examId]/page.tsx` (ويمكن تعميمه على باقي الصفحات بنفس النمط).

## أين تُدار البيانات في الواجهة
- الدروس: `app/arabic/[lessonId]`, `app/english/[lessonId]` (حفظ تلقائي + هيدرَيشِن للجلسة).
- الامتحانات: `app/arabic/exam/[examId]`, `app/english/exam/[examId]` (حفظ تلقائي + هيدرَيشِن + إعادة توجيه للجلسات المكتملة عبر `useExamSession`).
- مكوّن التنقل: `components/Navbar.tsx` يعتمد على `useAuth`.

## أنواع الأسئلة التفصيلية

### أنواع الأسئلة الأساسية (QuestionType)
- `multi_choice`: اختيار من متعدد - يحتوي على `options[]` و `correctAnswer` (رقم الفهرس)
- `parsing`: تحليل نحوي - يحتوي على `selections[]` مع `startIndex`, `endIndex`, `tag`
- `extraction`: استخراج - يحتوي على `question` و `answer` (نص)
- `translation`: ترجمة - يحتوي على `originalText`, `translationDirection`, `options[]`, `correctAnswer`
- `essay`: مقال - يحتوي على `question` و `modelAnswer` (اختياري)
- `reading`: قراءة - يحتوي على `readingPassage` و `multipleChoiceQuestions[]`

### أنواع الأسئلة العربية المتقدمة
- `arabic_comprehensive_exam`: امتحان شامل عربي - يحتوي على `blocks[]` من أنواع:
  - `reading_passage`: نص قراءة (Scientific/Literary)
  - `poetry_text`: نص شعري مع `verses[]`
  - `grammar_block`: كتلة نحوية
  - `expression_block`: تعبير (functional/creative)
- `arabic_comprehensive`: سؤال شامل عربي - يحتوي على `sections[]` مع `arabicText`, `essayRequirement`
- `arabic_multi_section`: سؤال متعدد الأقسام

### أنواع الأسئلة الإنجليزية المتقدمة
- `english_comprehensive_exam`: امتحان شامل إنجليزي - يحتوي على `sections[]` من أنواع:
  - `vocabulary_grammar`: مفردات وقواعد
  - `advanced_writing`: كتابة متقدمة
  - `reading`: قراءة
  - `translation`: ترجمة
  - `essay`: مقال
- `english_comprehensive`: سؤال شامل إنجليزي
- `english_reading`: سؤال قراءة
- `english_translation`: سؤال ترجمة
- `english_literature`: سؤال أدب
- `english_essay`: سؤال مقال

### هيكل الأسئلة الشاملة
```typescript
{
  questionTitle?: string;
  questionSubtitle?: string;
  readingPassage?: string;
  arabicText?: string;
  mainQuestion?: string;
  essayRequirement?: string;
  multipleChoiceQuestions?: MCQ[];
  extractionQuestions?: ExtractionQuestion[];
  shortEssayQuestions?: ShortEssayQuestion[];
  translationQuestions?: TranslationQuestion[];
  essayQuestions?: EssayQuestion[];
  grammarQuestions?: GrammarQuestion[];
  sections?: SubSection[];
  blocks?: ExamBlock[]; // للامتحانات الشاملة
}
```

## هيكل الدروس

### دروس اللغة العربية (`app/arabic/[lessonId]`)
- `arabic_nahw_01`: النحو
- `arabic_reading_02`: القراءة
- `arabic_poetry_03`: النصوص
- `arabic_story_04`: القصة
- `arabic_adab_05`: الأدب
- `arabic_balagha_06`: البلاغة
- `arabic_expression_07`: التعبير
- `arabic_sarf_08`: الصرف

### دروس اللغة الإنجليزية (`app/english/[lessonId]`)
- يتم جلب الدروس من Firestore حسب `lessonId`
- كل درس يحتوي على أسئلة مرتبطة عبر `lessonId` في وثيقة السؤال

## صفحات الإدارة (`app/admin/`)

### لوحة التحكم الرئيسية (`/admin`)
- عرض إحصائيات: عدد الأسئلة، المستخدمين، الرسائل
- روابط سريعة لصفحات الإدارة المختلفة

### إدارة المستخدمين (`/admin/users`)
- عرض قائمة المستخدمين مع فلترة (provider, verified, role)
- تحديث أدوار المستخدمين (user/admin)
- البحث عن المستخدمين

### إدارة الأسئلة (`/admin/questions`)
- عرض جميع الأسئلة مع فلترة (language, type, lesson)
- حذف الأسئلة
- التوجيه لصفحات التعديل حسب نوع السؤال:
  - `arabic_comprehensive_exam` → `/admin/questions/arabic-comprehensive-exam`
  - `arabic_comprehensive`, `arabic_multi_section` → `/admin/questions/arabic-template`
  - `english_comprehensive_exam` → `/admin/questions/english-comprehensive-exam`
  - `english_comprehensive`, `english_reading`, etc. → `/admin/questions/english-manager`

### صفحات إنشاء/تعديل الأسئلة
- `/admin/questions/arabic`: إنشاء أسئلة عربية بسيطة
- `/admin/questions/arabic-template`: إنشاء/تعديل أسئلة عربية شاملة
- `/admin/questions/arabic-comprehensive-exam`: إنشاء/تعديل امتحانات عربية شاملة
- `/admin/questions/english`: إنشاء أسئلة إنجليزية بسيطة
- `/admin/questions/english-manager`: إنشاء/تعديل أسئلة إنجليزية شاملة
- `/admin/questions/english-comprehensive-exam`: إنشاء/تعديل امتحانات إنجليزية شاملة
- `/admin/questions/exams-ar`: إنشاء/تعديل امتحانات عربية
- `/admin/questions/exams-en`: إنشاء/تعديل امتحانات إنجليزية

### إدارة الرسائل (`/admin/messages`)
- عرض رسائل التواصل من المستخدمين
- الرد على الرسائل
- تحديث حالة الرسائل (new/read/replied)

## الـ Hooks المخصصة

### `hooks/useAutoSave.ts`
- **الوظيفة**: حفظ تلقائي للإجابات مع debounce
- **المدخلات**: `userId`, `examId`, `sessionId`, `userAnswers`
- **السلوك**:
  - Debounce داخلي (افتراضي 1000ms)
  - `beforeunload` event مع `sendBeacon` للحفظ عند إغلاق الصفحة
  - Fallback `fetch` مع `keepalive` option
- **الاستخدام**: في صفحات الامتحانات والدروس

### `hooks/useExamSession.ts`
- **الوظيفة**: إدارة جلسات الامتحان (إنشاء/جلب/تحديث)
- **المدخلات**: `userId`, `examId`
- **المخرجات**: `sessionId`, `userAnswers`, `status`, `score`
- **السلوك**:
  - البحث عن جلسة `in_progress` موجودة
  - إنشاء جلسة جديدة إن لم توجد
  - تحديث الإجابات تلقائياً
  - إعادة توجيه للجلسات المكتملة

### `hooks/useAdmin.ts`
- **الوظيفة**: التحقق من صلاحيات الأدمن
- **المخرجات**: `isAdmin`, `loading`
- **السلوك**: يتحقق من `user.role === "admin"` في Firestore

## تدفقات العمل الكاملة

### تدفق حل الامتحان
1. المستخدم يفتح صفحة الامتحان (`/english/exam/[examId]`)
2. `useExamSession` يبحث عن جلسة `in_progress` أو ينشئ واحدة جديدة
3. يتم جلب الأسئلة من Firestore حسب `examId`
4. `useAutoSave` يحفظ الإجابات تلقائياً كل 1000ms
5. عند الضغط على "إرسال":
   - يتم استدعاء `/api/submit-and-score`
   - يتم حساب الدرجة
   - يتم تحديث `status: completed`, `score`, `completedAt`
   - يتم إعادة توجيه لصفحة النتائج

### تدفق إنشاء سؤال جديد (أدمن)
1. الأدمن يذهب لصفحة الإدارة المناسبة (مثلاً `/admin/questions/english`)
2. يملأ نموذج السؤال
3. يتم حفظ السؤال في Firestore collection `questions`
4. يتم إضافة `lessonId`, `language`, `type`, `createdBy`, `createdAt`
5. السؤال يظهر في قائمة الأسئلة

### تدفق إنشاء امتحان شامل
1. الأدمن يذهب لصفحة الامتحان الشامل (مثلاً `/admin/questions/english-comprehensive-exam`)
2. يضيف `examTitle`, `examDescription`, `durationMinutes`
3. يضيف `sections[]` أو `blocks[]` حسب النوع
4. كل section يحتوي على `questionId` أو `questionData` مباشرة
5. يتم حفظ الامتحان في Firestore collection `questions` مع `type: "english_comprehensive_exam"`

## أمثلة على هياكل البيانات

### مثال: سؤال اختيار من متعدد
```typescript
{
  id: "q1",
  lessonId: "english_lesson_01",
  language: "english",
  type: "multipleChoice",
  question: "What is the capital of France?",
  options: ["London", "Berlin", "Paris", "Madrid"],
  correctAnswer: 2,
  createdAt: Timestamp,
  createdBy: "user123"
}
```

### مثال: امتحان شامل عربي
```typescript
{
  id: "exam_arabic_01",
  type: "arabic_comprehensive_exam",
  examTitle: "امتحان شامل في اللغة العربية",
  examDescription: "امتحان شامل يغطي جميع فروع اللغة العربية",
  durationMinutes: 120,
  blocks: [
    {
      id: "block1",
      type: "reading_passage",
      genre: "Literary",
      bodyText: "النص الكامل...",
      questions: [
        {
          id: "q1",
          type: "mcq",
          stem: "ما الفكرة الرئيسية للنص؟",
          options: ["...", "...", "..."],
          correctIndex: 0,
          weight: 5
        }
      ]
    }
  ],
  createdAt: Timestamp,
  createdBy: "admin123"
}
```

### مثال: جلسة امتحان
```typescript
{
  sessionId: "session_123",
  userId: "user456",
  examId: "exam_arabic_01",
  status: "in_progress",
  userAnswers: {
    "block1_q1": { selectedIndex: 2 },
    "block1_q2": { selections: [{ startIndex: 10, endIndex: 20, tag: "subject" }] }
  },
  startedAt: Timestamp,
  lastUpdated: Timestamp
}
```

## ملاحظات تشغيلية
- تسجيل الدخول شرط أساسي للحفظ (وجود `user.uid`).
- الجلسات القديمة بلا `examId` قد لا تُسترجع باستعلام `userId + examId`; يمكن ترميمها لاحقًا إذا لزم.
- مفاتيح الإجابات قد تكون مركّبة (مثل `${sectionId}_mcq_${index}`) وتُخزَّن كما هي في `userAnswers`.
- لتوسعة أنواع أسئلة جديدة: أضف شكل الإجابة في `UserAnswerShape`، واحفظه في `userAnswers`, وعدّل `scoreQuestion` في `/api/submit-and-score` عند الحاجة للتصحيح.
- صفحات الإدارة محمية بفحص `isAdmin` - يتم إعادة التوجيه للصفحة الرئيسية إن لم يكن المستخدم أدمن.
- أنواع الأسئلة المختلفة تستخدم قوالب عرض مختلفة في الواجهة حسب `templateType` أو `type`.
- الامتحانات الشاملة تدعم `blocks[]` (للعربية) أو `sections[]` (للإنجليزية) حسب التصميم.
