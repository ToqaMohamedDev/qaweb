# 🗺️ خريطة الملفات التفصيلية - Detailed File Map

> هذا الملف يحتوي على وصف مختصر لكل ملف في المشروع ودوره

---

## 📁 /app (Next.js App Router)

### /app/api (API Routes)

| الملف | الوظيفة | الاعتماديات |
|-------|---------|-------------|
| `api/public/data/route.ts` | البيانات العامة (معلمين، مراحل، مواد) | Supabase SSR |
| `api/exam/route.ts` | جلب/إنشاء/تحديث محاولات الامتحانات | Supabase SSR |
| `api/admin/query/route.ts` | عمليات CRUD للمدير | Supabase SSR + Service Role |
| `api/admin/dashboard/route.ts` | إحصائيات لوحة التحكم | Supabase SSR |
| `api/auth/callback/route.ts` | معالجة OAuth callback | Supabase SSR |
| `api/auth/user/route.ts` | جلب بيانات المستخدم | Supabase SSR |
| `api/notifications/route.ts` | إدارة الإشعارات | Supabase SSR |
| `api/subscriptions/route.ts` | إدارة الاشتراكات | Supabase SSR |
| `api/support/route.ts` | الدعم الفني | Supabase SSR |
| `api/words/*/route.ts` | القاموس والترجمة | Supabase SSR |

### /app/admin (لوحة تحكم المدير)

| الملف | الوظيفة | الـ Hooks المستخدمة |
|-------|---------|-------------------|
| `admin/page.tsx` | الصفحة الرئيسية للمدير | Server Actions |
| `admin/layout.tsx` | Layout الإدارة | useAuthStore |
| `admin/exams/page.tsx` | إدارة الامتحانات | useExamsAPI, useStagesAPI |
| `admin/exams/create/page.tsx` | إنشاء امتحان | useExamCreate |
| `admin/lessons/page.tsx` | إدارة الدروس | useLessonsAPI |
| `admin/users/page.tsx` | إدارة المستخدمين | useUsersAPI |
| `admin/teachers/page.tsx` | إدارة المعلمين | useTeachersAPI |
| `admin/stages/page.tsx` | إدارة المراحل | useStagesAPI |
| `admin/subjects/page.tsx` | إدارة المواد | useSubjectsAPI |
| `admin/quiz-questions/page.tsx` | إدارة بنوك الأسئلة | useQuestionBanks |

### /app/teacher (لوحة تحكم المعلم)

| الملف | الوظيفة | الـ Hooks المستخدمة |
|-------|---------|-------------------|
| `teacher/page.tsx` | الصفحة الرئيسية للمعلم | Direct Supabase |
| `teacher/layout.tsx` | Layout المعلم | useAuthStore |
| `teacher/exams/page.tsx` | قائمة امتحانات المعلم | Direct Supabase |
| `teacher/exams/create/page.tsx` | إنشاء امتحان | useExamCreate |
| `teacher/exams/[examId]/edit/page.tsx` | تعديل امتحان | useExamCreate |
| `teacher/profile/page.tsx` | ملف المعلم الشخصي | useTeacherSetup |

### /app (الصفحات العامة)

| الملف | الوظيفة |
|-------|---------|
| `page.tsx` | الصفحة الرئيسية |
| `layout.tsx` | Layout الرئيسي |
| `login/page.tsx` | تسجيل الدخول |
| `signup/page.tsx` | إنشاء حساب |
| `teachers/page.tsx` | قائمة المعلمين |
| `teachers/[id]/page.tsx` | صفحة معلم |
| `profile/page.tsx` | الملف الشخصي |
| `[subjectSlug]/page.tsx` | صفحة المادة |
| `[subjectSlug]/[lessonSlug]/page.tsx` | صفحة الدرس |

---

## 📁 /lib (المنطق الأساسي)

### /lib/supabase* (Supabase Clients)

| الملف | الوظيفة | الحالة |
|-------|---------|--------|
| `supabase.ts` | Re-export للـ clients | ⚠️ للتوحيد |
| `supabase-client.ts` | Browser client (singleton) | ⚠️ للتوحيد |
| `supabase-server.ts` | Server client | ⚠️ للتوحيد |

### /lib/api-client (API Client)

| الملف | الوظيفة | الحالة |
|-------|---------|--------|
| `index.ts` | ApiClient class | ✅ جيد |
| `endpoints.ts` | API endpoints constants | ✅ جيد |
| `types.ts` | API response types | ✅ جيد |

### /lib/api (Admin API Client)

