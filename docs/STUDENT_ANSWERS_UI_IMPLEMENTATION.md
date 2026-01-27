# Student Answers UI Implementation - توثيق تنفيذ واجهة إجابات الطلاب

## Overview - نظرة عامة

This document describes the complete implementation of the Student Answers UI system. The system is designed with **complete separation** between three distinct categories:

1. **Site Exams (امتحانات الموقع)** - `comprehensive_exams` table
2. **Teacher Exams (امتحانات المدرسين)** - `teacher_exams` table  
3. **Question Bank Practice (بنك الأسئلة)** - `question_bank_attempts` table

---

## Architecture - البنية المعمارية

### Database Tables - جداول قاعدة البيانات

| Table | Purpose | Arabic Name |
|-------|---------|-------------|
| `comprehensive_exams` | Site-wide exams created by admins | امتحانات الموقع |
| `comprehensive_exam_attempts` | Student attempts for site exams | محاولات امتحانات الموقع |
| `teacher_exams` | Exams created by teachers | امتحانات المدرسين |
| `teacher_exam_attempts` | Student attempts for teacher exams | محاولات امتحانات المدرسين |
| `question_banks` | Question banks for practice | بنوك الأسئلة |
| `question_bank_attempts` | Student practice attempts | محاولات بنك الأسئلة |

### RPC Functions - دوال RPC

| Function | Purpose |
|----------|---------|
| `get_or_create_question_bank_attempt` | Get or create a question bank practice attempt |
| `upsert_question_bank_answer` | Save answer with server-side grading |
| `submit_question_bank_attempt` | Submit completed practice attempt |
| `get_or_create_teacher_exam_attempt` | Get or create a teacher exam attempt |
| `upsert_teacher_exam_answer` | Save teacher exam answer |
| `submit_teacher_exam_attempt` | Submit teacher exam |
| `get_or_create_comprehensive_exam_attempt` | Get or create a site exam attempt |
| `upsert_comprehensive_exam_answer` | Save site exam answer |
| `submit_comprehensive_exam_attempt` | Submit site exam |
| `grade_essay_question` | Manual grading for essay questions |

---

## Components Created - المكونات المنشأة

### 1. ExamPlayerWithGrading.tsx
**Location:** `/components/exam/ExamPlayerWithGrading.tsx`

A unified exam player component that supports both teacher and comprehensive exams with:
- Server-side grading hooks integration
- Real-time answer saving
- Question navigation with block support
- Timer functionality
- Submission handling with score calculation
- Arabic/English language support

### 2. QuestionBankPlayer.tsx
**Location:** `/components/exam/QuestionBankPlayer.tsx`

Question bank practice component with:
- Fetches question bank data from Supabase
- Question navigation (next/previous)
- Answer selection with immediate feedback
- Server-side grading via RPC
- Results display with retry option
- Progress tracking

### 3. StudentProgressDashboard.tsx
**Location:** `/components/profile/StudentProgressDashboard.tsx`

Student progress dashboard with **3 SEPARATE TABS**:

| Tab | Data Source | Color Theme |
|-----|-------------|-------------|
| امتحانات الموقع (Site Exams) | `comprehensive_exam_attempts` | Blue |
| امتحانات المدرسين (Teacher Exams) | `teacher_exam_attempts` | Purple |
| بنك الأسئلة (Question Bank) | `question_bank_attempts` | Amber |

Features:
- Separate stats cards for each category
- Individual average scores per category
- Completion counts per category
- Clear visual distinction with color coding

### 4. ExamResultsGrading.tsx
**Location:** `/components/teacher/ExamResultsGrading.tsx`

Teacher grading interface for:
- Viewing student submissions
- Manual grading of essay questions
- Score assignment and feedback
- Bulk grading capabilities

---

## Pages Created - الصفحات المنشأة

### Exam Pages

| Route | File | Purpose |
|-------|------|---------|
| `/[subjectSlug]/exam/[examId]` | `app/[subjectSlug]/exam/[examId]/page.tsx` | Take site exam |
| `/[subjectSlug]/exam/[examId]/results` | `app/[subjectSlug]/exam/[examId]/results/page.tsx` | Site exam results |
| `/[subjectSlug]/teacher-exam/[examId]` | `app/[subjectSlug]/teacher-exam/[examId]/page.tsx` | Take teacher exam |
| `/[subjectSlug]/teacher-exam/[examId]/results` | `app/[subjectSlug]/teacher-exam/[examId]/results/page.tsx` | Teacher exam results |

### Question Bank Pages

| Route | File | Purpose |
|-------|------|---------|
| `/[subjectSlug]/question-bank/[bankId]` | `app/[subjectSlug]/question-bank/[bankId]/page.tsx` | Practice questions |
| `/[subjectSlug]/question-bank/[bankId]/results` | `app/[subjectSlug]/question-bank/[bankId]/results/page.tsx` | Practice results |

### Teacher Pages

| Route | File | Purpose |
|-------|------|---------|
| `/teacher/exams/[examId]/grade` | `app/teacher/exams/[examId]/grade/page.tsx` | Grade student submissions |
| `/teacher/results` | `app/teacher/results/page.tsx` | View all student results (updated with grading links) |

---

## Hooks - الخطافات

### useStudentAttempts.ts
**Location:** `/hooks/useStudentAttempts.ts`

Contains the following hooks:

