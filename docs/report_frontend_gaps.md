# 💻 UI/Frontend Gap Report

> **📅 Date**: 2026-01-03
> **🔍 Basis**: Comparison of `docs/database_xray_output.json` (Truth) vs Codebase Scan.
> **🎯 Purpose**: Provide a detailed list of what is missing in the **User Interface** compared to what the database supports.

## 1. 📢 Communication & Support (Critical Gap)

The database fully supports a robust support ticket system, but the UI is effectively missing for the end-user.

- **Available in DB**:
  - Tables: `support_chats`, `chat_messages`
  - Columns: `status` (open/closed), `assigned_to` (support agent), `subject`, `is_read`.
  - Service Layer: `lib/services/support.service.ts` exists.
- **Missing in UI**:
  - **User Dashboard**: No page for a student/teacher to view their *past* support tickets (`/app/support` seems to only be a landing page or incomplete).
  - **Ticket Creation**: No dedicated "Open Ticket" form that allows selecting a subject.
  - **Human Interaction**: The current `ChatWidget.tsx` appears heavily focused on AI/Bot interaction. There is no clear UI for a "Human Agent" to join the chat from the Admin side and for the user to see that response distinct from AI.

## 2. 📝 Exam History & Grades (High Priority)

The database tracks every attempt, score, and answer, but the student has no way to see this history.

- **Available in DB**:
  - Tables: `comprehensive_exam_attempts`, `teacher_exam_attempts`
  - Columns: `answers` (JSONB), `score`, `max_score`, `completed_at`, `feedback`.
- **Missing in UI**:
  - **Exam History Page**: **Zero** occurrences of "exam_history" found in the codebase.
  - **Review Page**: No interface to click on a past exam and see:
    - Which questions were wrong?
    - What was the correct answer?
    - Teacher's feedback (stored in DB but invisible).

## 3. 🔔 Notifications System (Partial Gap)

The database supports sophisticated notification targeting and scheduling, but the UI is "dumb".

- **Available in DB**:
  - Columns: `scheduled_for` (timestamp), `target_role` (enum), `push_notifications` (preference).
- **Missing in UI**:
  - **Scheduling Interface**: The Admin Notification Form has input for `scheduled_for`, but there is **no visible Cron/Background/Queue system** in the codebase to actually *send* these at the right time. They might just sit in the DB.
  - **Push Permission**: The code references `push_notifications` in `database.types.ts`, but there `app/profile/notification-settings` page does not appear to request Browser Permission or manage distinct Push vs Email vs In-App preferences effectively.

## 4. 👩‍🏫 Teacher Features (Refinement Needed)

- **Available in DB**:
  - Columns: `rating_check` (Constraint 1-5), `subscriptions`.
- **Missing in UI**:
  - **Subscription List for Students**: Code refers to `teacher_subscriptions`, but there is no dedicated "My Teachers" or "Subscriptions" page for students to manage/unfollow teachers in bulk. Use is limited to the Teacher Profile page button.

## 5. 🛠 Config & Admin (Advanced)

- **Available in DB**:
  - `site_settings` table stores loosely typed JSON values.
- **Missing in UI**:
  - **Dynamic Settings UI**: The Admin "Settings" page likely needs to be hardcoded for each key. If you add a new setting key to DB, it won't magically appear in the Admin UI without code changes.

---

## 🚀 Recommended Implementation Roadmap

1.  **Phase 1: Student History (Quick Win)**
    - Build `/app/profile/exam-history/page.tsx`.
    - Fetch from `teacher_exam_attempts` and `comprehensive_exam_attempts`.
    - Use `ExamCard` component (reused) to simple show score/date.

2.  **Phase 2: Support Dashboard**
    - Build `/app/support/dashboard/page.tsx` for users.
    - Show list of `support_chats` where `user_id` matches current user.
    - Allow clicking to enter the chat view (reuse `ChatWidget` logic but in full page mode).

3.  **Phase 3: Subscriptions**
    - Build `/app/profile/subscriptions/page.tsx`.
    - List teachers the student follows.
    - Add "Unsubscribe" button.

4.  **Phase 4: Notification Engine (Backend Task)**
    - The `scheduled_for` column is useless without a backend worker (Cron Job/Vercel Cron/Supabase Edge Function) to process it. This is a *backend* gap, not just UI.