| الملف | الوظيفة |
|-------|---------|
| `adminClient.ts` | Helper functions للـ admin CRUD |

### /lib/services (طبقة الخدمات)

| الملف | الوظيفة |
|-------|---------|
| `index.ts` | تصدير كل الخدمات |
| `auth.service.ts` | التوثيق والمصادقة |
| `profile.service.ts` | إدارة الملفات الشخصية |
| `exam.service.ts` | إدارة الامتحانات |
| `teacher.service.ts` | عمليات المعلمين |
| `lesson.service.ts` | إدارة الدروس |
| `stage.service.ts` | إدارة المراحل |
| `subject.service.ts` | إدارة المواد |
| `question.service.ts` | إدارة الأسئلة |
| `notification.service.ts` | إدارة الإشعارات |
| `subscription.service.ts` | إدارة الاشتراكات |
| `device.service.ts` | تتبع الأجهزة |
| `message.service.ts` | الرسائل |
| `support.service.ts` | الدعم الفني |
| `progress.service.ts` | تتبع التقدم |
| `rating.service.ts` | التقييمات |
| `settings.service.ts` | الإعدادات |

### /lib/data (Data Layer)

| الملف | الوظيفة | الحالة |
|-------|---------|--------|
| `index.ts` | تصدير الـ data layer | ⚠️ للتوحيد |
| `client.ts` | Supabase clients | ⚠️ للتوحيد |
| `service.ts` | DataService مع caching | ⚠️ للتوحيد |
| `hooks.ts` | React hooks للبيانات | ⚠️ للتوحيد |
| `types.ts` | أنواع البيانات | ✅ جيد |
| `repositories/*.ts` | Repository pattern | ✅ جيد |
| `mappers/*.ts` | Data mappers | ✅ جيد |

### /lib/queries (Query Hooks)

| الملف | الوظيفة | الحالة |
|-------|---------|--------|
| `index.ts` | Hooks للعمليات CRUD (Direct Supabase) | ⚠️ للتوحيد |
| `adminQueries.ts` | Hooks للـ Admin (Via API) | ⚠️ للتوحيد |
| `useExamQueries.ts` | Hooks خاصة بالامتحانات | ✅ جيد |

### /lib/stores (Zustand Stores)

| الملف | الوظيفة |
|-------|---------|
| `index.ts` | تصدير الـ stores |
| `useAuthStore.ts` | حالة المستخدم والمصادقة |
| `useExamStore.ts` | حالة الامتحان |
| `useUIStore.ts` | حالة الواجهة (toasts, modals) |

### /lib/types (TypeScript Types)

| الملف | المحتوى |
|-------|---------|
| `index.ts` | تصدير كل الأنواع |
| `exam.ts` | أنواع الامتحانات |
| `user.ts` | أنواع المستخدمين |
| `teacher.ts` | أنواع المعلمين |
| `teacher.types.ts` | أنواع إضافية للمعلمين |
| `subject.ts` | أنواع المواد |
| `subject.types.ts` | أنواع إضافية للمواد |
| `lesson.ts` | أنواع الدروس |
| `question.ts` | أنواع الأسئلة |
| `question-bank.ts` | أنواع بنوك الأسئلة |
| `attempts.types.ts` | أنواع المحاولات |
| `admin.ts` | أنواع الإدارة |
| `common.ts` | أنواع مشتركة |

### /lib/utils (أدوات مساعدة)

| الملف | الوظيفة |
|-------|---------|
| `index.ts` | تصدير الأدوات |
| `formatters.ts` | تنسيق التواريخ والأرقام |
| `helpers.ts` | دوال مساعدة عامة |
| `validation.ts` | التحقق من البيانات |
| `api-helpers.ts` | مساعدات API responses |
| `date-utils.ts` | أدوات التواريخ |
| `string-utils.ts` | أدوات النصوص |
| `exam-utils.ts` | أدوات الامتحانات |
| `exam-transformer.ts` | تحويل بيانات الامتحانات |
| `questionUtils.ts` | أدوات الأسئلة المشتركة |
| `errors.ts` | معالجة الأخطاء |
| `logger.ts` | نظام الـ logging |
| `getAuthUser.ts` | جلب المستخدم الحالي |
| `words.ts` | أدوات القاموس |

### /lib/domain (Domain Layer)