#### useQuestionBankAttempt(questionBankId)
```typescript
const {
  attempt,
  loading,
  error,
  getOrCreateAttempt,
  saveAnswer,
  submitAttempt,
} = useQuestionBankAttempt(questionBankId);
```

#### useTeacherExamAttempt(examId)
```typescript
const {
  attempt,
  loading,
  error,
  getOrCreateAttempt,
  saveAnswer,
  submitAttempt,
} = useTeacherExamAttempt(examId);
```

#### useComprehensiveExamAttempt(examId)
```typescript
const {
  attempt,
  loading,
  error,
  getOrCreateAttempt,
  saveAnswer,
  submitAttempt,
} = useComprehensiveExamAttempt(examId);
```

#### useStudentExamAttempts(studentId?)
```typescript
const {
  data: {
    comprehensive_exams: [...],
    teacher_exams: [...],
  },
  loading,
  error,
  fetchAttempts,
} = useStudentExamAttempts(studentId);
```

#### useQuestionBankProgress(studentId?)
```typescript
const {
  progress: [...],
  loading,
  error,
  fetchProgress,
} = useQuestionBankProgress(studentId);
```

---

## Types - الأنواع

### Location: `/lib/types/attempts.types.ts`

```typescript
// Answer structure stored in JSONB
interface QuestionAnswer {
  answer: unknown;
  answered_at: string;
  time_spent_seconds: number | null;
  flagged: boolean;
  auto: {
    is_correct: boolean;
    points_earned: number;
    max_points: number;
  } | null;
  manual: {
    points_earned: number;
    max_points: number;
    feedback: string | null;
    graded_by: string;
    graded_at: string;
  } | null;
}

// Attempt status types
type QuestionBankAttemptStatus = 'in_progress' | 'completed';
type ExamAttemptStatus = 'in_progress' | 'submitted' | 'graded';
```

---

## Profile Integration - تكامل الملف الشخصي

### Profile Page Updates

**File:** `/app/profile/page.tsx`

Added new "exams" tab to profile that renders `StudentProgressDashboard`:

```typescript
{activeTab === 'exams' && (
  <StudentProgressDashboard language="arabic" />
)}
```

### ProfileTabs Updates

**File:** `/components/profile/ProfileTabs.tsx`

Added new tab:
```typescript
{ id: 'exams', label: 'الامتحانات', icon: FileText }
```

### ProfileTab Type Update

**File:** `/components/profile/types.ts`

```typescript
export type ProfileTab = 'overview' | 'exams' | 'achievements' | 'activity' | 'settings';
```

---

## Navigation Flow - تدفق التنقل

### Student Flow

```
Profile Page
    └── Exams Tab (الامتحانات)
        ├── Site Exams Tab (امتحانات الموقع)
        │   └── Click exam → /arabic/exam/[examId]
        │       └── Submit → /arabic/exam/[examId]/results
        │
        ├── Teacher Exams Tab (امتحانات المدرسين)
        │   └── Click exam → /arabic/teacher-exam/[examId]
        │       └── Submit → /arabic/teacher-exam/[examId]/results
        │
        └── Question Bank Tab (بنك الأسئلة)
            └── Click practice → /arabic/question-bank/[bankId]
                └── Complete → /arabic/question-bank/[bankId]/results
```

### Teacher Flow

```
Teacher Results Page (/teacher/results)
    └── Click "تصحيح" → /teacher/exams/[examId]/grade
        └── Grade essays and save
```

---

## Key Design Decisions - قرارات التصميم الرئيسية

### 1. Complete Separation
Site exams, teacher exams, and question banks are **completely independent**:
- Separate database tables
- Separate RPC functions
- Separate UI tabs
- Separate statistics
- Different color coding (Blue/Purple/Amber)

### 2. Server-Side Grading
All grading happens on the server via RPC functions:
- Prevents cheating
- Consistent scoring
- Supports both auto-grading (MCQ) and manual grading (essays)

### 3. Real-Time Answer Saving
Answers are saved immediately as users answer:
- No data loss on disconnection
- Tracks time spent per question
- Supports question flagging

### 4. Bilingual Support
All components support Arabic and English:
- RTL layout for Arabic
- Localized labels
- Date formatting per locale

---

## Files Modified - الملفات المعدلة

| File | Changes |
|------|---------|
| `/components/profile/types.ts` | Added 'exams' to ProfileTab type |
| `/components/profile/ProfileTabs.tsx` | Added exams tab |
| `/app/profile/page.tsx` | Import and render StudentProgressDashboard |
| `/app/teacher/results/page.tsx` | Added grading action column |
| `/components/exam/index.ts` | Export new components |
| `/components/teacher/index.ts` | Created with ExamResultsGrading export |

---

## Testing Checklist - قائمة الاختبار

- [ ] Student can view separate tabs for site exams, teacher exams, and question banks
- [ ] Site exam attempts are stored in `comprehensive_exam_attempts`
- [ ] Teacher exam attempts are stored in `teacher_exam_attempts`
- [ ] Question bank attempts are stored in `question_bank_attempts`
- [ ] Each category shows independent statistics
- [ ] Exam results pages display correct scores
- [ ] Teachers can grade essay questions
- [ ] Navigation links work correctly
- [ ] RTL layout works for Arabic

---

## Version History - سجل الإصدارات

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-27 | Initial implementation |
| 2.0 | 2026-01-27 | Added separation between site/teacher exams |
| 3.0 | 2026-01-27 | Complete UI with 3 separate tabs |

---

## Author

Generated by Cascade AI Assistant