| الملف | الوظيفة |
|-------|---------|
| `index.ts` | تصدير طبقة الـ domain |
| `entities/Exam.ts` | كيان الامتحان |
| `entities/Question.ts` | كيان السؤال |
| `entities/User.ts` | كيان المستخدم |
| `usecases/CreateExam.ts` | حالة استخدام إنشاء امتحان |
| `usecases/SubmitAnswer.ts` | حالة استخدام تقديم إجابة |
| `usecases/CalculateScore.ts` | حالة استخدام حساب الدرجة |
| `repositories/IExamRepository.ts` | واجهة مستودع الامتحانات |
| `repositories/IQuestionRepository.ts` | واجهة مستودع الأسئلة |

### /lib/constants (الثوابت)

| الملف | المحتوى |
|-------|---------|
| `index.ts` | تصدير الثوابت |
| `app.ts` | ثوابت التطبيق |
| `admin.ts` | ثوابت الإدارة |
| `config.ts` | إعدادات التكوين |
| `design.ts` | ثوابت التصميم |
| `messages.ts` | رسائل النظام |
| `image-dimensions.ts` | أبعاد الصور |

---

## 📁 /hooks (Custom Hooks)

| الملف | الوظيفة | الاستخدام |
|-------|---------|-----------|
| `index.ts` | تصدير الـ hooks | - |
| `useAuth.ts` | المصادقة | عام |
| `useAuthUser.ts` | بيانات المستخدم | عام |
| `useProfile.tsx` | الملف الشخصي | عام |
| `useProtectedRoute.ts` | حماية المسارات | عام |
| `useExamSession.ts` | تشغيل الامتحان | الامتحانات |
| `useExamCreate.ts` | إنشاء الامتحان | Admin/Teacher |
| `useQuestionBankCreate.ts` | إنشاء بنك أسئلة | Admin |
| `useTeacherSetup.ts` | إعداد المعلم | Teacher |
| `useTeachers.ts` | جلب المعلمين | عام |
| `useSubscriptions.ts` | الاشتراكات | عام |
| `useSubjects.ts` | جلب المواد | عام |
| `useLessons.ts` | جلب الدروس | عام |
| `useNotifications.ts` | الإشعارات | عام |
| `useNotificationPreferences.ts` | تفضيلات الإشعارات | عام |
| `useAdminDashboard.ts` | لوحة تحكم المدير | Admin |
| `useAdminTable.ts` | جداول الإدارة | Admin |
| `useDashboard.ts` | لوحة التحكم العامة | عام |
| `useStudentAttempts.ts` | محاولات الطلاب | عام |
| `useFormValidation.ts` | التحقق من النماذج | عام |
| `useAsync.ts` | أدوات async | عام |
| `useGameSocket.ts` | WebSocket للألعاب | Game |

---

## 📁 /components (المكونات)

### /components (Root)

| الملف | الوظيفة |
|-------|---------|
| `index.ts` | تصدير كل المكونات |
| `Navbar.tsx` | شريط التنقل |
| `Footer.tsx` | التذييل |
| `Input.tsx` | مكون الإدخال |
| `ThemeToggle.tsx` | تبديل الثيم |
| `ThemeProvider.tsx` | مزود الثيم |
| `ChatWidget.tsx` | ويدجت الدردشة |
| `NotificationDropdown.tsx` | قائمة الإشعارات |
| `SplashScreen.tsx` | شاشة التحميل |
| `VisitorTracker.tsx` | تتبع الزوار |
| `ClientProviders.tsx` | مزودات العميل |
| `StructuredData.tsx` | بيانات منظمة للـ SEO |

### /components/admin (مكونات الإدارة)

| الملف | الوظيفة |
|-------|---------|
| `index.ts` | تصدير مكونات الإدارة |
| `types.ts` | أنواع الإدارة |
| `utils.ts` | أدوات الإدارة |
| `ActivityFeed.tsx` | تغذية النشاط |
| `DeleteConfirmModal.tsx` | نافذة تأكيد الحذف |
| `MiniChart.tsx` | رسم بياني صغير |
| `ProgressRing.tsx` | حلقة التقدم |
| `QuickActionCard.tsx` | بطاقة إجراء سريع |
| `RecentUsersTable.tsx` | جدول المستخدمين الأخيرين |
| `StatCardAdvanced.tsx` | بطاقة إحصائيات متقدمة |
| `UserDevicesList.tsx` | قائمة أجهزة المستخدمين |
| `VisitorDevicesList.tsx` | قائمة أجهزة الزوار |
| `shared/*.tsx` | مكونات إدارة مشتركة |
| `question-bank/*.tsx` | مكونات بنك الأسئلة |

### /components/auth (مكونات المصادقة)

| الملف | الوظيفة |
|-------|---------|
| `index.ts` | تصدير مكونات المصادقة |
| `AuthLayout.tsx` | layout المصادقة |
| `AuthCard.tsx` | بطاقة المصادقة |
| `AuthHeader.tsx` | رأس المصادقة |
| `AuthAlert.tsx` | تنبيه المصادقة |
| `AuthDivider.tsx` | فاصل المصادقة |
| `AuthFooterLink.tsx` | رابط تذييل المصادقة |
| `GoogleAuthButton.tsx` | زر تسجيل Google |
| `PasswordInput.tsx` | إدخال كلمة المرور |
| `PasswordStrengthIndicator.tsx` | مؤشر قوة كلمة المرور |
| `RoleSelector.tsx` | اختيار الدور |
| `ProtectedComponents.tsx` | مكونات محمية |

### /components/exam (مكونات الامتحانات)

| الملف | الوظيفة |
|-------|---------|
| `index.ts` | تصدير مكونات الامتحانات |
| `ExamCard.tsx` | بطاقة الامتحان |
| `ExamList.tsx` | قائمة الامتحانات |
| `ExamUI.tsx` | واجهة الامتحان |
| `UnifiedExamPlayer.tsx` | مشغل الامتحان الموحد |
| `SectionExamPlayer.tsx` | مشغل امتحان الأقسام |
| `QuestionBankPlayer.tsx` | مشغل بنك الأسئلة |
| `TeacherExamSectionPlayer.tsx` | مشغل امتحان المعلم |
| `ExamPlayerWithGrading.tsx` | مشغل مع التصحيح |

### /components/shared (مكونات مشتركة)

| الملف | الوظيفة |
|-------|---------|
| `index.ts` | تصدير المكونات المشتركة |
| `Button.tsx` | أزرار متعددة الأنماط |
| `ConfirmDialog.tsx` | نافذة تأكيد |
| `EmptyState.tsx` | حالة فارغة |
| `ErrorBoundary.tsx` | معالجة الأخطاء |
| `Form.tsx` | نماذج |
| `LoadingSpinner.tsx` | مؤشر تحميل |
| `ToastContainer.tsx` | حاوي التنبيهات |
| `SubjectPage.tsx` | صفحة المادة |
| `LessonPage.tsx` | صفحة الدرس |
| `forms/*.tsx` | مكونات النماذج |
| `layout/*.tsx` | مكونات التخطيط |
| `data/*.tsx` | مكونات البيانات |

### /components/words (مكونات القاموس)

| الملف | الوظيفة |
|-------|---------|
| `index.ts` | تصدير مكونات القاموس |
| `WordCard.tsx` | بطاقة الكلمة |
| `WordDetailModal.tsx` | نافذة تفاصيل الكلمة |
| `WordHighlighter.tsx` | تمييز الكلمات |
| `HighlightableWord.tsx` | كلمة قابلة للتمييز |
| `DictionaryWordCard.tsx` | بطاقة كلمة القاموس |
| `MyWordCard.tsx` | بطاقة كلماتي |
| `FilterDrawer.tsx` | درج الفلاتر |
| `TTSModal.tsx` | نافذة النطق |
| `WordsPagination.tsx` | ترقيم صفحات الكلمات |
| `WordsEmptyState.tsx` | حالة فارغة |
| `WordsLoadingState.tsx` | حالة تحميل |
| `WordCardSkeleton.tsx` | هيكل بطاقة |
| `design-tokens.ts` | رموز التصميم |

---

## 📁 /middleware.ts

| الملف | الوظيفة |
|-------|---------|
| `middleware.ts` | Supabase auth refresh + Route protection |

---

## 📁 /scripts (سكريبتات)

| الملف | الوظيفة |
|-------|---------|
| `setup_db.js` | إعداد قاعدة البيانات |
| `upload_to_supabase.js` | رفع البيانات |
| `enrich_data.py` | إثراء البيانات |
| `enrich_data_resumable.py` | إثراء قابل للاستئناف |

---

## 📁 /docs (التوثيق)

| الملف | الوظيفة |
|-------|---------|
| `COMPREHENSIVE_ANALYSIS.md` | التحليل الشامل |
| `IMPLEMENTATION_CHECKLIST.md` | قائمة التنفيذ |
| `FILE_MAP.md` | خريطة الملفات (هذا الملف) |
| `database/*.md` | توثيق قاعدة البيانات |

---

> **ملاحظة:** الملفات المعلمة بـ ⚠️ تحتاج للتوحيد في المراحل القادمة
